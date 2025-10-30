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
    const { payment_method, amount } = body

    if (!payment_method || !amount) {
      return NextResponse.json(
        { error: 'Missing payment information' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        client_id,
        partner_id,
        total_price,
        status,
        payment_status,
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

    // Check if user is the client who made the booking
    if (booking.client_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the booking owner can make payments' },
        { status: 403 }
      )
    }

    // Check if booking is in correct state for payment
    if (booking.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Booking is already paid' },
        { status: 400 }
      )
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot pay for cancelled booking' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount !== booking.total_price) {
      return NextResponse.json(
        { error: 'Payment amount does not match booking total' },
        { status: 400 }
      )
    }

    // Simulate payment processing
    // In a real application, you would integrate with Stripe, PayPal, etc.
    const paymentSuccess = Math.random() > 0.1 // 90% success rate for demo

    if (!paymentSuccess) {
      // Update booking with failed payment
      await supabase
        .from('bookings')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id)

      return NextResponse.json(
        { error: 'Payment failed. Please try again.' },
        { status: 400 }
      )
    }

    // Payment successful - update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Booking update error:', updateError)
      return NextResponse.json(
        { error: 'Payment processed but failed to update booking' },
        { status: 500 }
      )
    }

    // TODO: Send confirmation email to client
    // TODO: Send notification to partner
    // TODO: Create payment record for accounting

    // Simulate creating a payment record
    const paymentRecord = {
      id: `pay_${Date.now()}`,
      booking_id: params.id,
      amount: amount,
      currency: 'EUR',
      payment_method: payment_method,
      status: 'succeeded',
      created_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      booking: updatedBooking,
      payment: paymentRecord
    })

  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}