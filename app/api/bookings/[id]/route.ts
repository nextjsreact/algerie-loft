import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// GET /api/bookings/[id] - Get booking details (public access for reservation confirmation)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient()

    // Get reservation with related data from reservations table
    const { data: reservation, error } = await supabase
      .from('reservations')
      .select(`
        *,
        loft:lofts(*),
        customer:customers(*)
      `)
      .eq('id', id)
      .single()

    if (error || !reservation) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      )
    }

    // Transform reservation data to match expected booking format
    const booking = {
      id: reservation.id,
      loft_id: reservation.loft_id,
      customer_id: reservation.customer_id,
      check_in_date: reservation.check_in_date,
      check_out_date: reservation.check_out_date,
      nights: reservation.nights,
      guest_info: reservation.guest_info,
      pricing: reservation.pricing,
      status: reservation.status,
      special_requests: reservation.special_requests,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
      loft: reservation.loft,
      customer: reservation.customer
    }

    return NextResponse.json(booking)

  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT /api/bookings/[id] - Update reservation (public access for status updates)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const supabase = await createClient()

    // Get existing reservation
    const { data: existingReservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingReservation) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      )
    }

    // Update reservation
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating reservation:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedReservation)

  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}