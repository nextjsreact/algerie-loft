/**
 * Secure login endpoint demonstrating comprehensive security middleware usage
 * This endpoint showcases all security features: rate limiting, CSRF protection,
 * input validation, SQL injection prevention, and audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurity, SecurityPresets } from '@/lib/security/security-middleware';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import { createAuditLog } from '@/lib/services/audit';
import bcrypt from 'bcryptjs';

// Validation schema for login request
const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email too long')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password too long'), // Don't validate password complexity on login
  rememberMe: z.boolean().optional().default(false),
  captcha: z.string().optional() // For additional bot protection
});

type LoginRequest = z.infer<typeof loginSchema>;

/**
 * Secure login handler with comprehensive security measures
 */
async function loginHandler(request: NextRequest, context: any): Promise<NextResponse> {
  const { sanitizedData, clientIp, userAgent, requestId } = context;
  const loginData = sanitizedData as LoginRequest;

  try {
    const supabase = await createClient();

    // Additional security: Check for account lockout
    const lockoutCheck = await checkAccountLockout(loginData.email, clientIp);
    if (lockoutCheck.isLocked) {
      logger.warn('Login attempt on locked account', {
        email: loginData.email,
        clientIp,
        requestId,
        lockoutReason: lockoutCheck.reason
      });

      return NextResponse.json(
        { 
          error: 'Account temporarily locked due to security reasons',
          retryAfter: lockoutCheck.retryAfter
        },
        { status: 423 } // Locked
      );
    }

    // Attempt authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password
    });

    if (authError || !authData.user) {
      // Record failed login attempt
      await recordFailedLoginAttempt(loginData.email, clientIp, userAgent, authError?.message);

      logger.warn('Failed login attempt', {
        email: loginData.email,
        clientIp,
        userAgent,
        requestId,
        error: authError?.message
      });

      // Generic error message to prevent user enumeration
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user profile for role information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, last_login_at, login_count')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      logger.error('Failed to fetch user profile', profileError, {
        userId: authData.user.id,
        requestId
      });
    }

    // Update user login statistics
    await updateLoginStatistics(authData.user.id, clientIp, userAgent);

    // Clear any failed login attempts for this email/IP
    await clearFailedLoginAttempts(loginData.email, clientIp);

    // Create audit log for successful login
    await createAuditLog(
      authData.user.id,
      'create',
      'user_session',
      'login',
      undefined,
      {
        clientIp,
        userAgent,
        requestId,
        rememberMe: loginData.rememberMe,
        loginMethod: 'password'
      }
    );

    // Prepare response data
    const responseData = {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profile?.role || 'member',
        full_name: profile?.full_name || authData.user.user_metadata?.full_name,
        last_login: profile?.last_login_at,
        login_count: (profile?.login_count || 0) + 1
      },
      session: {
        access_token: authData.session?.access_token,
        refresh_token: authData.session?.refresh_token,
        expires_at: authData.session?.expires_at
      }
    };

    logger.info('Successful login', {
      userId: authData.user.id,
      email: loginData.email,
      role: profile?.role,
      clientIp,
      userAgent,
      requestId
    });

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    logger.error('Login handler error', error, {
      email: loginData.email,
      clientIp,
      requestId
    });

    // Record the error for security monitoring
    await recordSecurityEvent(
      'login_error',
      'high',
      clientIp,
      undefined,
      {
        email: loginData.email,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      }
    );

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if account is locked due to failed attempts
 */
async function checkAccountLockout(email: string, clientIp: string): Promise<{
  isLocked: boolean;
  reason?: string;
  retryAfter?: number;
}> {
  try {
    const supabase = await createClient();
    const now = new Date();
    const lockoutWindow = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes

    // Check failed attempts by email
    const { data: emailAttempts, error: emailError } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('email', email)
      .gte('created_at', lockoutWindow.toISOString())
      .order('created_at', { ascending: false });

    if (emailError) {
      logger.error('Failed to check email lockout', emailError);
      return { isLocked: false };
    }

    // Check failed attempts by IP
    const { data: ipAttempts, error: ipError } = await supabase
      .from('failed_login_attempts')
      .select('*')
      .eq('client_ip', clientIp)
      .gte('created_at', lockoutWindow.toISOString())
      .order('created_at', { ascending: false });

    if (ipError) {
      logger.error('Failed to check IP lockout', ipError);
      return { isLocked: false };
    }

    // Check lockout thresholds
    const emailAttemptCount = emailAttempts?.length || 0;
    const ipAttemptCount = ipAttempts?.length || 0;

    if (emailAttemptCount >= 5) {
      return {
        isLocked: true,
        reason: 'Too many failed attempts for this email',
        retryAfter: 30 * 60 // 30 minutes
      };
    }

    if (ipAttemptCount >= 10) {
      return {
        isLocked: true,
        reason: 'Too many failed attempts from this IP',
        retryAfter: 30 * 60 // 30 minutes
      };
    }

    return { isLocked: false };
  } catch (error) {
    logger.error('Account lockout check failed', error);
    return { isLocked: false }; // Fail open for availability
  }
}

/**
 * Record failed login attempt
 */
async function recordFailedLoginAttempt(
  email: string,
  clientIp: string,
  userAgent: string,
  errorMessage?: string
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase
      .from('failed_login_attempts')
      .insert({
        email,
        client_ip: clientIp,
        user_agent: userAgent,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      });

    // Also record as security event
    await recordSecurityEvent(
      'failed_login',
      'medium',
      clientIp,
      undefined,
      {
        email,
        userAgent,
        errorMessage
      }
    );
  } catch (error) {
    logger.error('Failed to record login attempt', error);
  }
}

/**
 * Update user login statistics
 */
async function updateLoginStatistics(
  userId: string,
  clientIp: string,
  userAgent: string
): Promise<void> {
  try {
    const supabase = await createClient();

    // Update profile with login info
    await supabase
      .from('profiles')
      .update({
        last_login_at: new Date().toISOString(),
        last_login_ip: clientIp,
        login_count: supabase.rpc('increment_login_count', { user_id: userId })
      })
      .eq('id', userId);

    // Record login session
    await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        client_ip: clientIp,
        user_agent: userAgent,
        login_at: new Date().toISOString()
      });
  } catch (error) {
    logger.error('Failed to update login statistics', error);
  }
}

/**
 * Clear failed login attempts after successful login
 */
async function clearFailedLoginAttempts(email: string, clientIp: string): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase
      .from('failed_login_attempts')
      .delete()
      .or(`email.eq.${email},client_ip.eq.${clientIp}`);
  } catch (error) {
    logger.error('Failed to clear login attempts', error);
  }
}

/**
 * Record security event
 */
async function recordSecurityEvent(
  eventType: string,
  severity: string,
  identifier: string,
  userId?: string,
  details?: any
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase
      .from('security_events')
      .insert({
        event_type: eventType,
        severity,
        identifier,
        user_id: userId,
        details: details || {},
        created_at: new Date().toISOString()
      });
  } catch (error) {
    logger.error('Failed to record security event', error);
  }
}

// Export the secured endpoint
export const POST = withSecurity(
  loginHandler,
  SecurityPresets.auth(loginSchema)
);