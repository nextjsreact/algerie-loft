"use server"

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import type { SuperuserSession, SuperuserProfile } from '@/types/superuser';
import type { AuthSession } from '@/lib/types';
import type { SuperuserSessionManager, SessionMetadata, SessionValidationResult } from './types';
import { getSession } from '@/lib/auth';

/**
 * Enhanced session management for superuser activities
 */

// Types moved to ./types.ts to comply with "use server" restrictions

/**
 * Create a new superuser session
 */
export async function createSuperuserSession(
  superuserProfile: SuperuserProfile,
  metadata: SessionMetadata = {}
): Promise<SuperuserSession | null> {
  try {
    const supabase = await createClient(true); // Use service role
    
    // Generate secure session token
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + superuserProfile.session_timeout_minutes * 60 * 1000);
    
    const { data: session, error } = await supabase
      .from('superuser_sessions')
      .insert({
        superuser_id: superuserProfile.id,
        session_token: sessionToken,
        ip_address: metadata.ipAddress || 'unknown',
        user_agent: metadata.userAgent || 'unknown',
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        mfa_verified: metadata.mfaVerified || !superuserProfile.require_mfa
      })
      .select()
      .single();

    if (error || !session) {
      console.error('Failed to create superuser session:', error);
      return null;
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('superuser-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: superuserProfile.session_timeout_minutes * 60,
      path: '/'
    });

    // Log session creation
    await logSessionActivity(supabase, {
      superuser_id: superuserProfile.id,
      action_type: 'SECURITY',
      action_details: {
        action: 'session_created',
        session_id: session.id,
        timeout_minutes: superuserProfile.session_timeout_minutes
      },
      ip_address: metadata.ipAddress || 'unknown',
      user_agent: metadata.userAgent || 'unknown',
      timestamp: new Date(),
      severity: 'LOW',
      session_id: session.id
    });

    return {
      ...session,
      started_at: new Date(session.started_at),
      last_activity: new Date(session.last_activity),
      expires_at: new Date(session.expires_at),
      created_at: new Date(session.created_at)
    };
  } catch (error) {
    console.error('Error creating superuser session:', error);
    return null;
  }
}

/**
 * Validate and retrieve current superuser session
 */
export async function validateSuperuserSession(
  sessionToken?: string
): Promise<SessionValidationResult> {
  try {
    const cookieStore = await cookies();
    const token = sessionToken || cookieStore.get('superuser-session')?.value;
    
    if (!token) {
      return { isValid: false, reason: 'not_found' };
    }

    const supabase = await createClient(true);
    
    // Get session from database
    const { data: session, error } = await supabase
      .from('superuser_sessions')
      .select('*')
      .eq('session_token', token)
      .eq('is_active', true)
      .single();

    if (error || !session) {
      return { isValid: false, reason: 'not_found' };
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.expires_at);
    
    if (now > expiresAt) {
      // Mark session as inactive
      await supabase
        .from('superuser_sessions')
        .update({ is_active: false })
        .eq('id', session.id);
      
      return { isValid: false, reason: 'expired' };
    }

    // Verify the associated superuser profile is still active
    const { data: superuserProfile, error: profileError } = await supabase
      .from('superuser_profiles')
      .select('is_active')
      .eq('id', session.superuser_id)
      .single();

    if (profileError || !superuserProfile?.is_active) {
      await supabase
        .from('superuser_sessions')
        .update({ is_active: false })
        .eq('id', session.id);
      
      return { isValid: false, reason: 'invalid_user' };
    }

    // Update last activity
    await supabase
      .from('superuser_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', session.id);

    return {
      isValid: true,
      session: {
        ...session,
        started_at: new Date(session.started_at),
        last_activity: new Date(session.last_activity),
        expires_at: new Date(session.expires_at),
        created_at: new Date(session.created_at)
      }
    };
  } catch (error) {
    console.error('Error validating superuser session:', error);
    return { isValid: false, reason: 'not_found' };
  }
}

/**
 * Refresh and extend current session
 */
