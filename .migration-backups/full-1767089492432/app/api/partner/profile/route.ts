import { NextRequest, NextResponse } from 'next/server';
import { PartnerAuthService } from '@/lib/services/partner-auth-service';
import { getPartnerInfoFromHeaders } from '@/middleware/partner-auth';
import { createReadOnlyClient } from '@/utils/supabase/server';
import type { PartnerProfile } from '@/lib/types/partner-auth';

interface PartnerProfileResponse {
  success: boolean;
  data?: PartnerProfile & {
    properties_count: number;
    total_revenue: number;
    active_reservations_count: number;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<PartnerProfileResponse>> {
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

    // Get partner profile with additional computed fields
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

    // Get properties count
    const propertiesCount = await PartnerAuthService.getPartnerPropertiesCount(partnerInfo.partnerId);

    // Get total revenue (simplified calculation)
    const { data: revenueData, error: revenueError } = await supabase
      .from('reservations')
      .select('total_amount')
      .eq('partner_id', partnerInfo.partnerId)
      .eq('status', 'completed');

    const totalRevenue = revenueData?.reduce((sum, reservation) => sum + (reservation.total_amount || 0), 0) || 0;

    // Get active reservations count
    const { count: activeReservationsCount, error: reservationsError } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerInfo.partnerId)
      .in('status', ['confirmed', 'pending']);

    const responseData = {
      ...partnerProfile,
      properties_count: propertiesCount,
      total_revenue: totalRevenue,
      active_reservations_count: activeReservationsCount || 0
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Partner profile API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<PartnerProfileResponse>> {
  try {
    // Get partner info from middleware headers
    const partnerInfo = getPartnerInfoFromHeaders(request);
    
    if (!partnerInfo.partnerId || !partnerInfo.userId) {
      return NextResponse.json({
        success: false,
        error: 'Partner authentication required'
      }, { status: 401 });
    }

    const body = await request.json();
    const { business_name, business_type, address, phone, tax_id, portfolio_description } = body;

    // Validate required fields
    if (!address || !phone) {
      return NextResponse.json({
        success: false,
        error: 'Address and phone are required'
      }, { status: 400 });
    }

    const supabase = await createReadOnlyClient();

    // Update partner profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('partners')
      .update({
        business_name,
        business_type,
        address,
        phone,
        tax_id,
        portfolio_description,
        updated_at: new Date().toISOString()
      })
      .eq('id', partnerInfo.partnerId)
      .select('*')
      .single();

    if (updateError || !updatedProfile) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update partner profile'
      }, { status: 500 });
    }

    // Get additional computed fields
    const propertiesCount = await PartnerAuthService.getPartnerPropertiesCount(partnerInfo.partnerId);

    const responseData = {
      ...updatedProfile,
      properties_count: propertiesCount,
      total_revenue: 0, // Will be calculated separately
      active_reservations_count: 0 // Will be calculated separately
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Partner profile update API error:', error);
    
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
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}