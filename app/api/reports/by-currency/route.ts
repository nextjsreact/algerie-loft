import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

const CUTOVER = '2026-04-01'

function prorateAmount(checkIn: Date, checkOut: Date, total: number, periodStart: Date, periodEnd: Date): number {
  const totalNights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
  if (totalNights <= 0) return 0
  const overlapStart = checkIn < periodStart ? periodStart : checkIn
  const overlapEnd = checkOut > periodEnd ? periodEnd : checkOut
  const nights = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000)
  if (nights <= 0) return 0
  return Math.round((nights / totalNights) * total)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    const filterLoftId = searchParams.get('loftId') || null
    const filterOwnerId = searchParams.get('ownerId') || null

    const periodStart = new Date(startDate + 'T00:00:00Z')
    const periodEnd = new Date(endDate + 'T00:00:00Z')
    const periodEndExclusive = new Date(periodEnd)
    periodEndExclusive.setUTCDate(periodEndExclusive.getUTCDate() + 1)
    const useReservations = startDate >= CUTOVER

    // Get lofts for filtering
    const { data: lofts } = await supabase
      .from('lofts')
      .select('id, name, owner_id')
    const loftMap = new Map((lofts || []).map((l: any) => [l.id, l]))

    // ── INCOME ──────────────────────────────────────────────────────────────
    const incomesByCurrency = new Map<string, { total: number; count: number; details: any[] }>()

    const addIncome = (currency: string, amount: number, detail: any) => {
      if (!incomesByCurrency.has(currency)) incomesByCurrency.set(currency, { total: 0, count: 0, details: [] })
      const e = incomesByCurrency.get(currency)!
      e.total += amount
      e.count++
      e.details.push(detail)
    }

    if (useReservations) {
      // From April: prorated reservations — currency from reservation.currency_code
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, loft_id, check_in_date, check_out_date, total_amount, currency_code, guest_name, status')
        .in('status', ['confirmed', 'completed'])
        .lt('check_in_date', periodEndExclusive.toISOString().split('T')[0])
        .gt('check_out_date', startDate)

      ;(reservations || []).forEach((r: any) => {
        const loft = loftMap.get(r.loft_id)
        if (filterLoftId && r.loft_id !== filterLoftId) return
        if (filterOwnerId && loft?.owner_id !== filterOwnerId) return

        const ci = new Date(r.check_in_date + 'T00:00:00Z')
        const co = new Date(r.check_out_date + 'T00:00:00Z')
        const prorated = prorateAmount(ci, co, r.total_amount || 0, periodStart, periodEndExclusive)
        const currency = r.currency_code || 'DZD'

        addIncome(currency, prorated, {
          id: r.id,
          amount: prorated,
          currency,
          loft_name: loft?.name || '—',
          guest_name: r.guest_name || null,
          date: r.check_in_date,
          check_in: r.check_in_date,
          check_out: r.check_out_date,
          type: 'income',
          source: 'reservation',
        })
      })
    } else {
      // Before April: income transactions
      let txQuery = supabase
        .from('transactions')
        .select('id, amount, equivalent_amount_default_currency, description, date, loft_id, currency_id, currencies:currency_id(code, symbol)')
        .eq('transaction_type', 'income')
        .gte('date', startDate)
        .lte('date', endDate + 'T23:59:59')

      if (filterLoftId) txQuery = txQuery.eq('loft_id', filterLoftId)
      const { data: incomeTx } = await txQuery

      ;(incomeTx || []).forEach((t: any) => {
        const loft = loftMap.get(t.loft_id)
        if (filterOwnerId && loft?.owner_id !== filterOwnerId) return
        const currency = (t.currencies as any)?.code || 'DZD'
        const amount = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
        addIncome(currency, amount, {
          id: t.id, amount, currency,
          loft_name: loft?.name || '—',
          description: t.description || '—',
          date: t.date,
          type: 'income',
          source: 'transaction',
        })
      })
    }

    // Also include reservation_payments (actual cash received) — always
    const { data: payments } = await supabase
      .from('reservation_payments')
      .select(`
        id, amount, currency, payment_method, processed_at, created_at,
        reservations:reservation_id(id, loft_id, guest_name, check_in_date, check_out_date)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .eq('status', 'completed')

    // Group payments separately as "encaissements" (cash received)
    const paymentsByCurrency = new Map<string, { total: number; count: number; details: any[] }>()

    ;(payments || []).forEach((p: any) => {
      const res = p.reservations as any
      const loftId = res?.loft_id
      const loft = loftMap.get(loftId)
      if (filterLoftId && loftId !== filterLoftId) return
      if (filterOwnerId && loft?.owner_id !== filterOwnerId) return

      const currency = p.currency || 'DZD'
      if (!paymentsByCurrency.has(currency)) paymentsByCurrency.set(currency, { total: 0, count: 0, details: [] })
      const e = paymentsByCurrency.get(currency)!
      e.total += Number(p.amount)
      e.count++
      e.details.push({
        id: p.id,
        amount: Number(p.amount),
        currency,
        payment_method: p.payment_method,
        date: p.processed_at || p.created_at,
        loft_name: loft?.name || '—',
        guest_name: res?.guest_name || null,
        check_in: res?.check_in_date,
        check_out: res?.check_out_date,
        type: 'payment',
        source: 'payment',
      })
    })

    // ── EXPENSES ────────────────────────────────────────────────────────────
    let expQuery = supabase
      .from('transactions')
      .select('id, amount, equivalent_amount_default_currency, description, category, date, loft_id, currency_id, currencies:currency_id(code, symbol)')
      .eq('transaction_type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate + 'T23:59:59')

    if (filterLoftId) expQuery = expQuery.eq('loft_id', filterLoftId)
    const { data: expenses } = await expQuery

    const expensesByCurrency = new Map<string, { total: number; count: number; details: any[] }>()

    ;(expenses || []).forEach((t: any) => {
      const loft = loftMap.get(t.loft_id)
      if (filterOwnerId && loft?.owner_id !== filterOwnerId) return
      const currency = (t.currencies as any)?.code || 'DZD'
      const amount = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
      if (!expensesByCurrency.has(currency)) expensesByCurrency.set(currency, { total: 0, count: 0, details: [] })
      const e = expensesByCurrency.get(currency)!
      e.total += amount
      e.count++
      e.details.push({
        id: t.id, amount, currency,
        description: t.description || '—',
        category: t.category || '—',
        date: t.date,
        loft_name: loft?.name || '—',
        type: 'expense',
      })
    })

    // ── MERGE ───────────────────────────────────────────────────────────────
    const allCurrencies = new Set([
      ...Array.from(incomesByCurrency.keys()),
      ...Array.from(paymentsByCurrency.keys()),
      ...Array.from(expensesByCurrency.keys()),
    ])

    const byCurrency = Array.from(allCurrencies).map(currency => {
      const inc = incomesByCurrency.get(currency) || { total: 0, count: 0, details: [] }
      const pay = paymentsByCurrency.get(currency) || { total: 0, count: 0, details: [] }
      const exp = expensesByCurrency.get(currency) || { total: 0, count: 0, details: [] }
      return {
        currency,
        // Revenue = prorated reservations (or transactions before cutover)
        income: Math.round(inc.total),
        income_count: inc.count,
        income_details: inc.details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        // Cash received = actual payments recorded
        payments: Math.round(pay.total),
        payments_count: pay.count,
        payments_details: pay.details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        // Expenses
        expense: Math.round(exp.total),
        expense_count: exp.count,
        expense_details: exp.details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        net: Math.round(inc.total - exp.total),
      }
    }).sort((a, b) => b.income - a.income)

    const grandIncome = byCurrency.reduce((s, c) => s + c.income, 0)
    const grandPayments = byCurrency.reduce((s, c) => s + c.payments, 0)
    const grandExpense = byCurrency.reduce((s, c) => s + c.expense, 0)

    // Lofts and owners for filters
    const { data: owners } = await supabase.from('owners').select('id, name').order('name')

    return NextResponse.json({
      period: { startDate, endDate, source: useReservations ? 'reservations' : 'transactions' },
      by_currency: byCurrency,
      totals: {
        income: grandIncome,
        payments: grandPayments,
        expense: grandExpense,
        net: grandIncome - grandExpense,
      },
      lofts_list: (lofts || []).map((l: any) => ({ id: l.id, name: l.name })),
      owners_list: owners || [],
    })
  } catch (err) {
    console.error('[reports/by-currency]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
