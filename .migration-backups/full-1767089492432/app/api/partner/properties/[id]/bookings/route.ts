import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    
    // Get current user and verify they own this property
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const propertyId = params.id

    // Verify property ownership
    const { data: property, error: propertyError } = await supabase
      .from('lofts')
      .select('owner_id')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property || property.owner_id !== user.id) {
      return NextResponse.json({ error: 'Propriété non trouvée ou accès non autorisé' }, { status: 404 })
    }

    // Build query for bookings
    let query = supabase
      .from('bookings')
      .select(`
        id,
        check_in,
        check_out,
        guests,
        total_price,
        status,
        payment_status,
        profiles!bookings_client_id_fkey(full_name)
      `)
      .eq('loft_id', propertyId)
      .order('check_in', { ascending: true })

    // Filter by date range if provided
    if (start) {
      query = query.gte('check_in', start)
    }
    if (end) {
      query = query.lte('check_out', end)
    }

    const { data: bookings, error } = await query

    if (error) {
      throw error
    }

    // Transform data for the frontend
    const transformedBookings = bookings?.map(booking => ({
      id: booking.id,
      client_name: booking.profiles?.full_name || 'Client inconnu',
      check_in: booking.check_in,
      check_out: booking.check_out,
      guests: booking.guests,
      total_price: booking.total_price,
      status: booking.status
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