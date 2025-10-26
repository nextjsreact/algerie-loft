/**
 * API security utilities for secure endpoint protection
 * Provides authentication, authorization, and security headers for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PermissionValidator } from '@/lib/permissions/types';
import { checkRateLimit, isIdentifierBlocked, detectSuspiciousActivity } from './rate-limiting';
import { createAuditLog } from '@/lib/services/audit';
import { logger } from '@/lib/logger';
import type { UserRole } from '@/lib/types';

export interface ApiSecurityConfig {
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  requiredPermissions?: {
    resource: string;
    action: string;
    scope?: string;
  }[];
  rateLimitEndpoint?: string;
  enableSuspiciousActivityDetection?: boolean;
  requireHttps?: boolean;
  allowedOrigins?: string[];
  maxRequestSize?: number; // in bytes
}

export interface SecureApiContext {
  user?: {
    id: string;
    email: string | null;
    role: UserRole;
    full_name: string | null;
  };
  clientIp: string;
  userAgent: string;
  requestId: string;
}

/**
 * Secure API wrapper that applies security checks and middleware
 */
export function withApiSecurity(
  handler: (request: NextRequest, context: SecureApiContext) => Promise<NextResponse>,
  config: ApiSecurityConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    try {
      // Security headers
      const securityHeaders = getSecurityHeaders();

      // Check if identifier is blocked
      if (await isIdentifierBlocked(clientIp)) {
        logger.warn('Blocked identifier attempted access', { clientIp, userAgent });
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403, headers: securityHeaders }
        );
      }

      // HTTPS enforcement
      if (config.requireHttps && !isHttps(request)) {
        return NextResponse.json(
          { error: 'HTTPS required' },
          { status: 400, headers: securityHeaders }
        );
      }

      // CORS check
      if (config.allowedOrigins && !isOriginAllowed(request, config.allowedOrigins)) {
        return NextResponse.json(
          { error: 'Origin not allowed' },
          { status: 403, headers: securityHeaders }
        );
      }

      // Request size check
      if (config.maxRequestSize && await getRequestSize(request) > config.maxRequestSize) {
        return NextResponse.json(
          { error: 'Request too large' },
          { status: 413, headers: securityHeaders }
        );
      }

      // Rate limiting
      if (config.rateLimitEndpoint) {
        const rateLimitResult = await checkRateLimit(clientIp, config.rateLimitEndpoint as any);
        
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { 
              error: 'Too Many Requests',
              retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            },
            { 
              status: 429, 
              headers: {
                ...securityHeaders,
                'X-RateLimit-Limit': config.rateLimitEndpoint ? String(rateLimitResult.totalHits) : '0',
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetTime / 1000)),
                'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000))
              }
            }
        );
        }
      }

      // Authentication check
      let user: SecureApiContext['user'] | undefined;
      if (config.requireAuth) {
        const session = await getSession();
        if (!session) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401, headers: securityHeaders }
          );
        }
        user = session.user;
      }

      // Role-based authorization
      if (config.allowedRoles && user) {
        if (!config.allowedRoles.includes(user.role)) {
          await createAuditLog(
            user.id,
            'view',
            'api_access',
            request.url,
            undefined,
            { action: 'access_denied', reason: 'insufficient_role', requiredRoles: config.allowedRoles }
          );
          
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403, headers: securityHeaders }
          );
        }
      }

      // Permission-based authorization
      if (config.requiredPermissions && user) {
        for (const permission of config.requiredPermissions) {
          if (!PermissionValidator.hasPermission(
            user.role,
            permission.resource,
            permission.action,
            permission.scope
          )) {
            await createAuditLog(
              user.id,
              'view',
              'api_access',
              request.url,
              undefined,
              { 
                action: 'access_denied', 
                reason: 'insufficient_permissions',
                requiredPermission: permission
              }
            );
            
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403, headers: securityHeaders }
            );
          }
        }
      }

      // Suspicious activity detection
      if (config.enableSuspiciousActivityDetection) {
        const suspiciousActivity = await detectSuspiciousActivity(
          clientIp,
          'api_access',
          {
            endpoint: request.url,
            method: request.method,
            userAgent,
            userId: user?.id
          }
        );

        if (suspiciousActivity.suspicious) {
          logger.warn('Suspicious API activity detected', {
            clientIp,
            userId: user?.id,
            endpoint: request.url,
            riskScore: suspiciousActivity.riskScore,
            reason: suspiciousActivity.reason
          });

          // For high-risk activities, block the request
          if (suspiciousActivity.riskScore >= 80) {
            return NextResponse.json(
              { error: 'Access denied due to suspicious activity' },
              { status: 403, headers: securityHeaders }
            );
          }
        }
      }

      // Create API access audit log
      if (user) {
        await createAuditLog(
          user.id,
          'view',
          'api_access',
          request.url,
          undefined,
          {
            method: request.method,
            endpoint: request.url,
            clientIp,
            userAgent,
            requestId
          }
        );
      }

      // Create secure context
      const context: SecureApiContext = {
        user,
        clientIp,
        userAgent,
        requestId
      };

      // Call the actual handler
      const response = await handler(request, context);

      // Add security headers to response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;

    } catch (error) {
      logger.error('API security middleware error', error, {
        requestId,
        clientIp,
        endpoint: request.url,
        method: request.method
      });

      return NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  };
}

