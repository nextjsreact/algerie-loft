/**
 * Performance monitoring system for multi-role booking system
 * Tracks response times, database queries, and system health
 */

import { logger } from '@/lib/logger';
import { performanceThresholds } from '@/lib/config/error-logging';

export interface PerformanceMetrics {
  timestamp: number;
  route: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userRole?: string;
  userId?: string;
  dbQueryTime?: number;
  cacheHitRate?: number;
  memoryUsage?: number;
  errorCount?: number;
}

export interface SystemHealthMetrics {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  responseTimeP95: number;
  errorRate: number;
  cacheHitRate: number;
}

export interface AlertThresholds {
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  dbQueryTime: number;
}

/**
 * Performance metrics collector
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private systemMetrics: SystemHealthMetrics[] = [];
  private maxMetricsHistory = 10000;
  private alertThresholds: AlertThresholds;
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  constructor(thresholds?: Partial<AlertThresholds>) {
    this.alertThresholds = {
      responseTime: thresholds?.responseTime || 5000,
      errorRate: thresholds?.errorRate || 5,
      memoryUsage: thresholds?.memoryUsage || 80,
      dbQueryTime: thresholds?.dbQueryTime || 2000
    };

    // Collect system metrics every minute
    setInterval(() => this.collectSystemMetrics(), 60000);
    
    // Clean old metrics every hour
    setInterval(() => this.cleanOldMetrics(), 3600000);
  }

  /**
   * Record performance metrics for a request
   */
  recordMetrics(metrics: PerformanceMetrics): void {
    metrics.timestamp = Date.now();
    this.metrics.push(metrics);

    // Check for alerts
    this.checkAlerts(metrics);

    // Trim metrics if too many
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log slow requests
    if (metrics.responseTime > this.alertThresholds.responseTime) {
      logger.warn('Slow request detected', {
        route: metrics.route,
        responseTime: metrics.responseTime,
        userRole: metrics.userRole,
        dbQueryTime: metrics.dbQueryTime
      });
    }
  }

  /**
   * Get performance statistics for a time period
   */
  getStats(timeRangeMs: number = 3600000): PerformanceStats {
    const cutoff = Date.now() - timeRangeMs;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        errorRate: 0,
        slowestRoutes: [],
        requestsByRole: {},
        dbPerformance: { averageQueryTime: 0, slowQueries: 0 }
      };
    }

    const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b);
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;

    // Group by route for slowest routes analysis
    const routeStats = new Map<string, { count: number; totalTime: number; errors: number }>();
    recentMetrics.forEach(m => {
      const key = `${m.method} ${m.route}`;
      const stats = routeStats.get(key) || { count: 0, totalTime: 0, errors: 0 };
      stats.count++;
      stats.totalTime += m.responseTime;
      if (m.statusCode >= 400) stats.errors++;
      routeStats.set(key, stats);
    });

    const slowestRoutes = Array.from(routeStats.entries())
      .map(([route, stats]) => ({
        route,
        averageTime: stats.totalTime / stats.count,
        requestCount: stats.count,
        errorRate: (stats.errors / stats.count) * 100
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    // Group by user role
    const requestsByRole = recentMetrics.reduce((acc, m) => {
      if (m.userRole) {
        acc[m.userRole] = (acc[m.userRole] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Database performance
    const dbMetrics = recentMetrics.filter(m => m.dbQueryTime);
    const avgDbQueryTime = dbMetrics.length > 0 
      ? dbMetrics.reduce((sum, m) => sum + (m.dbQueryTime || 0), 0) / dbMetrics.length 
      : 0;
    const slowQueries = dbMetrics.filter(m => (m.dbQueryTime || 0) > 1000).length;

    return {
      totalRequests: recentMetrics.length,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[p95Index] || 0,
      errorRate: (errorCount / recentMetrics.length) * 100,
      slowestRoutes,
      requestsByRole,
      dbPerformance: {
        averageQueryTime: avgDbQueryTime,
        slowQueries
      }
    };
  }

  /**
   * Get system health metrics
   */
  getSystemHealth(): SystemHealthMetrics | null {
    return this.systemMetrics[this.systemMetrics.length - 1] || null;
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = [];

    // Response time alert
    if (metrics.responseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'slow_response',
        severity: 'warning',
        message: `Slow response time: ${metrics.responseTime}ms on ${metrics.route}`,
        metrics,
        timestamp: Date.now()
      });
    }

    // Database query time alert
    if (metrics.dbQueryTime && metrics.dbQueryTime > this.alertThresholds.dbQueryTime) {
      alerts.push({
        type: 'slow_query',
        severity: 'warning',
        message: `Slow database query: ${metrics.dbQueryTime}ms on ${metrics.route}`,
        metrics,
        timestamp: Date.now()
      });
    }

    // Error alert
    if (metrics.statusCode >= 500) {
      alerts.push({
        type: 'server_error',
        severity: 'error',
        message: `Server error ${metrics.statusCode} on ${metrics.route}`,
        metrics,
        timestamp: Date.now()
      });
    }

    // Trigger alert callbacks
    alerts.forEach(alert => {
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          logger.error('Alert callback failed', { error, alert });
        }
      });
    });
  }

  /**
   * Collect system-level metrics
   */
  private collectSystemMetrics(): void {
    try {
      const memUsage = process.memoryUsage();
      const recentMetrics = this.metrics.filter(m => m.timestamp > Date.now() - 300000); // Last 5 minutes
      
      const systemMetrics: SystemHealthMetrics = {
        timestamp: Date.now(),
        cpuUsage: 0, // Would be implemented with actual CPU monitoring
        memoryUsage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
        activeConnections: 0, // Would be implemented with connection monitoring
        responseTimeP95: this.calculateP95(recentMetrics.map(m => m.responseTime)),
        errorRate: recentMetrics.length > 0 
          ? (recentMetrics.filter(m => m.statusCode >= 400).length / recentMetrics.length) * 100 
          : 0,
        cacheHitRate: this.calculateCacheHitRate(recentMetrics)
      };

      this.systemMetrics.push(systemMetrics);

      // Keep only last 24 hours of system metrics
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoff);

      // Check system-level alerts
      this.checkSystemAlerts(systemMetrics);
    } catch (error) {
      logger.error('Failed to collect system metrics', { error });
    }
  }

  /**
   * Check for system-level alerts
   */
  private checkSystemAlerts(metrics: SystemHealthMetrics): void {
    const alerts: PerformanceAlert[] = [];

    if (metrics.memoryUsage > this.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'high_memory',
        severity: 'warning',
        message: `High memory usage: ${metrics.memoryUsage.toFixed(1)}%`,
        systemMetrics: metrics,
        timestamp: Date.now()
      });
    }

    if (metrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push({
        type: 'high_error_rate',
        severity: 'error',
        message: `High error rate: ${metrics.errorRate.toFixed(1)}%`,
        systemMetrics: metrics,
        timestamp: Date.now()
      });
    }

    alerts.forEach(alert => {
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          logger.error('System alert callback failed', { error, alert });
        }
      });
    });
  }

  /**
   * Calculate 95th percentile
   */
  private calculateP95(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = values.sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] || 0;
  }

  /**
   * Calculate cache hit rate from metrics
   */
  private calculateCacheHitRate(metrics: PerformanceMetrics[]): number {
    const metricsWithCache = metrics.filter(m => m.cacheHitRate !== undefined);
    if (metricsWithCache.length === 0) return 0;
    
    return metricsWithCache.reduce((sum, m) => sum + (m.cacheHitRate || 0), 0) / metricsWithCache.length;
  }

  /**
   * Clean old metrics to prevent memory leaks
   */
  private cleanOldMetrics(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    const initialCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    const cleaned = initialCount - this.metrics.length;
    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} old performance metrics`);
    }
  }
}

/**
 * Performance statistics interface
 */
export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  slowestRoutes: Array<{
    route: string;
    averageTime: number;
    requestCount: number;
    errorRate: number;
  }>;
  requestsByRole: Record<string, number>;
  dbPerformance: {
    averageQueryTime: number;
    slowQueries: number;
  };
}

/**
 * Performance alert interface
 */
export interface PerformanceAlert {
  type: 'slow_response' | 'slow_query' | 'server_error' | 'high_memory' | 'high_error_rate';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: number;
  metrics?: PerformanceMetrics;
  systemMetrics?: SystemHealthMetrics;
}

/**
 * Performance middleware for Next.js API routes
 */
export function withPerformanceMonitoring(monitor: PerformanceMonitor) {
  return function(handler: Function) {
    return async function(req: any, res: any, ...args: any[]) {
      const startTime = Date.now();
      const route = req.url || 'unknown';
      const method = req.method || 'GET';
      
      // Get user info if available
      const userRole = req.user?.role;
      const userId = req.user?.id;

      try {
        const result = await handler(req, res, ...args);
        
        // Record successful request metrics
        monitor.recordMetrics({
          timestamp: Date.now(),
          route,
          method,
          responseTime: Date.now() - startTime,
          statusCode: res.statusCode || 200,
          userRole,
          userId
        });

        return result;
      } catch (error) {
        // Record error metrics
        monitor.recordMetrics({
          timestamp: Date.now(),
          route,
          method,
          responseTime: Date.now() - startTime,
          statusCode: 500,
          userRole,
          userId,
          errorCount: 1
        });

        throw error;
      }
    };
  };
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor();

// Setup default alert handlers
globalPerformanceMonitor.onAlert((alert) => {
  logger.warn('Performance alert triggered', {
    type: alert.type,
    severity: alert.severity,
    message: alert.message,
    timestamp: alert.timestamp
  });
});

/**
 * Performance monitoring hook for React components
 */
export function usePerformanceMonitoring(componentName: string) {
  const recordRender = (renderTime: number) => {
    globalPerformanceMonitor.recordMetrics({
      timestamp: Date.now(),
      route: `component:${componentName}`,
      method: 'RENDER',
      responseTime: renderTime,
      statusCode: 200
    });
  };

  return { recordRender };
}