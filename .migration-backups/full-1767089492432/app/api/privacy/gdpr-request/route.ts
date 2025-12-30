import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, requestType } = body
    
    if (!email || !requestType) {
      return NextResponse.json({ 
        error: 'Email and request type are required' 
      }, { status: 400 })
    }

    // In a real app, you would process the GDPR request
    // For now, just return a success response
    return NextResponse.json({ 
      success: true,
      message: 'GDPR request received and will be processed within 30 days',
      requestId: `gdpr_${Date.now()}`,
      email,
      requestType
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid request' 
    }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'GDPR request endpoint',
    supportedTypes: ['data-export', 'data-deletion', 'data-correction']
  })
}