import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loftId = params.id
    const { searchParams } = new URL(request.url)
    const checkIn = searchParams.get('check_in')
    const checkOut = searchParams.get('check_out')

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'check_in and check_out dates are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check availability using the database function
    const { data: isAvailable, error: availabilityError } = await supabase.rpc(
      'check_loft_availability',
      {
        p_loft_id: loftId,
        p_check_in: checkIn,
        p_check_out: checkOut
      }
    )

    if (availabilityError) {
      console.error('Availability check error:', availabilityError)
      return NextResponse.json(
        { error: 'Failed to check availability' },
        { status: 500 }
      )
    }

    if (!isAvailable) {
      return NextResponse.json({
        available: false,
        message: 'Le loft n\'est pas disponible pour ces dates'
      })
    }

    // Calculate total price using the database function
    const { data: totalPrice, error: priceError } = await supabase.rpc(
      'calculate_booking_total',
      {
        p_loft_id: loftId,
        p_check_in: checkIn,
        p_check_out: checkOut
      }
    )

    if (priceError) {
      console.error('Price calculation error:', priceError)
      return NextResponse.json(
        { error: 'Failed to calculate price' },
        { status: 500 }
      )
    }

    // Calculate number of nights
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate fees (simplified for now)
    const serviceFee = Math.round(totalPrice * 0.1) // 10% service fee
    const cleaningFee = 2000 // Fixed cleaning fee in DZD
    const totalWithFees = totalPrice + serviceFee + cleaningFee

    return NextResponse.json({
      available: true,
      pricing: {
        basePrice: totalPrice,
        nights: nights,
        pricePerNight: Math.round(totalPrice / nights),
        fees: {
          service: serviceFee,
          cleaning: cleaningFee
        },
        total: totalWithFees
      }
    })

  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}