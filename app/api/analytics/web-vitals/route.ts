import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@/lib/mocks/sentry';

interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON with error handling for empty body
    let metric: WebVitalMetric;
    try {
      metric = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    
    // Validate the metric data
    if (!metric.name || typeof metric.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }
    
    // Log the metric for monitoring
    console.log(`[Web Vitals] ${metric.name}: ${metric.value} (${metric.rating})`);
    
    // Send to Sentry as a custom metric
    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: `${metric.name}: ${metric.value}`,
      level: 'info',
      data: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        url: metric.url,
      },
    });
    
    // For poor ratings, create a performance issue
    if (metric.rating === 'poor') {
      Sentry.captureMessage(`Poor Web Vital: ${metric.name}`, {
        level: 'warning',
        tags: {
          metric: metric.name,
          rating: metric.rating,
        },
        extra: {
          value: metric.value,
          url: metric.url,
          userAgent: metric.userAgent,
        },
      });
    }
    
    // Here you could also store metrics in a database
    // await storeMetricInDatabase(metric);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    
    Sentry.captureException(error, {
      tags: {
        component: 'web-vitals-api',
      },
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Store metrics in database
async function storeMetricInDatabase(metric: WebVitalMetric) {
  // Implementation would depend on your database choice
  // Example with a hypothetical analytics table:
  /*
  await db.analytics.create({
    data: {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_rating: metric.rating,
      page_url: metric.url,
      user_agent: metric.userAgent,
      timestamp: new Date(metric.timestamp),
    },
  });
  */
}