/**
 * Get security headers for API responses
 */
function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-Request-ID': generateRequestId()
  };
}

/**
 * Extract client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwarded) return forwarded.split(',')[0].trim();
  
  return 'unknown';
}

/**
 * Check if request is using HTTPS
 */
function isHttps(request: NextRequest): boolean {
  return request.url.startsWith('https://') || 
         request.headers.get('x-forwarded-proto') === 'https';
}

/**
 * Check if request origin is allowed
 */
function isOriginAllowed(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Allow requests without origin header
  
  return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
}

/**
 * Get request size in bytes
 */
async function getRequestSize(request: NextRequest): Promise<number> {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10);
  }
  
  // If no content-length header, try to get body size
  try {
    const body = await request.text();
    return new Blob([body]).size;
  } catch {
    return 0;
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate API key for external integrations
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  keyInfo?: {
    id: string;
    name: string;
    permissions: string[];
    rateLimits: Record<string, number>;
  };
}> {
  try {
    const supabase = await (await import('@/utils/supabase/server')).createClient();
    
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', await hashApiKey(apiKey))
      .eq('is_active', true)
      .single();

    if (error || !keyData) {
      return { valid: false };
    }

    // Check if key is expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { valid: false };
    }

    return {
      valid: true,
      keyInfo: {
        id: keyData.id,
        name: keyData.name,
        permissions: keyData.permissions || [],
        rateLimits: keyData.rate_limits || {}
      }
    };
  } catch (error) {
    logger.error('API key validation error', error);
    return { valid: false };
  }
}

/**
 * Hash API key for secure storage
 */
async function hashApiKey(apiKey: string): Promise<string> {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Create a new API key
 */
export async function createApiKey(
  name: string,
  permissions: string[],
  expiresAt?: Date,
  rateLimits?: Record<string, number>
): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  try {
    const supabase = await (await import('@/utils/supabase/server')).createClient();
    const { generateSecureToken } = await import('./encryption');
    
    const apiKey = `loft_${generateSecureToken(32)}`;
    const keyHash = await hashApiKey(apiKey);

    const { error } = await supabase
      .from('api_keys')
      .insert({
        name,
        key_hash: keyHash,
        permissions,
        rate_limits: rateLimits,
        expires_at: expiresAt?.toISOString(),
        is_active: true,
        created_at: new Date().toISOString()
      });

    if (error) {
      logger.error('API key creation error', error);
      return { success: false, error: 'Failed to create API key' };
    }

    return { success: true, apiKey };
  } catch (error) {
    logger.error('API key creation failed', error);
    return { success: false, error: 'Internal server error' };
  }
}