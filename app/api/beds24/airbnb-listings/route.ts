import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/security/require-admin'

const BEDS24_API_KEY = process.env.BEDS24_API_KEY
const BEDS24_API_V1 = 'https://api.beds24.com/json'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }
  try {
    if (!BEDS24_API_KEY) {
      return NextResponse.json(
        { error: 'BEDS24_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Use API v1 to get properties with their channel mappings
    const response = await fetch(`${BEDS24_API_V1}/getProperties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authentication: {
          apiKey: BEDS24_API_KEY,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorDetails
      try {
        errorDetails = JSON.parse(errorText)
      } catch {
        errorDetails = errorText
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch properties from Beds24',
          status: response.status,
          details: errorDetails
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
