import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { ErrorTracker } from '@/lib/monitoring/error-tracking';
import { UptimeMonitor } from '@/lib/monitoring/uptime';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    
    // Get error statistics
    const errorTracker = ErrorTracker.getInstance();
    const errorStats = errorTracker.getErrorStats(hours);
    
    // Get uptime statistics (if uptime monitoring is running)
    let uptimeStats = {};
    try {
      const uptimeMonitor = UptimeMonitor.getInstance();
      const currentStatus = uptimeMonitor.getCurrentStatus();
      
      uptimeStats = Object.entries(currentStatus).reduce((acc, [endpoint, status]) => {
        if (status) {
          const stats = uptimeMonitor.getUptimeStats(endpoint, hours);
          acc[endpoint] = {
            status: status.status,
            responseTime: status.responseTime,
            uptime: stats.uptime,
            avgResponseTime: stats.avgResponseTime,
            totalChecks: stats.totalChecks,
          };
        }
        return acc;
      }, {} as Record<string, any>);
    } catch (error) {
      console.log('[Dashboard] Uptime monitoring not available:', error);
    }
    
    // Simulate Web Vitals data (in production, this would come from your analytics database)
    const webVitals = [
      { 
        name: 'LCP', 
        value: Math.random() * 2000 + 800, 
        rating: Math.random() > 0.8 ? 'needs-improvement' : 'good',
        threshold: { good: 2500, poor: 4000 }
      },
      { 
        name: 'FID', 
        value: Math.random() * 80 + 20, 
        rating: Math.random() > 0.9 ? 'needs-improvement' : 'good',
        threshold: { good: 100, poor: 300 }
      },
      { 
        name: 'CLS', 
        value: Math.random() * 0.1, 
        rating: Math.random() > 0.85 ? 'needs-improvement' : 'good',
        threshold: { good: 0.1, poor: 0.25 }
      },
      { 
        name: 'FCP', 
        value: Math.random() * 1000 + 500, 
        rating: Math.random() > 0.8 ? 'needs-improvement' : 'good',
        threshold: { good: 1800, poor: 3000 }
      },
      { 
        name: 'TTFB', 
        value: Math.random() * 300 + 100, 
        rating: Math.random() > 0.9 ? 'needs-improvement' : 'good',
        threshold: { good: 800, poor: 1800 }
      },
    ];
    
    // Simulate analytics data (in production, this would come from your analytics database)
    const analytics = {
      totalSessions: Math.floor(Math.random() * 1000) + 1000,
      totalPageViews: Math.floor(Math.random() * 2000) + 3000,
      avgSessionDuration: Math.floor(Math.random() * 120000) + 120000, // 2-4 minutes
      bounceRate: Math.floor(Math.random() * 20) + 30, // 30-50%
      topPages: [
        { page: '/', views: Math.floor(Math.random() * 500) + 1000 },
        { page: '/services', views: Math.floor(Math.random() * 300) + 600 },
        { page: '/portfolio', views: Math.floor(Math.random() * 200) + 400 },
        { page: '/contact', views: Math.floor(Math.random() * 150) + 250 },
        { page: '/about', views: Math.floor(Math.random() * 100) + 150 },
      ],
      deviceBreakdown: {
        desktop: Math.floor(Math.random() * 20) + 50, // 50-70%
        mobile: Math.floor(Math.random() * 20) + 25,  // 25-45%
        tablet: Math.floor(Math.random() * 10) + 5,   // 5-15%
      },
    };
    
    // Calculate overall system health
    const totalErrors = errorStats.totalErrors;
    const criticalErrors = errorStats.errorsByLevel.error || 0;
    const avgUptime = Object.values(uptimeStats).length > 0 
      ? Object.values(uptimeStats).reduce((sum: number, stat: any) => sum + (stat.uptime || 100), 0) / Object.values(uptimeStats).length
      : 100;
    
    const systemHealth = {
      status: criticalErrors > 0 ? 'degraded' : avgUptime < 99 ? 'degraded' : 'healthy',
      uptime: avgUptime,
      errorRate: totalErrors > 0 ? (criticalErrors / totalErrors) * 100 : 0,
      avgResponseTime: Object.values(uptimeStats).length > 0
        ? Object.values(uptimeStats).reduce((sum: number, stat: any) => sum + (stat.avgResponseTime || 0), 0) / Object.values(uptimeStats).length
        : 0,
    };
    
    const dashboardData = {
      timestamp: Date.now(),
      systemHealth,
      webVitals,
      uptime: uptimeStats,
      errors: errorStats,
      analytics,
    };
    
    // Log dashboard access
    console.log('[Dashboard] Data requested', {
      hours,
      totalErrors: errorStats.totalErrors,
      uptimeEndpoints: Object.keys(uptimeStats).length,
    });
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    
    Sentry.captureException(error, {
      tags: {
        component: 'monitoring-dashboard-api',
      },
    });
    
    return NextResponse.json(
      { error: 'Failed to generate dashboard data' },
      { status: 500 }
    );
  }
}

// Health check endpoint for the dashboard itself
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}