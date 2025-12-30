/**
 * Performance metrics API endpoint
 * Provides access to system performance data for monitoring dashboards
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth';
import { getPerformanceReport } from '@/lib/performance';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication for performance metrics
    const session = await requireAuthAPI();
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has admin or manager role
    const userRole = session.user?.role;
    if (!['admin', 'manager', 'executive'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '1h';
    const includeDetails = searchParams.get('details') === 'true';

    // Convert time range to milliseconds
    const timeRangeMs = parseTimeRange(timeRange);
    
    // Get comprehensive performance report
    const report = getPerformanceReport();
    
    // Add time range specific stats
    const stats = globalPerformanceMonitor.getStats(timeRangeMs);
    
    const response = {
      timestamp: Date.now(),
      timeRange,
      overview: {
        totalRequests: stats.totalRequests,
        averageResponseTime: Math.round(stats.averageResponseTime),
        p95ResponseTime: Math.round(stats.p95ResponseTime),
        errorRate: Math.round(stats.errorRate * 100) / 100,
        cacheHitRate: Math.round((report.cache.stats.hitRate || 0) * 100) / 100
      },
      performance: {
        slowestRoutes: stats.slowestRoutes.slice(0, 10),
        requestsByRole: stats.requestsByRole,
        dbPerformance: stats.dbPerformance
      },
      system: report.monitoring.systemHealth,
      cache: {
        totalEntries: report.cache.stats.totalEntries,
        hitRate: report.cache.stats.hitRate,
        memoryUsage: Math.round(report.cache.stats.memoryUsage / 1024 / 1024 * 100) / 100 // MB
      },
      alerts: {
        active: report.alerts.activeAlerts.length,
        last24h: report.alerts.stats.alertsLast24h,
        severityBreakdown: report.alerts.stats.severityBreakdown
      }
    };

    // Include detailed data if requested
    if (includeDetails) {
      (response as any).details = {
        queryMetrics: report.queries.metrics,
        alertHistory: report.alerts.recentHistory,
        activeAlerts: report.alerts.activeAlerts
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * Parse time range string to milliseconds
 */
function parseTimeRange(timeRange: string): number {
  const unit = timeRange.slice(-1);
  const value = parseInt(timeRange.slice(0, -1));
  
  switch (unit) {
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 60 * 60 * 1000; // Default to 1 hour
  }
}

// Import the global performance monitor
import { globalPerformanceMonitor } from '@/lib/performance';