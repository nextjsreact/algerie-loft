/**
 * Performance Monitoring API Endpoint
 * Provides access to performance metrics and health status
 * Requirements: 1.7, 1.9 from reservation data consistency fix spec
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { loftCacheService } from '@/lib/services/loft-cache-service';
// Import services with error handling
let systemHealthMonitor: any = null;
let reservationPerformanceMonitor: any = null;
let reservationMonitoringService: any = null;
let getPerformanceServicesStatus: any = null;

try {
  systemHealthMonitor = require('@/lib/services/system-health-monitor').systemHealthMonitor;
} catch (e) {
  console.warn('System health monitor not available:', e.message);
}

try {
  reservationPerformanceMonitor = require('@/lib/services/reservation-performance-monitor').reservationPerformanceMonitor;
} catch (e) {
  console.warn('Performance monitor not available:', e.message);
}

try {
  reservationMonitoringService = require('@/lib/monitoring/reservation-monitoring').reservationMonitoringService;
} catch (e) {
  console.warn('Reservation monitoring not available:', e.message);
}

try {
  getPerformanceServicesStatus = require('@/lib/services/performance-initialization').getPerformanceServicesStatus;
} catch (e) {
  console.warn('Performance services status not available:', e.message);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const timeRange = searchParams.get('timeRange') || '1h';

    logger.info('Performance monitoring API request', { type, timeRange });

    switch (type) {
      case 'overview':
        return await getOverview(timeRange);
      
      case 'health':
        return await getHealthStatus();
      
      case 'cache':
        return await getCacheMetrics();
      
      case 'performance':
        return await getPerformanceMetrics(timeRange);
      
      case 'reservations':
        return await getReservationMetrics(timeRange);
      
      case 'services':
        return await getServicesStatus();
      
      case 'report':
        return await getComprehensiveReport(timeRange);
      
      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Performance monitoring API error', { error });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get overview of all performance metrics
 */
async function getOverview(timeRange: string) {
  try {
    const [healthStatus, cacheStats, perfStats, reservationMetrics] = await Promise.allSettled([
      systemHealthMonitor.getHealthStatus(),
      Promise.resolve(loftCacheService.getCacheStats()),
      Promise.resolve(reservationPerformanceMonitor.getRealTimeStats()),
      reservationMonitoringService.getReservationMetrics(timeRange as any)
    ]);

    const overview = {
      timestamp: new Date().toISOString(),
      timeRange,
      systemHealth: {
        status: healthStatus.status === 'fulfilled' ? healthStatus.value.status : 'unknown',
        uptime: healthStatus.status === 'fulfilled' ? healthStatus.value.uptime : 0,
        alertCount: healthStatus.status === 'fulfilled' ? healthStatus.value.alerts.length : 0
      },
      cache: {
        hitRate: cacheStats.status === 'fulfilled' ? cacheStats.value.metrics.hitRate : 0,
        totalRequests: cacheStats.status === 'fulfilled' ? cacheStats.value.metrics.totalRequests : 0,
        averageResponseTime: cacheStats.status === 'fulfilled' ? cacheStats.value.metrics.averageResponseTime : 0
      },
      performance: {
        activeTimers: perfStats.status === 'fulfilled' ? perfStats.value.activeTimers : 0,
        recentOperations: perfStats.status === 'fulfilled' ? perfStats.value.recentOperations : 0,
        averageResponseTime: perfStats.status === 'fulfilled' ? perfStats.value.averageResponseTime : 0,
        errorRate: perfStats.status === 'fulfilled' ? perfStats.value.errorRate : 0
      },
      reservations: {
        totalReservations: reservationMetrics.status === 'fulfilled' ? reservationMetrics.value.total_reservations : 0,
        successfulReservations: reservationMetrics.status === 'fulfilled' ? reservationMetrics.value.successful_reservations : 0,
        conversionRate: reservationMetrics.status === 'fulfilled' ? reservationMetrics.value.conversion_rate : 0,
        errorRate: reservationMetrics.status === 'fulfilled' ? reservationMetrics.value.error_rate : 0
      }
    };

    return NextResponse.json(overview);
  } catch (error) {
    logger.error('Error getting performance overview', { error });
    throw error;
  }
}

/**
 * Get detailed health status
 */
async function getHealthStatus() {
  try {
    const healthStatus = await systemHealthMonitor.performHealthCheck();
    return NextResponse.json(healthStatus);
  } catch (error) {
    logger.error('Error getting health status', { error });
    throw error;
  }
}

/**
 * Get cache performance metrics
 */
async function getCacheMetrics() {
  try {
    const cacheStats = loftCacheService.getCacheStats();
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      cache: cacheStats
    });
  } catch (error) {
    logger.error('Error getting cache metrics', { error });
    throw error;
  }
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(timeRange: string) {
  try {
    const timeRangeMs = parseTimeRange(timeRange);
    const performanceReport = reservationPerformanceMonitor.getPerformanceReport(timeRangeMs);
    const realTimeStats = reservationPerformanceMonitor.getRealTimeStats();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeRange,
      realTime: realTimeStats,
      report: performanceReport
    });
  } catch (error) {
    logger.error('Error getting performance metrics', { error });
    throw error;
  }
}

