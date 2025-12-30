import { NextRequest, NextResponse } from 'next/server';
import { PartnerAuthService } from '@/lib/services/partner-auth-service';
import { getPartnerInfoFromHeaders } from '@/middleware/partner-auth';
import type { PartnerStatus } from '@/lib/types/partner-auth';

interface PartnerSessionResponse {
  success: boolean;
  data?: {
    isAuthenticated: boolean;
    partner_id?: string;
    partner_status?: PartnerStatus;
    expires_at?: string;
    user?: {
      id: string;
      email: string;
      full_name?: string;
    };
  };
  error?: string;
  code?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<PartnerSessionResponse>> {
  try {
    // Get partner session
    const partnerSession = await PartnerAuthService.getPartnerSession();
    
    if (!partnerSession) {
      return NextResponse.json({
        success: true,
        data: {
          isAuthenticated: false
        }
      });
    }

    // Validate partner status
    const statusError = PartnerAuthService.validatePartnerStatus(partnerSession.partner_status);
    
    const response: PartnerSessionResponse = {
      success: true,
      data: {
        isAuthenticated: true,
        partner_id: partnerSession.partner_profile.id,
        partner_status: partnerSession.partner_status,
        expires_at: partnerSession.expires_at,
        user: {
          id: partnerSession.user.id,
          email: partnerSession.user.email || '',
          full_name: partnerSession.user.user_metadata?.full_name
        }
      }
    };

    // Include status error if partner is not active
    if (statusError) {
      response.error = statusError.message;
      response.code = statusError.code;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Partner session API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    // Sign out using the partner auth service
    const result = await PartnerAuthService.signOut();
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to sign out'
      }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Partner logout API error:', error);
    
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
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}