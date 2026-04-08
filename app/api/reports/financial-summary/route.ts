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
    const filterLoftId = searchParams.get('loftId') || null
    const filterOwnerId = searchParams.get('ownerId') || null

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
      let resQuery = supabase
        .from('reservations')
        .select('loft_id, check_in_date, check_out_date, total_amount')
        .in('status', ['confirmed', 'completed'])
        .lt('check_in_date', periodEndExclusive.toISOString().split('T')[0])
        .gt('check_out_date', startDate)

      if (filterLoftId) resQuery = resQuery.eq('loft_id', filterLoftId)

      const { data: reservations } = await resQuery

      ;(reservations || []).forEach((r: any) => {
        const ci = new Date(r.check_in_date + 'T00:00:00Z')
        const co = new Date(r.check_out_date + 'T00:00:00Z')
        const prorated = prorateAmount(ci, co, r.total_amount || 0, periodStart, periodEndExclusive)
        incomeByLoft.set(r.loft_id, (incomeByLoft.get(r.loft_id) || 0) + prorated)
      })
    } else {
      // Before April: transactions
      let txQuery = supabase
        .from('transactions')
        .select('loft_id, equivalent_amount_default_currency, amount')
        .eq('transaction_type', 'income')
        .gte('date', startDate)
        .lte('date', endDate + 'T23:59:59')

      if (filterLoftId) txQuery = txQuery.eq('loft_id', filterLoftId)

      const { data: incomeTx } = await txQuery

      ;(incomeTx || []).forEach((t: any) => {
        if (!t.loft_id) return
        const amt = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
        incomeByLoft.set(t.loft_id, (incomeByLoft.get(t.loft_id) || 0) + amt)
      })
    }

    // --- EXPENSES (always from transactions) ---
    let expQuery = supabase
      .from('transactions')
      .select('loft_id, equivalent_amount_default_currency, amount, category')
      .eq('transaction_type', 'expense')
      .gte('date', startDate)
      .lte('date', endDate + 'T23:59:59')

    if (filterLoftId) expQuery = expQuery.eq('loft_id', filterLoftId)

    const { data: expenseTx } = await expQuery

    const expenseByLoft = new Map<string, number>()
    ;(expenseTx || []).forEach((t: any) => {
      if (!t.loft_id) return
      const amt = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
      expenseByLoft.set(t.loft_id, (expenseByLoft.get(t.loft_id) || 0) + amt)
    })

    // --- RESERVATION PAYMENTS (by payment method + per loft) ---
    const { data: resPay } = await supabase
      .from('reservation_payments')
      .select(`
        id, amount, payment_method, processed_at, created_at, transaction_id, processor_response,
        reservations:reservation_id(
          id, loft_id, guest_name, guest_phone, check_in_date, check_out_date,
          lofts:loft_id(id, name)
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .order('created_at', { ascending: false })

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

    // Apply owner filter to loft list
    const filteredLofts = (lofts || []).filter((l: any) => {
      if (filterLoftId && l.id !== filterLoftId) return false
      if (filterOwnerId && l.owner_id !== filterOwnerId) return false
      return true
    })
    const filteredLoftIds = new Set(filteredLofts.map((l: any) => l.id))

    // --- GLOBAL TOTALS (filtered) ---
    const totalIncome = Array.from(incomeByLoft.entries())
      .filter(([id]) => !filterLoftId && !filterOwnerId ? true : filteredLoftIds.has(id))
      .reduce((s, [, v]) => s + v, 0)
    const totalExpense = Array.from(expenseByLoft.entries())
      .filter(([id]) => !filterLoftId && !filterOwnerId ? true : filteredLoftIds.has(id))
      .reduce((s, [, v]) => s + v, 0)

    // Trésorerie encaissée = payments received for reservations in this period
    // Filter payments whose reservation overlaps the period
    const cashReceived = (resPayByPeriod || []).filter((p: any) => {
      const r = p.reservations as any
      if (!r) return false
      const ci = r.check_in_date
      const co = r.check_out_date
      return ci < periodEndExclusive.toISOString().split('T')[0] && co > startDate
    }).reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0)

    // --- BY PAYMENT METHOD (filtered by loft/owner) ---
    const byPaymentMethod: Record<string, { amount: number; details: any[] }> = {}
    ;(resPay || []).forEach((p: any) => {
      const res = p.reservations as any
      const loftId = res?.loft_id
      if (filterLoftId && loftId !== filterLoftId) return
      if (filterOwnerId && !filteredLoftIds.has(loftId)) return
      const m = p.payment_method || 'autre'
      if (!byPaymentMethod[m]) byPaymentMethod[m] = { amount: 0, details: [] }
      byPaymentMethod[m].amount += Number(p.amount)
      byPaymentMethod[m].details.push({
        id: p.id,
        amount: Number(p.amount),
        date: p.processed_at || p.created_at,
        reference: p.transaction_id || null,
        notes: p.processor_response || null,
        loft_name: res?.lofts?.name || '—',
        guest_name: res?.guest_name || null,
        guest_phone: res?.guest_phone || null,
        check_in: res?.check_in_date || null,
        check_out: res?.check_out_date || null,
      })
    })

    // Payment method total
    const totalPayments = Object.values(byPaymentMethod).reduce((s, v) => s + v.amount, 0)

    // --- OWN LOFTS (company_percentage = 100, filtered) ---
    const byOwnLoft: Record<string, { name: string; income: number; expense: number }> = {}
    ;(lofts || []).filter((l: any) => l.company_percentage === 100 && filteredLoftIds.has(l.id)).forEach((l: any) => {
      const income = incomeByLoft.get(l.id) || 0
      const expense = expenseByLoft.get(l.id) || 0
      if (income > 0 || expense > 0) {
        byOwnLoft[l.id] = { name: l.name, income: Math.round(income), expense: Math.round(expense) }
      }
    })

    // --- BY PARTNER (filtered) ---
    const byPartner: Record<string, any> = {}
    ;(lofts || []).filter((l: any) => l.owner_percentage > 0 && l.owner_percentage < 100 && filteredLoftIds.has(l.id)).forEach((l: any) => {
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

    // --- LOFT ALGÉRIE TOTAL GAINS ---
    // = net from own lofts + company share from partner lofts
    const ownLoftNet = Object.values(byOwnLoft).reduce((s: number, l: any) => s + l.income - l.expense, 0)
    const partnerCompanyShare = Object.values(byPartner).reduce((s: number, p: any) => s + p.total_company_share, 0)
    const loftAlgerieTotal = Math.round(ownLoftNet + partnerCompanyShare)

    // --- BY LOFT (for loft-level report) ---
    const byLoft = (lofts || [])
      .filter((l: any) => filteredLoftIds.has(l.id))
      .map((l: any) => {
        const income = Math.round(incomeByLoft.get(l.id) || 0)
        const expense = Math.round(expenseByLoft.get(l.id) || 0)
        const ownerPct = l.owner_percentage || 0
        const companyPct = l.company_percentage || 0
        const ownerDue = Math.max(0, Math.round(income * ownerPct / 100) - expense)
        const companyDue = Math.round(income * companyPct / 100)
        return {
          loft_id: l.id,
          loft_name: l.name,
          owner_name: (l.owners as any)?.name || null,
          owner_percentage: ownerPct,
          company_percentage: companyPct,
          income,
          expense,
          net: income - expense,
          owner_due: ownerDue,
          company_due: companyDue,
          is_own: companyPct === 100,
        }
      })
      .filter((l: any) => l.income > 0 || l.expense > 0)
      .sort((a: any, b: any) => b.income - a.income)

    return NextResponse.json({
      period: { startDate, endDate, source: useReservations ? 'reservations' : 'transactions' },
      filters: { loftId: filterLoftId, ownerId: filterOwnerId },
      global: {
        total_income: Math.round(totalIncome),
        total_expense: Math.round(totalExpense),
        net: Math.round(totalIncome - totalExpense),
        cash_received: Math.round(cashReceived),
        outstanding: Math.round(totalIncome - cashReceived),
        total_payments_received: Math.round(totalPayments),
      },
      loft_algerie: {
        own_loft_net: Math.round(ownLoftNet),
        partner_company_share: Math.round(partnerCompanyShare),
        total: loftAlgerieTotal,
      },
      by_payment_method: Object.entries(byPaymentMethod)
        .map(([method, data]) => ({ method, amount: Math.round(data.amount), details: data.details }))
        .sort((a, b) => b.amount - a.amount),
      own_lofts: Object.values(byOwnLoft)
        .map((l: any) => ({ ...l, net: l.income - l.expense }))
        .sort((a: any, b: any) => b.income - a.income),
      by_partner: Object.values(byPartner)
        .sort((a: any, b: any) => b.total_company_share - a.total_company_share),
      by_loft: byLoft,
      // Available lofts and owners for filter dropdowns
      lofts_list: (lofts || []).map((l: any) => ({ id: l.id, name: l.name, owner_id: l.owner_id, owner_name: (l.owners as any)?.name || null })),
      owners_list: Array.from(new Map((lofts || []).filter((l: any) => l.owner_id).map((l: any) => [l.owner_id, { id: l.owner_id, name: (l.owners as any)?.name || 'Inconnu' }])).values()),
    })
  } catch (err) {
    console.error('[financial-summary]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
