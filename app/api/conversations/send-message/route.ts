import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sendMessage } from '@/lib/services/conversations'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversation_id, content, message_type = 'text' } = body

    if (!conversation_id || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    const message = await sendMessage(session.user.id, {
      conversation_id,
      content,
      message_type
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error('API Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' }, 
      { status: 500 }
    )
  }
}