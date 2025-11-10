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
          address,
          city,
          price_per_night,
          images,
          amenities,
          bedrooms,
          bathrooms,
          max_guests
        )
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des réservations' },
        { status: 500 }
      )
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
        address: `${booking.loft?.address || ''}, ${booking.loft?.city || ''}`,
        price_per_night: booking.loft?.price_per_night || 0,
        images: booking.loft?.images || [],
        amenities: booking.loft?.amenities || [],
        bedrooms: booking.loft?.bedrooms || 0,
        bathrooms: booking.loft?.bathrooms || 0,
        max_guests: booking.loft?.max_guests || 0
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
