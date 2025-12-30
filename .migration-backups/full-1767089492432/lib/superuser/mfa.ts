"use server"

import { createClient } from '@/utils/supabase/server';
import type { MFAChallenge } from '@/types/superuser';
import { getSuperuserProfile, logSuperuserAudit } from './auth';
import { getClientIPAddress, getUserAgent } from './session';

export interface MFAResult {
  success: boolean;
  error?: string;
  challenge?: MFAChallenge;
  verified?: boolean;
}

/**
 * Generate and send MFA challenge
 */
export async function generateMFAChallenge(
  challengeType: 'EMAIL' | 'TOTP' | 'SMS' = 'EMAIL',
  action?: string
): Promise<MFAResult> {
  try {
    const superuser = await getSuperuserProfile();
    if (!superuser) {
      return { success: false, error: 'Superuser profile not found' };
    }

    const challengeCode = generateMFACode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const supabase = await createClient(true);
    const { data: challenge, error } = await supabase
      .from('mfa_challenges')
      .insert({
        superuser_id: superuser.id,
        challenge_type: challengeType,
        challenge_code: challengeCode,
        expires_at: expiresAt.toISOString(),
        verified: false,
        action_context: action,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !challenge) {
      console.error('Failed to create MFA challenge:', error);
      return { success: false, error: 'Failed to generate MFA challenge' };
    }

    // Send challenge via appropriate channel
    let sendResult = false;
    switch (challengeType) {
      case 'EMAIL':
        sendResult = await sendMFAEmail(superuser.user_id, challengeCode, action);
        break;
      case 'SMS':
        sendResult = await sendMFASMS(superuser.user_id, challengeCode, action);
        break;
      case 'TOTP':
        // TOTP doesn't require sending, user uses their authenticator app
        sendResult = true;
        break;
    }

    if (!sendResult) {
      // Mark challenge as failed if sending failed
      await supabase
        .from('mfa_challenges')
        .update({ verified: false, failed_reason: 'Send failed' })
        .eq('id', challenge.id);
      
      return { success: false, error: 'Failed to send MFA challenge' };
    }

    await logSuperuserAudit('SECURITY', {
      action: 'mfa_challenge_generated',
      challenge_type: challengeType,
      challenge_id: challenge.id,
      action_context: action
    }, { severity: 'MEDIUM' });

    return {
      success: true,
      challenge: {
        ...challenge,
        expires_at: new Date(challenge.expires_at),
        created_at: new Date(challenge.created_at)
      }
    };
  } catch (error) {
    console.error('Error generating MFA challenge:', error);
    return { success: false, error: 'Internal error generating MFA challenge' };
  }
}

/**
 * Verify MFA challenge code
 */
export async function verifyMFAChallenge(
  challengeId: string,
  code: string
): Promise<MFAResult> {
  try {
    const supabase = await createClient(true);
    
    // Get challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('mfa_challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (challengeError || !challenge) {
      await logSuperuserAudit('SECURITY', {
        action: 'mfa_verification_failed',
        challenge_id: challengeId,
        reason: 'Challenge not found or expired'
      }, { severity: 'HIGH' });
      
      return { success: false, error: 'Invalid or expired challenge' };
    }

    // Verify code
    const isValidCode = await validateMFACode(challenge, code);
    
    if (!isValidCode) {
      // Increment failed attempts
      await supabase
        .from('mfa_challenges')
        .update({ 
          failed_attempts: (challenge.failed_attempts || 0) + 1,
          last_attempt_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      await logSuperuserAudit('SECURITY', {
        action: 'mfa_verification_failed',
        challenge_id: challengeId,
        reason: 'Invalid code',
        failed_attempts: (challenge.failed_attempts || 0) + 1
      }, { severity: 'HIGH' });

      return { success: false, error: 'Invalid verification code' };
    }

    // Mark challenge as verified
    await supabase
      .from('mfa_challenges')
      .update({ 
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('id', challengeId);

    // Update session MFA status if applicable
    const { getSuperuserSession } = await import('./session');
    const session = await getSuperuserSession();
    if (session) {
      await supabase
        .from('superuser_sessions')
        .update({ 
          mfa_verified: true,
          mfa_verified_at: new Date().toISOString()
        })
        .eq('id', session.id);
    }

    await logSuperuserAudit('SECURITY', {
      action: 'mfa_verification_success',
      challenge_id: challengeId,
      challenge_type: challenge.challenge_type,
      action_context: challenge.action_context
    }, { severity: 'MEDIUM' });

    return { success: true, verified: true };
  } catch (error) {
    console.error('Error verifying MFA challenge:', error);
    return { success: false, error: 'Internal error verifying MFA challenge' };
  }
}

/**
 * Check if MFA is required for an action
 */
export async function isMFARequired(action: string): Promise<boolean> {
  try {
    const superuser = await getSuperuserProfile();
    if (!superuser) {
      return false;
    }

    // Check if MFA is globally required for this superuser
    if (superuser.require_mfa) {
      return true;
    }

    // Check action-specific MFA requirements
    const criticalActions = [
      'delete_user',
      'assign_superuser_role',
      'system_configuration_change',
      'backup_restore',
      'security_policy_change'
    ];

    return criticalActions.includes(action);
  } catch (error) {
    console.error('Error checking MFA requirement:', error);
    return true; // Fail safe - require MFA if unsure
  }
}

/**
 * Get active MFA challenges for current superuser
 */
export async function getActiveMFAChallenges(): Promise<MFAChallenge[]> {
  try {
    const superuser = await getSuperuserProfile();
    if (!superuser) {
      return [];
    }

    const supabase = await createClient(true);
    const { data: challenges, error } = await supabase
      .from('mfa_challenges')
      .select('*')
      .eq('superuser_id', superuser.id)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error || !challenges) {
      return [];
    }

    return challenges.map(challenge => ({
      ...challenge,
      expires_at: new Date(challenge.expires_at),
      created_at: new Date(challenge.created_at)
    }));
  } catch (error) {
    console.error('Error getting active MFA challenges:', error);
    return [];
  }
}

/**
 * Invalidate MFA challenge
 */
export async function invalidateMFAChallenge(challengeId: string): Promise<boolean> {
  try {
    const supabase = await createClient(true);
    const { error } = await supabase
      .from('mfa_challenges')
      .update({ 
        verified: false,
        invalidated: true,
        invalidated_at: new Date().toISOString()
      })
      .eq('id', challengeId);

    if (!error) {
      await logSuperuserAudit('SECURITY', {
        action: 'mfa_challenge_invalidated',
        challenge_id: challengeId
      }, { severity: 'MEDIUM' });
    }

    return !error;
  } catch (error) {
    console.error('Error invalidating MFA challenge:', error);
    return false;
  }
}

/**
 * Clean up expired MFA challenges
 */
export async function cleanupExpiredMFAChallenges(): Promise<number> {
  try {
    const supabase = await createClient(true);
    const { data: expired, error } = await supabase
      .from('mfa_challenges')
      .update({ 
        verified: false,
        expired: true
      })
      .lt('expires_at', new Date().toISOString())
      .eq('verified', false)
      .is('expired', null)
      .select('id');

    return expired?.length || 0;
  } catch (error) {
    console.error('Error cleaning up expired MFA challenges:', error);
    return 0;
  }
}

/**
 * Generate MFA code
 */
function generateMFACode(): string {
  // Generate 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate MFA code based on challenge type
 */
async function validateMFACode(challenge: any, code: string): Promise<boolean> {
  switch (challenge.challenge_type) {
    case 'EMAIL':
    case 'SMS':
      // Simple code comparison for email/SMS
      return challenge.challenge_code === code.toUpperCase();
    
    case 'TOTP':
      // For TOTP, you would validate against the user's TOTP secret
      // This is a simplified implementation
      return await validateTOTPCode(challenge.superuser_id, code);
    
    default:
      return false;
  }
}

/**
 * Validate TOTP code (placeholder implementation)
 */
async function validateTOTPCode(superuserId: string, code: string): Promise<boolean> {
  try {
    // In a real implementation, you would:
    // 1. Get the user's TOTP secret from secure storage
    // 2. Generate the expected TOTP code for the current time window
    // 3. Compare with the provided code
    // 4. Account for time drift (check previous/next time windows)
    
    // For now, return true for demonstration
    // You would use a library like 'otplib' for actual TOTP validation
    return code.length === 6 && /^\d+$/.test(code);
  } catch (error) {
    console.error('Error validating TOTP code:', error);
    return false;
  }
}

/**
 * Send MFA code via email
 */
async function sendMFAEmail(userId: string, code: string, action?: string): Promise<boolean> {
  try {
    // Get user email
    const supabase = await createClient(true);
    const { data: user } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user || !user.email) {
      return false;
    }

    // In a real implementation, you would send an email using your email service
    // For now, we'll just log it
    console.log(`MFA Email to ${user.email}:`);
    console.log(`Subject: Superuser Authentication Required`);
    console.log(`Hello ${user.full_name || 'Superuser'},`);
    console.log(`Your verification code is: ${code}`);
    if (action) {
      console.log(`This code is required for: ${action}`);
    }
    console.log(`This code will expire in 10 minutes.`);
    console.log(`If you did not request this, please contact security immediately.`);

    // TODO: Implement actual email sending
    // await emailService.send({
    //   to: user.email,
    //   subject: 'Superuser Authentication Required',
    //   template: 'mfa-challenge',
    //   data: { code, action, userName: user.full_name }
    // });

    return true;
  } catch (error) {
    console.error('Error sending MFA email:', error);
    return false;
  }
}

/**
 * Send MFA code via SMS
 */
async function sendMFASMS(userId: string, code: string, action?: string): Promise<boolean> {
  try {
    // Get user phone number
    const supabase = await createClient(true);
    const { data: user } = await supabase
      .from('profiles')
      .select('phone, full_name')
      .eq('id', userId)
      .single();

    if (!user || !user.phone) {
      return false;
    }

    // In a real implementation, you would send SMS using your SMS service
    console.log(`MFA SMS to ${user.phone}:`);
    console.log(`Your superuser verification code is: ${code}`);
    if (action) {
      console.log(`Required for: ${action}`);
    }
    console.log(`Expires in 10 minutes.`);

    // TODO: Implement actual SMS sending
    // await smsService.send({
    //   to: user.phone,
    //   message: `Your superuser verification code is: ${code}. ${action ? `Required for: ${action}. ` : ''}Expires in 10 minutes.`
    // });

    return true;
  } catch (error) {
    console.error('Error sending MFA SMS:', error);
    return false;
  }
}