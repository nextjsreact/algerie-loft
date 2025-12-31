import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Timeout pour la lecture du body
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 5000);
    });
    
    const bodyPromise = request.json();
    const body = await Promise.race([bodyPromise, timeoutPromise]);

    const {
      sessionId,
      referrer,
      landingPage,
      deviceType,
      browser,
      os
    } = body as any;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get IP address from request headers
    const ip = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown';
    
    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Record visitor using the database function with timeout
    const dbPromise = supabase
      .rpc('record_visitor', {
        p_session_id: sessionId,
        p_ip_address: ip,
        p_user_agent: userAgent,
        p_referrer: referrer || null,
        p_landing_page: landingPage || null,
        p_device_type: deviceType || null,
        p_browser: browser || null,
        p_os: os || null
      });

    const dbTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database timeout')), 8000);
    });

    const { data, error } = await Promise.race([dbPromise, dbTimeoutPromise]) as any;

    if (error) {
      console.error('Error recording visitor:', error);
      return NextResponse.json(
        { error: 'Failed to record visitor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      visitorId: data
    });

  } catch (error) {
    console.error('Error in track-visitor API:', error);
    
    // Gestion spécifique des timeouts
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
