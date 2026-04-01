import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Prorates a reservation amount for a given period.
 * e.g. reservation 28 mars → 05 avril, 8000 DA
 *   → for mars  (01/03 → 01/04): 4/8 × 8000 = 4000 DA
 *   → for avril (01/04 → 01/05): 4/8 × 8000 = 4000 DA
 */
function prorateAmount(
  checkIn: Date,
  checkOut: Date,
  totalAmount: number,
  periodStart: Date,
  periodEnd: Date   // exclusive (first day of next period)
): number {
  const totalNights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
  if (totalNights <= 0) return 0

  const overlapStart = checkIn < periodStart ? periodStart : checkIn
  const overlapEnd = checkOut > periodEnd ? periodEnd : checkOut
  const nightsInPeriod = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000)

  if (nightsInPeriod <= 0) return 0
  return Math.round((nightsInPeriod / totalNights) * totalAmount)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')   // e.g. '2026-04-01'
    const endDate = searchParams.get('endDate')       // e.g. '2026-04-30'

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    const periodStart = new Date(startDate + 'T00:00:00Z')
    const periodEnd = new Date(endDate + 'T00:00:00Z')
    // Make periodEnd exclusive (day after last day)
    const periodEndExclusive = new Date(periodEnd)
    periodEndExclusive.setUTCDate(periodEndExclusive.getUTCDate() + 1)

    // April 2026 is the cutover month: use reservations+prorata from April onwards,
    // use transactions for months before April 2026
    const CUTOVER = new Date('2026-04-01T00:00:00Z')
    const useReservations = periodStart >= CUTOVER

    // 1. Fetch lofts with owner info and percentages
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name, owner_id, owner_percentage, company_percentage, owners:owner_id(id, name)')
      .not('owner_id', 'is', null)
      .order('name')

    if (loftsError) return NextResponse.json({ error: loftsError.message }, { status: 500 })

    // 2. Fetch income — from reservations (prorata) if >= April 2026, else from transactions
    let resByLoft = new Map<string, { income: number; reservations: any[] }>()

    if (useReservations) {
      // Fetch confirmed/completed reservations overlapping the period
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('id, loft_id, check_in_date, check_out_date, total_amount, guest_name, status')
        .in('status', ['confirmed', 'completed'])
        .lt('check_in_date', periodEndExclusive.toISOString().split('T')[0])
        .gt('check_out_date', startDate)
        .order('check_in_date', { ascending: false })

      if (resError) return NextResponse.json({ error: resError.message }, { status: 500 })

      ;(reservations || []).forEach(r => {
        const checkIn = new Date(r.check_in_date + 'T00:00:00Z')
        const checkOut = new Date(r.check_out_date + 'T00:00:00Z')
        const proratedAmount = prorateAmount(checkIn, checkOut, r.total_amount || 0, periodStart, periodEndExclusive)
        if (!resByLoft.has(r.loft_id)) resByLoft.set(r.loft_id, { income: 0, reservations: [] })
        const entry = resByLoft.get(r.loft_id)!
        entry.income += proratedAmount
        entry.reservations.push({
          id: r.id,
          guest_name: r.guest_name,
          check_in_date: r.check_in_date,
          check_out_date: r.check_out_date,
          nights: Math.round((new Date(r.check_out_date).getTime() - new Date(r.check_in_date).getTime()) / 86400000),
          total_amount: r.total_amount,
          prorated_amount: proratedAmount,
          status: r.status,
        })
      })
    } else {
      // Use income transactions for months before April 2026
      const { data: incomeTx, error: incError } = await supabase
        .from('transactions')
        .select('id, loft_id, equivalent_amount_default_currency, amount, description, date, category')
        .eq('transaction_type', 'income')
        .gte('date', startDate)
        .lte('date', endDate + 'T23:59:59')

      if (incError) return NextResponse.json({ error: incError.message }, { status: 500 })

      ;(incomeTx || []).forEach(tx => {
        if (!tx.loft_id) return
        if (!resByLoft.has(tx.loft_id)) resByLoft.set(tx.loft_id, { income: 0, reservations: [] })
        const entry = resByLoft.get(tx.loft_id)!
        const amt = Math.round(Number(tx.equivalent_amount_default_currency ?? tx.amount ?? 0))
        entry.income += amt
        // Store as "reservation-like" entry for display
        entry.reservations.push({
          id: tx.id,
          guest_name: tx.description || '-',
          check_in_date: tx.date?.split('T')[0] || startDate,
          check_out_date: tx.date?.split('T')[0] || startDate,
          nights: 0,
          total_amount: amt,
          prorated_amount: amt,
          status: 'income_tx',
        })
      })
    }

    // 3. Fetch expense transactions for the period (by transaction date)
    const { data: expenseTx, error: expError } = await supabase
      .from('transactions')
      .select('id, loft_id, equivalent_amount_default_currency, amount, description, date, category')
      .eq('transaction_type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate + 'T23:59:59')

    if (expError) return NextResponse.json({ error: expError.message }, { status: 500 })

    // 4. Group expenses by loft
    const expByLoft = new Map<string, { expense: number; transactions: any[] }>()
    ;(expenseTx || []).forEach(tx => {
      if (!tx.loft_id) return
      if (!expByLoft.has(tx.loft_id)) expByLoft.set(tx.loft_id, { expense: 0, transactions: [] })
      const entry = expByLoft.get(tx.loft_id)!
      const amt = Math.round(Number(tx.equivalent_amount_default_currency ?? tx.amount ?? 0))
      entry.expense += amt
      entry.transactions.push({
        id: tx.id,
        date: tx.date,
        description: tx.description || '',
        category: tx.category || '',
        amount: amt,
        type: 'expense' as const,
      })
    })

    // 6. Build result per loft
    const loftResults = (lofts || []).map((loft: any) => {
      const rev = resByLoft.get(loft.id) || { income: 0, reservations: [] }
      const exp = expByLoft.get(loft.id) || { expense: 0, transactions: [] }
      const ownerPct = loft.owner_percentage || 0
      const companyPct = loft.company_percentage || 0

      const ownerGross = Math.round(rev.income * ownerPct / 100)
      const ownerDue = Math.max(0, ownerGross - exp.expense)
      const companyDue = Math.round(rev.income * companyPct / 100)

      return {
        loft_id: loft.id,
        loft_name: loft.name,
        owner_id: loft.owner_id,
        owner_name: (loft.owners as any)?.name || 'Inconnu',
        owner_percentage: ownerPct,
        company_percentage: companyPct,
        total_income: Math.round(rev.income),
        total_expense: exp.expense,
        total_revenue: Math.round(rev.income) - exp.expense,
        owner_gross: ownerGross,
        owner_due: ownerDue,
        company_due: companyDue,
        // For detail modal — show reservations (income source)
        transactions: [
          ...rev.reservations.map(r => ({
            id: r.id,
            date: r.check_in_date,
            description: `${r.guest_name} (${r.check_in_date} → ${r.check_out_date})`,
            category: 'Réservation',
            amount: r.prorated_amount,
            type: 'income' as const,
          })),
          ...exp.transactions,
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }
    })

    // 7. Group by owner — only include lofts with activity
    const byOwnerMap = new Map<string, any>()
    loftResults.forEach(l => {
      if (!byOwnerMap.has(l.owner_id)) {
        byOwnerMap.set(l.owner_id, {
          owner_id: l.owner_id,
          owner_name: l.owner_name,
          lofts: [],
          total_revenue: 0,
          total_owner_due: 0,
          total_company_due: 0,
        })
      }
      const entry = byOwnerMap.get(l.owner_id)!
      entry.lofts.push(l)
      entry.total_revenue += l.total_income
      entry.total_owner_due += l.owner_due
      entry.total_company_due += l.company_due
    })

    const byOwner = Array.from(byOwnerMap.values())
      .filter(g => g.total_revenue > 0)
      .sort((a, b) => b.total_revenue - a.total_revenue)

    return NextResponse.json({
      lofts: loftResults,
      byOwner,
      period: { startDate, endDate },
    })
  } catch (err) {
    console.error('[partner-due]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
