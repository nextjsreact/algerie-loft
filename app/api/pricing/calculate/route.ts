import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loftId = searchParams.get('loft_id');
    const checkIn = searchParams.get('check_in');
    const checkOut = searchParams.get('check_out');
    const guests = parseInt(searchParams.get('guests') || '1');

    if (!loftId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required parameters: loft_id, check_in, check_out' },
        { status: 400 }
      );
    }

    // Calculate number of nights
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }

    // Simple pricing calculation (in a real app, this would come from database)
    const basePrice = 120; // Base price per night in DZD
    const cleaningFee = nights >= 7 ? 50 : 30;
    const serviceFee = Math.round((basePrice * nights) * 0.05); // 5% service fee
    const taxes = Math.round((basePrice * nights + serviceFee) * 0.19); // 19% tax

    const subtotal = basePrice * nights;
    const total = subtotal + cleaningFee + serviceFee + taxes;

    const pricing = {
      loft_id: loftId,
      check_in: checkIn,
      check_out: checkOut,
      nights,
      guests,
      breakdown: {
        base_price: basePrice,
        subtotal,
        cleaning_fee: cleaningFee,
        service_fee: serviceFee,
        taxes,
        total
      },
      currency: 'DZD',
      calculated_at: new Date().toISOString()
    };

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}