import { NextRequest, NextResponse } from 'next/server'

const BEDS24_API_KEY = process.env.BEDS24_API_KEY
const BEDS24_API_V1 = 'https://api.beds24.com/json'
const BEDS24_API_V2 = 'https://beds24.com/api/v2'

// List of all Airbnb listings from the user's account
const AIRBNB_LISTINGS = [
  "Carnot Loft", "Bougie Loft", "Yemma Gouraya Loft", "Ighil El bordj · Résidence Ighil El Bordj",
  "Dary Loft", "Bouzareah loft · Nada Loft - Forest vue", "Blue · Golf Loft _ Blue'78",
  "Purple · El Mouradia Loft _ Purple'78", "Mira loft", "Aftis 01 · Aftis 01", "Aftis 02 · Aftis 02",
  "Aftis 03", "Aftis 04", "Aftis 05", "Aftis 101", "Aftis 102", "Aftis 103", "Aftis 202", "Aftis 201",
  "Aftis 203", "Aftis 301", "Aftis 302", "Aftis 303", "Aftis 401 VIP", "Aftis 402", "Aftis 403",
  "Aftis 501", "Aftis 502", "Maya loft", "Camélia loft", "Marc loft", "Golden loft", "Yasmine loft",
  "Djoua loft", "Sonia loft", "Mona Loft", "Dina Loft", "Chiswick loft", "Tulipe Loft",
  "Lafayette · Luna Loft", "Choco Loft", "Sidi Fredj · Chanel Loft _ Sidi Fredj", "Oasis Loft",
  "La Redoute N°5", "La Redoute N°6", "La Redoute N°4", "Aida Loft - Forest Vue", "Zina Loft",
  "La Redoute - Duplex N°2", "El Bahdja", "Dounia Loft", "Talia loft", "Villa Lalla Meriem",
  "Madina loft", "Kifan Loft", "Hilel Loft", "Lyna loft", "Nedjma loft", "Max loft", "La Redoute N°3",
  "Swan Loft", "Star Loft", "Camomille Loft", "Nounou Loft", "Manar Loft", "Candy loft", "Éden Loft",
  "Mély Loft", "Baya Loft", "Lila Loft", "Amel loft", "Élias loft", "Ania loft", "Gouraya loft",
  "Thiziri loft", "Léa loft", "Amilis loft", "Sky loft", "Joelle loft", "Anna loft", "Olivia loft",
  "Eva loft", "Maha Loft", "Océana loft", "Sarah loft"
]

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

    // Step 1: Get existing properties from Beds24 using API v2
    const propertiesResponse = await fetch(`${BEDS24_API_V2}/properties`, {
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
    const existingNames = new Set(existingProperties.map((p: any) => p.name.toLowerCase()))

    // Step 2: Create properties for each Airbnb listing that doesn't exist
    for (const listingName of AIRBNB_LISTINGS) {
      // Skip if already exists (case-insensitive)
      if (existingNames.has(listingName.toLowerCase())) {
        results.skipped++
        continue
      }

      try {
        // Create property in Beds24 using API v2
        const propertyData = {
          name: listingName,
          propertyType: 'apartment',
          currency: 'DZD',
          country: 'DZ',
          city: 'Algiers',
          checkInStart: '15:00',
          checkInEnd: '23:00',
          checkOutEnd: '11:00',
        }

        const createResponse = await fetch(`${BEDS24_API_V2}/properties`, {
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
          })
        } else {
          const errorText = await createResponse.text()
          results.failed++
          results.errors.push({
            name: listingName,
            error: errorText,
          })
        }

        // Add delay to avoid rate limiting (500ms between each)
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
      totalListings: AIRBNB_LISTINGS.length,
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
