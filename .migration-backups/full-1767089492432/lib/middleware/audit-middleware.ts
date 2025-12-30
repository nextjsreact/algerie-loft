import { NextRequest, NextResponse } from 'next/server'
import { reservationAuditService } from '@/lib/services/reservation-audit-service'
import { reservationMonitoringService } from '@/lib/monitoring/reservation-monitoring'
import { logger } from '@/lib/logger'

/**
 * Audit middleware for capturing reservation flow activities
 * Requirements: 10.1, 10.2, 10.4
 */

export interface AuditContext {
  user_id?: string
  session_id?: string
  ip_address?: string
  user_agent?: string
  request_id: string
  path: string
  method: string
  timestamp: string
}

export class AuditMiddleware {
  /**
   * Extract audit context from request
   */
  static extractAuditContext(request: NextRequest): AuditContext {
    const headers = request.headers
    const url = new URL(request.url)
    
    // Extract IP address (considering proxies)
    const ip_address = 
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headers.get('x-real-ip') ||
      headers.get('cf-connecting-ip') ||
      'unknown'

    // Extract user agent
    const user_agent = headers.get('user-agent') || 'unknown'

    // Extract session information (from cookies or headers)
    const session_id = 
      request.cookies.get('session_id')?.value ||
      headers.get('x-session-id') ||
      undefined

    // Extract user ID (from auth token or session)
    const user_id = 
      headers.get('x-user-id') ||
      request.cookies.get('user_id')?.value ||
      undefined

    // Generate request ID for tracing
    const request_id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      user_id,
      session_id,
      ip_address,
      user_agent,
      request_id,
      path: url.pathname,
      method: request.method,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Log API request for audit trail
   */
  static async logAPIRequest(
    context: AuditContext,
    body?: any,
    query?: Record<string, string>
  ): Promise<void> {
    try {
      // Log API access
      logger.api(`${context.method} ${context.path}`, context.method, context.path, {
        user_id: context.user_id,
        session_id: context.session_id,
        ip_address: context.ip_address,
        request_id: context.request_id,
        query_params: query,
        has_body: !!body
      })

      // Track in monitoring service
      reservationMonitoringService.trackUserBehavior(
        'api_request',
        context.user_id,
        context.session_id,
        {
          path: context.path,
          method: context.method,
          ip_address: context.ip_address,
          request_id: context.request_id
        }
      )

    } catch (error) {
      logger.error('Failed to log API request', error, { context })
    }
  }

  /**
   * Log API response for audit trail
   */
  static async logAPIResponse(
    context: AuditContext,
    statusCode: number,
    responseTime: number,
    error?: Error
  ): Promise<void> {
    try {
      const logData = {
        request_id: context.request_id,
        status_code: statusCode,
        response_time: responseTime,
        user_id: context.user_id,
        session_id: context.session_id,
        ip_address: context.ip_address,
        path: context.path,
        method: context.method
      }

      if (error) {
        logger.error(`API Error: ${context.method} ${context.path}`, error, logData)
        
        // Track error in monitoring service
        reservationMonitoringService.trackReservationError(
          error,
          `api_${context.method.toLowerCase()}_${context.path.replace(/\//g, '_')}`,
          undefined,
          {
            user_id: context.user_id,
            session_id: context.session_id,
            ip_address: context.ip_address,
            user_agent: context.user_agent,
            step: 'api_response',
            additional_data: {
              status_code: statusCode,
              response_time: responseTime,
              path: context.path,
              method: context.method
            }
          }
        )
      } else {
        logger.info(`API Success: ${context.method} ${context.path}`, logData)
      }

    } catch (logError) {
      logger.error('Failed to log API response', logError, { context })
    }
  }

  /**
   * Detect and log suspicious request patterns
   */
  static async detectSuspiciousActivity(
    context: AuditContext,
    requestBody?: any
  ): Promise<boolean> {
    try {
      const suspiciousPatterns: string[] = []
      let riskScore = 0

      // Check for SQL injection attempts
      const sqlPatterns = [
        /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b|\bUPDATE\b)/i,
        /(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/i,
        /(\'|\")(\s*;\s*|\s*--|\s*\/\*)/i
      ]

      const requestString = JSON.stringify(requestBody || {}) + context.path
      
      for (const pattern of sqlPatterns) {
        if (pattern.test(requestString)) {
          suspiciousPatterns.push('sql_injection_attempt')
          riskScore += 50
          break
        }
      }

      // Check for XSS attempts
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
      ]

      for (const pattern of xssPatterns) {
        if (pattern.test(requestString)) {
          suspiciousPatterns.push('xss_attempt')
          riskScore += 40
          break
        }
      }

      // Check for unusual request frequency (rate limiting)
      if (context.user_id) {
        const recentRequests = await this.getRecentUserRequests(context.user_id)
        if (recentRequests > 100) { // More than 100 requests in last 5 minutes
          suspiciousPatterns.push('excessive_requests')
          riskScore += 30
        }
      }

      // Check for suspicious IP patterns
      if (await this.isKnownMaliciousIP(context.ip_address)) {
        suspiciousPatterns.push('malicious_ip')
        riskScore += 60
      }

      // Check for bot-like behavior
      if (this.detectBotBehavior(context.user_agent)) {
        suspiciousPatterns.push('bot_behavior')
        riskScore += 20
      }

      // Log security event if suspicious activity detected
      if (suspiciousPatterns.length > 0 && riskScore > 30) {
        await reservationAuditService.logSecurityEvent(
          `security_${context.request_id}`,
          {
            event_type: 'suspicious_activity',
            severity: riskScore > 60 ? 'high' : riskScore > 40 ? 'medium' : 'low',
            user_id: context.user_id,
            ip_address: context.ip_address,
            user_agent: context.user_agent,
            details: {
              patterns: suspiciousPatterns,
              risk_score: riskScore,
              path: context.path,
              method: context.method,
              request_body: requestBody ? 'present' : 'none'
            },
            timestamp: context.timestamp
          },
          {
            user_id: context.user_id,
            session_id: context.session_id,
            ip_address: context.ip_address,
            user_agent: context.user_agent
          }
        )

        return riskScore > 60 // Return true if high risk (should block request)
      }

      return false

    } catch (error) {
      logger.error('Error detecting suspicious activity', error, { context })
      return false
    }
  }

  /**
   * Validate request data and log validation failures
   */
  static async validateAndLogRequest(
    context: AuditContext,
    validationRules: Record<string, any>,
    requestData: any
  ): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const errors: string[] = []

      // Basic validation (extend as needed)
      for (const [field, rules] of Object.entries(validationRules)) {
        const value = requestData[field]

        if (rules.required && (!value || value === '')) {
          errors.push(`${field} is required`)
        }

        if (rules.type && value && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`)
        }

        if (rules.maxLength && value && value.length > rules.maxLength) {
          errors.push(`${field} exceeds maximum length of ${rules.maxLength}`)
        }

        if (rules.pattern && value && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`)
        }
      }

