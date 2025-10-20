import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Basic health checks
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: await checkDatabase(),
        cms: await checkCMS(),
        email: await checkEmailService(),
        external: await checkExternalServices()
      }
    };

    const responseTime = Date.now() - startTime;
    
    // Determine overall health status
    const allChecksHealthy = Object.values(checks.checks).every(check => check.status === 'healthy');
    
    return NextResponse.json({
      ...checks,
      status: allChecksHealthy ? 'healthy' : 'degraded',
      responseTime: `${responseTime}ms`
    }, {
      status: allChecksHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 });
  }
}

async function checkDatabase(): Promise<{ status: string; message?: string }> {
  try {
    // If using a database, add connection check here
    // For now, return healthy since it's optional for the public website
    return { status: 'healthy' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : 'Database connection failed' 
    };
  }
}

async function checkCMS(): Promise<{ status: string; message?: string }> {
  try {
    if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
      return { status: 'not_configured' };
    }
    
    // Basic Sanity API check
    const response = await fetch(
      `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v1/ping`,
      { 
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SANITY_API_TOKEN}`
        }
      }
    );
    
    if (response.ok) {
      return { status: 'healthy' };
    } else {
      return { status: 'unhealthy', message: `CMS API returned ${response.status}` };
    }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : 'CMS connection failed' 
    };
  }
}

async function checkEmailService(): Promise<{ status: string; message?: string }> {
  try {
    if (!process.env.SMTP_HOST) {
      return { status: 'not_configured' };
    }
    
    // For production, you might want to add actual SMTP connection test
    return { status: 'healthy' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: error instanceof Error ? error.message : 'Email service check failed' 
    };
  }
}

async function checkExternalServices(): Promise<{ status: string; services?: any }> {
  const services = {
    analytics: process.env.NEXT_PUBLIC_GA_ID ? 'configured' : 'not_configured',
    sentry: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'not_configured',
    recaptcha: process.env.RECAPTCHA_SITE_KEY ? 'configured' : 'not_configured'
  };
  
  return { status: 'healthy', services };
}