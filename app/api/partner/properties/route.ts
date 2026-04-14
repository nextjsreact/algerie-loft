import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSession } from '@/lib/auth';

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
    // Check authentication
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const supabase = await createClient(true);

    const { searchParams: sp } = new URL(request.url);

    // Find owner by auth user id OR email (ids may differ)
    let ownerId: string | null = null

    const { data: ownerById } = await supabase
      .from('owners')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (ownerById) {
      ownerId = ownerById.id
    } else if (session.user.email) {
      const { data: ownerByEmail } = await supabase
        .from('owners')
        .select('id')
        .eq('email', session.user.email)
        .single()
      if (ownerByEmail) ownerId = ownerByEmail.id
    }

    if (!ownerId) {
      return NextResponse.json({
        success: false,
        error: 'Partner profile not found'
      }, { status: 403 })
    }

    const partnerId = ownerId

    const page = Number(sp.get('page')) || 1;
    const limit = Math.min(Number(sp.get('limit')) || 20, 100);
    const offset = (page - 1) * limit;
    
    const filters: PropertyFilters = {
      status: sp.get('status') || undefined,
      type: sp.get('type') || undefined,
      search: sp.get('search') || undefined
    };

    // Build query - get lofts WITHOUT photo join first
    let query = supabase
      .from('lofts')
      .select('id, name, address, status, price_per_night, max_guests, bedrooms, bathrooms, created_at, updated_at')
      .eq('owner_id', partnerId)
      .order('created_at', { ascending: false })

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

    const { count: totalCount } = await supabase
      .from('lofts')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', partnerId)

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

    // Fetch photos separately (explicit query, more reliable than join)
    const photosMap: Record<string, { url: string; is_cover: boolean }[]> = {}
    if (propertiesList.length > 0) {
      const { data: allPhotos, error: photosError } = await supabase
        .from('loft_photos')
        .select('loft_id, url, is_cover')
        .in('loft_id', propertiesList.map(p => p.id))

      if (photosError) {
        console.error('[partner/properties] photos fetch error:', photosError.message)
      } else {
        console.log(`[partner/properties] fetched ${(allPhotos || []).length} photos for ${propertiesList.length} lofts`)
        for (const photo of (allPhotos || [])) {
          if (!photosMap[photo.loft_id]) photosMap[photo.loft_id] = []
          photosMap[photo.loft_id].push({ url: photo.url, is_cover: photo.is_cover })
        }
      }
    }

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
      const { data: bookings, error: bookingsError } = await supabase
        .from('reservations')
        .select(`
          id,
          loft_id,
          check_in_date,
          check_out_date,
          status,
          total_amount,
          guest_name,
          created_at
        `)
        .in('loft_id', propertyIds)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Reservations fetch error:', bookingsError);
      } else {
        reservationsData = (bookings || []).map((b: any) => ({
          ...b,
          check_in: b.check_in_date,
          check_out: b.check_out_date,
          total_price: b.total_amount,
        }))
      }
    }

    const propertiesView = propertiesList.map((property) => {
      const propertyReservations = reservationsData.filter(r => r.loft_id === property.id)
      
      const nextReservation = propertyReservations
        .filter(r => new Date(r.check_in) > now && r.status === 'confirmed')
        .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())[0]

      const propertyCurrentMonthRevenue = propertyReservations
        .filter(r => {
          const checkIn = new Date(r.check_in)
          return checkIn >= currentMonthStart && checkIn <= currentMonthEnd && r.status !== 'cancelled'
        })
        .reduce((sum, r) => sum + (r.total_price || 0), 0)

      const currentReservation = propertyReservations.find(r => {
        const checkIn = new Date(r.check_in)
        const checkOut = new Date(r.check_out)
        return now >= checkIn && now <= checkOut && ['confirmed', 'pending'].includes(r.status)
      })

      let occupancyStatus: 'available' | 'occupied' | 'maintenance' = 'available'
      if (property.status === 'maintenance') occupancyStatus = 'maintenance'
      else if (currentReservation) occupancyStatus = 'occupied'

      // Occupancy rate for current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const occupiedDays = propertyReservations
        .filter(r => r.status !== 'cancelled')
        .filter(r => {
          const ci = new Date(r.check_in)
          const co = new Date(r.check_out)
          return ci <= currentMonthEnd && co >= currentMonthStart
        })
        .reduce((s, r) => {
          const nights = Math.ceil((new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 86400000)
          return s + Math.min(nights, daysInMonth)
        }, 0)
      const occupancyRate = Math.round((occupiedDays / daysInMonth) * 100)

      const photos = (photosMap[property.id] || [])
        .sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0))
        .map(p => p.url)
      const coverPhoto = photos[0] || null

      console.log(`[partner/properties] loft ${property.id} (${property.name}): photos=${photos.length}, cover=${coverPhoto}`)
      return {
        id: property.id,
        name: property.name,
        address: property.address || '',
        status: occupancyStatus,
        price_per_night: property.price_per_night || 0,
        max_guests: (property as any).max_guests || null,
        bedrooms: (property as any).bedrooms || null,
        bathrooms: (property as any).bathrooms || null,
        bookings_count: propertyReservations.length,
        earnings_this_month: Math.round(propertyCurrentMonthRevenue),
        occupancy_rate: occupancyRate,
        average_rating: 4.5,
        images: photos,
        cover_photo: coverPhoto,
        next_booking: nextReservation ? {
          check_in: nextReservation.check_in,
          check_out: nextReservation.check_out,
          client_name: nextReservation.guest_name || 'Invité',
        } : undefined,
        current_occupancy_status: occupancyStatus,
        revenue_this_month: Math.round(propertyCurrentMonthRevenue),
        revenue_last_month: 0,
        total_reservations: propertyReservations.length,
        created_at: property.created_at,
        updated_at: property.updated_at,
      }
    })

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