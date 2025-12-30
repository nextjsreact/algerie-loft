import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI } from '@/lib/superuser/auth';
import { resetUserPassword } from '@/lib/superuser/user-management';
import { sendPasswordResetEmail } from '@/lib/superuser/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify superuser permissions
    const { authorized, superuser, error } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const body = await request.json();
    const { newPassword, sendEmail = true } = body;

    // Reset password
    const result = await resetUserPassword(userId, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Send email notification if requested and temporary password was generated
    if (sendEmail && result.data?.temporaryPassword && result.data?.email) {
      try {
        await sendPasswordResetEmail(
          result.data.email,
          result.data.temporaryPassword,
          'superuser'
        );
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email fails, just log it
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        temporaryPassword: result.data?.temporaryPassword,
        emailSent: sendEmail && result.data?.temporaryPassword
      }
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}