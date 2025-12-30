/**
 * Partner Security Middleware
 * Provides comprehensive security validation, rate limiting, and input sanitization
 * for partner dashboard system endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { LRUCache } from 'lru-cache';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface PartnerSecurityContext {
  partnerId: string;
  userId: string;
  partnerStatus: string;
  isAdmin: boolean;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
}

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
}

// =====================================================
// RATE LIMITING CONFIGURATION
// =====================================================

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Partner authentication endpoints
  'partner-login': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true
  },
  
  // Partner registration
  'partner-register': {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registration attempts per hour
    message: 'Too many registration attempts, please try again later'
  },
  
  // Partner dashboard data access
  'partner-dashboard': {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Too many dashboard requests, please slow down'
  },
  
  // Property data access
  'partner-properties': {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    message: 'Too many property requests, please slow down'
  },
  
  // Revenue and analytics
  'partner-revenue': {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute (more expensive queries)
    message: 'Too many revenue requests, please slow down'
  },
  
  // Admin actions
  'admin-partner-actions': {
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 admin actions per minute
    message: 'Too many admin actions, please slow down'
  }
};

// In-memory rate limit store using LRU cache
const rateLimitStore = new LRUCache<string, { count: number; resetTime: number }>({
  max: 10000, // Maximum number of entries
  ttl: 60 * 60 * 1000, // 1 hour TTL
});

// =====================================================
// INPUT VALIDATION SCHEMAS
// =====================================================

// Partner registration validation
export const partnerRegistrationSchema = z.object({
  personal_info: z.object({
    full_name: z.string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name is too long')
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Full name contains invalid characters'),
    email: z.string()
      .email('Invalid email format')
      .max(255, 'Email is too long'),
    phone: z.string()
      .regex(/^[\+]?[0-9\s\-\(\)]{8,20}$/, 'Invalid phone number format')
      .max(20, 'Phone number is too long'),
    address: z.string()
      .min(10, 'Address must be at least 10 characters')
      .max(500, 'Address is too long')
  }),
  business_info: z.object({
    business_name: z.string()
      .max(255, 'Business name is too long')
      .optional(),
    business_type: z.enum(['individual', 'company']),
    tax_id: z.string()
      .max(50, 'Tax ID is too long')
      .optional()
  }),
  portfolio_description: z.string()
    .min(50, 'Portfolio description must be at least 50 characters')
    .max(2000, 'Portfolio description is too long'),
  terms_accepted: z.boolean().refine(val => val === true, 'Terms must be accepted')
});

// Partner profile update validation
export const partnerProfileUpdateSchema = z.object({
  personal_info: z.object({
    full_name: z.string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name is too long')
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Full name contains invalid characters')
      .optional(),
    phone: z.string()
      .regex(/^[\+]?[0-9\s\-\(\)]{8,20}$/, 'Invalid phone number format')
      .max(20, 'Phone number is too long')
      .optional(),
    address: z.string()
      .min(10, 'Address must be at least 10 characters')
      .max(500, 'Address is too long')
      .optional()
  }).optional(),
  business_info: z.object({
    business_name: z.string()
      .max(255, 'Business name is too long')
      .optional(),
    tax_id: z.string()
      .max(50, 'Tax ID is too long')
      .optional()
  }).optional(),
  portfolio_description: z.string()
    .min(50, 'Portfolio description must be at least 50 characters')
    .max(2000, 'Portfolio description is too long')
    .optional()
});

// Admin validation actions
export const adminValidationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  partner_id: z.string().uuid('Invalid partner ID'),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason is too long')
    .optional(),
  admin_notes: z.string()
    .max(2000, 'Admin notes are too long')
    .optional()
});

// Property access validation
export const propertyAccessSchema = z.object({
  loft_id: z.string().uuid('Invalid property ID').optional(),
  date_range: z.object({
    from: z.string().datetime('Invalid from date'),
    to: z.string().datetime('Invalid to date')
  }).optional(),
  filters: z.object({
    status: z.enum(['available', 'occupied', 'maintenance']).optional(),
    search: z.string().max(100, 'Search term is too long').optional()
  }).optional()
});

// =====================================================
// SECURITY VALIDATION FUNCTIONS
// =====================================================

/**
 * Validates and sanitizes input data based on schema
 */
