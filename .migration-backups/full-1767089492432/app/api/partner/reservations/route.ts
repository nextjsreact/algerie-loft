import { NextRequest, NextResponse } from 'next/server';
import { getPartnerInfoFromHeaders } from '@/middleware/partner-auth';
import { createReadOnlyClient } from '@/utils/supabase/server';

interface ReservationFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  property_id?: string;
}

interface PartnerReservationView {
  id: string;
  loft_id: string;
  loft_name: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
  nights: number;
  guests_count: number;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

interface PartnerReservationsResponse {
  success: boolean;
  data?: {
    reservations: PartnerReservationView[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
    summary: {
      total_reservations: number;
      active_reservations: number;
      upcoming_reservations: number;
      completed_reservations: number;
      total_revenue: number;
    };
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<PartnerReservationsResponse>> {
  try {
    // Get partner info from middleware headers
    const partnerInfo = getPartnerInfoFromHeaders(request);
    
    if (!partnerInfo.partnerId || !partnerInfo.userId) {
      return NextResponse.json({
        success: false,
        error: 'Partner authentication required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100); // Max 100 items per page
    const offset = (page - 1) * limit;
    
    // Parse filters
    const filters: ReservationFilters = {
      status: searchParams.get('status') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      property_id: searchParams.get('property_id') || undefined
    };

    const supabase = await createReadOnlyClient();

    // Build query with RLS automatically applied through lofts join
    let query = supabase
      .from('reservations')
      .select(`
        id,
        loft_id,
        guest_name,
        guest_email,
        guest_phone,
        check_in,
        check_out,
        status,
        total_amount,
        nights,
        guests_count,
        special_requests,
        created_at,
        updated_at,
        lofts!inner(
          id,
          name,
          partner_id
        )
      `)
      .eq('lofts.partner_id', partnerInfo.partnerId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.property_id) {
      query = query.eq('loft_id', filters.property_id);
    }
    
    if (filters.date_from) {
      query = query.gte('check_in', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('check_out', filters.date_to);
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('reservations')
      .select('*, lofts!inner(partner_id)', { count: 'exact', head: true })
      .eq('lofts.partner_id', partnerInfo.partnerId);

    if (countError) {
      console.error('Count query error:', countError);
    }

    // Get paginated results
    const { data: reservations, error: reservationsError } = await query
      .range(offset, offset + limit - 1);

    if (reservationsError) {
      console.error('Reservations fetch error:', reservationsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch reservations'
      }, { status: 500 });
    }

    const reservationsList = reservations || [];

    // Build detailed reservations view
    const reservationsView: PartnerReservationView[] = reservationsList.map((reservation) => {
      const loft = reservation.lofts as any;
      
      return {
        id: reservation.id,
        loft_id: reservation.loft_id,
        loft_name: loft?.name || 'Unknown Property',
        guest_name: reservation.guest_name || 'Guest',
        guest_email: reservation.guest_email,
        guest_phone: reservation.guest_phone,
        check_in: reservation.check_in,
        check_out: reservation.check_out,
        status: reservation.status,
        total_amount: reservation.total_amount || 0,
        nights: reservation.nights || 1,
        guests_count: reservation.guests_count || 1,
        special_requests: reservation.special_requests,
        created_at: reservation.created_at,
        updated_at: reservation.updated_at
      };
    });

    // Calculate summary statistics
    const now = new Date();
    const allReservationsForSummary = reservationsList;

    const activeReservations = allReservationsForSummary.filter(r => 
      ['confirmed', 'checked_in'].includes(r.status)
    );

    const upcomingReservations = allReservationsForSummary.filter(r => {
      const checkIn = new Date(r.check_in);
      return checkIn > now && r.status === 'confirmed';
    });

    const completedReservations = allReservationsForSummary.filter(r => 
      r.status === 'completed'
    );

    const totalRevenue = completedReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0);

    const summary = {
      total_reservations: totalCount || 0,
      active_reservations: activeReservations.length,
      upcoming_reservations: upcomingReservations.length,
      completed_reservations: completedReservations.length,
      total_revenue: totalRevenue
    };

    return NextResponse.json({
      success: true,
      data: {
        reservations: reservationsView,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          hasMore: reservationsList.length === limit
        },
        summary
      }
    });

  } catch (error) {
    console.error('Partner reservations API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}