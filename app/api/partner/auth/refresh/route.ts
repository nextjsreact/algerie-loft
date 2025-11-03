import { NextRequest, NextResponse } from 'next/server';
import { PartnerAuthService } from '@/lib/services/partner-auth-service';
import { createClient } from '@/utils/supabase/server';

interface TokenRefreshResponse {
  success: boolean;
  data?: {
    token: string;
    expires_at: string;
    partner_id: string;
  };
  error?: string;
  code?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<TokenRefreshResponse>> {
  try {
    const supabase = await createClient();
    
    // Refresh the Supabase session
    const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !sessionData.session) {
      return NextResponse.json({
        success: false,
        error: 'Failed to refresh session',
        code: 'REFRESH_FAILED'
      }, { status: 401 });
    }

    // Get partner session with refreshed auth
    const partnerSession = await PartnerAuthService.getPartnerSession();
    
    if (!partnerSession) {
      return NextResponse.json({
        success: false,
        error: 'Partner session not found',
        code: 'PARTNER_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate partner status
    const statusError = PartnerAuthService.validatePartnerStatus(partnerSession.partner_status);
    
    if (statusError && partnerSession.partner_status !== 'active') {
      return NextResponse.json({
        success: false,
        error: statusError.message,
        code: statusError.code
      }, { status: 403 });
    }

    // Generate new partner token
    const newPartnerToken = PartnerAuthService.generatePartnerToken(partnerSession);
    
    // Update last login timestamp
    await PartnerAuthService.updateLastLogin(partnerSession.partner_profile.id);

    return NextResponse.json({
      success: true,
      data: {
        token: newPartnerToken,
        expires_at: sessionData.session.expires_at ? new Date(sessionData.session.expires_at * 1000).toISOString() : '',
        partner_id: partnerSession.partner_profile.id
      }
    });

  } catch (error) {
    console.error('Partner token refresh API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}