import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { loftDataService } from '@/lib/services/loft-data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const loftId = searchParams.get('loft_id');
    const checkIn = searchParams.get('check_in');
    const checkOut = searchParams.get('check_out');

    if (!loftId || !checkIn || !checkOut) {
      return NextResponse.json({
        success: false,
        error: 'Paramètres requis: loft_id, check_in, check_out',
        available: false
      }, { status: 400 });
    }

    console.log('Availability check request:', { loftId, checkIn, checkOut });

    // Check if loft exists
    const loftExists = await loftDataService.loftExists(loftId);
    if (!loftExists) {
      return NextResponse.json({
        success: false,
        error: 'Loft non trouvé',
        available: false,
        code: 'LOFT_NOT_FOUND'
      }, { status: 404 });
    }

    // Date validation
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return NextResponse.json({
        success: false,
        error: 'La date d\'arrivée ne peut pas être dans le passé',
        available: false,
        code: 'INVALID_DATE'
      }, { status: 400 });
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json({
        success: false,
        error: 'La date de départ doit être après la date d\'arrivée',
        available: false,
        code: 'INVALID_DATE_RANGE'
      }, { status: 400 });
    }

    // Check availability
    const isAvailable = await checkLoftAvailability(loftId, checkIn, checkOut);

    return NextResponse.json({
      success: true,
      available: isAvailable,
      loft_id: loftId,
      check_in: checkIn,
      check_out: checkOut,
      checked_at: new Date().toISOString(),
      message: isAvailable ? 'Loft disponible' : 'Loft non disponible pour ces dates'
    });

  } catch (error) {
    console.error('Availability check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la vérification de disponibilité',
      available: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function checkLoftAvailability(loftId: string, checkIn: string, checkOut: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Check for overlapping reservations
    const { data: overlappingReservations, error } = await supabase
      .from('reservations')
      .select('id')
      .eq('loft_id', loftId)
      .in('status', ['confirmed', 'pending'])
      .lt('check_in_date', checkOut)
      .gt('check_out_date', checkIn);

    if (error) {
      console.warn('Error checking reservations, assuming available:', error);
      return true; // Default to available if we can't check
    }

    const hasOverlap = overlappingReservations && overlappingReservations.length > 0;
    
    if (hasOverlap) {
      console.log(`Found ${overlappingReservations.length} overlapping reservations for loft ${loftId}`);
      return false;
    }

    // Check for manually blocked dates
    const { data: blockedDates, error: blockError } = await supabase
      .from('loft_availability')
      .select('date')
      .eq('loft_id', loftId)
      .eq('is_available', false)
      .gte('date', checkIn)
      .lt('date', checkOut);

    if (blockError) {
      console.warn('Error checking blocked dates, assuming available:', blockError);
      return true;
    }

    const hasBlockedDates = blockedDates && blockedDates.length > 0;
    
    if (hasBlockedDates) {
      console.log(`Found ${blockedDates.length} blocked dates for loft ${loftId}`);
      return false;
    }

    return true; // Available if no overlaps and no blocked dates

  } catch (error) {
    console.error('Error in availability check:', error);
    return true; // Default to available if error occurs
  }
}