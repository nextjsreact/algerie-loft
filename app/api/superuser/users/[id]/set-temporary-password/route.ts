import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI, logSuperuserAudit } from '@/lib/superuser/auth';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify superuser access with user management permissions
    const { authorized, error } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { temporaryPassword } = body;

    if (!temporaryPassword) {
      return NextResponse.json(
        { error: 'Temporary password is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient(true); // Use service role

    // Get user details for audit
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Set the temporary password in auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
      user_metadata: {
        password_change_required: true,
        temporary_password_set_at: new Date().toISOString()
      }
    });

    if (updateError) {
      throw updateError;
    }

    // Log audit entry
    await logSuperuserAudit(
      'USER_MANAGEMENT',
      {
        action: 'temporary_password_set',
        targetUserId: userId,
        targetUserEmail: user.email,
        temporaryPasswordGenerated: true
      },
      {
        targetUserId: userId,
        severity: 'HIGH',
        metadata: {
          actionType: 'temporary_password_set'
        }
      }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Temporary password set successfully'
    });

  } catch (error) {
    console.error('Error setting temporary password:', error);
    return NextResponse.json(
      { error: 'Failed to set temporary password' },
      { status: 500 }
    );
  }
}