import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createSimpleConversation } from '@/lib/services/conversations-simple'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    
    const { type, name, participant_ids } = body

    if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un participant est requis' },
        { status: 400 }
      )
    }

    if (type === 'group' && !name?.trim()) {
      return NextResponse.json(
        { error: 'Le nom du groupe est requis' },
        { status: 400 }
      )
    }

    const conversation = await createSimpleConversation(
      session.user.id,
      participant_ids,
      name?.trim(),
      type || 'direct'
    )

    if (!conversation) {
      return NextResponse.json(
        { error: 'Erreur lors de la création de la conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création' },
      { status: 500 }
    )
  }
}