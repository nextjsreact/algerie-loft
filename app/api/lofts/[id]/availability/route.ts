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

    const supabase = await createClient(true);

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

    // Check for unavailable dates (manually blocked)
    const { data: blockedDates, error: blockError } = await supabase
      .from('loft_availability')
      .select('date, notes')
      .eq('loft_id', id)
      .eq('is_available', false)
      .gte('date', checkIn)
      .lt('date', checkOut);

    if (blockError) {
      console.error("Blocked dates check error:", blockError);
      return NextResponse.json(
        { error: "Failed to check availability" },
        { status: 500 }
      );
    }

    // Check for overlapping reservations (confirmed or pending)
    const { data: conflicts, error: conflictError } = await supabase
      .from('reservations')
      .select('id, check_in_date, check_out_date, status')
      .eq('loft_id', id)
      .in('status', ['confirmed', 'pending'])
      .lt('check_in_date', checkOut)
      .gt('check_out_date', checkIn);

    if (conflictError) {
      console.error("Reservation check error:", conflictError);
      return NextResponse.json(
        { error: "Failed to check availability" },
        { status: 500 }
      );
    }

    // Calculate stay duration
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const stayDuration = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Determine availability
    let available = true;
    let reason = "Available for booking";

    if (blockedDates && blockedDates.length > 0) {
      available = false;
      reason = "Certaines dates sont bloquées dans cette période";
    } else if (conflicts && conflicts.length > 0) {
      available = false;
      reason = "Le loft est déjà réservé pour certaines de ces dates";
    } else if (loft.minimum_stay && stayDuration < loft.minimum_stay) {
      available = false;
      reason = `Séjour minimum : ${loft.minimum_stay} nuits`;
    } else if (loft.maximum_stay && stayDuration > loft.maximum_stay) {
      available = false;
      reason = `Séjour maximum : ${loft.maximum_stay} nuits`;
    }

    // Build the full list of unavailable dates for calendar display
    const allUnavailableDates = [...(blockedDates || [])]
    if (conflicts) {
      conflicts.forEach((res: any) => {
        const start = new Date(res.check_in_date)
        const end = new Date(res.check_out_date)
        const current = new Date(start)
        while (current < end) {
          const dateStr = current.toISOString().split('T')[0]
          if (!allUnavailableDates.find(d => d.date === dateStr)) {
            allUnavailableDates.push({ date: dateStr, notes: `Réservé (${res.status})` })
          }
          current.setDate(current.getDate() + 1)
        }
      })
    }

    return NextResponse.json({
      available,
      reason: available ? "Available for booking" : reason,
      stay_duration: stayDuration,
      minimum_stay: loft.minimum_stay,
      maximum_stay: loft.maximum_stay,
      unavailable_dates: allUnavailableDates
    });

  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}