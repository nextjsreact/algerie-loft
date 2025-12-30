import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@/lib/mocks/sentry';

interface PageEngagement {
  page: string;
  timeOnPage: number;
  scrollDepth: number;
  interactions: number;
  bounced: boolean;
}

interface EngagementRequest {
  sessionId: string;
  engagement: PageEngagement;
}

export async function POST(request: NextRequest) {
  try {
    // Parse JSON with error handling for empty body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    
    const { sessionId, engagement }: EngagementRequest = body;
    
    // Validate the engagement data
    if (!sessionId || !engagement || !engagement.page || typeof engagement.timeOnPage !== 'number') {
      return NextResponse.json(
        { error: 'Invalid engagement data' },
        { status: 400 }
      );
    }
    
    // Log the engagement for monitoring
    console.log(`[Analytics Engagement] ${engagement.page}`, {
      sessionId,
      timeOnPage: engagement.timeOnPage,
      scrollDepth: engagement.scrollDepth,
      interactions: engagement.interactions,
      bounced: engagement.bounced,
    });
    
    // Add breadcrumb to Sentry
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: `Page engagement: ${engagement.page}`,
      level: 'info',
      data: {
        sessionId,
        timeOnPage: engagement.timeOnPage,
        scrollDepth: engagement.scrollDepth,
        interactions: engagement.interactions,
        bounced: engagement.bounced,
      },
    });
    
    // Alert on concerning engagement patterns
    if (engagement.bounced && engagement.timeOnPage < 5000) {
      Sentry.captureMessage(`High bounce rate detected: ${engagement.page}`, {
        level: 'warning',
        tags: {
          engagement: 'high-bounce',
          page: engagement.page,
        },
        extra: {
          sessionId,
          engagement,
        },
      });
    }
    
    // Alert on very low scroll depth
    if (engagement.scrollDepth < 10 && engagement.timeOnPage > 10000) {
      Sentry.captureMessage(`Low scroll engagement: ${engagement.page}`, {
        level: 'info',
        tags: {
          engagement: 'low-scroll',
          page: engagement.page,
        },
        extra: {
          sessionId,
          engagement,
        },
      });
    }
    
    // Here you could store engagement data in a database
    // await storeEngagementInDatabase(sessionId, engagement);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing engagement data:', error);
    
    Sentry.captureException(error, {
      tags: {
        component: 'analytics-engagement-api',
      },
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Store engagement data in database
async function storeEngagementInDatabase(sessionId: string, engagement: PageEngagement) {
  // Implementation would depend on your database choice
  // Example with a hypothetical engagement table:
  /*
  await db.page_engagement.create({
    data: {
      session_id: sessionId,
      page: engagement.page,
      time_on_page: engagement.timeOnPage,
      scroll_depth: engagement.scrollDepth,
      interactions: engagement.interactions,
      bounced: engagement.bounced,
      timestamp: new Date(),
    },
  });
  */
}