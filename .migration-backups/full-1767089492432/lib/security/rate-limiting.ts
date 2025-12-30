/**
 * Rate limiting and DDoS protection utilities
 * Provides configurable rate limiting for API endpoints and user actions
 */

import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import { createAuditLog } from '@/lib/services/audit';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

// Default rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 registrations per hour
  passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 password resets per hour
  
  // Booking endpoints
  bookingCreate: { windowMs: 60 * 1000, maxRequests: 2 }, // 2 bookings per minute
  bookingSearch: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 searches per minute
  
  // File upload endpoints
  fileUpload: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 uploads per minute
  
  // API endpoints
  apiGeneral: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  apiSensitive: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 sensitive requests per minute
  
  // Partner verification
  partnerVerification: { windowMs: 24 * 60 * 60 * 1000, maxRequests: 1 }, // 1 verification per day
  
  // Payment processing
  paymentProcess: { windowMs: 60 * 1000, maxRequests: 3 }, // 3 payment attempts per minute
} as const;

/**
 * Check rate limit for a specific identifier and endpoint
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMIT_CONFIGS,
  customConfig?: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const config = customConfig || RATE_LIMIT_CONFIGS[endpoint];
    const key = `rate_limit:${endpoint}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const supabase = await createClient();

    // Get existing rate limit record
    const { data: existing, error: selectError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('key', key)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      logger.error('Rate limit check error', selectError);
      // Allow request if we can't check rate limit
      return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs, totalHits: 1 };
    }

    let totalHits = 1;
    let resetTime = now + config.windowMs;

    if (existing) {
      // Check if window has expired
      if (existing.window_start < windowStart) {
        // Reset window
        totalHits = 1;
        resetTime = now + config.windowMs;
        
        const { error: updateError } = await supabase
          .from('rate_limits')
          .update({
            hits: 1,
            window_start: now,
            reset_time: resetTime,
            updated_at: new Date().toISOString()
          })
          .eq('key', key);

        if (updateError) {
          logger.error('Rate limit update error', updateError);
        }
      } else {
        // Increment hits in current window
        totalHits = existing.hits + 1;
        resetTime = existing.reset_time;

        const { error: updateError } = await supabase
          .from('rate_limits')
          .update({
            hits: totalHits,
            updated_at: new Date().toISOString()
          })
          .eq('key', key);

        if (updateError) {
          logger.error('Rate limit increment error', updateError);
        }
      }
    } else {
      // Create new rate limit record
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          key,
          identifier,
          endpoint,
          hits: 1,
          window_start: now,
          reset_time: resetTime,
          max_requests: config.maxRequests,
          window_ms: config.windowMs
        });

      if (insertError) {
        logger.error('Rate limit creation error', insertError);
      }
    }

    const allowed = totalHits <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - totalHits);

    // Log rate limit violations
    if (!allowed) {
      logger.warn('Rate limit exceeded', {
        identifier,
        endpoint,
        totalHits,
        maxRequests: config.maxRequests,
        windowMs: config.windowMs
      });

      // Create audit log for rate limit violation
      await createAuditLog(
        identifier,
        'view',
        'rate_limit',
        key,
        undefined,
        {
          endpoint,
          totalHits,
          maxRequests: config.maxRequests,
          violation: true
        }
      );
    }

    return {
      allowed,
      remaining,
      resetTime,
      totalHits
    };
  } catch (error) {
    logger.error('Rate limit check failed', error);
    // Allow request if rate limiting fails
    return { allowed: true, remaining: 0, resetTime: Date.now(), totalHits: 1 };
  }
}

/**
 * Middleware function to apply rate limiting
 */
