import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'


// GET /api/admin/lofts/[id]/reservations - Get reservations for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    // Verify property exists
    const { data: property, error: propertyError } = await supabase
      .from('lofts')
      .select('id, name')
      .eq('id', id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Build query based on status filter
    let query = supabase
      .from('reservations')
      .select(`
        id,
        check_in,
        check_out,
        status,
        total_amount,
        currency,
        guest_name,
        guest_email,
        guest_phone,
        special_requests,
        created_at
      `)
      .eq('loft_id', id)
      .order('check_in', { ascending: true })

    const now = new Date().toISOString()

    // Apply status filters
    switch (status) {
      case 'active':
        // Currently active reservations (checked in or confirmed and current)
        query = query.in('status', ['confirmed', 'checked_in', 'pending'])
        break
      case 'future':
        // Future reservations
        query = query.gte('check_in', now)
        break
      case 'past':
        // Past reservations
        query = query.lt('check_out', now)
        break
      case 'confirmed':
        query = query.eq('status', 'confirmed')
        break
      case 'pending':
        query = query.eq('status', 'pending')
        break
      case 'cancelled':
        query = query.eq('status', 'cancelled')
        break
      // 'all' - no additional filter
    }

    const { data: reservations, error } = await query

    if (error) {
      console.error('Error fetching reservations:', error)
      return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
    }

    // Categorize reservations for better analysis
    const categorizedReservations = {
      active: reservations?.filter(r => 
        ['confirmed', 'checked_in', 'pending'].includes(r.status) &&
        new Date(r.check_in) <= new Date() &&
        new Date(r.check_out) >= new Date()
      ) || [],
      future: reservations?.filter(r => 
        new Date(r.check_in) > new Date()
      ) || [],
      past: reservations?.filter(r => 
        new Date(r.check_out) < new Date()
      ) || []
    }

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        name: property.name
      },
      reservations: reservations || [],
      categorized: categorizedReservations,
      summary: {
        total: reservations?.length || 0,
        active: categorizedReservations.active.length,
        future: categorizedReservations.future.length,
        past: categorizedReservations.past.length
      }
    })

  } catch (error) {
    console.error('Property reservations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}