import { NextRequest, NextResponse } from 'next/server';
import { getPartnerInfoFromHeaders } from '@/middleware/partner-auth';
import { createReadOnlyClient } from '@/utils/supabase/server';

interface PropertyFilters {
  status?: string;
  type?: string;
  search?: string;
}

interface PartnerPropertyView {
  id: string;
  name: string;
  type: string;
  address: string;
  status: string;
  price_per_night: number;
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
  created_at: string;
  updated_at: string;
}

interface PartnerPropertiesResponse {
  success: boolean;
  data?: {
    properties: PartnerPropertyView[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<PartnerPropertiesResponse>> {
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
    const filters: PropertyFilters = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      search: searchParams.get('search') || undefined
    };

    const supabase = await createReadOnlyClient();

    // Build query with RLS automatically applied
    let query = supabase
      .from('lofts')
      .select(`
        id,
        name,
        type,
        address,
        status,
        price_per_night,
        images,
        created_at,
        updated_at
      `)
      .eq('partner_id', partnerInfo.partnerId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerInfo.partnerId);

    if (countError) {
      console.error('Count query error:', countError);
    }

    // Get paginated results
    const { data: properties, error: propertiesError } = await query
      .range(offset, offset + limit - 1);

    if (propertiesError) {
      console.error('Properties fetch error:', propertiesError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch properties'
      }, { status: 500 });
    }

    const propertiesList = properties || [];

    // Get current and previous month dates for revenue calculations
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all reservations for these properties
    const propertyIds = propertiesList.map(p => p.id);
    let reservationsData: any[] = [];
    
    if (propertyIds.length > 0) {
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
          created_at
        `)
        .in('loft_id', propertyIds)
        .order('created_at', { ascending: false });

      if (reservationsError) {
        console.error('Reservations fetch error:', reservationsError);
      } else {
        reservationsData = reservations || [];
      }
    }

    // Build detailed properties view
    const propertiesView: PartnerPropertyView[] = propertiesList.map((property) => {
      const propertyReservations = reservationsData.filter(r => r.loft_id === property.id);
      
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
        price_per_night: property.price_per_night || 0,
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
        images: property.images || [],
        created_at: property.created_at,
        updated_at: property.updated_at
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        properties: propertiesView,
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          hasMore: propertiesList.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Partner properties API error:', error);
    
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