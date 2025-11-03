import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // In a real app, you would fetch the dispute from database
    return NextResponse.json({ 
      id,
      status: 'pending',
      type: 'booking_dispute',
      description: 'Sample dispute',
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch dispute' 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // In a real app, you would update the dispute
    return NextResponse.json({ 
      success: true,
      id,
      ...body
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to update dispute' 
    }, { status: 500 })
  }
}