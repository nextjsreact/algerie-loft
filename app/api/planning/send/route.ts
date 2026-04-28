import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const body = await request.json()
    const { date, members, astreinte_agent } = body

    if (!date || !members) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const dateLabel = fmtDate(date)
    const results: { agent: string; sent: boolean; error?: string }[] = []

    for (const item of members) {
      const { agent, is_off, is_astreinte, cleaning_tasks, welcome_tasks } = item

      console.log(`[planning/send] agent: ${agent.full_name}, telegram_chat_id: ${agent.telegram_chat_id}`)

      if (!agent.telegram_chat_id) {
        results.push({ agent: agent.full_name, sent: false, error: 'Pas de Telegram ID' })
        continue
      }

      let msg = `📋 <b>Planning du ${dateLabel}</b>\n`
      msg += `👤 <b>${agent.full_name}</b>\n\n`

      if (is_off) {
        msg += `🌴 <b>JOUR DE REPOS</b>\n`
        msg += `Tu es en repos aujourd'hui. Bonne journée ! 😊\n`
        msg += `\n⚠️ Tu seras d'astreinte demain.`
      } else {
        if (is_astreinte) {
          msg += `🔔 <b>ASTREINTE DU JOUR</b> — Tu es disponible pour toute urgence\n\n`
        }

        if (cleaning_tasks.length === 0 && welcome_tasks.length === 0) {
          msg += `✅ Aucune tâche assignée pour aujourd'hui.\n`
          if (is_astreinte) msg += `Reste disponible en cas d'urgence.\n`
        }

        if (cleaning_tasks.length > 0) {
          msg += `🧹 <b>NETTOYAGE (${cleaning_tasks.length} appart${cleaning_tasks.length > 1 ? 's' : ''})</b>\n`
          cleaning_tasks.forEach((r: any, i: number) => {
            const loftName = r.lofts?.name || r.loft_id
            const address = r.lofts?.address || ''
            const gps = r.lofts?.gps_coordinates || ''
            msg += `  ${i + 1}. <b>${loftName}</b>`
            if (address) msg += ` — ${address}`
            if (r.guest_name) msg += `\n     👤 Départ : ${r.guest_name}`
            if (gps) msg += `\n     📍 <a href="${gps}">Voir sur Maps</a>`
            msg += '\n'
          })
          msg += '\n'
        }

        if (welcome_tasks.length > 0) {
          msg += `🤝 <b>ACCUEIL + CONTRAT (${welcome_tasks.length} appart${welcome_tasks.length > 1 ? 's' : ''})</b>\n`
          welcome_tasks.forEach((r: any, i: number) => {
            const loftName = r.lofts?.name || r.loft_id
            const address = r.lofts?.address || ''
            const gps = r.lofts?.gps_coordinates || ''
            msg += `  ${i + 1}. <b>${loftName}</b>`
            if (address) msg += ` — ${address}`
            if (r.guest_name) msg += `\n     👤 Arrivée : ${r.guest_name}`
            if (r.guest_phone) msg += ` — 📞 ${r.guest_phone}`
            if (gps) msg += `\n     📍 <a href="${gps}">Voir sur Maps</a>`
            msg += '\n'
          })
          msg += '\n'
        }

        if (item.pending_tasks?.length > 0) {
          msg += `📋 <b>TÂCHES EN COURS / À FAIRE (${item.pending_tasks.length})</b>\n`
          item.pending_tasks.forEach((t: any, i: number) => {
            const status = t.status === 'in_progress' ? '🔄' : '⏳'
            msg += `  ${i + 1}. ${status} ${t.title}`
            if (t.lofts?.name) msg += ` — ${t.lofts.name}`
            if (t.due_date) msg += ` (échéance: ${new Date(t.due_date).toLocaleDateString('fr-FR')})`
            msg += '\n'
          })
          msg += '\n'
        }

        msg += `\n📞 En cas de problème, contactez le responsable.`
      }

      try {
        // Send to individual agent's Telegram
        const token = process.env.PLANNING_TELEGRAM_BOT_TOKEN
        if (!token) throw new Error('PLANNING_TELEGRAM_BOT_TOKEN non configuré')

        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: agent.telegram_chat_id,
            text: msg,
            parse_mode: 'HTML',
          }),
        })
        const data = await res.json()
        if (!data.ok) throw new Error(data.description || 'Erreur Telegram')
        results.push({ agent: agent.full_name, sent: true })
      } catch (err: any) {
        results.push({ agent: agent.full_name, sent: false, error: err.message })
      }
    }

    // Save astreinte log for today (so tomorrow we know who is off)
    if (astreinte_agent?.id) {
      await supabase
        .from('team_astreinte_log')
        .upsert({ agent_id: astreinte_agent.id, astreinte_date: date }, { onConflict: 'astreinte_date' })
    }

    // Also send a summary to the planning group chat
    const groupSummary = buildGroupSummary(date, dateLabel, members)
    try {
      const token = process.env.PLANNING_TELEGRAM_BOT_TOKEN
      const chatId = process.env.PLANNING_TELEGRAM_CHAT_ID
      if (token && chatId) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: groupSummary, parse_mode: 'HTML' }),
        })
      }
    } catch {}

    const sentCount = results.filter(r => r.sent).length
    console.log('[planning/send] results:', JSON.stringify(results))
    return NextResponse.json({
      success: true,
      sent: sentCount,
      total: results.length,
      results,
    })
  } catch (err) {
    console.error('[planning/send]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

function buildGroupSummary(date: string, dateLabel: string, members: any[]) {
  let msg = `📋 <b>Planning équipe — ${dateLabel}</b>\n\n`

  const offAgent = members.find(m => m.is_off)
  const astreinteAgent = members.find(m => m.is_astreinte)

  if (offAgent) msg += `🌴 Repos : <b>${offAgent.agent.full_name}</b>\n`
  if (astreinteAgent) msg += `🔔 Astreinte : <b>${astreinteAgent.agent.full_name}</b>\n\n`

  const working = members.filter(m => !m.is_off)
  working.forEach(item => {
    const total = item.cleaning_tasks.length + item.welcome_tasks.length
    if (total === 0 && !item.is_astreinte) return
    msg += `👤 <b>${item.agent.full_name}</b>`
    if (item.is_astreinte) msg += ` 🔔`
    msg += '\n'
    if (item.cleaning_tasks.length > 0) {
      msg += `  🧹 ${item.cleaning_tasks.map((r: any) => r.lofts?.name || '?').join(', ')}\n`
    }
    if (item.welcome_tasks.length > 0) {
      msg += `  🤝 ${item.welcome_tasks.map((r: any) => r.lofts?.name || '?').join(', ')}\n`
    }
  })

  return msg
}
