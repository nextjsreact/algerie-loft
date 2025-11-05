"use server"

import { createClient } from '@/utils/supabase/server';
import type { SuperuserSession, SuperuserProfile } from '@/types/superuser';
import { cookies, headers } from 'next/headers';

/**
 * Create a new superuser session
 */
export async function createSuperuserSession(
  superuserId: string,
  ipAddress: string,
  userAgent: string,
  timeoutMinutes: number = 30
): Promise<SuperuserSession | null> {
  try {
    const sessionToken = generateSecureToken();
    const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);
    
    const supabase = await createClient(true);
    const { data: session, error } = await supabase
      .from('superuser_sessions')
      .insert({
        superuser_id: superuserId,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        started_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        mfa_verified: false
      })
      .select()
      .single();

    if (error || !session) {
      console.error('Failed to create superuser session:', error);
      return null;
    }

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set('superuser-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: timeoutMinutes * 60,
      path: '/admin/superuser'
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
 * Extend superuser session timeout
 */
export async function extendSuperuserSession(
  sessionId: string,
  additionalMinutes: number = 30
): Promise<boolean> {
  try {
    const newExpiresAt = new Date(Date.now() + additionalMinutes * 60 * 1000);
    
    const supabase = await createClient(true);
    const { error } = await supabase
      .from('superuser_sessions')
      .update({
        last_activity: new Date().toISOString(),
        expires_at: newExpiresAt.toISOString()
      })
      .eq('id', sessionId)
      .eq('is_active', true);

    return !error;
  } catch (error) {
    console.error('Error extending superuser session:', error);
    return false;
  }
}

/**
 * Invalidate all superuser sessions for a user
 */
export async function invalidateAllSuperuserSessions(superuserId: string): Promise<boolean> {
  try {
    const supabase = await createClient(true);
    const { error } = await supabase
      .from('superuser_sessions')
      .update({ is_active: false })
      .eq('superuser_id', superuserId);

    return !error;
  } catch (error) {
    console.error('Error invalidating superuser sessions:', error);
    return false;
  }
}

/**
 * Get active superuser sessions for monitoring
 */
export async function getActiveSuperuserSessions(): Promise<SuperuserSession[]> {
  try {
    const supabase = await createClient(true);
    const { data: sessions, error } = await supabase
      .from('superuser_sessions')
      .select(`
        *,
        superuser_profiles!inner(
          user_id,
          profiles!inner(full_name, email)
        )
      `)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('last_activity', { ascending: false });

    if (error || !sessions) {
      return [];
    }

    return sessions.map(session => ({
      ...session,
      started_at: new Date(session.started_at),
      last_activity: new Date(session.last_activity),
      expires_at: new Date(session.expires_at),
      created_at: new Date(session.created_at)
    }));
  } catch (error) {
    console.error('Error getting active superuser sessions:', error);
    return [];
  }
}

/**
 * Clean up expired superuser sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const supabase = await createClient(true);
    const { data, error } = await supabase
      .from('superuser_sessions')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select('id');

    if (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    return 0;
  }
}

/**
 * Monitor session activity and detect anomalies
 */
export async function detectSessionAnomalies(sessionId: string): Promise<{
  isAnomalous: boolean;
  reasons: string[];
}> {
  try {
    const supabase = await createClient(true);
    const { data: session, error } = await supabase
      .from('superuser_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return { isAnomalous: true, reasons: ['Session not found'] };
    }

    const reasons: string[] = [];
    
    // Check for IP address changes (if we had previous sessions)
    const { data: recentSessions } = await supabase
      .from('superuser_sessions')
      .select('ip_address')
      .eq('superuser_id', session.superuser_id)
      .neq('id', sessionId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(5);

    if (recentSessions && recentSessions.length > 0) {
      const uniqueIPs = new Set(recentSessions.map(s => s.ip_address));
      if (!uniqueIPs.has(session.ip_address)) {
        reasons.push('New IP address detected');
      }
    }

    // Check session duration
    const sessionDuration = Date.now() - new Date(session.started_at).getTime();
    const maxDuration = 8 * 60 * 60 * 1000; // 8 hours
    if (sessionDuration > maxDuration) {
      reasons.push('Session duration exceeds maximum allowed time');
    }

    // Check for rapid activity (potential automation)
    const { data: recentActivity } = await supabase
      .from('audit_logs')
      .select('timestamp')
      .eq('session_id', sessionId)
      .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (recentActivity && recentActivity.length > 20) {
      reasons.push('Unusually high activity rate detected');
    }

    return {
      isAnomalous: reasons.length > 0,
      reasons
    };
  } catch (error) {
    console.error('Error detecting session anomalies:', error);
    return { isAnomalous: true, reasons: ['Error analyzing session'] };
  }
}

/**
 * Get session timeout warning time (5 minutes before expiry)
 */
export async function getSessionTimeoutWarning(sessionId: string): Promise<{
  showWarning: boolean;
  minutesRemaining: number;
}> {
  try {
    const supabase = await createClient(true);
    const { data: session, error } = await supabase
      .from('superuser_sessions')
      .select('expires_at')
      .eq('id', sessionId)
      .eq('is_active', true)
      .single();

    if (error || !session) {
      return { showWarning: false, minutesRemaining: 0 };
    }

    const expiresAt = new Date(session.expires_at).getTime();
    const now = Date.now();
    const minutesRemaining = Math.floor((expiresAt - now) / (60 * 1000));

    return {
      showWarning: minutesRemaining <= 5 && minutesRemaining > 0,
      minutesRemaining: Math.max(0, minutesRemaining)
    };
  } catch (error) {
    console.error('Error getting session timeout warning:', error);
    return { showWarning: false, minutesRemaining: 0 };
  }
}

/**
 * Force logout from specific session
 */
export async function forceLogoutSession(sessionId: string, reason: string): Promise<boolean> {
  try {
    const supabase = await createClient(true);
    
    // Get session info for audit log
    const { data: session } = await supabase
      .from('superuser_sessions')
      .select('superuser_id, ip_address, user_agent')
      .eq('id', sessionId)
      .single();

    // Invalidate session
    const { error } = await supabase
      .from('superuser_sessions')
      .update({ 
        is_active: false,
        logout_reason: reason,
        logout_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (!error && session) {
      // Log forced logout
      await supabase
        .from('audit_logs')
        .insert({
          superuser_id: session.superuser_id,
          action_type: 'SECURITY',
          action_details: {
            action: 'forced_logout',
            reason,
            session_id: sessionId
          },
          ip_address: session.ip_address,
          user_agent: session.user_agent,
          timestamp: new Date().toISOString(),
          severity: 'HIGH',
          session_id: sessionId
        });
    }

    return !error;
  } catch (error) {
    console.error('Error forcing logout session:', error);
    return false;
  }
}

/**
 * Generate secure session token
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get client IP address from headers
 */
export async function getClientIPAddress(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get('x-forwarded-for');
  const realIP = headersList.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Get user agent from headers
 */
export async function getUserAgent(): Promise<string> {
  const headersList = await headers();
  return headersList.get('user-agent') || 'unknown';
}