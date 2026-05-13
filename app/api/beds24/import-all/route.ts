import { NextRequest, NextResponse } from 'next/server'

const BEDS24_API_KEY = process.env.BEDS24_API_KEY
const BEDS24_API_BASE = 'https://beds24.com/api/v2'
const AIRBNB_USER_ID = '154594699' // Karim's Airbnb account

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

    // Step 1: Get existing properties from Beds24
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

    // Step 2: Get Airbnb listings for the user
    const listingsResponse = await fetch(`${BEDS24_API_BASE}/channels/airbnb/users/${AIRBNB_USER_ID}/listings`, {
      method: 'GET',
      headers: {
        'token': BEDS24_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    if (!listingsResponse.ok) {
      const errorText = await listingsResponse.text()
      let errorDetails
      try {
        errorDetails = JSON.parse(errorText)
      } catch {
        errorDetails = errorText
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch Airbnb listings',
          status: listingsResponse.status,
          details: errorDetails,
          hint: 'Vérifiez que le User ID Airbnb est correct: ' + AIRBNB_USER_ID
        },
        { status: listingsResponse.status }
      )
    }

    const listingsData = await listingsResponse.json()
    const listings = listingsData.data || listingsData || []

    if (!Array.isArray(listings) || listings.length === 0) {
      return NextResponse.json({
        success: false,
        results: {
          ...results,
          message: 'Aucun listing Airbnb trouvé pour cet utilisateur'
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Step 3: Create properties for unmapped listings
    for (const listing of listings) {
      const listingName = listing.name || listing.listingName || listing.title
      const listingId = listing.id || listing.listingId
      
      // Skip if no name
      if (!listingName) {
        results.skipped++
        continue
      }

      // Skip if already exists
      if (existingNames.has(listingName)) {
        results.skipped++
        continue
      }

      try {
        // Create property in Beds24
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
          const propertyId = createdProperty.id || createdProperty.data?.id
          
          results.success++
          results.created.push({
            name: listingName,
            propertyId: propertyId,
            airbnbListingId: listingId,
          })

          // Try to map the property to Airbnb listing
          // This might require additional API call to link them
          if (propertyId && listingId) {
            try {
              // Attempt to link property to Airbnb listing
              // The exact endpoint might vary, this is a common pattern
              await fetch(`${BEDS24_API_BASE}/properties/${propertyId}/channels/airbnb`, {
                method: 'POST',
                headers: {
                  'token': BEDS24_API_KEY,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  listingId: listingId,
                  userId: AIRBNB_USER_ID,
                }),
              })
            } catch (linkError) {
              // Linking failed but property was created
              console.error('Failed to link property to Airbnb:', linkError)
            }
          }
        } else {
          const errorText = await createResponse.text()
          results.failed++
          results.errors.push({
            name: listingName,
            error: errorText,
          })
        }

        // Add delay to avoid rate limiting
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
      totalListings: listings.length,
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
