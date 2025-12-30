/**
 * Security utilities and helpers for easy integration of security middleware
 * Provides convenient functions and decorators for securing API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurity, SecurityPresets, SecurityMiddlewareConfig } from './security-middleware';
import { logger } from '@/lib/logger';

/**
 * Security decorator for class-based API handlers
 */
export function Secure(config: SecurityMiddlewareConfig = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = withSecurity(method, config);
    
    return descriptor;
  };
}

/**
 * Quick security wrapper for simple endpoints
 */
export function quickSecure(
  handler: (request: NextRequest) => Promise<NextResponse>,
  preset: keyof typeof SecurityPresets = 'api',
  schema?: z.ZodSchema
) {
  return withSecurity(
    async (request, context) => handler(request),
    SecurityPresets[preset](schema)
  );
}

/**
 * Create a secure API route with automatic error handling
 */
export function createSecureRoute(config: {
  GET?: (request: NextRequest, context: any) => Promise<NextResponse>;
  POST?: (request: NextRequest, context: any) => Promise<NextResponse>;
  PUT?: (request: NextRequest, context: any) => Promise<NextResponse>;
  DELETE?: (request: NextRequest, context: any) => Promise<NextResponse>;
  PATCH?: (request: NextRequest, context: any) => Promise<NextResponse>;
  security?: SecurityMiddlewareConfig;
}) {
  const securityConfig = config.security || SecurityPresets.api();
  
  const handlers: Record<string, any> = {};
  
  if (config.GET) {
    handlers.GET = withSecurity(config.GET, {
      ...securityConfig,
      allowedMethods: ['GET']
    });
  }
  
  if (config.POST) {
    handlers.POST = withSecurity(config.POST, {
      ...securityConfig,
      allowedMethods: ['POST']
    });
  }
  
  if (config.PUT) {
    handlers.PUT = withSecurity(config.PUT, {
      ...securityConfig,
      allowedMethods: ['PUT']
    });
  }
  
  if (config.DELETE) {
    handlers.DELETE = withSecurity(config.DELETE, {
      ...securityConfig,
      allowedMethods: ['DELETE']
    });
  }
  
  if (config.PATCH) {
    handlers.PATCH = withSecurity(config.PATCH, {
      ...securityConfig,
      allowedMethods: ['PATCH']
    });
  }
  
  return handlers;
}

/**
 * Validation schemas for common use cases
 */
export const CommonSchemas = {
  // User authentication
  login: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1).max(128),
    rememberMe: z.boolean().optional()
  }),
  
  register: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(8).max(128)
      .regex(/^(?=.*[a-z])/, 'Must contain lowercase letter')
      .regex(/^(?=.*[A-Z])/, 'Must contain uppercase letter')
      .regex(/^(?=.*\d)/, 'Must contain number'),
    full_name: z.string().min(2).max(100).trim(),
    terms_accepted: z.boolean().refine(val => val === true)
  }),
  
  // Contact forms
  contact: z.object({
    name: z.string().min(2).max(100).trim(),
    email: z.string().email().toLowerCase().trim(),
    subject: z.string().min(5).max(200).trim(),
    message: z.string().min(10).max(2000).trim(),
    phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/).optional()
  }),
  
  // File upload
  fileUpload: z.object({
    file: z.instanceof(File),
    category: z.enum(['image', 'document', 'video']).optional(),
    description: z.string().max(500).optional()
  }),
  
  // Search/pagination
  search: z.object({
    q: z.string().max(100).optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
    sort: z.string().max(50).optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  }),
  
  // ID validation
  uuid: z.object({
    id: z.string().uuid()
  }),
  
  // Date range
  dateRange: z.object({
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }).refine(data => new Date(data.end_date) > new Date(data.start_date), {
    message: 'End date must be after start date'
  })
};

/**
 * Security middleware presets for common scenarios
 */
