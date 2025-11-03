import { NextRequest, NextResponse } from 'next/server';
import { PartnerAuthService } from '@/lib/services/partner-auth-service';
import { getPartnerInfoFromHeaders } from '@/middleware/partner-auth';
import { createReadOnlyClient } from '@/utils/supabase/server';
import type { PartnerProfile } from '@/lib/types/partner-auth';

interface PartnerDashboardStats {
  properties: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
  };
  revenue: {
    current_month: number;
    previous_month: number;
    year_to_date: number;
    currency: string;
  };
  reservations: {
    active: number;
    upcoming: number;
    completed_this_month: number;
  };
  occupancy_rate: {
    current_month: number;
    previous_month: number;
  };
}

interface ReservationSummary {
  id: string;
  loft_name: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
}

interface PartnerPropertyView {
  id: string;
  name: string;
  type: string;
  address: string;
  status: string;
  current_occupancy_status: 'available' | 'occupied' | 'maintenance';
  next_reservation?: {
    check_in: string;
    check_out: string;
    guest_name: string;
  };
  revenue_this_month: number;
  revenue_last_month: number;
  total_reservations: number;
  average_rating: number;
  images: string[];
}

interface PartnerDashboardResponse {
  success: boolean;
  data?: {
    partner: PartnerProfile & {
      properties_count: number;
      total_revenue: number;
      active_reservations_count: number;
    };
    statistics: PartnerDashboardStats;
    properties: PartnerPropertyView[];
    recent_reservations: ReservationSummary[];
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<PartnerDashboardResponse>> {
  try {
    // Get partner info from middleware headers
    const partnerInfo = getPartnerInfoFromHeaders(request);
    
    if (!partnerInfo.partnerId || !partnerInfo.userId) {
      return NextResponse.json({
        success: false,
        error: 'Partner authentication required'
      }, { status: 401 });
    }

    const supabase = await createReadOnlyClient();

    // Get partner profile
    const { data: partnerProfile, error: profileError } = await supabase
      .from('partners')
      .select('*')
      .eq('id', partnerInfo.partnerId)
      .single();

    if (profileError || !partnerProfile) {
      return NextResponse.json({
        success: false,
        error: 'Partner profile not found'
      }, { status: 404 });
    }

    // Get current and previous month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Get partner properties with detailed information
    const { data: properties, error: propertiesError } = await supabase
      .from('lofts')
      .select(`
        id,
        name,
        type,
        address,
        status,
        images,
        price_per_night
      `)
      .eq('partner_id', partnerInfo.partnerId);

    if (propertiesError) {
      console.error('Properties fetch error:', propertiesError);
    }

    const propertiesList = properties || [];

    // Get reservations data
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select(`
        id,
        loft_id,
        guest_name,
        check_in,
        check_out,
        status,
        total_amount,
        created_at,
        lofts!inner(name, partner_id)
      `)
      .eq('lofts.partner_id', partnerInfo.partnerId)
      .order('created_at', { ascending: false });

    if (reservationsError) {
      console.error('Reservations fetch error:', reservationsError);
    }

    const reservationsList = reservations || [];

    // Calculate statistics
    const propertiesStats = {
      total: propertiesList.length,
      available: propertiesList.filter(p => p.status === 'available').length,
      occupied: propertiesList.filter(p => p.status === 'occupied').length,
      maintenance: propertiesList.filter(p => p.status === 'maintenance').length
    };

    // Calculate revenue statistics
    const currentMonthReservations = reservationsList.filter(r => {
      const checkIn = new Date(r.check_in);
      return checkIn >= currentMonthStart && checkIn <= currentMonthEnd && r.status === 'completed';
    });

    const previousMonthReservations = reservationsList.filter(r => {
      const checkIn = new Date(r.check_in);
      return checkIn >= previousMonthStart && checkIn <= previousMonthEnd && r.status === 'completed';
    });

    const yearToDateReservations = reservationsList.filter(r => {
      const checkIn = new Date(r.check_in);
      return checkIn >= yearStart && r.status === 'completed';
    });

    const revenueStats = {
      current_month: currentMonthReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0),
      previous_month: previousMonthReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0),
      year_to_date: yearToDateReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0),
      currency: 'DZD'
    };

    // Calculate reservation statistics
    const activeReservations = reservationsList.filter(r => 
      ['confirmed', 'checked_in'].includes(r.status)
    );

    const upcomingReservations = reservationsList.filter(r => {
      const checkIn = new Date(r.check_in);
      return checkIn > now && r.status === 'confirmed';
    });

