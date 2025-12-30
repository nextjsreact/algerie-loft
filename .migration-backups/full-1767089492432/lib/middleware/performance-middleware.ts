/**
 * Performance monitoring middleware for Next.js API routes
 * Automatically tracks performance metrics for all API requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { globalPerformanceMonitor } from '@/lib/performance';
import { logger } from '@/lib/logger';

export interface PerformanceMiddlewareOptions {
  excludePaths?: string[];
  includeUserInfo?: boolean;
  trackDbQueries?: boolean;
  logSlowRequests?: boolean;
  slowRequestThreshold?: number;
}

/**
 * Create performance monitoring middleware
 */
export function createPerformanceMiddleware(options: PerformanceMiddlewareOptions = {}) {
  const {
    excludePaths = ['/api/health', '/api/performance/metrics'],
    includeUserInfo = true,
    trackDbQueries = true,
    logSlowRequests = true,
    slowRequestThreshold = 2000
  } = options;

  return async function performanceMiddleware(
    request: NextRequest,
    response: NextResponse
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const route = new URL(request.url).pathname;
    const method = request.method;

    // Skip monitoring for excluded paths
    if (excludePaths.some(path => route.startsWith(path))) {
      return response;
    }

    // Extract user information if available
    let userRole: string | undefined;
    let userId: string | undefined;

    if (includeUserInfo) {
      try {
        // This would be enhanced to extract actual user info from the request
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
          // Parse user info from token or session
          // This is a placeholder - actual implementation would decode JWT or session
        }
      } catch (error) {
        // Ignore auth parsing errors for performance monitoring
      }
    }

    // Track database query time (placeholder)
    let dbQueryTime: number | undefined;
    if (trackDbQueries) {
      // This would be enhanced to track actual database query times
      // Could be done by wrapping Supabase client methods
    }

    try {
      // Process the request (this would be the actual API handler)
      const responseTime = Date.now() - startTime;
      const statusCode = response.status;

      // Record performance metrics
      globalPerformanceMonitor.recordMetrics({
        timestamp: Date.now(),
        route,
        method,
        responseTime,
        statusCode,
        userRole,
        userId,
        dbQueryTime
      });

      // Log slow requests
      if (logSlowRequests && responseTime > slowRequestThreshold) {
        logger.warn('Slow API request detected', {
          route,
          method,
          responseTime,
          statusCode,
          userRole,
          threshold: slowRequestThreshold
        });
      }

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record error metrics
      globalPerformanceMonitor.recordMetrics({
        timestamp: Date.now(),
        route,
        method,
        responseTime,
        statusCode: 500,
        userRole,
        userId,
        errorCount: 1
      });

      logger.error('API request failed', {
        route,
        method,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        userRole
      });

      throw error;
    }
  };
}

/**
 * Wrapper function to apply performance monitoring to API handlers
 */
export function withPerformanceTracking<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  routeName?: string
) {
  return async function(...args: T): Promise<R> {
    const startTime = Date.now();
    const route = routeName || 'unknown';

    try {
      const result = await handler(...args);
      const responseTime = Date.now() - startTime;

      // Record successful operation
      globalPerformanceMonitor.recordMetrics({
        timestamp: Date.now(),
        route,
        method: 'FUNCTION',
        responseTime,
        statusCode: 200
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Record failed operation
      globalPerformanceMonitor.recordMetrics({
        timestamp: Date.now(),
        route,
        method: 'FUNCTION',
        responseTime,
        statusCode: 500,
        errorCount: 1
      });

      throw error;
    }
  };
}

/**
 * Database query performance tracker
 */
export class DatabaseQueryTracker {
  private static queryTimes: Map<string, number> = new Map();

  static startQuery(queryId: string): void {
    this.queryTimes.set(queryId, Date.now());
  }

  static endQuery(queryId: string, queryType: string = 'unknown'): number {
    const startTime = this.queryTimes.get(queryId);
    if (!startTime) return 0;

    const queryTime = Date.now() - startTime;
    this.queryTimes.delete(queryId);

    // Log slow queries
    if (queryTime > 1000) {
      logger.warn('Slow database query detected', {
        queryId,
        queryType,
        queryTime
      });
    }

    return queryTime;
  }

  static trackQuery<T>(
    queryFn: () => Promise<T>,
    queryType: string = 'unknown'
  ): Promise<T> {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.startQuery(queryId);
    
    return queryFn().finally(() => {
      this.endQuery(queryId, queryType);
    });
  }
}

/**
 * Enhanced Supabase client wrapper with performance tracking
 */
export function createTrackedSupabaseClient(supabaseClient: any) {
  return new Proxy(supabaseClient, {
    get(target, prop) {
      const originalMethod = target[prop];
      
      if (typeof originalMethod === 'function' && prop === 'from') {
        return function(tableName: string) {
          const tableClient = originalMethod.call(target, tableName);
          
          return new Proxy(tableClient, {
            get(tableTarget, tableProp) {
              const tableMethod = tableTarget[tableProp];
              
              if (typeof tableMethod === 'function' && 
                  ['select', 'insert', 'update', 'delete', 'upsert'].includes(tableProp as string)) {
                
                return function(...args: any[]) {
                  const queryId = `${tableName}_${tableProp}_${Date.now()}`;
                  DatabaseQueryTracker.startQuery(queryId);
                  
                  const result = tableMethod.apply(tableTarget, args);
                  
                  // If it's a promise (which Supabase queries are), track completion
                  if (result && typeof result.then === 'function') {
                    return result.finally(() => {
                      DatabaseQueryTracker.endQuery(queryId, `${tableName}.${tableProp as string}`);
                    });
                  }
                  
                  return result;
                };
              }
              
              return tableMethod;
            }
          });
        };
      }
      
      return originalMethod;
    }
  });
}

/**
 * Performance monitoring configuration
 */
export const performanceConfig = {
  // Routes that should be excluded from monitoring
  excludedRoutes: [
    '/api/health',
    '/api/performance/metrics',
    '/api/performance/alerts',
    '/_next/static',
    '/favicon.ico'
  ],
  
  // Thresholds for performance alerts
  thresholds: {
    slowRequest: 2000, // 2 seconds
    slowQuery: 1000,   // 1 second
    highErrorRate: 5,  // 5%
    highMemoryUsage: 80 // 80%
  },
  
  // Sampling configuration
  sampling: {
    enabled: process.env.NODE_ENV === 'production',
    rate: 0.1 // Sample 10% of requests in production
  }
};

/**
 * Initialize performance monitoring system
 */
export function initializePerformanceMonitoring(): void {
  // Setup global error handlers
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    
    globalPerformanceMonitor.recordMetrics({
      timestamp: Date.now(),
      route: 'system',
      method: 'ERROR',
      responseTime: 0,
      statusCode: 500,
      errorCount: 1
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', { reason, promise });
    
    globalPerformanceMonitor.recordMetrics({
      timestamp: Date.now(),
      route: 'system',
      method: 'ERROR',
      responseTime: 0,
      statusCode: 500,
      errorCount: 1
    });
  });

  logger.info('Performance monitoring initialized');
}