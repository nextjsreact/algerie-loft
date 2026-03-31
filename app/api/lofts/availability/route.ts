import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { format, addDays, eachDayOfInterval, isBefore, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: Request) {
  try {
    const supabase = await createClient(true);
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd');
    const endDateParam = searchParams.get('endDate') || format(addDays(new Date(), 29), 'yyyy-MM-dd');

    const startDate = parseISO(startDateParam);
    const endDate = parseISO(endDateParam);

    // 1. Fetch all lofts
    const { data: loftsData, error: loftsError } = await supabase
      .from("lofts")
      .select('id, name, address, description, price_per_night, status, owner_id, zone_area_id, company_percentage')
      .order("created_at", { ascending: false });

    if (loftsError) throw loftsError;

    // 2. Fetch all reservations that overlap with our window
    const { data: reservationsData, error: reservationsError } = await supabase
      .from('reservations')
      .select('loft_id, check_in_date, check_out_date')
      .in('status', ['confirmed', 'pending'])
      .lt('check_in_date', endDateParam)
      .gte('check_out_date', startDateParam);

    if (reservationsError) throw reservationsError;

    // 3. Fetch all manual availability that overlaps with our window
    const { data: availabilityData, error: availabilityError } = await supabase
      .from('loft_availability')
      .select('loft_id, date, is_available, blocked_reason')
      .gte('date', startDateParam)
      .lte('date', endDateParam);

    if (availabilityError) throw availabilityError;

    // 4. Create a map of loft_id -> set of booked dates for efficient lookup
    const bookedDatesByLoft = new Map<string, Set<string>>();
    (reservationsData || []).forEach(res => {
      const interval = eachDayOfInterval({
        start: parseISO(res.check_in_date),
        end: addDays(parseISO(res.check_out_date), -1) // checkout day is NOT occupied
      });
      
      if (!bookedDatesByLoft.has(res.loft_id)) {
        bookedDatesByLoft.set(res.loft_id, new Set());
      }
      const loftBookings = bookedDatesByLoft.get(res.loft_id)!;
      interval.forEach(day => loftBookings.add(format(day, 'yyyy-MM-dd')));
    });

    // 5. Create a map of manual availability for efficient lookup
    const manualAvailabilityByLoft = new Map<string, Map<string, { is_available: boolean; blocked_reason: string | null }>>();
    (availabilityData || []).forEach(avail => {
      if (!manualAvailabilityByLoft.has(avail.loft_id)) {
        manualAvailabilityByLoft.set(avail.loft_id, new Map());
      }
      manualAvailabilityByLoft.get(avail.loft_id)!.set(avail.date, {
        is_available: avail.is_available,
        blocked_reason: avail.blocked_reason,
      });
    });

    // 6. Fetch owners and zones
    const { data: ownersData } = await supabase.from("owners").select("id, name").order("name");
    const { data: zoneAreasData } = await supabase.from("zone_areas").select("id, name").order("name");
    const ownersMap = new Map((ownersData || []).map(o => [o.id, o.name]));
    const zonesMap = new Map((zoneAreasData || []).map(z => [z.id, z.name]));

    // 7. Transform the data, building the day-by-day availability object
    const transformedLofts = (loftsData || []).map(loft => {
      const availabilityMap: { [key: string]: string } = {};
      const loftBookedDates = bookedDatesByLoft.get(loft.id);
      const loftManualAvailability = manualAvailabilityByLoft.get(loft.id);
      const interval = eachDayOfInterval({ start: startDate, end: endDate });

      let isCurrentlyOccupied = false;
      let totalDays = 0;
      let occupiedDays = 0;

      interval.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const manualAvail = loftManualAvailability?.get(dayKey);
        totalDays++;

        if (loftBookedDates?.has(dayKey)) {
          availabilityMap[dayKey] = 'occupied';
          occupiedDays++;
          if (isBefore(day, addDays(new Date(), 1))) {
            isCurrentlyOccupied = true;
          }
        } else if (manualAvail && !manualAvail.is_available) {
          availabilityMap[dayKey] = manualAvail.blocked_reason || 'maintenance';
          occupiedDays++;
        } else {
          availabilityMap[dayKey] = 'available';
        }
      });

      // Status based on the selected period:
      // - 'available'    : no occupied days in the period
      // - 'occupied'     : all days occupied
      // - 'partial'      : some days occupied (shown as occupied in stats)
      const occupancyRatio = totalDays > 0 ? occupiedDays / totalDays : 0;
      let periodStatus: string;
      if (occupiedDays === 0) {
        periodStatus = 'available';
      } else if (occupancyRatio >= 0.5) {
        periodStatus = 'occupied';
      } else {
        periodStatus = 'partial'; // partially booked → counts as occupied in stats
      }

      return {
        id: loft.id,
        name: loft.name,
        region: zonesMap.get(loft.zone_area_id) || 'availability:unknown',
        owner: ownersMap.get(loft.owner_id) || 'availability:unknown',
        pricePerNight: loft.price_per_night,
        capacity: 4,
        status: periodStatus,
        image: '/images/loft-placeholder.jpg',
        amenities: ['wifi', 'parking', 'kitchen'],
        availability: availabilityMap, // The detailed day-by-day map
        address: loft.address,
        description: loft.description,
        companyPercentage: loft.company_percentage,
        owner_id: loft.owner_id,
        zone_area_id: loft.zone_area_id
      };
    });

    // Prepare filter options
    const regions = [{ value: 'all', label: 'availability:allRegions' }, ...(zoneAreasData || []).map(z => ({ value: z.id, label: z.name }))];
    const owners = [{ value: 'all', label: 'availability:allOwners' }, ...(ownersData || []).map(o => ({ value: o.id, label: o.name }))];

    return NextResponse.json({
      lofts: transformedLofts,
      filterOptions: { regions, owners, zoneAreas: zoneAreasData || [], ownersData: ownersData || [] }
    });

  } catch (error) {
    console.error("Unexpected error in /api/lofts/availability:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}