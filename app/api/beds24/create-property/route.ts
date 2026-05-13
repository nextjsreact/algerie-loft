import { NextRequest, NextResponse } from 'next/server'

const BEDS24_API_KEY = process.env.BEDS24_API_KEY
const BEDS24_API_BASE = 'https://beds24.com/api/v2'

export async function POST(request: NextRequest) {
  try {
    if (!BEDS24_API_KEY) {
      return NextResponse.json(
        { error: 'BEDS24_API_KEY not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { name, airbnbListingId } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Property name is required' },
        { status: 400 }
      )
    }

    // Create property in Beds24
    const propertyData = {
      name: name,
      propertyType: 'apartment',
      currency: 'DZD',
      country: 'DZ',
      checkInStart: '15:00',
      checkInEnd: '23:00',
      checkOutEnd: '11:00',
    }

    const response = await fetch(`${BEDS24_API_BASE}/properties`, {
      method: 'POST',
      headers: {
        'token': BEDS24_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(propertyData),
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
          error: 'Failed to create property in Beds24',
          status: response.status,
          details: errorDetails
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    // If Airbnb listing ID provided, try to map it
    if (airbnbListingId && data.id) {
      // Map the property to Airbnb listing
      // Note: This might require a separate API call depending on Beds24 API
      // For now, we'll return the created property
    }

    return NextResponse.json({
      success: true,
      property: data,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Beds24 create property error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