export const SecurityScenarios = {
  // Public API (no auth required)
  publicApi: (schema?: z.ZodSchema): SecurityMiddlewareConfig => ({
    rateLimitEndpoint: 'apiGeneral',
    enableCsrf: false,
    validationSchema: schema,
    enableSuspiciousActivityDetection: true,
    enableHeaderValidation: true,
    maxRequestSize: 1024 * 1024, // 1MB
    allowedMethods: ['GET', 'POST']
  }),
  
  // User dashboard endpoints
  userDashboard: (schema?: z.ZodSchema): SecurityMiddlewareConfig => ({
    rateLimitEndpoint: 'apiGeneral',
    enableCsrf: true,
    validationSchema: schema,
    enableSuspiciousActivityDetection: true,
    enableHeaderValidation: true,
    requireAuth: true,
    allowedRoles: ['admin', 'manager', 'member', 'client'],
    maxRequestSize: 2 * 1024 * 1024 // 2MB
  }),
  
  // Admin-only endpoints
  adminOnly: (schema?: z.ZodSchema): SecurityMiddlewareConfig => ({
    rateLimitEndpoint: 'apiSensitive',
    enableCsrf: true,
    validationSchema: schema,
    enableSuspiciousActivityDetection: true,
    enableHeaderValidation: true,
    requireAuth: true,
    allowedRoles: ['admin'],
    maxRequestSize: 5 * 1024 * 1024 // 5MB
  }),
  
  // File upload endpoints
  fileUpload: (schema?: z.ZodSchema): SecurityMiddlewareConfig => ({
    rateLimitEndpoint: 'fileUpload',
    enableCsrf: true,
    validationSchema: schema,
    enableFileValidation: true,
    enableHeaderValidation: true,
    requireAuth: true,
    maxRequestSize: 50 * 1024 * 1024, // 50MB
    allowedMethods: ['POST']
  }),
  
  // Payment processing
  payment: (schema?: z.ZodSchema): SecurityMiddlewareConfig => ({
    rateLimitEndpoint: 'paymentProcess',
    enableCsrf: true,
    validationSchema: schema,
    enableSuspiciousActivityDetection: true,
    enableHeaderValidation: true,
    requireAuth: true,
    maxRequestSize: 1024 * 1024, // 1MB
    allowedMethods: ['POST']
  })
};

/**
 * Helper to create validation middleware for form data
 */
export function validateFormData(schema: z.ZodSchema) {
  return async (request: NextRequest): Promise<{
    isValid: boolean;
    data?: any;
    errors?: string[];
  }> => {
    try {
      const contentType = request.headers.get('content-type') || '';
      let data: any = {};
      
      if (contentType.includes('application/json')) {
        data = await request.json();
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        data = Object.fromEntries(formData.entries());
      } else {
        return {
          isValid: false,
          errors: ['Unsupported content type']
        };
      }
      
      const result = schema.safeParse(data);
      
      if (!result.success) {
        return {
          isValid: false,
          errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      
      return {
        isValid: true,
        data: result.data
      };
    } catch (error) {
      logger.error('Form validation error', error);
      return {
        isValid: false,
        errors: ['Invalid request format']
      };
    }
  };
}

/**
 * Helper to create CORS-enabled responses
 */
export function createCorsResponse(
  data: any,
  status: number = 200,
  allowedOrigins: string[] = ['*']
): NextResponse {
  const response = NextResponse.json(data, { status });
  
  response.headers.set('Access-Control-Allow-Origin', allowedOrigins.join(', '));
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

/**
 * Helper to handle OPTIONS requests for CORS
 */
export function handleCorsOptions(allowedOrigins: string[] = ['*']): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.join(', '),
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400' // 24 hours
    }
  });
}

/**
 * Security audit helper
 */
export async function auditSecurityEvent(
  eventType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>,
  request?: NextRequest
): Promise<void> {
  try {
    const supabase = await (await import('@/utils/supabase/server')).createClient();
    
    const clientIp = request ? getClientIp(request) : 'unknown';
    const userAgent = request?.headers.get('user-agent') || 'unknown';
    
    await supabase
      .from('security_events')
      .insert({
        event_type: eventType,
        severity,
        identifier: clientIp,
        endpoint: request?.url,
        method: request?.method,
        user_agent: userAgent,
        details,
        created_at: new Date().toISOString()
      });
      
    logger.warn('Security event recorded', {
      eventType,
      severity,
      details,
      clientIp,
      userAgent
    });
  } catch (error) {
    logger.error('Failed to audit security event', error);
  }
}

/**
 * Extract client IP from request
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
 * Rate limit helper for custom scenarios
 */
export async function checkCustomRateLimit(
  identifier: string,
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const { checkRateLimit } = await import('./rate-limiting');
    
    return await checkRateLimit(identifier, key as any, {
      windowMs,
      maxRequests
    });
  } catch (error) {
    logger.error('Custom rate limit check failed', error);
    return { allowed: true, remaining: maxRequests - 1, resetTime: Date.now() + windowMs };
  }
}

/**
 * Security headers helper
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}