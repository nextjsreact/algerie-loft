import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Debug reservation request:', JSON.stringify(body, null, 2));
    
    return NextResponse.json({
      success: true,
      received_data: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug reservation error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}