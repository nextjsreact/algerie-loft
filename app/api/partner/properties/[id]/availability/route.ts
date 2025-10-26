import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
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

    // Build query for availability data
    let query = supabase
      .from('loft_availability')
      .select(`
        date,
        is_available,
        price_override,
        minimum_stay,
        bookings(id, status)
      `)
      .eq('loft_id', propertyId)
      .order('date', { ascending: true })

    // Filter by date range if provided
    if (start) {
      query = query.gte('date', start)
    }
    if (end) {
      query = query.lte('date', end)
    }

    const { data: availability, error } = await query

    if (error) {
      throw error
    }

    // Transform data to include booking information
    const transformedAvailability = availability?.map(item => ({
      date: item.date,
      is_available: item.is_available,
      price_override: item.price_override,
      minimum_stay: item.minimum_stay,
      booking_id: item.bookings?.[0]?.id,
      booking_status: item.bookings?.[0]?.status
    })) || []

    return NextResponse.json({ availability: transformedAvailability })

  } catch (error) {
    console.error('Error fetching availability:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement de la disponibilité' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { date, is_available, price_override, minimum_stay } = await request.json()
    
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

    // Check if there's an existing booking for this date
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('loft_id', propertyId)
      .lte('check_in', date)
      .gte('check_out', date)
      .in('status', ['confirmed', 'pending'])
      .single()

    if (existingBooking && is_available === false) {
      return NextResponse.json(
        { error: 'Impossible de bloquer une date avec une réservation active' },
        { status: 400 }
      )
    }

    // Upsert availability data
    const { error: upsertError } = await supabase
      .from('loft_availability')
      .upsert({
        loft_id: propertyId,
        date,
        is_available: is_available ?? true,
        price_override: price_override || null,
        minimum_stay: minimum_stay || 1
      })

    if (upsertError) {
      throw upsertError
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la disponibilité' },
      { status: 500 }
    )
  }
}