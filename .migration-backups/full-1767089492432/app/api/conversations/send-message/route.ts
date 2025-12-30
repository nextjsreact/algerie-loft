import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sendSimpleMessage } from '@/lib/services/conversations-simple'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { conversationId, content } = body

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    const message = await sendSimpleMessage(
      session.user.id,
      conversationId,
      content
    )

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to send message' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message
    })
  } catch (error) {
    console.error('API Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' }, 
      { status: 500 }
    )
  }
}