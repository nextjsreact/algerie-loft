import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the event data
    const { event, properties } = body;
    
    if (!event || typeof event !== 'string') {
      return NextResponse.json(
        { error: 'Invalid event data' },
        { status: 400 }
      );
    }

    // Add server-side context
    const eventData = {
      event,
      properties: {
        ...properties,
        server_timestamp: Date.now(),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        referer: request.headers.get('referer') || 'direct',
      },
    };

    // Log the event (in production, you would send this to your analytics service)
    console.log('Custom Event Received:', eventData);

    // Example: Send to external analytics service
    if (process.env.ANALYTICS_ENDPOINT) {
      try {
        await fetch(process.env.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`,
          },
          body: JSON.stringify(eventData),
        });
      } catch (error) {
        console.error('Failed to send to external analytics:', error);
      }
    }

    // Store in database if needed
    // await storeAnalyticsEvent(eventData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing analytics event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    const timeframe = searchParams.get('timeframe') || '24h';
    const limit = parseInt(searchParams.get('limit') || '100');
    
    // In a real implementation, you would fetch data from your database
    // For now, return mock data
    const mockData = {
      event,
      timeframe,
      limit,
      data: [
        {
          event: 'page_view',
          count: 1250,
          unique_users: 890,
          timestamp: Date.now() - 86400000, // 24 hours ago
        },
        {
          event: 'contact_form_submission',
          count: 45,
          unique_users: 42,
          timestamp: Date.now() - 86400000,
        },
        {
          event: 'property_inquiry',
          count: 78,
          unique_users: 65,
          timestamp: Date.now() - 86400000,
        },
      ],
      total_events: 1373,
      total_unique_users: 997,
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}