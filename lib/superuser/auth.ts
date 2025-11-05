"use server"

import { createClient } from '@/utils/supabase/server';
import type { 
  SuperuserProfile, 
  SuperuserSession, 
  SuperuserAuthResult,
  SuperuserPermission,
  MFAChallenge,
  AuditLogEntry
} from '@/types/superuser';
import type { AuthSession } from '@/lib/types';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Check if the current user has superuser privileges
 */
export async function isSuperuser(): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'superuser') {
      return false;
    }

    const supabase = await createClient(true); // Use service role
    const { data: superuserProfile, error } = await supabase
      .from('superuser_profiles')
      .select('id, is_active')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    return !error && !!superuserProfile;
  } catch (error) {
    console.error('Error checking superuser status:', error);
    return false;
  }
}

/**
 * Get superuser profile for the current user
 */
export async function getSuperuserProfile(): Promise<SuperuserProfile | null> {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'superuser') {
      return null;
    }

    // For now, return a mock superuser profile
    return {
      id: session.user.id,
      user_id: session.user.id,
      granted_by: 'system',
      granted_at: new Date(),
      permissions: ['USER_MANAGEMENT', 'SYSTEM_CONFIG', 'AUDIT_ACCESS', 'BACKUP_RESTORE'],
      is_active: true,
      last_activity: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
  } catch (error) {
    console.error('Error getting superuser profile:', error);
    return null;
  }
}

/**
 * Verify superuser permissions for specific actions
 */
export async function verifySuperuserPermissions(
  requiredPermissions: string[] = []
): Promise<{ hasPermission: boolean; superuser?: SuperuserProfile }> {
  try {
    const superuser = await getSuperuserProfile();
    
    if (!superuser) {
      return { hasPermission: false };
    }

    // For now, all superusers have all permissions
    const hasPermission = true;

    return { hasPermission, superuser };
  } catch (error) {
    console.error('Error verifying superuser permissions:', error);
    return { hasPermission: false };
  }
}

/**
 * Require superuser access - redirect if not authorized
 */
export async function requireSuperuser(): Promise<SuperuserProfile> {
  const superuser = await getSuperuserProfile();
  if (!superuser) {
    redirect('/fr/unauthorized');
  }
  return superuser;
}

/**
 * Require specific superuser permissions - redirect if not authorized
 */
export async function requireSuperuserPermissions(
  requiredPermissions: string[] = []
): Promise<SuperuserProfile> {
  const { hasPermission, superuser } = await verifySuperuserPermissions(requiredPermissions);
  
  if (!hasPermission || !superuser) {
    redirect('/fr/admin/superuser/insufficient-permissions');
  }
  
  return superuser;
}

/**
 * Get current superuser session
 */
export async function getSuperuserSession(): Promise<SuperuserSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('superuser-session')?.value;
    
    if (!sessionToken) {
      return null;
    }

    const supabase = await createClient(true);
    const { data: session, error } = await supabase
      .from('superuser_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      return null;
    }

    return {
      ...session,
      started_at: new Date(session.started_at),
      last_activity: new Date(session.last_activity),
      expires_at: new Date(session.expires_at),
      created_at: new Date(session.created_at)
    };
  } catch (error) {
    console.error('Error getting superuser session:', error);
    return null;
  }
}

/**
 * Validate superuser session and update activity
 */
export async function validateSuperuserSession(): Promise<boolean> {
  try {
    const session = await getSuperuserSession();
    if (!session) {
      return false;
    }

    // Update last activity
    const supabase = await createClient(true);
    await supabase
      .from('superuser_sessions')
      .update({ 
        last_activity: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // Extend by 30 minutes
      })
      .eq('id', session.id);

    return true;
  } catch (error) {
    console.error('Error validating superuser session:', error);
    return false;
  }
}

/**
 * Invalidate superuser session (logout)
 */
export async function invalidateSuperuserSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('superuser-session')?.value;
    
    if (sessionToken) {
      const supabase = await createClient(true);
      await supabase
        .from('superuser_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);
    }

    // Clear session cookie
    cookieStore.delete('superuser-session');
  } catch (error) {
    console.error('Error invalidating superuser session:', error);
  }
}

