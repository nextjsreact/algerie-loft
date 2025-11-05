import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI, logSuperuserAudit } from '@/lib/superuser/auth';
import { resetUserPassword } from '@/lib/superuser/user-management';
import { sendPasswordResetEmail } from '@/lib/superuser/email-service';

export async function POST(request: NextRequest) {
  try {
    // Verify superuser permissions
    const { authorized, superuser, error } = await verifySuperuserAPI(['USER_MANAGEMENT']);
    
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userIds, sendEmail = true } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Process each user
    for (const userId of userIds) {
      try {
        const result = await resetUserPassword(userId);
        
        if (result.success && result.data) {
          results.push({
            userId,
            email: result.data.email,
            temporaryPassword: result.data.temporaryPassword,
            success: true
          });

          // Send email if requested and temporary password was generated
          if (sendEmail && result.data.temporaryPassword && result.data.email) {
            try {
              await sendPasswordResetEmail(
                result.data.email,
                result.data.temporaryPassword,
                'superuser'
              );
            } catch (emailError) {
              console.error(`Failed to send email to ${result.data.email}:`, emailError);
            }
          }
        } else {
          errors.push({
            userId,
            error: result.error || 'Unknown error'
          });
        }
      } catch (userError) {
        errors.push({
          userId,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        });
      }
    }

    // Log bulk password reset
    await logSuperuserAudit('USER_MANAGEMENT', {
      action: 'bulk_password_reset',
      target_user_ids: userIds,
      successful_resets: results.length,
      failed_resets: errors.length,
      email_notifications_sent: sendEmail
    }, { severity: 'HIGH' });

    return NextResponse.json({
      success: true,
      data: {
        successful: results.length,
        failed: errors.length,
        results: results.map(r => ({
          userId: r.userId,
          email: r.email,
          success: r.success
        })),
        errors
      },
      message: `Password reset completed. ${results.length} successful, ${errors.length} failed.`
    });

  } catch (error) {
    console.error('Error bulk resetting passwords:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}