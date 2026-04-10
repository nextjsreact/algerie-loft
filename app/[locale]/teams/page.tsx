import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { TeamsWrapper } from "@/components/teams/teams-wrapper"

const TEAM_LABELS: Record<string, string> = {
  nettoyage: '🧹 Nettoyage',
  accueil: '🤝 Accueil',
  maintenance: '🔧 Maintenance',
  gestion: '📋 Gestion',
}

export default async function TeamsPage() {
  const session = await requireRole(["admin", "manager"])
  const supabase = await createClient(true)

  // Fetch all staff: confirmed members + admins + managers (they belong to gestion team)
  const { data: staffMembers, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, team, role')
    .or('and(is_staff.eq.true,role.eq.member),role.eq.admin,role.eq.manager')
    .order('full_name')

  if (error) throw new Error(error.message)

  // Fetch active tasks per member
  const { data: activeTasks } = await supabase
    .from('tasks')
    .select('assigned_to, status')
    .in('status', ['todo', 'in_progress'])

  const taskCountByMember = new Map<string, number>()
  ;(activeTasks || []).forEach((t: any) => {
    if (t.assigned_to) {
      taskCountByMember.set(t.assigned_to, (taskCountByMember.get(t.assigned_to) || 0) + 1)
    }
  })

  // Group members by team
  const teamMap = new Map<string, any[]>()
  const ALL_TEAMS = ['nettoyage', 'accueil', 'maintenance', 'gestion']

  ALL_TEAMS.forEach(t => teamMap.set(t, []))

  ;(staffMembers || []).forEach((m: any) => {
    // admins and managers without a team → auto-assign to gestion
    const team = m.team || (['admin', 'manager'].includes(m.role) ? 'gestion' : 'sans_equipe')
    if (!teamMap.has(team)) teamMap.set(team, [])
    teamMap.get(team)!.push({ ...m, active_tasks: taskCountByMember.get(m.id) || 0 })
  })

  // Build teams array (only teams with members)
  const teams = Array.from(teamMap.entries())
    .filter(([, members]) => members.length > 0)
    .map(([teamKey, members]) => ({
      id: teamKey,
      name: TEAM_LABELS[teamKey] || teamKey,
      description: null,
      created_by_name: '',
      member_count: String(members.length),
      active_tasks: String(members.reduce((s: number, m: any) => s + m.active_tasks, 0)),
      members,
    }))

  return (
    <TeamsWrapper
      teams={teams}
      userRole={session.user.role}
    />
  )
}
