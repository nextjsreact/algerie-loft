import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const checkIn = searchParams.get('check_in');
    const checkOut = searchParams.get('check_out');

    if (!id) {
      return NextResponse.json(
        { error: "Loft ID is required" },
        { status: 400 }
      );
    }

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "Check-in and check-out dates are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if loft exists and is published
    const { data: loft, error: loftError } = await supabase
      .from('lofts')
      .select('id, name, status, is_published, minimum_stay, maximum_stay')
      .eq('id', id)
      .single();

    if (loftError || !loft) {
      return NextResponse.json(
        { error: "Loft not found" },
        { status: 404 }
      );
    }

    if (!loft.is_published || loft.status !== 'available') {
      return NextResponse.json({
        available: false,
        reason: "Loft is not available for booking"
      });
    }

    // Check for unavailable dates in the range
    const { data: unavailableDates, error: availabilityError } = await supabase
      .from('loft_availability')
      .select('date, notes')
      .eq('loft_id', id)
      .eq('is_available', false)
      .gte('date', checkIn)
      .lt('date', checkOut);

    if (availabilityError) {
      console.error("Availability check error:", availabilityError);
      return NextResponse.json(
        { error: "Failed to check availability" },
        { status: 500 }
      );
    }

    // Calculate stay duration
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const stayDuration = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Check minimum and maximum stay requirements
    let available = true;
    let reason = "";

    if (unavailableDates && unavailableDates.length > 0) {
      available = false;
      reason = "Some dates in the selected range are not available";
    } else if (loft.minimum_stay && stayDuration < loft.minimum_stay) {
      available = false;
      reason = `Minimum stay is ${loft.minimum_stay} nights`;
    } else if (loft.maximum_stay && stayDuration > loft.maximum_stay) {
      available = false;
      reason = `Maximum stay is ${loft.maximum_stay} nights`;
    }

    return NextResponse.json({
      available,
      reason: available ? "Available for booking" : reason,
      stay_duration: stayDuration,
      minimum_stay: loft.minimum_stay,
      maximum_stay: loft.maximum_stay,
      unavailable_dates: unavailableDates || []
    });

  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}