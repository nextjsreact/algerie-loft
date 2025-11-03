import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    privacy: {
      dataCollection: true,
      analytics: true,
      cookies: true
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // In a real app, you would save these settings
    return NextResponse.json({ 
      success: true,
      settings: body
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid request' 
    }, { status: 400 })
  }
}