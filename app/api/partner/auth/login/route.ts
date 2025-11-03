import { NextRequest, NextResponse } from 'next/server';
import { PartnerAuthService } from '@/lib/services/partner-auth-service';
import { login } from '@/lib/auth';
import type { PartnerStatus } from '@/lib/types/partner-auth';

interface PartnerLoginRequest {
  email: string;
  password: string;
  locale?: string;
}

interface PartnerLoginResponse {
  success: boolean;
  data?: {
    partner_id: string;
    partner_status: PartnerStatus;
    redirect_url: string;
    token?: string;
  };
  error?: string;
  code?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<PartnerLoginResponse>> {
  try {
    const body: PartnerLoginRequest = await request.json();
    const { email, password, locale = 'fr' } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      }, { status: 400 });
    }

    // Attempt login using existing auth service
    const loginResult = await login(email, password, locale);
    
    if (!loginResult.success) {
      return NextResponse.json({
        success: false,
        error: loginResult.error || 'Authentication failed',
        code: 'AUTH_FAILED'
      }, { status: 401 });
    }

    // Get partner session to validate partner status
    const partnerSession = await PartnerAuthService.getPartnerSession();
    
    if (!partnerSession) {
      return NextResponse.json({
        success: false,
        error: 'Partner account not found. Please ensure you have registered as a partner.',
        code: 'PARTNER_NOT_FOUND'
      }, { status: 404 });
    }

    // Validate partner status
    const statusError = PartnerAuthService.validatePartnerStatus(partnerSession.partner_status);
    
    // Generate partner-specific JWT token
    const partnerToken = PartnerAuthService.generatePartnerToken(partnerSession);
    
    // Update last login timestamp
    await PartnerAuthService.updateLastLogin(partnerSession.partner_profile.id);

    // Determine redirect URL based on partner status
    const getRedirectUrl = (status: PartnerStatus): string => {
      const statusUrls = {
        active: `/${locale}/partner/dashboard`,
        pending: `/${locale}/partner/pending`,
        rejected: `/${locale}/partner/rejected`,
        suspended: `/${locale}/partner/suspended`
      };
      return statusUrls[status];
    };

    const response: PartnerLoginResponse = {
      success: true,
      data: {
        partner_id: partnerSession.partner_profile.id,
        partner_status: partnerSession.partner_status,
        redirect_url: getRedirectUrl(partnerSession.partner_status),
        token: partnerToken
      }
    };

    // If partner is not active, include status error information
    if (statusError) {
      response.error = statusError.message;
      response.code = statusError.code;
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Partner login API error:', error);
    
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