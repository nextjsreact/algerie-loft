import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getPartnerInfo } from '@/lib/partner-auth'

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
    const partnerInfo = await getPartnerInfo()
    if (!partnerInfo) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const supabase = await createClient(true)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

    const periodStart = new Date(startDate + 'T00:00:00Z')
    const periodEnd = new Date(endDate + 'T00:00:00Z')
    const periodEndExclusive = new Date(periodEnd)
    periodEndExclusive.setUTCDate(periodEndExclusive.getUTCDate() + 1)
    const useReservations = startDate >= CUTOVER

    // Get partner's lofts with percentages
    const { data: lofts } = await supabase
      .from('lofts')
      .select('id, name, owner_percentage, company_percentage, price_per_night')
      .eq('owner_id', partnerInfo.ownerId)

    if (!lofts || lofts.length === 0) {
      return NextResponse.json({ lofts: [], summary: { total_income: 0, owner_due: 0, total_expense: 0 }, by_payment: [], analytics: [] })
    }

    const loftIds = lofts.map(l => l.id)
    const loftMap = new Map(lofts.map(l => [l.id, l]))

    // ── INCOME ──────────────────────────────────────────────────────────────
    const incomeByLoft = new Map<string, number>()
    const reservationsByLoft = new Map<string, any[]>()

    if (useReservations) {
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, loft_id, check_in_date, check_out_date, total_amount, currency_code, currency_ratio, guest_name, status')
        .in('loft_id', loftIds)
        .in('status', ['confirmed', 'completed'])
        .lt('check_in_date', periodEndExclusive.toISOString().split('T')[0])
        .gt('check_out_date', startDate)

      ;(reservations || []).forEach(r => {
        const ci = new Date(r.check_in_date + 'T00:00:00Z')
        const co = new Date(r.check_out_date + 'T00:00:00Z')
        const prorated = prorateAmount(ci, co, r.total_amount || 0, periodStart, periodEndExclusive)
        incomeByLoft.set(r.loft_id, (incomeByLoft.get(r.loft_id) || 0) + prorated)
        if (!reservationsByLoft.has(r.loft_id)) reservationsByLoft.set(r.loft_id, [])
        reservationsByLoft.get(r.loft_id)!.push({ ...r, prorated_amount: prorated })
      })
    } else {
      const { data: incomeTx } = await supabase
        .from('transactions')
        .select('loft_id, amount, equivalent_amount_default_currency')
        .eq('transaction_type', 'income')
        .in('loft_id', loftIds)
        .gte('date', startDate)
        .lte('date', endDate + 'T23:59:59')

      ;(incomeTx || []).forEach(t => {
        const amt = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
        incomeByLoft.set(t.loft_id, (incomeByLoft.get(t.loft_id) || 0) + amt)
      })
    }

    // ── EXPENSES ────────────────────────────────────────────────────────────
    const { data: expenses } = await supabase
      .from('transactions')
      .select('loft_id, amount, equivalent_amount_default_currency, description, category, date')
      .eq('transaction_type', 'expense')
      .in('loft_id', loftIds)
      .gte('date', startDate)
      .lte('date', endDate + 'T23:59:59')

    const expenseByLoft = new Map<string, number>()
    ;(expenses || []).forEach(t => {
      const amt = Number(t.equivalent_amount_default_currency ?? t.amount ?? 0)
      expenseByLoft.set(t.loft_id, (expenseByLoft.get(t.loft_id) || 0) + amt)
    })

    // ── PAYMENTS BY CURRENCY ─────────────────────────────────────────────────
    const { data: payments } = await supabase
      .from('reservation_payments')
      .select('amount, original_amount, original_currency, currency, payment_method, processed_at, reservations:reservation_id(loft_id)')
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59')
      .eq('status', 'completed')

    const byPayment: Record<string, { method: string; currency: string; total: number; count: number }> = {}
    ;(payments || []).forEach((p: any) => {
      const loftId = p.reservations?.loft_id
      if (!loftIds.includes(loftId)) return
      const key = `${p.payment_method}_${p.original_currency || p.currency || 'DZD'}`
      const currency = p.original_currency || p.currency || 'DZD'
      const amount = Number(p.original_amount ?? p.amount ?? 0)
      if (!byPayment[key]) byPayment[key] = { method: p.payment_method, currency, total: 0, count: 0 }
      byPayment[key].total += amount
      byPayment[key].count++
    })

    // ── PER LOFT RESULTS ─────────────────────────────────────────────────────
    const loftResults = lofts.map(loft => {
      const income = Math.round(incomeByLoft.get(loft.id) || 0)
      const expense = Math.round(expenseByLoft.get(loft.id) || 0)
      const ownerPct = loft.owner_percentage || 0
      const ownerGross = Math.round(income * ownerPct / 100)
      const ownerDue = Math.max(0, ownerGross - expense)
      const reservations = reservationsByLoft.get(loft.id) || []

      return {
        loft_id: loft.id,
        loft_name: loft.name,
        owner_percentage: ownerPct,
        income,
        expense,
        owner_gross: ownerGross,
        owner_due: ownerDue,
        reservations_count: reservations.length,
        reservations: reservations.map(r => ({
          id: r.id,
          guest_name: r.guest_name,
          check_in: r.check_in_date,
          check_out: r.check_out_date,
          amount: r.prorated_amount || r.total_amount,
          status: r.status,
        })),
      }
    })

    // ── ANALYTICS (monthly breakdown for last 6 months) ──────────────────────
    const analytics: any[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      const mStart = d.toISOString().split('T')[0]
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
      const mStartDate = new Date(mStart + 'T00:00:00Z')
      const mEndExclusive = new Date(mEnd + 'T00:00:00Z')
      mEndExclusive.setUTCDate(mEndExclusive.getUTCDate() + 1)

      let monthIncome = 0
      if (mStart >= CUTOVER) {
        const { data: mRes } = await supabase
          .from('reservations')
          .select('loft_id, check_in_date, check_out_date, total_amount')
          .in('loft_id', loftIds)
          .in('status', ['confirmed', 'completed'])
          .lt('check_in_date', mEnd)
          .gt('check_out_date', mStart)
        ;(mRes || []).forEach(r => {
          const ci = new Date(r.check_in_date + 'T00:00:00Z')
          const co = new Date(r.check_out_date + 'T00:00:00Z')
          monthIncome += prorateAmount(ci, co, r.total_amount || 0, mStartDate, mEndExclusive)
        })
      } else {
        const { data: mTx } = await supabase
          .from('transactions')
          .select('amount, equivalent_amount_default_currency')
          .eq('transaction_type', 'income')
          .in('loft_id', loftIds)
          .gte('date', mStart)
          .lte('date', mEnd + 'T23:59:59')
        ;(mTx || []).forEach(t => { monthIncome += Number(t.equivalent_amount_default_currency ?? t.amount ?? 0) })
      }

      const totalOwnerDue = lofts.reduce((s, l) => {
        const ownerPct = l.owner_percentage || 0
        return s + Math.round(monthIncome * ownerPct / 100)
      }, 0)

      analytics.push({
        month: mStart.slice(0, 7),
        label: new Date(mStart + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        income: Math.round(monthIncome),
        owner_due: totalOwnerDue,
      })
    }

    const summary = {
      total_income: loftResults.reduce((s, l) => s + l.income, 0),
      total_expense: loftResults.reduce((s, l) => s + l.expense, 0),
      owner_due: loftResults.reduce((s, l) => s + l.owner_due, 0),
    }

    return NextResponse.json({
      period: { startDate, endDate },
      lofts: loftResults,
      summary,
      by_payment: Object.values(byPayment).sort((a, b) => b.total - a.total),
      analytics,
    })
  } catch (err) {
    console.error('[partner/reports]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
