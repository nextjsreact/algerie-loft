import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifySuperuserAPI } from '@/lib/superuser/auth';

export async function GET(request: NextRequest) {
  try {
    const verification = await verifySuperuserAPI();
    if (!verification.authorized) {
      return NextResponse.json(
        { error: verification.error || 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Get aggregate stats from all policies
    const { data: policies, error } = await supabase
      .from('archive_policies')
      .select('archived_count, archived_size_mb, last_run');

    if (error) {
      console.error('Error fetching archive stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch archive stats' },
        { status: 500 }
      );
    }

    const stats = {
      totalArchived: policies?.reduce((sum, p) => sum + (p.archived_count || 0), 0) || 0,
      totalSize: policies?.reduce((sum, p) => sum + (p.archived_size_mb || 0), 0) || 0,
      oldestArchive: policies
        ?.filter(p => p.last_run)
        .sort((a, b) => new Date(a.last_run!).getTime() - new Date(b.last_run!).getTime())[0]?.last_run,
      newestArchive: policies
        ?.filter(p => p.last_run)
        .sort((a, b) => new Date(b.last_run!).getTime() - new Date(a.last_run!).getTime())[0]?.last_run,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in GET /api/superuser/archives/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
