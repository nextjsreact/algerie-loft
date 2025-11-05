import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI } from '@/lib/superuser/auth';
import { getUserSearchStatistics } from '@/lib/superuser/user-search';

export async function GET(request: NextRequest) {
  try {
    // Verify superuser permissions
    const { authorized, superuser, error } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    // Get user statistics
    const statistics = await getUserSearchStatistics();

    return NextResponse.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Error getting user statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}