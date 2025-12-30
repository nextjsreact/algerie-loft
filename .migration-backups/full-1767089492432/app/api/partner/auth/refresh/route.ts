/**
 * Partner Session Refresh API
 * Refreshes the partner's authentication session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if user has a valid session
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'No active session'
        },
        { status: 401 }
      );
    }

    // Verify user is a partner, admin, or client (multi-role support)
    const allowedRoles = ['partner', 'admin', 'client'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied - partner, admin, or client role required'
        },
        { status: 403 }
      );
    }

    // Refresh the Supabase session
    const supabase = await createClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[Partner Auth Refresh API] Error refreshing session:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to refresh session'
        },
        { status: 500 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session refresh returned no session'
        },
        { status: 500 }
      );
    }

    console.log('[Partner Auth Refresh API] Session refreshed successfully for user:', session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully'
    });

  } catch (error) {
    console.error('[Partner Auth Refresh API] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
