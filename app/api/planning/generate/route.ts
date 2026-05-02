import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Generates the planning for a given date (default: tomorrow).
 * Logic:
 * - Fetch all check-ins and check-outs for the target date
 * - Fetch all team members (role = 'member')
 * - Determine who is OFF (agent who did astreinte yesterday)
 * - Determine who does ASTREINTE today (rotation: next available after yesterday's agent)
 * - Distribute cleaning tasks (check-outs) and welcome tasks (check-ins) among available agents
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const { searchParams } = new URL(request.url)

    // Target date (default: tomorrow)
    const targetDateStr = searchParams.get('date') || (() => {
      const d = new Date()
      d.setDate(d.getDate() + 1)
      return d.toISOString().split('T')[0]
    })()

    const targetDate = new Date(targetDateStr + 'T00:00:00Z')
    const yesterday = new Date(targetDate)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // 1. Fetch confirmed staff members only (is_staff = true AND role = 'member')
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, telegram_chat_id, team, preferred_zone_id, zone_areas:preferred_zone_id(id, name)')
      .eq('role', 'member')
      .eq('is_staff', true)
      .order('full_name')

    if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 })
    if (!members || members.length === 0) {
      return NextResponse.json({ error: 'Aucun employé confirmé (is_staff = true) dans l\'équipe. Activez le statut staff dans la gestion des utilisateurs.' }, { status: 400 })
    }

    // 2. Who did astreinte yesterday? → they are OFF today
    const { data: yesterdayAstreinte } = await supabase
      .from('team_astreinte_log')
      .select('agent_id')
      .eq('astreinte_date', yesterdayStr)
      .single()

    const offAgentId = yesterdayAstreinte?.agent_id || null

    // 3. Available agents (not off)
    const available = members.filter(m => m.id !== offAgentId)
    const offAgent = members.find(m => m.id === offAgentId) || null

    if (available.length === 0) {
      return NextResponse.json({ error: 'Tous les agents sont en repos' }, { status: 400 })
    }

    // 4. Determine astreinte for today: next in rotation after yesterday's agent
    let astreinteAgent = available[0]
    if (offAgentId) {
      const offIndex = members.findIndex(m => m.id === offAgentId)
      // Find next available starting from offIndex+1
      for (let i = 1; i <= members.length; i++) {
        const candidate = members[(offIndex + i) % members.length]
        if (candidate.id !== offAgentId) {
          astreinteAgent = candidate
          break
        }
      }
    }

    // 5. Fetch check-outs for target date (cleaning tasks) — include zone + GPS
    const { data: checkouts } = await supabase
      .from('reservations')
      .select('id, loft_id, check_out_date, guest_name, lofts:loft_id(name, address, gps_coordinates, zone_area_id, zone_areas!lofts_zone_area_id_fkey(id, name))')
      .eq('check_out_date', targetDateStr)
      .in('status', ['confirmed', 'completed'])
      .order('check_out_date')

    // 6. Fetch check-ins for target date (welcome tasks) — include zone + GPS
    const { data: checkins } = await supabase
      .from('reservations')
      .select('id, loft_id, check_in_date, guest_name, guest_phone, lofts:loft_id(name, address, gps_coordinates, zone_area_id, zone_areas!lofts_zone_area_id_fkey(id, name))')
      .eq('check_in_date', targetDateStr)
      .in('status', ['confirmed', 'pending'])
      .order('check_in_date')

    // 7. Distribute tasks by team specialty AND preferred zone
    const cleaningAgents = available.filter(a => a.team === 'nettoyage')
    const welcomeAgents = available.filter(a => a.team === 'accueil')

    const cleaningPool = cleaningAgents.length > 0 ? cleaningAgents : available
    const welcomePool = welcomeAgents.length > 0 ? welcomeAgents : available

    // Zone-aware round-robin: rotate among agents of the matching zone, then fallback to global RR
    const makeZoneRR = () => {
      const zoneCounters = new Map<string, number>() // zone_id -> next index
      let globalRR = 0
      return (pool: any[], reservation: any): any => {
        const loftZoneId = (reservation.lofts as any)?.zone_area_id
        if (loftZoneId) {
          const zoneAgents = pool.filter(a => a.preferred_zone_id === loftZoneId)
          if (zoneAgents.length > 0) {
            const idx = (zoneCounters.get(loftZoneId) || 0) % zoneAgents.length
            zoneCounters.set(loftZoneId, idx + 1)
            return zoneAgents[idx]
          }
        }
        // No zone match → global round-robin
        const agent = pool[globalRR % pool.length]
        globalRR++
        return agent
      }
    }

    const assignCleaning = makeZoneRR()
    const assignWelcome = makeZoneRR()

    const cleaningTasks: { agent: any; reservation: any }[] = []
    ;(checkouts || []).forEach((res) => {
      cleaningTasks.push({ agent: assignCleaning(cleaningPool, res), reservation: res })
    })

    const welcomeTasks: { agent: any; reservation: any }[] = []
    ;(checkins || []).forEach((res) => {
      welcomeTasks.push({ agent: assignWelcome(welcomePool, res), reservation: res })
    })

    // 8. Fetch active tasks (todo + in_progress) per agent
    const { data: activeTasks } = await supabase
      .from('tasks')
      .select('id, title, status, due_date, assigned_to, loft_id, lofts:loft_id(name)')
      .in('status', ['todo', 'in_progress'])
      .in('assigned_to', members.map(m => m.id))

    const tasksByAgent = new Map<string, any[]>()
    ;(activeTasks || []).forEach(task => {
      if (!task.assigned_to) return
      if (!tasksByAgent.has(task.assigned_to)) tasksByAgent.set(task.assigned_to, [])
      tasksByAgent.get(task.assigned_to)!.push(task)
    })

    // 9. Build per-agent summary
    const agentPlanning = members.map(member => {
      const isOff = member.id === offAgentId
      const isAstreinte = member.id === astreinteAgent.id
      const cleaning = cleaningTasks.filter(t => t.agent.id === member.id).map(t => t.reservation)
      const welcome = welcomeTasks.filter(t => t.agent.id === member.id).map(t => t.reservation)
      const pendingTasks = tasksByAgent.get(member.id) || []

      return {
        agent: member,
        is_off: isOff,
        is_astreinte: isAstreinte,
        cleaning_tasks: cleaning,
        welcome_tasks: welcome,
        pending_tasks: pendingTasks,
      }
    })

    return NextResponse.json({
      date: targetDateStr,
      off_agent: offAgent,
      astreinte_agent: astreinteAgent,
      members: agentPlanning,
      summary: {
        total_checkouts: (checkouts || []).length,
        total_checkins: (checkins || []).length,
        total_members: members.length,
        available_count: available.length,
      }
    })
  } catch (err) {
    console.error('[planning/generate]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
