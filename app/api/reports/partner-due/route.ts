import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Fetch lofts with owner info and percentages
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name, owner_id, owner_percentage, company_percentage, owners:owner_id(id, name)')
      .not('owner_id', 'is', null)
      .order('name')

    if (loftsError) return NextResponse.json({ error: loftsError.message }, { status: 500 })

    // Fetch confirmed/completed reservations in date range with guest info
    let query = supabase
      .from('reservations')
      .select('id, loft_id, total_amount, check_in_date, check_out_date, status, guest_name, nights')
      .in('status', ['confirmed', 'completed'])
      .order('check_in_date', { ascending: false })

    if (startDate) query = query.gte('check_in_date', startDate)
    if (endDate) query = query.lte('check_in_date', endDate)

    const { data: reservations, error: resError } = await query
    if (resError) return NextResponse.json({ error: resError.message }, { status: 500 })

    // Group reservations by loft
    const reservationsByLoft = new Map<string, any[]>()
    ;(reservations || []).forEach(r => {
      if (!reservationsByLoft.has(r.loft_id)) reservationsByLoft.set(r.loft_id, [])
      reservationsByLoft.get(r.loft_id)!.push(r)
    })

    // Calculate revenue per loft
    const revenueByLoft = new Map<string, number>()
    ;(reservations || []).forEach(r => {
      revenueByLoft.set(r.loft_id, (revenueByLoft.get(r.loft_id) || 0) + (r.total_amount || 0))
    })

    // Build result per loft
    const loftResults = (lofts || []).map((loft: any) => {
      const revenue = revenueByLoft.get(loft.id) || 0
      const ownerPct = loft.owner_percentage || 0
      const companyPct = loft.company_percentage || 0
      const ownerDue = Math.round(revenue * ownerPct / 100)
      const companyDue = Math.round(revenue * companyPct / 100)
      const loftReservations = reservationsByLoft.get(loft.id) || []

      return {
        loft_id: loft.id,
        loft_name: loft.name,
        owner_id: loft.owner_id,
        owner_name: (loft.owners as any)?.name || 'Inconnu',
        owner_percentage: ownerPct,
        company_percentage: companyPct,
        total_revenue: revenue,
        owner_due: ownerDue,
        company_due: companyDue,
        reservations: loftReservations.map(r => ({
          id: r.id,
          guest_name: r.guest_name,
          check_in_date: r.check_in_date,
          check_out_date: r.check_out_date,
          nights: r.nights,
          total_amount: r.total_amount,
          status: r.status,
        })),
      }
    })

    // Group by owner
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
      entry.total_revenue += l.total_revenue
      entry.total_owner_due += l.owner_due
      entry.total_company_due += l.company_due
    })

    return NextResponse.json({
      lofts: loftResults,
      byOwner: Array.from(byOwnerMap.values()),
      period: { startDate, endDate },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
