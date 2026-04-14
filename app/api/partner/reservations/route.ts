import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getPartnerInfo } from '@/lib/partner-auth'

export async function GET(request: NextRequest) {
  try {
    const partnerInfo = await getPartnerInfo()
    if (!partnerInfo) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 403 })
    }

    const supabase = await createClient(true)
    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const offset = (page - 1) * limit

    // Get partner's loft IDs
    const { data: lofts } = await supabase
      .from('lofts')
      .select('id, name')
      .eq('owner_id', partnerInfo.ownerId)

    const loftIds = (lofts || []).map(l => l.id)
    const loftNameMap = new Map((lofts || []).map(l => [l.id, l.name]))

    if (loftIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          reservations: [],
          pagination: { page, limit, total: 0, hasMore: false },
          summary: { total_reservations: 0, active_reservations: 0, upcoming_reservations: 0, completed_reservations: 0, total_revenue: 0 }
        }
      })
    }

    let query = supabase
      .from('reservations')
      .select('id, loft_id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, status, total_amount, guest_count, special_requests, created_at, updated_at')
      .in('loft_id', loftIds)
      .order('created_at', { ascending: false })

    const statusFilter = searchParams.get('status')
    if (statusFilter) query = query.eq('status', statusFilter)

    const propertyFilter = searchParams.get('property_id')
    if (propertyFilter) query = query.eq('loft_id', propertyFilter)

    const { data: reservations, count: totalCount } = await query.range(offset, offset + limit - 1)

    const now = new Date()
    const list = reservations || []

    const reservationsView = list.map(r => ({
      id: r.id,
      loft_id: r.loft_id,
      loft_name: loftNameMap.get(r.loft_id) || '—',
      guest_name: r.guest_name || 'Invité',
      guest_email: r.guest_email,
      guest_phone: r.guest_phone,
      check_in: r.check_in_date,
      check_out: r.check_out_date,
      status: r.status,
      total_amount: Number(r.total_amount || 0),
      nights: Math.ceil((new Date(r.check_out_date).getTime() - new Date(r.check_in_date).getTime()) / 86400000),
      guests_count: r.guest_count || 1,
      special_requests: r.special_requests,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }))

    const summary = {
      total_reservations: totalCount || list.length,
      active_reservations: list.filter(r => r.status === 'confirmed').length,
      upcoming_reservations: list.filter(r => r.check_in_date > now.toISOString().split('T')[0] && r.status !== 'cancelled').length,
      completed_reservations: list.filter(r => r.status === 'completed').length,
      total_revenue: list.filter(r => r.status !== 'cancelled').reduce((s, r) => s + Number(r.total_amount || 0), 0),
    }

    return NextResponse.json({
      success: true,
      data: {
        reservations: reservationsView,
        bookings: reservationsView, // alias for compatibility
        pagination: { page, limit, total: totalCount || list.length, hasMore: list.length === limit },
        summary,
      }
    })
  } catch (error) {
    console.error('Partner reservations API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
