/**
 * Comprehensive security middleware for API endpoints
 * Combines input validation, rate limiting, CSRF protection, and SQL injection prevention
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, isIdentifierBlocked, detectSuspiciousActivity } from './rate-limiting';
import { createCsrfMiddleware, getCsrfTokenFromCookie } from './csrf-protection';
import { 
  validateAndSanitizeObject, 
  validateRequestHeaders, 
  validateFileUpload,
  detectSecurityViolations,
  ValidationConfig 
} from './input-validation';
import { logger } from '@/lib/logger';
import { createAuditLog } from '@/lib/services/audit';

export interface SecurityMiddlewareConfig {
  // Rate limiting
  rateLimitEndpoint?: string;
  customRateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  
  // CSRF protection
  enableCsrf?: boolean;
  csrfConfig?: {
    cookieName?: string;
    headerName?: string;
    formFieldName?: string;
  };
  
  // Input validation
  validationSchema?: z.ZodSchema;
  validationConfig?: ValidationConfig;
  
  // Security features
  enableSuspiciousActivityDetection?: boolean;
  enableHeaderValidation?: boolean;
  enableFileValidation?: boolean;
  maxRequestSize?: number;
  
  // Allowed methods
  allowedMethods?: string[];
  
  // CORS
  allowedOrigins?: string[];
  
  // Authentication
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export interface SecurityContext {
  clientIp: string;
  userAgent: string;
  requestId: string;
  securityViolations: string[];
  sanitizedData?: any;
}

/**
 * Create comprehensive security middleware
 */
export function createSecurityMiddleware(config: SecurityMiddlewareConfig = {}) {
  return async (
    request: NextRequest,
    handler: (request: NextRequest, context: SecurityContext) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const securityViolations: string[] = [];

    try {
      // 1. Method validation
      if (config.allowedMethods && !config.allowedMethods.includes(request.method)) {
        return createSecurityErrorResponse(
          'Method not allowed',
          405,
          requestId,
          { method: request.method }
        );
      }

      // 2. Check if IP is blocked
      if (await isIdentifierBlocked(clientIp)) {
        logger.warn('Blocked IP attempted access', { clientIp, userAgent, requestId });
        return createSecurityErrorResponse('Access denied', 403, requestId);
      }

      // 3. Rate limiting
      if (config.rateLimitEndpoint) {
        const rateLimitResult = await checkRateLimit(
          clientIp, 
          config.rateLimitEndpoint as any,
          config.customRateLimit
        );
        
        if (!rateLimitResult.allowed) {
          return NextResponse.json(
            { 
              error: 'Too Many Requests',
              requestId,
              retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
            },
            { 
              status: 429,
              headers: {
                'X-RateLimit-Limit': String(rateLimitResult.totalHits),
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': String(Math.ceil(rateLimitResult.resetTime / 1000)),
                'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
                ...getSecurityHeaders(requestId)
              }
            }
          );
        }
      }

      // 4. Header validation
      if (config.enableHeaderValidation !== false) {
        const headerValidation = validateRequestHeaders(request.headers);
        if (!headerValidation.isValid && headerValidation.securityViolations) {
          securityViolations.push(...headerValidation.securityViolations);
          logger.warn('Header validation failed', {
            violations: headerValidation.securityViolations,
            clientIp,
            requestId
          });
        }
      }

      // 5. Request size validation
      if (config.maxRequestSize) {
        const contentLength = request.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > config.maxRequestSize) {
          return createSecurityErrorResponse(
            'Request too large',
            413,
            requestId,
            { size: contentLength, maxSize: config.maxRequestSize }
          );
        }
      }

      // 6. CORS validation
      if (config.allowedOrigins) {
        const origin = request.headers.get('origin');
        if (origin && !config.allowedOrigins.includes(origin) && !config.allowedOrigins.includes('*')) {
          return createSecurityErrorResponse(
            'Origin not allowed',
            403,
            requestId,
            { origin }
          );
        }
      }

      // 7. CSRF protection (for state-changing methods)
      if (config.enableCsrf && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        const csrfMiddleware = createCsrfMiddleware(config.csrfConfig);
        const csrfResult = await csrfMiddleware(request);
        if (csrfResult) {
          // CSRF validation failed
          securityViolations.push('CSRF token validation failed');
          return csrfResult;
        }
      }

      // 8. Input validation and sanitization
      let sanitizedData: any = undefined;
      if (config.validationSchema && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        try {
          const contentType = request.headers.get('content-type') || '';
          let requestData: any = {};

          if (contentType.includes('application/json')) {
            requestData = await request.json();
          } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData();
            requestData = Object.fromEntries(formData.entries());
          } else if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            requestData = {};
            
            for (const [key, value] of formData.entries()) {
              if (value instanceof File) {
                if (config.enableFileValidation !== false) {
                  const fileValidation = validateFileUpload(value);
                  if (!fileValidation.isValid && fileValidation.securityViolations) {
                    securityViolations.push(...fileValidation.securityViolations);
                  }
                }
                requestData[key] = value;
              } else {
                requestData[key] = value;
              }
            }
          }

          // Validate and sanitize the data
          const validation = validateAndSanitizeObject(
            requestData,
            config.validationSchema,
            config.validationConfig
          );

          if (!validation.isValid) {
            return createSecurityErrorResponse(
              'Validation failed',
              400,
              requestId,
              { 
                errors: validation.errors,
                securityViolations: validation.securityViolations
              }
            );
          }

          sanitizedData = validation.sanitizedData;
          
          if (validation.securityViolations) {
            securityViolations.push(...validation.securityViolations);
          }
        } catch (error) {
          logger.error('Input validation error', error, { requestId });
          return createSecurityErrorResponse(
            'Invalid request format',
            400,
            requestId
          );
        }
      }

      // 9. Suspicious activity detection
      if (config.enableSuspiciousActivityDetection) {
        const suspiciousActivity = await detectSuspiciousActivity(
          clientIp,
          'api_request',
          {
            endpoint: request.url,
            method: request.method,
            userAgent,
            securityViolations: securityViolations.length > 0 ? securityViolations : undefined
          }
        );

        if (suspiciousActivity.suspicious) {
          logger.warn('Suspicious activity detected', {
            clientIp,
            requestId,
            riskScore: suspiciousActivity.riskScore,
            reason: suspiciousActivity.reason,
            endpoint: request.url
          });

          // Block high-risk requests
          if (suspiciousActivity.riskScore >= 80) {
            return createSecurityErrorResponse(
              'Access denied due to suspicious activity',
              403,
              requestId,
              { riskScore: suspiciousActivity.riskScore }
            );
          }
        }
      }

      // 10. Create security context
      const securityContext: SecurityContext = {
        clientIp,
        userAgent,
        requestId,
        securityViolations,
        sanitizedData
      };

      // 11. Log security violations if any
      if (securityViolations.length > 0) {
        logger.warn('Security violations detected', {
          violations: securityViolations,
          clientIp,
          userAgent,
          requestId,
          endpoint: request.url,
          method: request.method
        });

        // Create audit log for security violations
        await createAuditLog(
          clientIp,
          'view',
          'security_violation',
          request.url,
          undefined,
          {
            violations: securityViolations,
            userAgent,
            method: request.method,
            requestId
          }
        );
      }

      // 12. Call the actual handler with security context
      const response = await handler(request, securityContext);

      // 13. Add security headers to response
      const securityHeaders = getSecurityHeaders(requestId);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // 14. Log successful request
      logger.info('API request processed', {
        method: request.method,
        url: request.url,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        clientIp,
        requestId,
        securityViolations: securityViolations.length > 0 ? securityViolations : undefined
      });

      return response;

    } catch (error) {
      logger.error('Security middleware error', error, {
        requestId,
        clientIp,
        endpoint: request.url,
        method: request.method
      });

      return createSecurityErrorResponse(
        'Internal server error',
        500,
        requestId
      );
    }
  };
}

