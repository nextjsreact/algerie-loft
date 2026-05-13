import { NextRequest, NextResponse } from 'next/server'

const BEDS24_API_KEY = process.env.BEDS24_API_KEY
const BEDS24_API_BASE = 'https://beds24.com/api/v2'

export async function GET(request: NextRequest) {
  try {
    if (!BEDS24_API_KEY) {
      return NextResponse.json(
        { error: 'BEDS24_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Get all properties
    const response = await fetch(`${BEDS24_API_BASE}/properties`, {
      method: 'GET',
      headers: {
        'token': BEDS24_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { 
          error: 'Failed to fetch properties from Beds24',
          status: response.status,
          details: errorText
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      properties: data,
      count: Array.isArray(data) ? data.length : 0,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Beds24 properties error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
