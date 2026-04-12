import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const filterStatus = searchParams.get('status') || 'all' // all | partial | unpaid | paid
    const filterLoftId = searchParams.get('loftId') || null
    const filterOwnerId = searchParams.get('ownerId') || null

    // 1. Fetch reservations with their loft info
    let resQuery = supabase
      .from('reservations')
      .select(`
        id, loft_id, guest_name, guest_phone, check_in_date, check_out_date,
        total_amount, currency_code, currency_ratio, status,
        lofts:loft_id(id, name, owner_id, owners:owner_id(name))
      `)
      .in('status', ['confirmed', 'completed', 'pending'])
      .order('check_in_date', { ascending: false })

    if (startDate) resQuery = resQuery.gte('check_in_date', startDate)
    if (endDate) resQuery = resQuery.lte('check_in_date', endDate)
    if (filterLoftId) resQuery = resQuery.eq('loft_id', filterLoftId)

    const { data: reservations, error: resError } = await resQuery
    if (resError) return NextResponse.json({ error: resError.message }, { status: 500 })

    // 2. Fetch all payments for these reservations
    const reservationIds = (reservations || []).map((r: any) => r.id)
    if (reservationIds.length === 0) {
      return NextResponse.json({ reservations: [], summary: { total_due_dzd: 0, total_paid_dzd: 0, total_remaining_dzd: 0, count_paid: 0, count_partial: 0, count_unpaid: 0 } })
    }

    const { data: payments } = await supabase
      .from('reservation_payments')
      .select('id, reservation_id, amount, original_amount, original_currency, currency, payment_method, processed_at, created_at')
      .in('reservation_id', reservationIds)
      .eq('status', 'completed')

    // 3. Group payments by reservation
    const paymentsByRes = new Map<string, any[]>()
    ;(payments || []).forEach((p: any) => {
      if (!paymentsByRes.has(p.reservation_id)) paymentsByRes.set(p.reservation_id, [])
      paymentsByRes.get(p.reservation_id)!.push(p)
    })

    // 4. Build recouvrement data per reservation
    const result = (reservations || [])
      .filter((r: any) => {
        if (filterOwnerId) {
          const loft = r.lofts as any
          if (loft?.owner_id !== filterOwnerId) return false
        }
        return true
      })
      .map((r: any) => {
        const loft = r.lofts as any
        const resPays = paymentsByRes.get(r.id) || []

        // Total due in DZD (total_amount is always DZD)
        const totalDueDZD = Number(r.total_amount || 0)
        const currency = r.currency_code || 'DZD'
        const ratio = Number(r.currency_ratio) || 1
        // Total due in original currency
        const totalDueOriginal = currency === 'DZD' ? totalDueDZD : Math.round((totalDueDZD / ratio) * 100) / 100

        // Total paid in DZD (amount field is always DZD)
        const totalPaidDZD = resPays.reduce((s, p) => s + Number(p.amount), 0)
        const remainingDZD = Math.max(0, totalDueDZD - totalPaidDZD)

        // Payments breakdown by currency
        const paysByCurrency: Record<string, { amount: number; count: number }> = {}
        resPays.forEach(p => {
          const origCurr = p.original_currency || p.currency || 'DZD'
          const origAmt = Number(p.original_amount ?? p.amount)
          if (!paysByCurrency[origCurr]) paysByCurrency[origCurr] = { amount: 0, count: 0 }
          paysByCurrency[origCurr].amount += origAmt
          paysByCurrency[origCurr].count++
        })

        // Status
        let paymentStatus: 'paid' | 'partial' | 'unpaid'
        if (totalPaidDZD >= totalDueDZD * 0.99) paymentStatus = 'paid'
        else if (totalPaidDZD > 0) paymentStatus = 'partial'
        else paymentStatus = 'unpaid'

        return {
          id: r.id,
          guest_name: r.guest_name || '—',
          guest_phone: r.guest_phone || null,
          loft_name: loft?.name || '—',
          owner_name: loft?.owners?.name || null,
          check_in: r.check_in_date,
          check_out: r.check_out_date,
          reservation_status: r.status,
          // Amounts
          total_due_dzd: Math.round(totalDueDZD),
          total_due_original: totalDueOriginal,
          currency,
          total_paid_dzd: Math.round(totalPaidDZD),
          remaining_dzd: Math.round(remainingDZD),
          remaining_original: currency === 'DZD' ? Math.round(remainingDZD) : Math.round((remainingDZD / ratio) * 100) / 100,
          payment_status: paymentStatus,
          payments_by_currency: paysByCurrency,
          payments_count: resPays.length,
          payments: resPays.map(p => ({
            id: p.id,
            amount_dzd: Number(p.amount),
            original_amount: Number(p.original_amount ?? p.amount),
            original_currency: p.original_currency || p.currency || 'DZD',
            payment_method: p.payment_method,
            date: p.processed_at || p.created_at,
          })),
        }
      })
      .filter(r => {
        if (filterStatus === 'paid') return r.payment_status === 'paid'
        if (filterStatus === 'partial') return r.payment_status === 'partial'
        if (filterStatus === 'unpaid') return r.payment_status === 'unpaid'
        return true
      })

    // 5. Summary
    const summary = {
      total_due_dzd: result.reduce((s, r) => s + r.total_due_dzd, 0),
      total_paid_dzd: result.reduce((s, r) => s + r.total_paid_dzd, 0),
      total_remaining_dzd: result.reduce((s, r) => s + r.remaining_dzd, 0),
      count_paid: result.filter(r => r.payment_status === 'paid').length,
      count_partial: result.filter(r => r.payment_status === 'partial').length,
      count_unpaid: result.filter(r => r.payment_status === 'unpaid').length,
    }

    // Lofts and owners for filters
    const { data: lofts } = await supabase.from('lofts').select('id, name').order('name')
    const { data: owners } = await supabase.from('owners').select('id, name').order('name')

    return NextResponse.json({ reservations: result, summary, lofts_list: lofts || [], owners_list: owners || [] })
  } catch (err) {
    console.error('[recouvrement]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
