/**
 * Error tracking utilities for routing and validation issues
 * Provides specialized logging functions for different error scenarios
 * in the transaction routing system.
 */

import { logger } from '@/lib/logger';
import { 
  getErrorLoggingConfig, 
  isErrorLoggingEnabled, 
  getErrorSeverity,
  errorCodes,
  performanceThresholds
} from '@/lib/config/error-logging';

/**
 * Interface for routing error context
 */
export interface RoutingErrorContext {
  route: string;
  requestedPath?: string;
  userId?: string;
  userRole?: string;
  sessionId?: string;
  userAgent?: string;
  referer?: string;
  timestamp?: string;
}

/**
 * Interface for validation error context
 */
export interface ValidationErrorContext {
  validationFunction: string;
  inputValue: any;
  inputType: string;
  errorCode: string;
  expectedFormat?: string;
}

/**
 * Interface for 404 error context
 */
export interface NotFoundErrorContext {
  resourceType: 'transaction' | 'page' | 'api_endpoint';
  resourceId?: string;
  searchAttempted?: boolean;
  suggestedActions?: string[];
}

/**
 * Tracks UUID validation failures with comprehensive context
 */
export function trackValidationError(
  message: string,
  validationContext: ValidationErrorContext,
  routingContext?: Partial<RoutingErrorContext>
) {
  if (!isErrorLoggingEnabled('validation')) return;
  
  const severity = getErrorSeverity(validationContext.errorCode.toLowerCase());
  
  logger.warn(`Validation Error: ${message}`, {
    category: 'validation_error',
    severity,
    errorCode: errorCodes.VALIDATION_INVALID_UUID,
    ...validationContext,
    ...routingContext,
    timestamp: new Date().toISOString()
  });
}

/**
 * Tracks routing resolution issues
 */
export function trackRoutingIssue(
  message: string,
  issueType: 'invalid_format' | 'route_conflict' | 'parameter_missing' | 'authentication_failed',
  routingContext: RoutingErrorContext,
  additionalContext?: Record<string, any>
) {
  if (!isErrorLoggingEnabled('routing')) return;
  
  const severity = getErrorSeverity(issueType);
  
  logger.error(`Routing Issue: ${message}`, null, {
    category: 'routing_issue',
    severity,
    issueType,
    errorCode: errorCodes.ROUTING_CONFLICT,
    ...routingContext,
    ...additionalContext,
    timestamp: new Date().toISOString()
  });
}

/**
 * Tracks 404 scenarios with detailed context
 */
export function track404Error(
  message: string,
  notFoundContext: NotFoundErrorContext,
  routingContext?: Partial<RoutingErrorContext>,
  userContext?: { userId?: string; userRole?: string }
) {
  logger.warn(`404 Error: ${message}`, {
    category: '404_error',
    ...notFoundContext,
    ...routingContext,
    ...userContext,
    timestamp: new Date().toISOString(),
    severity: 'medium'
  });
}

/**
 * Tracks successful route resolutions for monitoring
 */
export function trackSuccessfulRouting(
  route: string,
  routingContext: Partial<RoutingErrorContext>,
  performanceMetrics?: { loadTime?: number; dbQueryTime?: number }
) {
  logger.info(`Successful routing: ${route}`, {
    category: 'routing_success',
    route,
    ...routingContext,
    ...performanceMetrics,
    timestamp: new Date().toISOString()
  });
}

/**
 * Tracks authentication-related routing issues
 */
export function trackAuthenticationError(
  message: string,
  authContext: {
    requiredRoles: string[];
    userRole?: string;
    userId?: string;
    route: string;
  }
) {
  logger.warn(`Authentication Error: ${message}`, {
    category: 'authentication_error',
    ...authContext,
    timestamp: new Date().toISOString(),
    severity: 'high'
  });
}

/**
 * Tracks database-related errors during routing
 */
export function trackDatabaseError(
  message: string,
  error: Error | unknown,
  dbContext: {
    operation: string;
    resourceType: string;
    resourceId?: string;
    userId?: string;
    route: string;
  }
) {
  logger.error(`Database Error during routing: ${message}`, error, {
    category: 'database_error',
    ...dbContext,
    timestamp: new Date().toISOString(),
    severity: 'high'
  });
}

/**
 * Tracks performance issues during routing
 */
export function trackPerformanceIssue(
  message: string,
  performanceContext: {
    route: string;
    operation: string;
    duration: number;
    threshold?: number;
    userId?: string;
  }
) {
  if (!isErrorLoggingEnabled('performance')) return;
  
  const threshold = performanceContext.threshold || 
    performanceThresholds.routes[performanceContext.route as keyof typeof performanceThresholds.routes] || 
    performanceThresholds.api.acceptable;
  
  const severity = performanceContext.duration > threshold * 2 ? 'high' : 'medium';
  
  logger.warn(`Performance Issue: ${message}`, {
    category: 'performance_issue',
    severity,
    errorCode: errorCodes.PERF_SLOW_RESPONSE,
    threshold,
    ...performanceContext,
    timestamp: new Date().toISOString()
  });
}

/**
 * Utility function to extract request context from headers (for API routes)
 */
export function extractRequestContext(request?: Request): Partial<RoutingErrorContext> {
  if (!request) return {};
  
  return {
    userAgent: request.headers.get('user-agent') || undefined,
    referer: request.headers.get('referer') || undefined,
    requestedPath: request.url
  };
}

/**
 * Utility function to create routing context from Next.js params
 */
export function createRoutingContext(
  route: string,
  params?: Record<string, any>,
  searchParams?: Record<string, any>
): RoutingErrorContext {
  return {
    route,
    timestamp: new Date().toISOString(),
    requestedPath: params ? `${route}?${new URLSearchParams(params).toString()}` : route
  };
}

/**
 * Error aggregation for monitoring dashboards
 */
export class ErrorAggregator {
  private static instance: ErrorAggregator;
  private errorCounts: Map<string, number> = new Map();
  private lastReset: Date = new Date();

  static getInstance(): ErrorAggregator {
    if (!ErrorAggregator.instance) {
      ErrorAggregator.instance = new ErrorAggregator();
    }
    return ErrorAggregator.instance;
  }

  incrementError(errorType: string, category: string) {
    const key = `${category}:${errorType}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    
    // Log aggregated stats every hour
    const hoursSinceReset = (Date.now() - this.lastReset.getTime()) / (1000 * 60 * 60);
    if (hoursSinceReset >= 1) {
      this.logAggregatedStats();
      this.reset();
    }
  }

  private logAggregatedStats() {
    const stats = Object.fromEntries(this.errorCounts);
    logger.info('Hourly error aggregation stats', {
      category: 'error_aggregation',
      stats,
      timeWindow: '1_hour',
      timestamp: new Date().toISOString()
    });
  }

  private reset() {
    this.errorCounts.clear();
    this.lastReset = new Date();
  }

  getStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }
}

// Export singleton instance
export const errorAggregator = ErrorAggregator.getInstance();