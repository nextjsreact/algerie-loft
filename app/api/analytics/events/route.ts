import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

interface UserEvent {
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  page: string;
  metadata?: Record<string, any>;
}

interface EventRequest {
  sessionId: string;
  event: UserEvent;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, event }: EventRequest = await request.json();
    
    // Validate the event data
    if (!sessionId || !event || !event.type || !event.category || !event.action) {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }
    
    // Log the event for monitoring
    console.log(`[Analytics Event] ${event.category}:${event.action}`, {
      sessionId,
      page: event.page,
      label: event.label,
      value: event.value,
    });
    
    // Add breadcrumb to Sentry for debugging
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: `User event: ${event.category}:${event.action}`,
      level: 'info',
      data: {
        sessionId,
        eventType: event.type,
        page: event.page,
        label: event.label,
        value: event.value,
      },
    });
    
    // Here you could store events in a database
    // await storeEventInDatabase(sessionId, event);
    
    // Send important events to Sentry for monitoring
    if (event.category === 'lead_generation' || event.category === 'form' || event.category === 'error') {
      Sentry.captureMessage(`Important user event: ${event.category}:${event.action}`, {
        level: 'info',
        tags: {
          event_category: event.category,
          event_action: event.action,
          page: event.page,
        },
        extra: {
          sessionId,
          event,
        },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing analytics event:', error);
    
    Sentry.captureException(error, {
      tags: {
        component: 'analytics-events-api',
      },
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Store events in database
async function storeEventInDatabase(sessionId: string, event: UserEvent) {
  // Implementation would depend on your database choice
  // Example with a hypothetical events table:
  /*
  await db.analytics_events.create({
    data: {
      session_id: sessionId,
      event_type: event.type,
      category: event.category,
      action: event.action,
      label: event.label,
      value: event.value,
      page: event.page,
      metadata: event.metadata,
      timestamp: new Date(event.timestamp),
    },
  });
  */
}