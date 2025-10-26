import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get booking details with loft and partner information
    const { data: booking, error } = await supabase
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
        special_requests,
        created_at,
        lofts (
          id,
          name,
          address,
          price_per_night
        ),
        partner_profiles!bookings_partner_id_fkey (
          user_id,
          business_name,
          profiles!partner_profiles_user_id_fkey (
            full_name
          )
        )
      `)
      .eq('id', params.id)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this booking
    const hasAccess = 
      booking.client_id === session.user.id || // Client owns the booking
      booking.partner_id === session.user.id || // Partner owns the loft
      ['admin', 'manager'].includes(session.user.role) // Admin access

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Format the response
    const formattedBooking = {
      ...booking,
      partner: booking.partner_profiles ? {
        id: booking.partner_profiles.user_id,
        name: booking.partner_profiles.profiles?.full_name || 'Propriétaire',
        business_name: booking.partner_profiles.business_name
      } : undefined
    }

    return NextResponse.json(formattedBooking)

  } catch (error) {
    console.error('Booking detail API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status, payment_status, special_requests } = body

    const supabase = await createClient()

    // Get current booking to check permissions
    const { data: currentBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('client_id, partner_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !currentBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const canModify = 
      currentBooking.client_id === session.user.id ||
      currentBooking.partner_id === session.user.id ||
      ['admin', 'manager'].includes(session.user.role)

    if (!canModify) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (payment_status !== undefined) updateData.payment_status = payment_status
    if (special_requests !== undefined) updateData.special_requests = special_requests
    updateData.updated_at = new Date().toISOString()

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Booking update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking
    })

  } catch (error) {
    console.error('Booking update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}