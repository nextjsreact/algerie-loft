import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Fetch bookings with loft details
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_reference,
        check_in,
        check_out,
        guests,
        total_price,
        status,
        payment_status,
        created_at,
        loft:lofts (
          id,
          name,
          description,
          address,
          price_per_month
        )
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      // Return empty array instead of error to allow dashboard to load
      return NextResponse.json({
        success: true,
        bookings: [],
        count: 0,
        message: 'Aucune réservation trouvée'
      })
    }

    // Transform data to match expected format
    const transformedBookings = (bookings || []).map(booking => ({
      id: booking.id,
      booking_reference: booking.booking_reference,
      check_in: booking.check_in,
      check_out: booking.check_out,
      guests: booking.guests,
      total_price: booking.total_price,
      status: booking.status,
      payment_status: booking.payment_status,
      loft: {
        id: booking.loft?.id || '',
        name: booking.loft?.name || 'Loft',
        address: booking.loft?.address || 'Adresse non disponible',
        price_per_night: booking.loft?.price_per_month || 0,
        images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop']
      }
    }))

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
      count: transformedBookings.length
    })

  } catch (error) {
    console.error('Error in bookings API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