export function validateAndSanitizeInput<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  securityLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): SecurityValidationResult {
  try {
    // Parse and validate with Zod
    const validatedData = schema.parse(data);
    
    // Additional security checks based on level
    const additionalErrors: string[] = [];
    
    if (securityLevel === 'high' || securityLevel === 'critical') {
      // Check for potential XSS patterns
      const dataString = JSON.stringify(validatedData);
      if (containsXSSPatterns(dataString)) {
        additionalErrors.push('Input contains potentially malicious content');
      }
      
      // Check for SQL injection patterns
      if (containsSQLInjectionPatterns(dataString)) {
        additionalErrors.push('Input contains potentially malicious SQL patterns');
      }
    }
    
    if (securityLevel === 'critical') {
      // Additional checks for critical operations
      if (containsScriptTags(JSON.stringify(validatedData))) {
        additionalErrors.push('Input contains script tags');
      }
    }
    
    return {
      isValid: additionalErrors.length === 0,
      errors: additionalErrors,
      sanitizedData: validatedData,
      securityLevel
    };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        securityLevel
      };
    }
    
    return {
      isValid: false,
      errors: ['Invalid input data'],
      securityLevel
    };
  }
}

/**
 * Check for XSS patterns
 */
function containsXSSPatterns(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for SQL injection patterns
 */
function containsSQLInjectionPatterns(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /('|(\\')|(;)|(--)|(\s)|(\/\*))/gi,
    /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR|ONCLICK)\b)/gi
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check for script tags
 */
