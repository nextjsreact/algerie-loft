/**
 * Reservation Performance Monitoring Service
 * Collects and analyzes performance metrics for reservation operations
 * Requirements: 1.7, 1.9 from reservation data consistency fix spec
 */

import { logger } from '@/lib/logger';
import { loftCacheService } from './loft-cache-service';

export interface ReservationPerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  errorType?: string;
  context: {
    loftId?: string;
    userId?: string;
    sessionId?: string;
    guestCount?: number;
    dateRange?: string;
    cacheHit?: boolean;
    dbQueryTime?: number;
    validationTime?: number;
    pricingCalculationTime?: number;
  };
}

export interface PerformanceReport {
  timeRange: string;
  totalOperations: number;
  successRate: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  operationBreakdown: {
    [operation: string]: {
      count: number;
      averageTime: number;
      successRate: number;
      errorTypes: { [type: string]: number };
    };
  };
  slowestOperations: Array<{
    operation: string;
    duration: number;
    timestamp: number;
    context: any;
  }>;
  cachePerformance: {
    hitRate: number;
    averageHitTime: number;
    averageMissTime: number;
  };
  recommendations: string[];
}

export interface PerformanceThresholds {
  loftSearch: number;
  loftDetails: number;
  availabilityCheck: number;
  pricingCalculation: number;
  reservationCreation: number;
  reservationValidation: number;
  databaseQuery: number;
  cacheOperation: number;
}

/**
 * Performance monitoring service for reservation operations
 */
export class ReservationPerformanceMonitor {
  private metrics: ReservationPerformanceMetrics[] = [];
  private readonly MAX_METRICS = 10000;
  private readonly DEFAULT_THRESHOLDS: PerformanceThresholds = {
    loftSearch: 1000,           // 1 second
    loftDetails: 500,           // 500ms
    availabilityCheck: 800,     // 800ms
    pricingCalculation: 300,    // 300ms
    reservationCreation: 2000,  // 2 seconds
    reservationValidation: 200, // 200ms
    databaseQuery: 1000,        // 1 second
    cacheOperation: 50          // 50ms
  };

  private thresholds: PerformanceThresholds;
  private performanceTimers: Map<string, { startTime: number; context: any }> = new Map();

  constructor(customThresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.DEFAULT_THRESHOLDS, ...customThresholds };
    
