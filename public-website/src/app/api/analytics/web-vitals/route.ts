import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the web vital data
    const { name, value, id, delta, rating, navigationType, timestamp, url, userAgent } = body;
    
    if (!name || typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid web vital data' },
        { status: 400 }
      );
    }

    // In production, you would send this data to your analytics service
    // For now, we'll just log it (you can replace this with your analytics service)
    console.log('Web Vital Received:', {
      name,
      value,
      id,
      delta,
      rating,
      navigationType,
      timestamp,
      url,
      userAgent: userAgent?.substring(0, 100), // Truncate user agent
    });

    // Example: Send to external analytics service
    if (process.env.ANALYTICS_ENDPOINT) {
      try {
        await fetch(process.env.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}`,
          },
          body: JSON.stringify({
            event: 'web_vital',
            properties: {
              metric_name: name,
              metric_value: value,
              metric_id: id,
              metric_delta: delta,
              metric_rating: rating,
              navigation_type: navigationType,
              page_url: url,
              timestamp,
            },
          }),
        });
      } catch (error) {
        console.error('Failed to send to external analytics:', error);
      }
    }

    // Store in database if needed
    // await storeWebVital({ name, value, id, delta, rating, url, timestamp });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing web vital:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve web vitals data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    
    // In a real implementation, you would fetch data from your database
    // For now, return mock data
    const mockData = {
      timeframe,
      metrics: {
        CLS: { value: 0.1, rating: 'good', samples: 150 },
        FID: { value: 45, rating: 'good', samples: 120 },
        FCP: { value: 1200, rating: 'good', samples: 180 },
        LCP: { value: 2100, rating: 'good', samples: 165 },
        TTFB: { value: 400, rating: 'good', samples: 200 },
      },
      timestamp: Date.now(),
    };

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Error fetching web vitals:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}