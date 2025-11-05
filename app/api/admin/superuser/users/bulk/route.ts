import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI } from '@/lib/superuser/auth';
import { bulkUpdateUsers } from '@/lib/superuser/user-management';
import type { UserUpdateData } from '@/lib/superuser/user-management';

export async function PUT(request: NextRequest) {
  try {
    // Verify superuser permissions
    const { authorized, superuser, error } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userIds, updateData } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Update data is required' },
        { status: 400 }
      );
    }

    // Validate update data
    const validatedUpdateData: Partial<UserUpdateData> = {};
    
    if (updateData.full_name !== undefined) validatedUpdateData.full_name = updateData.full_name;
    if (updateData.email !== undefined) validatedUpdateData.email = updateData.email;
    if (updateData.role !== undefined) validatedUpdateData.role = updateData.role;
    if (updateData.is_suspended !== undefined) validatedUpdateData.is_suspended = updateData.is_suspended;
    if (updateData.suspension_reason !== undefined) validatedUpdateData.suspension_reason = updateData.suspension_reason;

    // Perform bulk update
    const result = await bulkUpdateUsers(userIds, validatedUpdateData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Successfully updated ${result.data?.affectedCount || 0} users`
    });

  } catch (error) {
    console.error('Error bulk updating users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}