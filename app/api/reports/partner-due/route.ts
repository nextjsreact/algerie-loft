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

    // Fetch confirmed/completed reservations in date range
    let query = supabase
      .from('reservations')
      .select('loft_id, total_amount, check_in_date, check_out_date, status')
      .in('status', ['confirmed', 'completed'])

    if (startDate) query = query.gte('check_in_date', startDate)
    if (endDate) query = query.lte('check_in_date', endDate)

    const { data: reservations, error: resError } = await query
    if (resError) return NextResponse.json({ error: resError.message }, { status: 500 })

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
      }
    })

    // Group by owner
    const byOwner = new Map<string, { owner_id: string; owner_name: string; lofts: typeof loftResults; total_revenue: number; total_owner_due: number; total_company_due: number }>()
    loftResults.forEach(l => {
      if (!byOwner.has(l.owner_id)) {
        byOwner.set(l.owner_id, { owner_id: l.owner_id, owner_name: l.owner_name, lofts: [], total_revenue: 0, total_owner_due: 0, total_company_due: 0 })
      }
      const entry = byOwner.get(l.owner_id)!
      entry.lofts.push(l)
      entry.total_revenue += l.total_revenue
      entry.total_owner_due += l.owner_due
      entry.total_company_due += l.company_due
    })

    return NextResponse.json({
      lofts: loftResults,
      byOwner: Array.from(byOwner.values()),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
