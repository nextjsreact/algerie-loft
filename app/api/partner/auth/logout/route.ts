/**
 * Partner Logout API
 * Handles partner logout and clears sensitive data
 */

import { NextRequest, NextResponse } from 'next/server';
import { PartnerAuthGuard } from '@/lib/security/partner-auth-guard';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Clear sensitive data using the auth guard
    await PartnerAuthGuard.clearSensitiveData();

    // Clear login context cookie
    const cookieStore = await cookies();
    cookieStore.delete('login_context');

    // Clear any other partner-specific cookies
    cookieStore.delete('partner_session');
    cookieStore.delete('partner_preferences');

    console.log('[Partner Auth Logout API] Partner logged out successfully');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('[Partner Auth Logout API] Error:', error);
    
    // Even if there's an error, we should still try to clear the session
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error('[Partner Auth Logout API] Error signing out:', signOutError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Logout completed with errors'
      },
      { status: 500 }
    );
  }
}