export function createRateLimitMiddleware(
  endpoint: keyof typeof RATE_LIMIT_CONFIGS,
  identifierExtractor: (request: any) => string = (req) => req.ip || 'unknown'
) {
  return async (request: any, response: any, next: () => void) => {
    try {
      const identifier = identifierExtractor(request);
      const result = await checkRateLimit(identifier, endpoint);

      // Set rate limit headers
      response.setHeader('X-RateLimit-Limit', RATE_LIMIT_CONFIGS[endpoint].maxRequests);
      response.setHeader('X-RateLimit-Remaining', result.remaining);
      response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

      if (!result.allowed) {
        response.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Rate limit middleware error', error);
      next(); // Continue on error
    }
  };
}

/**
 * Check for suspicious activity patterns
 */
export async function detectSuspiciousActivity(
  identifier: string,
  activityType: string,
  metadata?: Record<string, any>
): Promise<{ suspicious: boolean; reason?: string; riskScore: number }> {
  try {
    const supabase = await createClient();
    const now = Date.now();
    const lookbackPeriod = 24 * 60 * 60 * 1000; // 24 hours

    // Get recent activity for this identifier
    const { data: recentActivity, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .gte('window_start', now - lookbackPeriod);

    if (error) {
      logger.error('Suspicious activity detection error', error);
      return { suspicious: false, riskScore: 0 };
    }

    let riskScore = 0;
    let suspiciousReasons: string[] = [];

    // Check for multiple rate limit violations
    const violations = recentActivity?.filter(r => r.hits > r.max_requests) || [];
    if (violations.length > 3) {
      riskScore += 30;
      suspiciousReasons.push('Multiple rate limit violations');
    }

    // Check for rapid endpoint switching
    const uniqueEndpoints = new Set(recentActivity?.map(r => r.endpoint) || []);
    if (uniqueEndpoints.size > 10) {
      riskScore += 20;
      suspiciousReasons.push('Rapid endpoint switching');
    }

    // Check for high volume activity
    const totalRequests = recentActivity?.reduce((sum, r) => sum + r.hits, 0) || 0;
    if (totalRequests > 1000) {
      riskScore += 25;
      suspiciousReasons.push('High volume activity');
    }

    // Check for authentication-related suspicious patterns
    if (activityType === 'authentication') {
      const authAttempts = recentActivity?.filter(r => 
        ['login', 'register', 'passwordReset'].includes(r.endpoint)
      ) || [];
      
      if (authAttempts.length > 20) {
        riskScore += 40;
        suspiciousReasons.push('Excessive authentication attempts');
      }
    }

    const suspicious = riskScore >= 50;

    if (suspicious) {
      logger.warn('Suspicious activity detected', {
        identifier,
        activityType,
        riskScore,
        reasons: suspiciousReasons,
        metadata
      });

      // Create audit log for suspicious activity
      await createAuditLog(
        identifier,
        'view',
        'security_alert',
        `suspicious_${identifier}`,
        undefined,
        {
          activityType,
          riskScore,
          reasons: suspiciousReasons,
          metadata
        }
      );
    }

    return {
      suspicious,
      reason: suspiciousReasons.join(', '),
      riskScore
    };
  } catch (error) {
    logger.error('Suspicious activity detection failed', error);
    return { suspicious: false, riskScore: 0 };
  }
}

/**
 * Block an identifier temporarily
 */
export async function blockIdentifier(
  identifier: string,
  reason: string,
  durationMs: number = 60 * 60 * 1000, // 1 hour default
  blockedBy?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const expiresAt = new Date(Date.now() + durationMs);

    const { error } = await supabase
      .from('blocked_identifiers')
      .insert({
        identifier,
        reason,
        blocked_by: blockedBy,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (error) {
      logger.error('Identifier blocking failed', error);
      return { success: false, error: 'Failed to block identifier' };
    }

    // Create audit log
    if (blockedBy) {
      await createAuditLog(
        blockedBy,
        'create',
        'security_block',
        identifier,
        undefined,
        {
          reason,
          durationMs,
          expiresAt: expiresAt.toISOString()
        }
      );
    }

    logger.info('Identifier blocked', {
      identifier,
      reason,
      durationMs,
      expiresAt: expiresAt.toISOString()
    });

    return { success: true };
  } catch (error) {
    logger.error('Identifier blocking error', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Check if an identifier is blocked
 */
export async function isIdentifierBlocked(identifier: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('blocked_identifiers')
      .select('id')
      .eq('identifier', identifier)
      .gt('expires_at', now)
      .limit(1);

    if (error) {
      logger.error('Blocked identifier check error', error);
      return false; // Allow on error
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    logger.error('Blocked identifier check failed', error);
    return false; // Allow on error
  }
}

/**
 * Clean up expired rate limit records
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  try {
    const supabase = await createClient();
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    const { count, error } = await supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', cutoffTime)
      .select();

    if (error) {
      logger.error('Rate limit cleanup error', error);
      return 0;
    }

    const deletedCount = count || 0;
    logger.info('Rate limit records cleaned up', { deletedCount });
    return deletedCount;
  } catch (error) {
    logger.error('Rate limit cleanup failed', error);
    return 0;
  }
}