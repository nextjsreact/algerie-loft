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

    // Test 1: Get account info
    const accountResponse = await fetch(`${BEDS24_API_BASE}/authentication/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: BEDS24_API_KEY,
      }),
    })

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text()
      return NextResponse.json(
        { 
          error: 'Failed to authenticate with Beds24',
          status: accountResponse.status,
          details: errorText
        },
        { status: accountResponse.status }
      )
    }

    const accountData = await accountResponse.json()

    // Test 2: Get properties list
    const propertiesResponse = await fetch(`${BEDS24_API_BASE}/properties`, {
      method: 'GET',
      headers: {
        'token': BEDS24_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    let propertiesData = null
    if (propertiesResponse.ok) {
      propertiesData = await propertiesResponse.json()
    }

    return NextResponse.json({
      success: true,
      message: 'Beds24 API connection successful',
      account: accountData,
      properties: propertiesData,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Beds24 test error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
