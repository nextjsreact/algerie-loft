import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

const CUTOVER = '2026-04-01' // From April: use reservations. Before: use transactions.

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
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]

    const periodStart = new Date(startDate + 'T00:00:00Z')
    const periodEnd = new Date(endDate + 'T00:00:00Z')
    const periodEndExclusive = new Date(periodEnd)
    periodEndExclusive.setUTCDate(periodEndExclusive.getUTCDate() + 1)
    const useReservations = startDate >= CUTOVER

    // --- INCOME SOURCE ---
    // Map: loft_id -> income amount
    const incomeByLoft = new Map<string, number>()

    if (useReservations) {
      // From April: prorated reservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('loft_id, check_in_date, check_out_date, total_amount')
        .in('status', ['confirmed', 'completed'])
        .lt('check_in_date', periodEndExclusive.toISOString().split('T')[0])
        .gt('check_out_date', startDate)

      ;(reservations || []).forEach((r: any) => {
        const ci = new Date(r.check_in_date + 'T00:00:00Z')
        const co = new Date(r.check_out_date + 'T00:00:00Z')
        const prorated = prorateAmount(ci, co, r.total_amount || 0, periodStart, periodEndExclusive)
        incomeByLoft.set(r.loft_id, (incomeByLoft.get(r.loft_id) || 0) + prorated)
      })
    } else {
      // Before April: transactions
      const { data: incomeTx } = await supabase
        .from('transactions')
        .select('loft_id, equivalent_amount_default_currency, amount')
        .eq('transaction_type', 'income')
        .gte('date', startDate)
        .lte('date', endDate + 'T23:59:59')

      ;(incomeTx || []).forEach((t: any) => {
        if (!t.loft_id) return
        const amt = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
        incomeByLoft.set(t.loft_id, (incomeByLoft.get(t.loft_id) || 0) + amt)
      })
    }

    // --- EXPENSES (always from transactions) ---
    const { data: expenseTx } = await supabase
      .from('transactions')
      .select('loft_id, equivalent_amount_default_currency, amount, category')
      .eq('transaction_type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate + 'T23:59:59')

    const expenseByLoft = new Map<string, number>()
    ;(expenseTx || []).forEach((t: any) => {
      if (!t.loft_id) return
      const amt = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
      expenseByLoft.set(t.loft_id, (expenseByLoft.get(t.loft_id) || 0) + amt)
    })

    // --- RESERVATION PAYMENTS (by payment method + per loft) ---
    const { data: resPay } = await supabase
      .from('reservation_payments')
      .select('amount, payment_method, reservation_id, reservations:reservation_id(loft_id, check_in_date)')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')

    // Also fetch reservation payments linked to reservations in the period
    const { data: resPayByPeriod } = await supabase
      .from('reservation_payments')
      .select('amount, payment_method, reservation_id, reservations:reservation_id(loft_id, check_in_date, check_out_date)')
      .not('reservation_id', 'is', null)

    // --- LOFTS ---
    const { data: lofts } = await supabase
      .from('lofts')
      .select('id, name, owner_id, owner_percentage, company_percentage, owners:owner_id(id, name)')

    const loftMap = new Map((lofts || []).map((l: any) => [l.id, l]))

    // --- GLOBAL TOTALS ---
    const totalIncome = Array.from(incomeByLoft.values()).reduce((s, v) => s + v, 0)
    const totalExpense = Array.from(expenseByLoft.values()).reduce((s, v) => s + v, 0)

    // Trésorerie encaissée = payments received for reservations in this period
    // Filter payments whose reservation overlaps the period
    const cashReceived = (resPayByPeriod || []).filter((p: any) => {
      const r = p.reservations as any
      if (!r) return false
      const ci = r.check_in_date
      const co = r.check_out_date
      return ci < periodEndExclusive.toISOString().split('T')[0] && co > startDate
    }).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)

    // Payment method breakdown (from payments in period)
    const totalPayments = (resPay || []).reduce((s, p) => s + Number(p.amount ?? 0), 0)

    // --- BY PAYMENT METHOD ---
    const byPaymentMethod: Record<string, number> = {}
    ;(resPay || []).forEach((p: any) => {
      const m = p.payment_method || 'autre'
      byPaymentMethod[m] = (byPaymentMethod[m] || 0) + Number(p.amount)
    })

    // --- OWN LOFTS (company_percentage = 100) ---
    const byOwnLoft: Record<string, { name: string; income: number; expense: number }> = {}
    ;(lofts || []).filter((l: any) => l.company_percentage === 100).forEach((l: any) => {
      const income = incomeByLoft.get(l.id) || 0
      const expense = expenseByLoft.get(l.id) || 0
      if (income > 0 || expense > 0) {
        byOwnLoft[l.id] = { name: l.name, income: Math.round(income), expense: Math.round(expense) }
      }
    })

    // --- BY PARTNER ---
    const byPartner: Record<string, any> = {}
    ;(lofts || []).filter((l: any) => l.owner_percentage > 0 && l.owner_percentage < 100).forEach((l: any) => {
      const income = incomeByLoft.get(l.id) || 0
      if (income === 0) return
      const companyShare = Math.round(income * (l.company_percentage || 0) / 100)
      const ownerId = l.owner_id
      const ownerName = (l.owners as any)?.name || 'Inconnu'
      if (!byPartner[ownerId]) byPartner[ownerId] = { owner_name: ownerName, lofts: [], total_income: 0, total_company_share: 0 }
      byPartner[ownerId].lofts.push({ name: l.name, income: Math.round(income), company_share: companyShare })
      byPartner[ownerId].total_income += Math.round(income)
      byPartner[ownerId].total_company_share += companyShare
    })

    return NextResponse.json({
      period: { startDate, endDate, source: useReservations ? 'reservations' : 'transactions' },
      global: {
        total_income: Math.round(totalIncome),          // Revenu acquis (prorata)
        total_expense: Math.round(totalExpense),
        net: Math.round(totalIncome - totalExpense),
        cash_received: Math.round(cashReceived),         // Trésorerie encaissée
        outstanding: Math.round(totalIncome - cashReceived), // Créances en cours
        total_payments_received: Math.round(totalPayments),
      },
      by_payment_method: Object.entries(byPaymentMethod)
        .map(([method, amount]) => ({ method, amount: Math.round(amount) }))
        .sort((a, b) => b.amount - a.amount),
      own_lofts: Object.values(byOwnLoft)
        .map((l: any) => ({ ...l, net: l.income - l.expense }))
        .sort((a: any, b: any) => b.income - a.income),
      by_partner: Object.values(byPartner)
        .sort((a: any, b: any) => b.total_company_share - a.total_company_share),
    })
  } catch (err) {
    console.error('[financial-summary]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