      // Log validation failures
      if (errors.length > 0) {
        logger.warn('Request validation failed', {
          request_id: context.request_id,
          path: context.path,
          method: context.method,
          user_id: context.user_id,
          errors,
          field_count: Object.keys(validationRules).length
        })

        // Track validation errors
        reservationMonitoringService.trackReservationError(
          `Validation failed: ${errors.join(', ')}`,
          'request_validation',
          undefined,
          {
            user_id: context.user_id,
            session_id: context.session_id,
            ip_address: context.ip_address,
            user_agent: context.user_agent,
            step: 'validation',
            additional_data: {
              errors,
              path: context.path,
              method: context.method
            }
          }
        )
      }

      return {
        isValid: errors.length === 0,
        errors
      }

    } catch (error) {
      logger.error('Error validating request', error, { context })
      return {
        isValid: false,
        errors: ['Validation system error']
      }
    }
  }

  /**
   * Create audit middleware function for Next.js
   */
  static createMiddleware() {
    return async (request: NextRequest) => {
      const startTime = Date.now()
      const context = this.extractAuditContext(request)

      try {
        // Extract request body if present
        let requestBody: any = null
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          try {
            const clonedRequest = request.clone()
            requestBody = await clonedRequest.json()
          } catch {
            // Body might not be JSON or might be empty
          }
        }

        // Extract query parameters
        const url = new URL(request.url)
        const query = Object.fromEntries(url.searchParams.entries())

        // Log the request
        await this.logAPIRequest(context, requestBody, query)

        // Check for suspicious activity
        const isSuspicious = await this.detectSuspiciousActivity(context, requestBody)
        
        if (isSuspicious) {
          logger.warn('Blocking suspicious request', { context })
          return new NextResponse('Request blocked due to suspicious activity', { 
            status: 403,
            headers: {
              'X-Request-ID': context.request_id
            }
          })
        }

        // Add audit context to request headers for downstream use
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-audit-context', JSON.stringify(context))
        requestHeaders.set('x-request-id', context.request_id)

        // Continue with the request
        const response = NextResponse.next({
          request: {
            headers: requestHeaders
          }
        })

        // Add request ID to response headers
        response.headers.set('X-Request-ID', context.request_id)

        // Log the response
        const responseTime = Date.now() - startTime
        await this.logAPIResponse(context, response.status, responseTime)

        return response

      } catch (error) {
        const responseTime = Date.now() - startTime
        await this.logAPIResponse(context, 500, responseTime, error as Error)
        
        logger.error('Audit middleware error', error, { context })
        
        // Don't block the request due to audit errors
        return NextResponse.next()
      }
    }
  }

  /**
   * Private helper methods
   */

  private static async getRecentUserRequests(userId: string): Promise<number> {
    // This would typically query a cache or database
    // For now, return a mock value
    return 0
  }

  private static async isKnownMaliciousIP(ipAddress: string): Promise<boolean> {
    // This would typically check against a threat intelligence database
    // For now, return false
    return false
  }

  private static detectBotBehavior(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i
    ]

    return botPatterns.some(pattern => pattern.test(userAgent))
  }
}

/**
 * Utility function to get audit context from request headers
 */
export function getAuditContextFromHeaders(headers: Headers): AuditContext | null {
  try {
    const contextHeader = headers.get('x-audit-context')
    if (contextHeader) {
      return JSON.parse(contextHeader)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Utility function to create audit context for server-side operations
 */
export function createServerAuditContext(
  userId?: string,
  operation?: string
): AuditContext {
  return {
    user_id: userId,
    session_id: `server_${Date.now()}`,
    ip_address: 'server',
    user_agent: 'server',
    request_id: `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    path: operation || 'server_operation',
    method: 'SERVER',
    timestamp: new Date().toISOString()
  }
}

export default AuditMiddleware