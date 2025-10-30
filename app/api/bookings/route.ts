import { NextRequest, NextResponse } from 'next/server';
import { ReservationService } from '@/lib/services/reservation-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    
    // Initialize reservation service
    const reservationService = new ReservationService();
    
    let reservations;
    if (customerId) {
      // Get reservations for specific customer
      reservations = await reservationService.getUserReservations(customerId);
    } else {
      // For development: return all reservations
      // In production, this would require admin authentication
      reservations = reservationService['getStoredReservations']();
    }
    
    return NextResponse.json({
      success: true,
      reservations,
      count: reservations.length
    });
    
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const reservationRequest = await request.json();
    
    // Initialize reservation service
    const reservationService = new ReservationService();
    
    // Create new reservation
    const reservation = await reservationService.createReservation(
      reservationRequest,
      reservationRequest.customer_id
    );
    
    return NextResponse.json({
      success: true,
      reservation
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
}