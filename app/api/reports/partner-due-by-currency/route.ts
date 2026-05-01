import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

function prorateAmount(
  checkIn: Date, checkOut: Date, totalAmount: number,
  periodStart: Date, periodEnd: Date
): number {
  const totalNights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
  if (totalNights <= 0) return 0
  const overlapStart = checkIn < periodStart ? periodStart : checkIn
  const overlapEnd = checkOut > periodEnd ? periodEnd : checkOut
  const nightsInPeriod = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000)
  if (nightsInPeriod <= 0) return 0
  return Math.round((nightsInPeriod / totalNights) * totalAmount * 100) / 100
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDateRaw = searchParams.get('endDate')

    if (!startDate || !endDateRaw) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    // Cap endDate to end of startDate's month
    const startDateObj = new Date(startDate + 'T00:00:00Z')
    const endOfStartMonth = new Date(Date.UTC(startDateObj.getUTCFullYear(), startDateObj.getUTCMonth() + 1, 0))
    const endDateObj = new Date(endDateRaw + 'T00:00:00Z')
    const endDate = endDateObj <= endOfStartMonth ? endDateRaw : endOfStartMonth.toISOString().split('T')[0]

    const periodStart = new Date(startDate + 'T00:00:00Z')
    const periodEnd = new Date(endDate + 'T00:00:00Z')
    const periodEndExclusive = new Date(periodEnd)
    periodEndExclusive.setUTCDate(periodEndExclusive.getUTCDate() + 1)

    const CUTOVER = new Date('2026-04-01T00:00:00Z')
    const useReservations = periodStart >= CUTOVER

    // 1. Fetch lofts with owner info
    const { data: lofts } = await supabase
      .from('lofts')
      .select('id, name, owner_id, owner_percentage, company_percentage, owners:owner_id(id, name)')
      .not('owner_id', 'is', null)
      .order('name')

    // 2. Build income by loft by currency (no conversion)
    // Map: loft_id -> currency -> { amount, entries[] }
    type CurrencyEntry = { amount: number; entries: any[] }
    const incomeByLoftByCurrency = new Map<string, Map<string, CurrencyEntry>>()

    const addEntry = (loftId: string, currency: string, amount: number, entry: any) => {
      if (!incomeByLoftByCurrency.has(loftId)) incomeByLoftByCurrency.set(loftId, new Map())
      const byCurrency = incomeByLoftByCurrency.get(loftId)!
      if (!byCurrency.has(currency)) byCurrency.set(currency, { amount: 0, entries: [] })
      const e = byCurrency.get(currency)!
      e.amount = Math.round((e.amount + amount) * 100) / 100
      e.entries.push(entry)
    }

    if (useReservations) {
      // Reservations — use original currency without conversion
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, loft_id, check_in_date, check_out_date, total_amount, currency_code, currency_ratio, guest_name, status')
        .in('status', ['confirmed', 'completed'])
        .lt('check_in_date', periodEndExclusive.toISOString().split('T')[0])
        .gt('check_out_date', startDate)
        .order('check_in_date', { ascending: true })

      ;(reservations || []).forEach((r: any) => {
        const ci = new Date(r.check_in_date + 'T00:00:00Z')
        const co = new Date(r.check_out_date + 'T00:00:00Z')
        const currency = r.currency_code || 'DZD'
        const ratio = Number(r.currency_ratio) || 1
        const totalDZD = r.total_amount || 0

        // Prorated DZD amount
        const proratedDZD = prorateAmount(ci, co, totalDZD, periodStart, periodEndExclusive)

        // Convert back to original currency for display
        const proratedOriginal = currency === 'DZD'
          ? proratedDZD
          : Math.round((proratedDZD / ratio) * 100) / 100

        addEntry(r.loft_id, currency, proratedOriginal, {
          date: r.check_in_date,
          description: `(${r.check_in_date} → ${r.check_out_date})`,
          category: 'Réservation',
          amount: proratedOriginal,
          amount_dzd: proratedDZD,
          currency,
          type: 'income',
        })
      })

      // Manual income transactions — always in DZD or original currency
      const { data: incomeTx } = await supabase
        .from('transactions')
        .select('id, loft_id, amount, original_amount, original_currency, equivalent_amount_default_currency, description, date, category, currency_id, currencies:currency_id(code)')
        .eq('transaction_type', 'income')
        .gte('date', startDate)
        .lte('date', endDate + 'T23:59:59')

      ;(incomeTx || []).forEach((t: any) => {
        if (!t.loft_id) return
        const currency = t.original_currency || (t.currencies as any)?.code || 'DZD'
        const amount = Number(t.original_amount ?? t.amount ?? 0)
        const amtDZD = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
        addEntry(t.loft_id, currency, amount, {
          date: t.date?.split('T')[0] || startDate,
          description: t.description || t.category || 'Recette',
          category: t.category || '—',
          amount,
          amount_dzd: amtDZD,
          currency,
          type: 'income',
        })
      })
    } else {
      // Before cutover: transactions only
      const { data: incomeTx } = await supabase
        .from('transactions')
        .select('id, loft_id, amount, original_amount, original_currency, equivalent_amount_default_currency, description, date, category, currency_id, currencies:currency_id(code)')
        .eq('transaction_type', 'income')
        .gte('date', startDate)
        .lte('date', endDate + 'T23:59:59')

      ;(incomeTx || []).forEach((t: any) => {
        if (!t.loft_id) return
        const currency = t.original_currency || (t.currencies as any)?.code || 'DZD'
        const amount = Number(t.original_amount ?? t.amount ?? 0)
        const amtDZD = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
        addEntry(t.loft_id, currency, amount, {
          date: t.date?.split('T')[0] || startDate,
          description: t.description || '—',
          category: t.category || '—',
          amount,
          amount_dzd: amtDZD,
          currency,
          type: 'income',
        })
      })
    }

    // 3. Expenses — always in DA, deducted from DZD part only
    const { data: expenseTx } = await supabase
      .from('transactions')
      .select('id, loft_id, amount, equivalent_amount_default_currency, description, date, category')
      .eq('transaction_type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate + 'T23:59:59')

    const expByLoft = new Map<string, { total: number; entries: any[] }>()
    ;(expenseTx || []).forEach((t: any) => {
      if (!t.loft_id) return
      if (!expByLoft.has(t.loft_id)) expByLoft.set(t.loft_id, { total: 0, entries: [] })
      const amt = Math.round(Number(t.equivalent_amount_default_currency ?? t.amount ?? 0))
      const e = expByLoft.get(t.loft_id)!
      e.total += amt
      e.entries.push({
        date: t.date?.split('T')[0] || startDate,
        description: t.description || '—',
        category: t.category || '—',
        amount: amt,
        currency: 'DZD',
        type: 'expense',
      })
    })

    // 4. Build result per loft
    const loftResults = (lofts || []).map((loft: any) => {
      const ownerPct = loft.owner_percentage || 0
      const byCurrency = incomeByLoftByCurrency.get(loft.id) || new Map()
      const exp = expByLoft.get(loft.id) || { total: 0, entries: [] }

      // Build per-currency summary
      const currencies = Array.from(byCurrency.entries()).map(([currency, data]) => {
        const ownerAmount = Math.round((data.amount * ownerPct / 100) * 100) / 100
        // Deduct expenses only from DZD
        const ownerDue = currency === 'DZD'
          ? Math.max(0, ownerAmount - exp.total)
          : ownerAmount
        return {
          currency,
          total_income: data.amount,
          owner_gross: ownerAmount,
          owner_due: ownerDue,
          entries: data.entries.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        }
      }).sort((a, b) => {
        // DZD first, then others
        if (a.currency === 'DZD') return -1
        if (b.currency === 'DZD') return 1
        return a.currency.localeCompare(b.currency)
      })

      const hasActivity = currencies.length > 0 || exp.total > 0

      return {
        loft_id: loft.id,
        loft_name: loft.name,
        owner_id: loft.owner_id,
        owner_name: (loft.owners as any)?.name || 'Inconnu',
        owner_percentage: ownerPct,
        currencies,
        expenses: exp.entries.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        total_expense_dzd: exp.total,
        has_activity: hasActivity,
      }
    }).filter(l => l.has_activity)

    // 5. Group by owner
    const byOwnerMap = new Map<string, any>()
    loftResults.forEach(l => {
      if (!byOwnerMap.has(l.owner_id)) {
        byOwnerMap.set(l.owner_id, {
          owner_id: l.owner_id,
          owner_name: l.owner_name,
          lofts: [],
        })
      }
      byOwnerMap.get(l.owner_id)!.lofts.push(l)
    })

    const byOwner = Array.from(byOwnerMap.values())
      .filter(g => g.lofts.length > 0)
      .sort((a, b) => a.owner_name.localeCompare(b.owner_name))

    return NextResponse.json({
      byOwner,
      lofts: loftResults,
      period: { startDate, endDate },
    })
  } catch (err) {
    console.error('[partner-due-by-currency]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