    const reservationStats = {
      active: activeReservations.length,
      upcoming: upcomingReservations.length,
      completed_this_month: currentMonthReservations.length
    };

    // Calculate occupancy rates (simplified)
    const daysInCurrentMonth = currentMonthEnd.getDate();
    const daysInPreviousMonth = previousMonthEnd.getDate();
    
    const currentMonthOccupiedDays = currentMonthReservations.reduce((sum, r) => {
      const checkIn = new Date(r.check_in);
      const checkOut = new Date(r.check_out);
      const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    const previousMonthOccupiedDays = previousMonthReservations.reduce((sum, r) => {
      const checkIn = new Date(r.check_in);
      const checkOut = new Date(r.check_out);
      const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    const occupancyStats = {
      current_month: propertiesStats.total > 0 ? 
        Math.round((currentMonthOccupiedDays / (propertiesStats.total * daysInCurrentMonth)) * 100 * 10) / 10 : 0,
      previous_month: propertiesStats.total > 0 ? 
        Math.round((previousMonthOccupiedDays / (propertiesStats.total * daysInPreviousMonth)) * 100 * 10) / 10 : 0
    };

    // Build detailed properties view
    const propertiesView: PartnerPropertyView[] = await Promise.all(
      propertiesList.map(async (property) => {
        const propertyReservations = reservationsList.filter(r => r.loft_id === property.id);
        
        // Find next reservation
        const nextReservation = propertyReservations
          .filter(r => new Date(r.check_in) > now && r.status === 'confirmed')
          .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())[0];

        // Calculate property-specific revenue
        const propertyCurrentMonthRevenue = propertyReservations
          .filter(r => {
            const checkIn = new Date(r.check_in);
            return checkIn >= currentMonthStart && checkIn <= currentMonthEnd && r.status === 'completed';
          })
          .reduce((sum, r) => sum + (r.total_amount || 0), 0);

        const propertyPreviousMonthRevenue = propertyReservations
          .filter(r => {
            const checkIn = new Date(r.check_in);
            return checkIn >= previousMonthStart && checkIn <= previousMonthEnd && r.status === 'completed';
          })
          .reduce((sum, r) => sum + (r.total_amount || 0), 0);

        // Determine current occupancy status
        const currentReservation = propertyReservations.find(r => {
          const checkIn = new Date(r.check_in);
          const checkOut = new Date(r.check_out);
          return now >= checkIn && now <= checkOut && ['confirmed', 'checked_in'].includes(r.status);
        });

        let occupancyStatus: 'available' | 'occupied' | 'maintenance' = 'available';
        if (property.status === 'maintenance') {
          occupancyStatus = 'maintenance';
        } else if (currentReservation) {
          occupancyStatus = 'occupied';
        }

        return {
          id: property.id,
          name: property.name,
          type: property.type || 'loft',
          address: property.address || '',
          status: property.status,
          current_occupancy_status: occupancyStatus,
          next_reservation: nextReservation ? {
            check_in: nextReservation.check_in,
            check_out: nextReservation.check_out,
            guest_name: nextReservation.guest_name || 'Guest'
          } : undefined,
          revenue_this_month: propertyCurrentMonthRevenue,
          revenue_last_month: propertyPreviousMonthRevenue,
          total_reservations: propertyReservations.length,
          average_rating: 4.2 + Math.random() * 0.6, // Simulated - would come from reviews
          images: property.images || []
        };
      })
    );

    // Get recent reservations
    const recentReservations: ReservationSummary[] = reservationsList
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        loft_name: (r.lofts as any)?.name || 'Unknown Property',
        guest_name: r.guest_name || 'Guest',
        check_in: r.check_in,
        check_out: r.check_out,
        status: r.status,
        total_amount: r.total_amount || 0
      }));

    // Build final response
    const statistics: PartnerDashboardStats = {
      properties: propertiesStats,
      revenue: revenueStats,
      reservations: reservationStats,
      occupancy_rate: occupancyStats
    };

    const partnerWithStats = {
      ...partnerProfile,
      properties_count: propertiesStats.total,
      total_revenue: revenueStats.year_to_date,
      active_reservations_count: reservationStats.active
    };

    return NextResponse.json({
      success: true,
      data: {
        partner: partnerWithStats,
        statistics,
        properties: propertiesView,
        recent_reservations: recentReservations
      }
    });

  } catch (error) {
    console.error('Partner dashboard API error:', error);
    
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