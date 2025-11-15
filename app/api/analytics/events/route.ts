import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Vérifier si le body existe
    const text = await request.text();
    if (!text || text.trim() === '') {
      return NextResponse.json({ success: true, message: 'Empty body ignored' });
    }

    // Parser le JSON
    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      console.warn('[Analytics API] Invalid JSON body:', text.substring(0, 100));
      return NextResponse.json({ success: true, message: 'Invalid JSON ignored' });
    }

    const { sessionId, event } = body;

    // Validate required fields
    if (!sessionId || !event) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, event' },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Store the event in your database
    // 2. Process the event for real-time analytics
    // 3. Update user behavior patterns
    
    console.log('[Analytics API] Event received:', {
      sessionId,
      eventType: event.type,
      category: event.category,
      action: event.action,
      timestamp: event.timestamp,
    });

    // For now, just log the event
    // TODO: Implement database storage
    // await storeAnalyticsEvent(sessionId, event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics API] Error processing event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Analytics events endpoint' });
}