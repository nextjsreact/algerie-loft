/**
 * Partner Authentication Verification API
 * Verifies partner authentication and returns session information
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPartnerAuth } from '@/lib/security/partner-auth-guard';

export async function GET(request: NextRequest) {
  try {
    // Get locale from query params or default to 'fr'
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'fr';

    // Verify partner authentication
    const authResult = await checkPartnerAuth(locale, {
      requireActive: false, // Allow all statuses for verification
      allowedStatuses: ['active', 'pending', 'rejected', 'suspended']
    });

    if (!authResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authResult.error || 'Authentication failed'
        },
        { status: authResult.shouldRedirect ? 401 : 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session: authResult.session,
      partnerId: authResult.partnerId,
      partnerStatus: authResult.partnerStatus
    });

  } catch (error) {
    console.error('[Partner Auth Verify API] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