function containsScriptTags(input: string): boolean {
  return /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(input);
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize SQL input
 */
export function sanitizeSqlInput(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

// =====================================================
// RATE LIMITING FUNCTIONS
// =====================================================

/**
 * Check rate limit for a specific endpoint and IP
 */
export function checkRateLimit(
  endpoint: string,
  ipAddress: string,
  userId?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = rateLimitConfigs[endpoint];
  if (!config) {
    return { allowed: true, remaining: Infinity, resetTime: 0 };
  }
  
  const key = `${endpoint}:${ipAddress}${userId ? `:${userId}` : ''}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  const existing = rateLimitStore.get(key);
  
  if (!existing || existing.resetTime <= now) {
    // New window or expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: now + config.windowMs
    };
  }
  
  if (existing.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime
    };
  }
  
  // Increment count
  existing.count++;
  rateLimitStore.set(key, existing);
  
  return {
    allowed: true,
    remaining: config.max - existing.count,
    resetTime: existing.resetTime
  };
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  endpoint: string,
  remaining: number,
  resetTime: number
): NextResponse {
  const config = rateLimitConfigs[endpoint];
  const response = NextResponse.json(
    { error: config?.message || 'Rate limit exceeded' },
    { status: 429 }
  );
  
  response.headers.set('X-RateLimit-Limit', config?.max.toString() || '0');
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
  response.headers.set('Retry-After', Math.ceil((resetTime - Date.now()) / 1000).toString());
  
  return response;
}

// =====================================================
// PARTNER OWNERSHIP VALIDATION
// =====================================================

/**
 * Validate partner ownership of a resource
 */
export async function validatePartnerOwnership(
  supabase: any,
  partnerId: string,
  resourceType: 'loft' | 'reservation' | 'transaction',
  resourceId: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    switch (resourceType) {
      case 'loft':
        const { data: loft, error: loftError } = await supabase
          .from('lofts')
          .select('partner_id')
          .eq('id', resourceId)
          .single();
        
        if (loftError || !loft) {
          return { isValid: false, error: 'Property not found' };
        }
        
        if (loft.partner_id !== partnerId) {
          return { isValid: false, error: 'Access denied: Property not owned by partner' };
        }
        break;
        
      case 'reservation':
        const { data: reservation, error: reservationError } = await supabase
          .from('reservations')
          .select(`
            loft_id,
            lofts!inner(partner_id)
          `)
          .eq('id', resourceId)
          .single();
        
        if (reservationError || !reservation) {
          return { isValid: false, error: 'Reservation not found' };
        }
        
        if (reservation.lofts.partner_id !== partnerId) {
          return { isValid: false, error: 'Access denied: Reservation not for partner property' };
        }
        break;
        
      case 'transaction':
        const { data: transaction, error: transactionError } = await supabase
          .from('transactions')
          .select(`
            loft_id,
            lofts!inner(partner_id)
          `)
          .eq('id', resourceId)
          .single();
        
        if (transactionError || !transaction) {
          return { isValid: false, error: 'Transaction not found' };
        }
        
        if (transaction.lofts.partner_id !== partnerId) {
          return { isValid: false, error: 'Access denied: Transaction not for partner property' };
        }
        break;
        
      default:
        return { isValid: false, error: 'Invalid resource type' };
    }
    
    return { isValid: true };
    
  } catch (error) {
    console.error('Partner ownership validation error:', error);
    return { isValid: false, error: 'Validation failed' };
  }
}

// =====================================================
// SECURITY CONTEXT EXTRACTION
// =====================================================

/**
 * Extract security context from request
 */
export function extractSecurityContext(request: NextRequest): Partial<PartnerSecurityContext> {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return {
    partnerId: request.headers.get('x-partner-id') || undefined,
    userId: request.headers.get('x-user-id') || undefined,
    partnerStatus: request.headers.get('x-partner-status') || undefined,
    isAdmin: request.headers.get('x-is-admin') === 'true',
    ipAddress,
    userAgent: request.headers.get('user-agent') || 'unknown',
    sessionId: request.cookies.get('session-id')?.value || 'unknown'
  };
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  supabase: any,
  context: Partial<PartnerSecurityContext>,
  event: {
    type: 'access_denied' | 'rate_limit_exceeded' | 'validation_failed' | 'suspicious_activity';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: Record<string, any>;
  }
) {
  try {
    // Log to partner audit system
    await supabase.rpc('log_partner_audit', {
      p_user_id: context.userId,
      p_partner_id: context.partnerId,
      p_admin_user_id: context.isAdmin ? context.userId : null,
      p_action: 'ACCESS_DENIED',
      p_table_name: 'security_events',
      p_record_id: null,
      p_old_values: null,
      p_new_values: {
        event_type: event.type,
        description: event.description,
        severity: event.severity,
        metadata: event.metadata
      },
      p_description: event.description,
      p_severity: event.severity.toUpperCase(),
      p_ip_address: context.ipAddress,
      p_user_agent: context.userAgent,
      p_access_granted: false,
      p_failure_reason: event.description
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// =====================================================
// MAIN SECURITY MIDDLEWARE FUNCTION
// =====================================================

/**
 * Main partner security middleware
 */
export async function partnerSecurityMiddleware(
  request: NextRequest,
  endpoint: string,
  validationSchema?: z.ZodSchema,
  securityLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<NextResponse | null> {
  const context = extractSecurityContext(request);
  
  // Rate limiting check
  const rateLimitResult = checkRateLimit(endpoint, context.ipAddress!, context.userId);
  if (!rateLimitResult.allowed) {
    // Log rate limit exceeded
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: () => {},
          remove: () => {}
        }
      }
    );
    
    await logSecurityEvent(supabase, context, {
      type: 'rate_limit_exceeded',
      description: `Rate limit exceeded for endpoint ${endpoint}`,
      severity: 'medium',
      metadata: { endpoint, remaining: rateLimitResult.remaining }
    });
    
    return createRateLimitResponse(endpoint, rateLimitResult.remaining, rateLimitResult.resetTime);
  }
  
  // Input validation if schema provided
  if (validationSchema && request.method !== 'GET') {
    try {
      const body = await request.json();
      const validationResult = validateAndSanitizeInput(body, validationSchema, securityLevel);
      
      if (!validationResult.isValid) {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get: (name: string) => request.cookies.get(name)?.value,
              set: () => {},
              remove: () => {}
            }
          }
        );
        
        await logSecurityEvent(supabase, context, {
          type: 'validation_failed',
          description: `Input validation failed for endpoint ${endpoint}`,
          severity: validationResult.securityLevel === 'critical' ? 'high' : 'medium',
          metadata: { endpoint, errors: validationResult.errors }
        });
        
        return NextResponse.json(
          { error: 'Invalid input data', details: validationResult.errors },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON data' },
        { status: 400 }
      );
    }
  }
  
  // Return null to continue processing
  return null;
}

// Export validation schemas for use in API routes
export {
  partnerRegistrationSchema,
  partnerProfileUpdateSchema,
  adminValidationSchema,
  propertyAccessSchema
};