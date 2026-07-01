import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  })
}

function fmtShortDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long'
  })
}

function calcNights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + 'T00:00:00')
  const b = new Date(checkOut + 'T00:00:00')
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000))
}

function formatAmount(n: number | null | undefined): string {
  if (!n) return '0 DA'
  return n.toLocaleString('fr-DZ') + ' DA'
}

function buildCheckinBlock(r: any, index: number): string {
  const loftName = r.lofts?.name || 'Loft'
  const address = r.lofts?.address || ''
  const gps = r.lofts?.gps_coordinates || ''
  const checkIn = r.check_in_date || ''
  const checkOut = r.check_out_date || ''
  const nights = checkIn && checkOut ? calcNights(checkIn, checkOut) : null
  const pricePerNight = nights && r.base_price ? r.base_price / nights : (r.total_amount && nights ? r.total_amount / nights : null)
  const total = r.total_amount || r.base_price || null
  const paid = r.payment_status === 'paid' ? total : (r.payment_status === 'partial' ? (r.paid_amount || null) : 0)
  const remaining = total && paid !== null ? total - paid : null
  const guests = r.guest_count || null
  const checkInTime = r.lofts?.check_in_time || null
  const phone = r.guest_phone || null
  const guestName = r.guest_name || null
  const notes = r.special_requests || null

  let block = `  ${index}. 🏠 <b>${loftName}</b>\n`
  if (address) block += `     📍 ${address}\n`

  // Dates + nuitées
  if (checkIn && checkOut) {
    const dateRange = `Du ${fmtShortDate(checkIn)} au ${fmtShortDate(checkOut)}`
    block += `     📅 ${dateRange}`
    if (nights) block += ` — ${nights} nuitée${nights > 1 ? 's' : ''}`
    block += '\n'
  }

  // Tarif
  if (pricePerNight && nights && total) {
    block += `     💰 ${formatAmount(pricePerNight)} × ${nights} = <b>${formatAmount(total)}</b>\n`
  } else if (total) {
    block += `     💰 Total : <b>${formatAmount(total)}</b>\n`
  }

  // Paiement
  if (paid !== null && paid > 0) {
    block += `     ✅ Payé : ${formatAmount(paid)}`
    if (r.payment_status === 'partial' || (remaining && remaining > 0)) {
      block += ` (${r.payment_status === 'paid' ? 'CCP' : 'acompte'})`
    }
    block += '\n'
  }
  if (remaining !== null && remaining > 0) {
    block += `     ⚠️ Reste : <b>${formatAmount(remaining)}</b> en espèces\n`
  }

  // Voyageurs + heure d'arrivée
  if (guests) block += `     👥 ${guests} personne${guests > 1 ? 's' : ''}\n`
  if (checkInTime) block += `     🕐 Arrivée à partir de ${checkInTime.substring(0, 5)}\n`
  if (guestName) block += `     👤 ${guestName}\n`
  if (phone) block += `     📞 ${phone}\n`
  if (notes) block += `     📝 ${notes}\n`
  if (gps) block += `     🗺️ <a href="${gps}">Voir sur Maps</a>\n`

  return block
}

function buildCheckoutBlock(r: any, index: number): string {
  const loftName = r.lofts?.name || 'Loft'
  const address = r.lofts?.address || ''
  const gps = r.lofts?.gps_coordinates || ''
  const checkOut = r.check_out_date || ''
  const checkOutTime = r.lofts?.check_out_time || null
  const guestName = r.guest_name || null

  let block = `  ${index}. 🧹 <b>${loftName}</b>\n`
  if (address) block += `     📍 ${address}\n`
  if (checkOut) block += `     📅 Départ le ${fmtShortDate(checkOut)}\n`
  if (checkOutTime) block += `     🕐 Avant ${checkOutTime}\n`
  if (guestName) block += `     👤 ${guestName}\n`
  if (gps) block += `     🗺️ <a href="${gps}">Voir sur Maps</a>\n`

  return block
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
            msg += buildCheckoutBlock(r, i + 1)
          })
          msg += '\n'
        }

        if (welcome_tasks.length > 0) {
          msg += `🤝 <b>ACCUEIL + CONTRAT (${welcome_tasks.length} arrivée${welcome_tasks.length > 1 ? 's' : ''})</b>\n`
          welcome_tasks.forEach((r: any, i: number) => {
            msg += buildCheckinBlock(r, i + 1)
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
