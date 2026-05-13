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

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const from = searchParams.get('from') // Format: YYYYMMDD
    const to = searchParams.get('to')     // Format: YYYYMMDD

    // Build query parameters for Beds24 API v2
    const params: any = {
      includeInvoice: false,
      includeInfoItems: false,
    }
    
    if (propertyId) params.propertyId = propertyId
    if (from) params.arrivalFrom = from
    if (to) params.arrivalTo = to

    // Get bookings using GET method with query params
    const queryString = new URLSearchParams(params).toString()
    const response = await fetch(`${BEDS24_API_BASE}/bookings?${queryString}`, {
      method: 'GET',
      headers: {
        'token': BEDS24_API_KEY,
        'Content-Type': 'application/json',
      },
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
          error: 'Failed to fetch bookings from Beds24',
          status: response.status,
          details: errorDetails
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      bookings: data.data || data,
      count: data.count || (Array.isArray(data.data) ? data.data.length : 0),
      filters: { propertyId, from, to },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Beds24 bookings error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
