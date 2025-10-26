import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user and verify admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager', 'executive'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Get all bookings with related data
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        loft_id,
        client_id,
        partner_id,
        check_in,
        check_out,
        guests,
        total_price,
        status,
        payment_status,
        special_requests,
        created_at,
        lofts(name, address),
        client:profiles!bookings_client_id_fkey(full_name, email),
        partner:profiles!bookings_partner_id_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Transform the data for the frontend
    const transformedBookings = bookings?.map(booking => ({
      id: booking.id,
      loft_id: booking.loft_id,
      client_id: booking.client_id,
      partner_id: booking.partner_id,
      check_in: booking.check_in,
      check_out: booking.check_out,
      guests: booking.guests,
      total_price: booking.total_price,
      status: booking.status,
      payment_status: booking.payment_status,
      special_requests: booking.special_requests,
      created_at: booking.created_at,
      loft: {
        name: booking.lofts?.name || 'Loft inconnu',
        address: booking.lofts?.address || 'Adresse inconnue'
      },
      client: {
        full_name: booking.client?.full_name || 'Client inconnu',
        email: booking.client?.email || 'Email inconnu'
      },
      partner: {
        full_name: booking.partner?.full_name || 'Partenaire inconnu',
        email: booking.partner?.email || 'Email inconnu'
      }
    })) || []

    return NextResponse.json({ bookings: transformedBookings })

  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des réservations' },
      { status: 500 }
    )
  }
}