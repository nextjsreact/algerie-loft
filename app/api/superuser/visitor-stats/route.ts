import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is a superuser
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify superuser status
    const { data: superuserProfile, error: superuserError } = await supabase
      .from('superuser_profiles')
      .select('is_active')
      .eq('user_id', user.id)
      .single();

    if (superuserError || !superuserProfile?.is_active) {
      return NextResponse.json(
        { error: 'Forbidden - Superuser access required' },
        { status: 403 }
      );
    }

    // Get visitor statistics with timeout
    const { data: stats, error: statsError } = await Promise.race([
      supabase.rpc('get_visitor_stats'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      )
    ]) as any;

    if (statsError) {
      console.error('Error fetching visitor stats:', statsError);
      // Retourner des valeurs par défaut au lieu d'une erreur
      return NextResponse.json({
        success: true,
        stats: {
          total_visitors: 0,
          today_visitors: 0,
          unique_today: 0,
          total_page_views: 0,
          today_page_views: 0,
          avg_session_duration: 0
        },
        trends: []
      });
    }

    // Skip trends for now to avoid blocking
    const trends: any[] = [];

    return NextResponse.json({
      success: true,
      stats: stats?.[0] || {
        total_visitors: 0,
        today_visitors: 0,
        unique_today: 0,
        total_page_views: 0,
        today_page_views: 0,
        avg_session_duration: 0
      },
      trends: trends || []
    });

  } catch (error) {
    console.error('Error in visitor-stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
