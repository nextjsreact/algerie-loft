import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { consent, preferences } = body
    
    // In a real app, you would store the consent preferences
    return NextResponse.json({ 
      success: true,
      consent,
      preferences,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid request' 
    }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Cookie consent endpoint',
    defaultPreferences: {
      necessary: true,
      analytics: false,
      marketing: false
    }
  })
}