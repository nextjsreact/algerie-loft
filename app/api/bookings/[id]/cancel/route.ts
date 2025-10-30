import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
    }

    const { id } = await params;
      )
    }

    const body = await request.json()
    const { cancellation_reason } = body

    const supabase = await createClient()

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        client_id,
        partner_id,
        status,
        payment_status,
        check_in,
        total_price,
        lofts (
          name
        )
      `)
      .eq('id', params.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check permissions - client or partner can cancel
    const canCancel = 
      booking.client_id === session.user.id ||
      booking.partner_id === session.user.id ||
      ['admin', 'manager'].includes(session.user.role)

    if (!canCancel) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      )
    }

    if (booking.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot cancel completed booking' },
        { status: 400 }
      )
    }

    // Check cancellation policy (simplified)
    const checkInDate = new Date(booking.check_in)
    const now = new Date()
    const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    let refundAmount = 0
    let refundStatus = 'no_refund'

    // Simple cancellation policy
    if (hoursUntilCheckIn > 48) {
      // More than 48 hours: full refund
      refundAmount = booking.total_price
      refundStatus = 'full_refund'
    } else if (hoursUntilCheckIn > 24) {
      // 24-48 hours: 50% refund
      refundAmount = Math.round(booking.total_price * 0.5)
      refundStatus = 'partial_refund'
    }
    // Less than 24 hours: no refund

    // Update booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: cancellation_reason || 'Cancelled by user',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Booking cancellation error:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      )
    }

    // Process refund if applicable and payment was made
    if (refundAmount > 0 && booking.payment_status === 'paid') {
      // In a real application, you would process the actual refund here
      // For now, we'll just update the payment status
      await supabase
        .from('bookings')
        .update({
          payment_status: 'refunded',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      // TODO: Process actual refund through payment provider
      // TODO: Send refund confirmation email
    }

    // TODO: Send cancellation notification to both client and partner
    // TODO: Update loft availability calendar

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
      refund: {
        status: refundStatus,
        amount: refundAmount,
        processed: refundAmount > 0 && booking.payment_status === 'paid'
      }
    })

  } catch (error) {
    console.error('Cancellation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}