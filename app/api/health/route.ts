import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    // Enhanced health check with monitoring integration
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'healthy', // À implémenter avec une vraie vérification Supabase
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        monitoring: {
          sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
          analytics: !!process.env.NEXT_PUBLIC_GA_ID,
          vercelAnalytics: true,
        },
      },
    };

    // Add breadcrumb for health check
    Sentry.addBreadcrumb({
      category: 'health-check',
      message: 'Health check performed',
      level: 'info',
      data: {
        uptime: healthCheck.uptime,
        memoryUsed: healthCheck.checks.memory.used,
      },
    });

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    Sentry.captureException(error, {
      tags: {
        component: 'health-check',
      },
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// HEAD request for simple uptime checks
export async function HEAD() {
  try {
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}