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

    // Get visitor statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_visitor_stats');

    if (statsError) {
      console.error('Error fetching visitor stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch visitor statistics' },
        { status: 500 }
      );
    }

    // Get visitor trends (last 7 days)
    const { data: trends, error: trendsError } = await supabase
      .rpc('get_visitor_trends');

    if (trendsError) {
      console.error('Error fetching visitor trends:', trendsError);
    }

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
