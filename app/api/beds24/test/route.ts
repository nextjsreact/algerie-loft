import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/security/require-admin'

const BEDS24_API_KEY = process.env.BEDS24_API_KEY
const BEDS24_API_BASE = 'https://beds24.com/api/v2'

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

    // Test: Get properties list directly (this validates the token)
    const propertiesResponse = await fetch(`${BEDS24_API_BASE}/properties`, {
      method: 'GET',
      headers: {
        'token': BEDS24_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!propertiesResponse.ok) {
      const errorText = await propertiesResponse.text()
      let errorDetails
      try {
        errorDetails = JSON.parse(errorText)
      } catch {
        errorDetails = errorText
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to connect to Beds24',
          status: propertiesResponse.status,
        },
        { status: propertiesResponse.status }
      )
    }

    const propertiesData = await propertiesResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Beds24 API connection successful',
      properties: propertiesData,
      count: Array.isArray(propertiesData) ? propertiesData.length : 0,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Beds24 test error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