/**
 * Get reservation system metrics
 */
async function getReservationMetrics(timeRange: string) {
  try {
    const reservationMetrics = await reservationMonitoringService.getReservationMetrics(timeRange as any);
    const performanceMetrics = reservationMonitoringService.getPerformanceMetrics();
    const behaviorMetrics = reservationMonitoringService.getUserBehaviorMetrics();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeRange,
      reservations: reservationMetrics,
      performance: performanceMetrics,
      behavior: behaviorMetrics
    });
  } catch (error) {
    logger.error('Error getting reservation metrics', { error });
    throw error;
  }
}

/**
 * Get services status
 */
async function getServicesStatus() {
  try {
    const servicesStatus = await getPerformanceServicesStatus();
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      services: servicesStatus
    });
  } catch (error) {
    logger.error('Error getting services status', { error });
    throw error;
  }
}

/**
 * Get comprehensive monitoring report
 */
async function getComprehensiveReport(timeRange: string) {
  try {
    const [
      healthStatus,
      cacheStats,
      performanceReport,
      reservationMetrics,
      monitoringReport
    ] = await Promise.allSettled([
      systemHealthMonitor.performHealthCheck(),
      Promise.resolve(loftCacheService.getCacheStats()),
      Promise.resolve(reservationPerformanceMonitor.getPerformanceReport(parseTimeRange(timeRange))),
      reservationMonitoringService.getReservationMetrics(timeRange as any),
      reservationMonitoringService.generateMonitoringReport(timeRange as any)
    ]);

    const report = {
      timestamp: new Date().toISOString(),
      timeRange,
      summary: {
        systemStatus: healthStatus.status === 'fulfilled' ? healthStatus.value.status : 'unknown',
        totalIssues: healthStatus.status === 'fulfilled' ? healthStatus.value.alerts.length : 0,
        cacheHitRate: cacheStats.status === 'fulfilled' ? cacheStats.value.metrics.hitRate : 0,
        averageResponseTime: performanceReport.status === 'fulfilled' ? performanceReport.value.averageResponseTime : 0,
        errorRate: reservationMetrics.status === 'fulfilled' ? reservationMetrics.value.error_rate : 0,
        conversionRate: reservationMetrics.status === 'fulfilled' ? reservationMetrics.value.conversion_rate : 0
      },
      details: {
        health: healthStatus.status === 'fulfilled' ? healthStatus.value : null,
        cache: cacheStats.status === 'fulfilled' ? cacheStats.value : null,
        performance: performanceReport.status === 'fulfilled' ? performanceReport.value : null,
        reservations: reservationMetrics.status === 'fulfilled' ? reservationMetrics.value : null,
        monitoring: monitoringReport.status === 'fulfilled' ? monitoringReport.value : null
      },
      recommendations: [
        ...(healthStatus.status === 'fulfilled' ? healthStatus.value.recommendations : []),
        ...(performanceReport.status === 'fulfilled' ? performanceReport.value.recommendations : []),
        ...(monitoringReport.status === 'fulfilled' ? monitoringReport.value.recommendations : [])
      ]
    };

    return NextResponse.json(report);
  } catch (error) {
    logger.error('Error generating comprehensive report', { error });
    throw error;
  }
}

/**
 * Helper function to parse time range string to milliseconds
 */
function parseTimeRange(timeRange: string): number {
  switch (timeRange) {
    case '5m':
      return 5 * 60 * 1000;
    case '15m':
      return 15 * 60 * 1000;
    case '30m':
      return 30 * 60 * 1000;
    case '1h':
      return 60 * 60 * 1000;
    case '6h':
      return 6 * 60 * 60 * 1000;
    case '12h':
      return 12 * 60 * 60 * 1000;
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 60 * 60 * 1000; // Default to 1 hour
  }
}

/**
 * POST endpoint for manual operations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    logger.info('Performance monitoring API action', { action, params });

    switch (action) {
      case 'clearCache':
        loftCacheService.invalidateAllCache();
        return NextResponse.json({ success: true, message: 'Cache cleared' });
      
      case 'clearMetrics':
        reservationPerformanceMonitor.clearMetrics();
        return NextResponse.json({ success: true, message: 'Performance metrics cleared' });
      
      case 'runHealthCheck':
        const healthStatus = await systemHealthMonitor.performHealthCheck();
        return NextResponse.json({ success: true, health: healthStatus });
      
      case 'warmUpCache':
        const loftIds = params.loftIds || ['test-loft-1', 'test-loft-2', 'test-loft-3'];
        await loftCacheService.warmUpCache(loftIds);
        return NextResponse.json({ success: true, message: `Cache warmed up for ${loftIds.length} lofts` });
      
      case 'resolveAlert':
        const alertId = params.alertId;
        if (!alertId) {
          return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
        }
        const resolved = systemHealthMonitor.resolveAlert(alertId);
        return NextResponse.json({ success: resolved, message: resolved ? 'Alert resolved' : 'Alert not found' });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Performance monitoring API action error', { error });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}