import { NextRequest, NextResponse } from 'next/server'

const BEDS24_API_KEY = process.env.BEDS24_API_KEY
const BEDS24_API_V2 = 'https://beds24.com/api/v2'

export async function POST(request: NextRequest) {
  try {
    if (!BEDS24_API_KEY) {
      return NextResponse.json(
        { error: 'BEDS24_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Try to create a single test property
    const propertyData = {
      name: 'TEST API Property - Delete Me',
      propertyType: 'apartment',
      currency: 'DZD',
      country: 'DZ',
      city: 'Algiers',
      checkInStart: '15:00',
      checkInEnd: '23:00',
      checkOutEnd: '11:00',
    }

    console.log('Sending to Beds24:', JSON.stringify([propertyData], null, 2))

    const createResponse = await fetch(`${BEDS24_API_V2}/properties`, {
      method: 'POST',
      headers: {
        'token': BEDS24_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([propertyData]),
    })

    const responseText = await createResponse.text()
    console.log('Beds24 response status:', createResponse.status)
    console.log('Beds24 response body:', responseText)

    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseText)
    } catch {
      parsedResponse = responseText
    }

    return NextResponse.json({
      success: createResponse.ok,
      status: createResponse.status,
      statusText: createResponse.statusText,
      requestBody: [propertyData],
      responseBody: parsedResponse,
      responseRaw: responseText,
    })

  } catch (error) {
    console.error('Test create error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
