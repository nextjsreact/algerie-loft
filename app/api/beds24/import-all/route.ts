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

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[],
      created: [] as any[],
    }

    // Step 1: Get existing properties
    const propertiesResponse = await fetch(`${BEDS24_API_BASE}/properties`, {
      method: 'GET',
      headers: {
        'token': BEDS24_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!propertiesResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch existing properties' },
        { status: 500 }
      )
    }

    const propertiesData = await propertiesResponse.json()
    const existingProperties = propertiesData.data || []
    const existingNames = new Set(existingProperties.map((p: any) => p.name))

    // Step 2: Get Airbnb listings
    const listingsResponse = await fetch(`${BEDS24_API_BASE}/channels/airbnb/listings`, {
      method: 'GET',
      headers: {
        'token': BEDS24_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!listingsResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Airbnb listings' },
        { status: 500 }
      )
    }

    const listingsData = await listingsResponse.json()
    const listings = listingsData.data || listingsData || []

    // Step 3: Create properties for unmapped listings
    for (const listing of listings) {
      const listingName = listing.name || listing.listingName
      
      // Skip if already exists
      if (existingNames.has(listingName)) {
        results.skipped++
        continue
      }

      // Skip if no name
      if (!listingName) {
        results.skipped++
        continue
      }

      try {
        // Create property
        const propertyData = {
          name: listingName,
          propertyType: 'apartment',
          currency: 'DZD',
          country: 'DZ',
          checkInStart: '15:00',
          checkInEnd: '23:00',
          checkOutEnd: '11:00',
        }

        const createResponse = await fetch(`${BEDS24_API_BASE}/properties`, {
          method: 'POST',
          headers: {
            'token': BEDS24_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(propertyData),
        })

        if (createResponse.ok) {
          const createdProperty = await createResponse.json()
          results.success++
          results.created.push({
            name: listingName,
            id: createdProperty.id,
            airbnbId: listing.id || listing.listingId,
          })
        } else {
          const errorText = await createResponse.text()
          results.failed++
          results.errors.push({
            name: listingName,
            error: errorText,
          })
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        results.failed++
        results.errors.push({
          name: listingName,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Beds24 import all error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
