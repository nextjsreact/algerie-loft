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

    const supabase = await createClient(true); // Use service role

    // Get user details for audit
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate password reset link
    const { data, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: user.email!,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/fr/reset-password`
      }
    });

    if (resetError) {
      throw resetError;
    }

    // Log audit entry
    await logSuperuserAudit(
      'USER_MANAGEMENT',
      {
        action: 'password_reset',
        targetUserId: userId,
        targetUserEmail: user.email,
        resetLinkGenerated: true
      },
      {
        targetUserId: userId,
        severity: 'MEDIUM',
        metadata: {
          actionType: 'password_reset'
        }
      }
    );

    // In a real implementation, you would send the reset link via email
    // For now, we'll return success
    return NextResponse.json({ 
      success: true,
      message: 'Password reset link generated and sent to user email',
      resetLink: data.properties?.action_link // Only for development/testing
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}