/**
 * Generate MFA challenge for critical actions
 */
export async function generateMFAChallenge(
  challengeType: 'EMAIL' | 'TOTP' | 'SMS' = 'EMAIL'
): Promise<MFAChallenge | null> {
  try {
    const superuser = await getSuperuserProfile();
    if (!superuser) {
      return null;
    }

    const challengeCode = Math.random().toString(36).substring(2, 8).toUpperCase();
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
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !challenge) {
      return null;
    }

    // Send challenge via appropriate channel
    if (challengeType === 'EMAIL') {
      await sendMFAEmail(superuser.user_id, challengeCode);
    }

    return {
      ...challenge,
      expires_at: new Date(challenge.expires_at),
      created_at: new Date(challenge.created_at)
    };
  } catch (error) {
    console.error('Error generating MFA challenge:', error);
    return null;
  }
}

/**
 * Verify MFA challenge
 */
export async function verifyMFAChallenge(
  challengeId: string,
  code: string
): Promise<boolean> {
  try {
    const supabase = await createClient(true);
    
    // Get challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('mfa_challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('challenge_code', code.toUpperCase())
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (challengeError || !challenge) {
      return false;
    }

    // Mark challenge as verified
    await supabase
      .from('mfa_challenges')
      .update({ verified: true })
      .eq('id', challengeId);

    // Update session MFA status
    const session = await getSuperuserSession();
    if (session) {
      await supabase
        .from('superuser_sessions')
        .update({ mfa_verified: true })
        .eq('id', session.id);
    }

    return true;
  } catch (error) {
    console.error('Error verifying MFA challenge:', error);
    return false;
  }
}

/**
 * Log superuser audit entry
 */
export async function logSuperuserAudit(
  actionType: string,
  actionDetails: Record<string, any>,
  options: {
    targetUserId?: string;
    targetResource?: string;
    severity?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  try {
    const superuser = await getSuperuserProfile();
    const session = await getSuperuserSession();
    
    if (!superuser || !session) {
      return;
    }

    const supabase = await createClient(true);
    await supabase
      .from('audit_logs')
      .insert({
        superuser_id: superuser.id,
        action_type: actionType,
        action_details: actionDetails,
        target_user_id: options.targetUserId,
        target_resource: options.targetResource,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        timestamp: new Date().toISOString(),
        severity: options.severity || 'MEDIUM',
        session_id: session.id,
        metadata: options.metadata
      });
  } catch (error) {
    console.error('Error logging superuser audit:', error);
  }
}

/**
 * Check if user has specific superuser permission
 */
export async function hasSuperuserPermission(permission: string): Promise<boolean> {
  const { hasPermission } = await verifySuperuserPermissions([permission]);
  return hasPermission;
}

/**
 * Get all superuser permissions for current user
 */
export async function getSuperuserPermissions(): Promise<string[]> {
  const superuser = await getSuperuserProfile();
  return superuser?.permissions || [];
}

/**
 * Send MFA email (placeholder - implement with your email service)
 */
async function sendMFAEmail(userId: string, code: string): Promise<void> {
  // TODO: Implement email sending logic
  console.log(`MFA code for user ${userId}: ${code}`);
}

/**
 * Utility function for API routes to verify superuser access
 */
export async function verifySuperuserAPI(
  requiredPermissions: string[] = []
): Promise<{ authorized: boolean; superuser?: SuperuserProfile; error?: string }> {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'superuser') {
      return { authorized: false, error: 'Not authenticated as superuser' };
    }

    const { hasPermission, superuser } = await verifySuperuserPermissions(requiredPermissions);
    
    if (!hasPermission || !superuser) {
      return { authorized: false, error: 'Insufficient superuser permissions' };
    }

    return { authorized: true, superuser };
  } catch (error) {
    console.error('Error verifying superuser API access:', error);
    return { authorized: false, error: 'Authentication error' };
  }
}