import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getSimpleConversationMessages, getSimpleConversationById } from '@/lib/services/conversations-simple'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    // Récupérer les messages et les informations de la conversation
    const [messages, conversation] = await Promise.all([
      getSimpleConversationMessages(id, session.user.id),
      getSimpleConversationById(id, session.user.id)
    ])

    return NextResponse.json({
      messages,
      conversation
    })
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}