export async function refreshSuperuserSession(
  sessionId: string,
  additionalMinutes?: number
): Promise<boolean> {
  try {
    const supabase = await createClient(true);
    
    // Get current session and superuser profile
    const { data: session, error: sessionError } = await supabase
      .from('superuser_sessions')
      .select(`
        *,
        superuser_profiles!inner(session_timeout_minutes)
      `)
      .eq('id', sessionId)
      .eq('is_active', true)
      .single();

    if (sessionError || !session) {
      return false;
    }

    const timeoutMinutes = additionalMinutes || session.superuser_profiles.session_timeout_minutes;
    const newExpiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    // Update session expiration and last activity
    const { error: updateError } = await supabase
      .from('superuser_sessions')
      .update({
        last_activity: new Date().toISOString(),
        expires_at: newExpiresAt.toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to refresh superuser session:', updateError);
      return false;
    }

    // Update cookie expiration
    const cookieStore = await cookies();
    const currentToken = cookieStore.get('superuser-session')?.value;
    
    if (currentToken && session.session_token === currentToken) {
      cookieStore.set('superuser-session', currentToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: timeoutMinutes * 60,
        path: '/'
      });
    }

    return true;
  } catch (error) {
    console.error('Error refreshing superuser session:', error);
    return false;
  }
}

/**
 * Invalidate superuser session (logout)
 */
export async function invalidateSuperuserSession(sessionId?: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('superuser-session')?.value;
    
    const supabase = await createClient(true);
    
    if (sessionId) {
      // Invalidate specific session
      await supabase
        .from('superuser_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);
    } else if (sessionToken) {
      // Invalidate session by token
      await supabase
        .from('superuser_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);
    }

    // Clear session cookie
    cookieStore.delete('superuser-session');

    // Log session invalidation
    if (sessionToken) {
      await logSessionActivity(supabase, {
        superuser_id: '', // Will be filled by the audit system
        action_type: 'SECURITY',
        action_details: {
          action: 'session_invalidated',
          session_token_hash: hashToken(sessionToken)
        },
        ip_address: 'server',
        user_agent: 'server',
        timestamp: new Date(),
        severity: 'LOW',
        session_id: sessionId || 'unknown'
      });
    }
  } catch (error) {
    console.error('Error invalidating superuser session:', error);
  }
}

/**
 * Require an active superuser session - throws if not found
 */
export async function requireActiveSuperuserSession(): Promise<SuperuserSession> {
  const validation = await validateSuperuserSession();
  
  if (!validation.isValid || !validation.session) {
    throw new Error(`Superuser session required: ${validation.reason || 'unknown'}`);
  }
  
  return validation.session;
}

/**
 * Get current superuser session without validation
 */
export async function getCurrentSuperuserSession(): Promise<SuperuserSession | null> {
  const validation = await validateSuperuserSession();
  return validation.session || null;
}

/**
 * Check if current user has an active superuser session
 */
export async function hasActiveSuperuserSession(): Promise<boolean> {
  const validation = await validateSuperuserSession();
  return validation.isValid;
}

/**
 * Extend session timeout for critical operations
 */
export async function extendSessionForCriticalOperation(
  sessionId: string,
  operationName: string,
  additionalMinutes: number = 15
): Promise<boolean> {
  try {
    const success = await refreshSuperuserSession(sessionId, additionalMinutes);
    
    if (success) {
      const supabase = await createClient(true);
      await logSessionActivity(supabase, {
        superuser_id: '', // Will be filled by audit system
        action_type: 'SECURITY',
        action_details: {
          action: 'session_extended',
          operation: operationName,
          additional_minutes: additionalMinutes
        },
        ip_address: 'server',
        user_agent: 'server',
        timestamp: new Date(),
        severity: 'MEDIUM',
        session_id: sessionId
      });
    }
    
    return success;
  } catch (error) {
    console.error('Error extending session for critical operation:', error);
    return false;
  }
}

/**
 * Cleanup expired sessions (should be called periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const supabase = await createClient(true);
    
    const { data: expiredSessions, error: selectError } = await supabase
      .from('superuser_sessions')
      .select('id')
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString());

    if (selectError || !expiredSessions) {
      return 0;
    }

    const { error: updateError } = await supabase
      .from('superuser_sessions')
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString());

    if (updateError) {
      console.error('Error cleaning up expired sessions:', updateError);
      return 0;
    }

    return expiredSessions.length;
  } catch (error) {
    console.error('Error in session cleanup:', error);
    return 0;
  }
}

// Utility functions

function generateSecureToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hashToken(token: string): string {
  // Simple hash for logging purposes (not cryptographic)
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

async function logSessionActivity(
  supabase: any,
  entry: any
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        ...entry,
        timestamp: entry.timestamp.toISOString()
      });
  } catch (error) {
    console.error('Failed to log session activity:', error);
  }
}

// Note: SuperuserSessionManager interface implementation available through individual function exports
// Use the individual functions directly: createSuperuserSession, validateSuperuserSession, etc.