    // Clean up old metrics periodically
    setInterval(() => this.cleanupOldMetrics(), 300000); // Every 5 minutes
  }

  /**
   * Start timing a reservation operation
   */
  startTiming(
    operation: string,
    context: ReservationPerformanceMetrics['context'] = {}
  ): string {
    const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.performanceTimers.set(timerId, {
      startTime: Date.now(),
      context
    });

    logger.debug(`[PERF] Started timing: ${operation}`, { timerId, context });
    return timerId;
  }

  /**
   * End timing and record performance metric
   */
  endTiming(
    timerId: string,
    operation: string,
    success: boolean = true,
    errorType?: string,
    additionalContext: any = {}
  ): number {
    const timer = this.performanceTimers.get(timerId);
    if (!timer) {
      logger.warn(`[PERF] Timer not found: ${timerId}`);
      return 0;
    }

    const duration = Date.now() - timer.startTime;
    this.performanceTimers.delete(timerId);

    // Record the metric
    const metric: ReservationPerformanceMetrics = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      errorType,
      context: {
        ...timer.context,
        ...additionalContext
      }
    };

    this.recordMetric(metric);

    // Check for performance issues
    this.checkPerformanceThreshold(operation, duration, metric);

    logger.debug(`[PERF] Completed: ${operation}`, {
      timerId,
      duration,
      success,
      errorType
    });

    return duration;
  }

  /**
   * Record a performance metric directly
   */
  recordMetric(metric: ReservationPerformanceMetrics): void {
    this.metrics.push(metric);

    // Trim metrics if we have too many
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow operations
    const threshold = this.getThresholdForOperation(metric.operation);
    if (metric.duration > threshold) {
      logger.warn(`[PERF] Slow operation detected`, {
        operation: metric.operation,
        duration: metric.duration,
        threshold,
        context: metric.context
      });
    }
  }

  /**
   * Record loft search performance
   */
  async measureLoftSearch<T>(
    searchFn: () => Promise<T>,
    context: { searchOptions?: any; userId?: string; sessionId?: string } = {}
  ): Promise<T> {
    const timerId = this.startTiming('loft_search', context);
    let cacheHit = false;
    let dbQueryTime = 0;

    try {
      const startDbTime = Date.now();
      const result = await searchFn();
      dbQueryTime = Date.now() - startDbTime;

      // Check if this was a cache hit (simplified detection)
      cacheHit = dbQueryTime < 50; // Assume cache hit if very fast

      this.endTiming(timerId, 'loft_search', true, undefined, {
        cacheHit,
        dbQueryTime,
        resultCount: Array.isArray(result) ? result.length : 1
      });

      return result;
    } catch (error) {
      this.endTiming(timerId, 'loft_search', false, error instanceof Error ? error.name : 'UnknownError', {
        cacheHit,
        dbQueryTime
      });
      throw error;
    }
  }

  /**
   * Record loft details fetch performance
   */
  async measureLoftDetails<T>(
    loftId: string,
    fetchFn: () => Promise<T>,
    context: { userId?: string; sessionId?: string } = {}
  ): Promise<T> {
    const timerId = this.startTiming('loft_details', { loftId, ...context });

    try {
      const result = await fetchFn();
      this.endTiming(timerId, 'loft_details', true, undefined, {
        loftFound: !!result
      });
      return result;
    } catch (error) {
      this.endTiming(timerId, 'loft_details', false, error instanceof Error ? error.name : 'UnknownError');
      throw error;
    }
  }

  /**
   * Record availability check performance
   */
  async measureAvailabilityCheck<T>(
    loftId: string,
    checkIn: string,
    checkOut: string,
    checkFn: () => Promise<T>,
    context: { userId?: string; sessionId?: string } = {}
  ): Promise<T> {
    const timerId = this.startTiming('availability_check', {
      loftId,
      dateRange: `${checkIn}_${checkOut}`,
      ...context
    });

    try {
      const result = await checkFn();
      this.endTiming(timerId, 'availability_check', true, undefined, {
        available: !!result
      });
      return result;
    } catch (error) {
      this.endTiming(timerId, 'availability_check', false, error instanceof Error ? error.name : 'UnknownError');
      throw error;
    }
  }

  /**
   * Record pricing calculation performance
   */
  async measurePricingCalculation<T>(
    loftId: string,
    guests: number,
    dateRange: string,
    calculateFn: () => Promise<T>,
    context: { userId?: string; sessionId?: string } = {}
  ): Promise<T> {
    const timerId = this.startTiming('pricing_calculation', {
      loftId,
      guestCount: guests,
      dateRange,
      ...context
    });

    try {
      const result = await calculateFn();
      this.endTiming(timerId, 'pricing_calculation', true, undefined, {
        pricingCompleted: !!result
      });
      return result;
    } catch (error) {
      this.endTiming(timerId, 'pricing_calculation', false, error instanceof Error ? error.name : 'UnknownError');
      throw error;
    }
  }

  /**
   * Record reservation creation performance
   */
  async measureReservationCreation<T>(
    loftId: string,
    createFn: () => Promise<T>,
    context: { userId?: string; sessionId?: string; guestCount?: number } = {}
  ): Promise<T> {
    const timerId = this.startTiming('reservation_creation', { loftId, ...context });
    let validationTime = 0;
    let dbQueryTime = 0;

    try {
      const validationStart = Date.now();
      // Validation would happen in createFn
      const result = await createFn();
      const totalTime = Date.now() - validationStart;
      
      // Estimate validation vs DB time (simplified)
      validationTime = Math.min(totalTime * 0.3, 500);
      dbQueryTime = totalTime - validationTime;

      this.endTiming(timerId, 'reservation_creation', true, undefined, {
        validationTime,
        dbQueryTime,
        reservationCreated: !!result
      });

      return result;
    } catch (error) {
      this.endTiming(timerId, 'reservation_creation', false, error instanceof Error ? error.name : 'UnknownError', {
        validationTime,
        dbQueryTime
      });
      throw error;
    }
  }

  /**
   * Record database query performance
   */
  async measureDatabaseQuery<T>(
    queryType: string,
    queryFn: () => Promise<T>,
    context: { table?: string; operation?: string } = {}
  ): Promise<T> {
    const timerId = this.startTiming('database_query', { queryType, ...context });

    try {
      const result = await queryFn();
      this.endTiming(timerId, 'database_query', true, undefined, {
        queryType,
        resultSize: Array.isArray(result) ? result.length : 1
      });
      return result;
    } catch (error) {
      this.endTiming(timerId, 'database_query', false, error instanceof Error ? error.name : 'UnknownError', {
        queryType
      });
      throw error;
    }
  }

  /**
   * Get performance report for a time range
   */
  getPerformanceReport(timeRangeMs: number = 3600000): PerformanceReport {
    const cutoff = Date.now() - timeRangeMs;
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return this.getEmptyReport(timeRangeMs);
    }

    // Calculate overall statistics
    const totalOperations = recentMetrics.length;
    const successfulOperations = recentMetrics.filter(m => m.success).length;
    const successRate = (successfulOperations / totalOperations) * 100;

    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const averageResponseTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const p95ResponseTime = durations[Math.floor(durations.length * 0.95)] || 0;
    const p99ResponseTime = durations[Math.floor(durations.length * 0.99)] || 0;

    // Operation breakdown
    const operationBreakdown = this.calculateOperationBreakdown(recentMetrics);

    // Slowest operations
    const slowestOperations = recentMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(m => ({
        operation: m.operation,
        duration: m.duration,
        timestamp: m.timestamp,
        context: m.context
      }));

    // Cache performance
    const cachePerformance = this.calculateCachePerformance(recentMetrics);

    // Generate recommendations
    const recommendations = this.generateRecommendations(recentMetrics, operationBreakdown);

    return {
      timeRange: this.formatTimeRange(timeRangeMs),
      totalOperations,
      successRate,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      operationBreakdown,
      slowestOperations,
      cachePerformance,
      recommendations
    };
  }

  /**
   * Get real-time performance statistics
   */
  getRealTimeStats(): {
    activeTimers: number;
    recentOperations: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  } {
    const recentMetrics = this.metrics.filter(m => m.timestamp > Date.now() - 300000); // Last 5 minutes
    
    const totalRecent = recentMetrics.length;
    const errors = recentMetrics.filter(m => !m.success).length;
    const cacheHits = recentMetrics.filter(m => m.context.cacheHit).length;
    
    return {
      activeTimers: this.performanceTimers.size,
      recentOperations: totalRecent,
      averageResponseTime: totalRecent > 0 
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRecent 
        : 0,
      errorRate: totalRecent > 0 ? (errors / totalRecent) * 100 : 0,
      cacheHitRate: totalRecent > 0 ? (cacheHits / totalRecent) * 100 : 0
    };
  }

  /**
   * Clear all metrics and timers
   */
  clearMetrics(): void {
    this.metrics = [];
    this.performanceTimers.clear();
    logger.info('[PERF] All metrics cleared');
  }

  /**
   * Private helper methods
   */

  private getThresholdForOperation(operation: string): number {
    switch (operation) {
      case 'loft_search': return this.thresholds.loftSearch;
      case 'loft_details': return this.thresholds.loftDetails;
      case 'availability_check': return this.thresholds.availabilityCheck;
      case 'pricing_calculation': return this.thresholds.pricingCalculation;
      case 'reservation_creation': return this.thresholds.reservationCreation;
      case 'reservation_validation': return this.thresholds.reservationValidation;
      case 'database_query': return this.thresholds.databaseQuery;
      case 'cache_operation': return this.thresholds.cacheOperation;
      default: return 1000; // Default 1 second
    }
  }

  private checkPerformanceThreshold(
    operation: string,
    duration: number,
    metric: ReservationPerformanceMetrics
  ): void {
    const threshold = this.getThresholdForOperation(operation);
    
    if (duration > threshold * 2) {
      // Critical performance issue
      logger.error(`[PERF] Critical performance issue`, {
        operation,
        duration,
        threshold,
        context: metric.context
      });
    } else if (duration > threshold) {
      // Performance warning
      logger.warn(`[PERF] Performance warning`, {
        operation,
        duration,
        threshold,
        context: metric.context
      });
    }
  }

  private calculateOperationBreakdown(metrics: ReservationPerformanceMetrics[]): any {
    const breakdown: any = {};

    metrics.forEach(metric => {
      if (!breakdown[metric.operation]) {
        breakdown[metric.operation] = {
          count: 0,
          totalTime: 0,
          successCount: 0,
          errorTypes: {}
        };
      }

      const op = breakdown[metric.operation];
      op.count++;
      op.totalTime += metric.duration;
      
      if (metric.success) {
        op.successCount++;
      } else if (metric.errorType) {
        op.errorTypes[metric.errorType] = (op.errorTypes[metric.errorType] || 0) + 1;
      }
    });

    // Calculate averages and rates
    Object.keys(breakdown).forEach(operation => {
      const op = breakdown[operation];
      op.averageTime = op.totalTime / op.count;
      op.successRate = (op.successCount / op.count) * 100;
      delete op.totalTime;
      delete op.successCount;
    });

    return breakdown;
  }

  private calculateCachePerformance(metrics: ReservationPerformanceMetrics[]): any {
    const cacheMetrics = metrics.filter(m => m.context.cacheHit !== undefined);
    
    if (cacheMetrics.length === 0) {
      return { hitRate: 0, averageHitTime: 0, averageMissTime: 0 };
    }

    const hits = cacheMetrics.filter(m => m.context.cacheHit);
    const misses = cacheMetrics.filter(m => !m.context.cacheHit);

    return {
      hitRate: (hits.length / cacheMetrics.length) * 100,
      averageHitTime: hits.length > 0 
        ? hits.reduce((sum, m) => sum + m.duration, 0) / hits.length 
        : 0,
      averageMissTime: misses.length > 0 
        ? misses.reduce((sum, m) => sum + m.duration, 0) / misses.length 
        : 0
    };
  }

  private generateRecommendations(
    metrics: ReservationPerformanceMetrics[],
    operationBreakdown: any
  ): string[] {
    const recommendations: string[] = [];

    // Check for slow operations
    Object.entries(operationBreakdown).forEach(([operation, stats]: [string, any]) => {
      const threshold = this.getThresholdForOperation(operation);
      
      if (stats.averageTime > threshold * 1.5) {
        recommendations.push(`Optimize ${operation} - average time ${stats.averageTime}ms exceeds threshold`);
      }
      
      if (stats.successRate < 95) {
        recommendations.push(`Improve ${operation} reliability - success rate is ${stats.successRate.toFixed(1)}%`);
      }
    });

    // Check cache performance
    const cachePerf = this.calculateCachePerformance(metrics);
    if (cachePerf.hitRate < 70) {
      recommendations.push(`Improve cache hit rate - currently ${cachePerf.hitRate.toFixed(1)}%`);
    }

    // Check for database performance
    const dbMetrics = metrics.filter(m => m.operation === 'database_query');
    if (dbMetrics.length > 0) {
      const avgDbTime = dbMetrics.reduce((sum, m) => sum + m.duration, 0) / dbMetrics.length;
      if (avgDbTime > this.thresholds.databaseQuery) {
        recommendations.push(`Optimize database queries - average time ${avgDbTime}ms`);
      }
    }

    return recommendations;
  }

  private getEmptyReport(timeRangeMs: number): PerformanceReport {
    return {
      timeRange: this.formatTimeRange(timeRangeMs),
      totalOperations: 0,
      successRate: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      operationBreakdown: {},
      slowestOperations: [],
      cachePerformance: { hitRate: 0, averageHitTime: 0, averageMissTime: 0 },
      recommendations: []
    };
  }

  private formatTimeRange(ms: number): string {
    const hours = ms / (1000 * 60 * 60);
    if (hours < 1) {
      return `${Math.round(ms / (1000 * 60))} minutes`;
    } else if (hours < 24) {
      return `${Math.round(hours)} hours`;
    } else {
      return `${Math.round(hours / 24)} days`;
    }
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    const initialCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    const cleaned = initialCount - this.metrics.length;
    if (cleaned > 0) {
      logger.info(`[PERF] Cleaned up ${cleaned} old performance metrics`);
    }

    // Clean up stale timers (older than 10 minutes)
    const timerCutoff = Date.now() - 10 * 60 * 1000;
    for (const [timerId, timer] of this.performanceTimers.entries()) {
      if (timer.startTime < timerCutoff) {
        this.performanceTimers.delete(timerId);
        logger.warn(`[PERF] Cleaned up stale timer: ${timerId}`);
      }
    }
  }
}

// Export singleton instance
export const reservationPerformanceMonitor = new ReservationPerformanceMonitor();