/**
 * Get security headers for responses
 */
function getSecurityHeaders(requestId: string): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-Request-ID': requestId,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };
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
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create standardized security error response
 */
function createSecurityErrorResponse(
  message: string,
  status: number,
  requestId: string,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      requestId,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    },
    {
      status,
      headers: getSecurityHeaders(requestId)
    }
  );
}

/**
 * Wrapper function for easy API route protection
 */
export function withSecurity<T extends any[]>(
  handler: (request: NextRequest, context: SecurityContext, ...args: T) => Promise<NextResponse>,
  config: SecurityMiddlewareConfig = {}
) {
  const securityMiddleware = createSecurityMiddleware(config);
  
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    return securityMiddleware(request, async (req, context) => {
      return handler(req, context, ...args);
    });
  };
}

/**
 * Create security middleware for specific endpoint types
 */
export const SecurityPresets = {
  // Authentication endpoints (login, register, etc.)
  auth: (schema?: z.ZodSchema): SecurityMiddlewareConfig => ({
    rateLimitEndpoint: 'login',
    enableCsrf: true,
    validationSchema: schema,
    enableSuspiciousActivityDetection: true,
    enableHeaderValidation: true,
    allowedMethods: ['POST'],
    maxRequestSize: 1024 * 1024 // 1MB
  }),

  // Booking/reservation endpoints
  booking: (schema?: z.ZodSchema): SecurityMiddlewareConfig => ({
    rateLimitEndpoint: 'bookingCreate',
    enableCsrf: true,
    validationSchema: schema,
    enableSuspiciousActivityDetection: true,
    enableHeaderValidation: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    maxRequestSize: 2 * 1024 * 1024, // 2MB
    requireAuth: true
  }),

  // File upload endpoints
  upload: (schema?: z.ZodSchema): SecurityMiddlewareConfig => ({
    rateLimitEndpoint: 'fileUpload',
    enableCsrf: true,
    validationSchema: schema,
    enableFileValidation: true,
    enableHeaderValidation: true,
    allowedMethods: ['POST'],
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    requireAuth: true
  }),

  // General API endpoints
  api: (schema?: z.ZodSchema): SecurityMiddlewareConfig => ({
    rateLimitEndpoint: 'apiGeneral',
    enableCsrf: false, // Usually disabled for API endpoints using other auth methods
    validationSchema: schema,
    enableSuspiciousActivityDetection: true,
    enableHeaderValidation: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    maxRequestSize: 1024 * 1024 // 1MB
  }),

  // Public endpoints (no auth required)
  public: (schema?: z.ZodSchema): SecurityMiddlewareConfig => ({
    rateLimitEndpoint: 'apiGeneral',
    enableCsrf: false,
    validationSchema: schema,
    enableSuspiciousActivityDetection: true,
    enableHeaderValidation: true,
    maxRequestSize: 512 * 1024 // 512KB
  })
};