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

interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: UserEvent[];
  userAgent: string;
  referrer: string;
  locale: string;
}

export async function POST(request: NextRequest) {
  try {
    const session: UserSession = await request.json();
    
    // Validate the session data
    if (!session.sessionId || !session.startTime || !Array.isArray(session.events)) {
      return NextResponse.json(
        { error: 'Invalid session data' },
        { status: 400 }
      );
    }
    
    // Calculate session metrics
    const sessionDuration = session.lastActivity - session.startTime;
    const uniquePages = new Set(session.events.map(e => e.page)).size;
    const totalInteractions = session.events.filter(e => e.category === 'interaction').length;
    const formSubmissions = session.events.filter(e => e.action === 'form_submit').length;
    const leadEvents = session.events.filter(e => e.category === 'lead_generation').length;
    
    // Log the session summary
    console.log(`[Analytics Session] ${session.sessionId}`, {
      duration: sessionDuration,
      pageViews: session.pageViews,
      uniquePages,
      totalInteractions,
      formSubmissions,
      leadEvents,
      locale: session.locale,
    });
    
    // Add comprehensive breadcrumb to Sentry
    Sentry.addBreadcrumb({
      category: 'analytics',
      message: `Session completed: ${session.sessionId}`,
      level: 'info',
      data: {
        sessionId: session.sessionId,
        duration: sessionDuration,
        pageViews: session.pageViews,
        uniquePages,
        totalInteractions,
        formSubmissions,
        leadEvents,
        locale: session.locale,
        referrer: session.referrer,
      },
    });
    
    // Alert on high-value sessions (potential leads)
    if (leadEvents > 0 || formSubmissions > 0) {
      Sentry.captureMessage(`High-value session detected: ${session.sessionId}`, {
        level: 'info',
        tags: {
          session_type: 'high-value',
          lead_events: leadEvents.toString(),
          form_submissions: formSubmissions.toString(),
        },
        extra: {
          sessionId: session.sessionId,
          duration: sessionDuration,
          pageViews: session.pageViews,
          leadEvents,
          formSubmissions,
          referrer: session.referrer,
        },
      });
    }
    
    // Alert on very short sessions (potential issues)
    if (sessionDuration < 10000 && session.pageViews === 1 && totalInteractions === 0) {
      Sentry.captureMessage(`Potential bounce session: ${session.sessionId}`, {
        level: 'info',
        tags: {
          session_type: 'bounce',
          duration: Math.round(sessionDuration / 1000).toString(),
        },
        extra: {
          sessionId: session.sessionId,
          duration: sessionDuration,
          pageViews: session.pageViews,
          referrer: session.referrer,
          userAgent: session.userAgent,
        },
      });
    }
    
    // Here you could store the complete session in a database
    // await storeSessionInDatabase(session);
    
    return NextResponse.json({ 
      success: true,
      metrics: {
        duration: sessionDuration,
        pageViews: session.pageViews,
        uniquePages,
        totalInteractions,
        formSubmissions,
        leadEvents,
      }
    });
  } catch (error) {
    console.error('Error processing session data:', error);
    
    Sentry.captureException(error, {
      tags: {
        component: 'analytics-session-api',
      },
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: Store session data in database
async function storeSessionInDatabase(session: UserSession) {
  // Implementation would depend on your database choice
  // Example with a hypothetical sessions table:
  /*
  await db.user_sessions.create({
    data: {
      session_id: session.sessionId,
      start_time: new Date(session.startTime),
      last_activity: new Date(session.lastActivity),
      page_views: session.pageViews,
      user_agent: session.userAgent,
      referrer: session.referrer,
      locale: session.locale,
      events: {
        create: session.events.map(event => ({
          event_type: event.type,
          category: event.category,
          action: event.action,
          label: event.label,
          value: event.value,
          page: event.page,
          metadata: event.metadata,
          timestamp: new Date(event.timestamp),
        })),
      },
    },
  });
  */
}