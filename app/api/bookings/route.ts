import { NextRequest, NextResponse } from 'next/server'
import { requireAuthAPI } from '@/lib/auth'
import { serverBookingIntegration, type BookingRequest } from '@/lib/services/booking-integration'

export async function POST(request: NextRequest) {
  try {
    // Check authentication using integrated auth system
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      loft_id,
      check_in,
      check_out,
      guests,
      special_requests,
      total_price,
      guest_info
    } = body

    // Validate required fields
    if (!loft_id || !check_in || !check_out || !guests || !total_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create booking request
    const bookingRequest: BookingRequest = {
      loft_id,
      check_in,
      check_out,
      guests,
      total_price,
      special_requests,
      guest_info
    }

    // Use integrated booking service
    const result = await serverBookingIntegration.createBooking(bookingRequest, session)

    if (result.success && result.booking) {
      return NextResponse.json({
        success: true,
        booking: result.booking
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to create booking' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication using integrated auth system
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 10
    const status = searchParams.get('status') || undefined

    // Use integrated booking service for consistent data access
    const result = await serverBookingIntegration.getUserBookings(session, {
      page,
      limit,
      status
    })

    return NextResponse.json({
      bookings: result.bookings,
      pagination: {
        page,
        limit,
        total: result.total,
        hasMore: result.bookings.length === limit
      }
    })

  } catch (error) {
    console.error('Bookings GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}