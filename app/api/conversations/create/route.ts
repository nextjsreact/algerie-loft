import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createConversation } from '@/lib/services/conversations'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, participant_ids } = body

    if (!type || !participant_ids || !Array.isArray(participant_ids)) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    if (type === 'group' && !name) {
      return NextResponse.json(
        { error: 'Group conversations require a name' }, 
        { status: 400 }
      )
    }

    const conversation = await createConversation(session.user.id, {
      name,
      type,
      participant_ids
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('API Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' }, 
      { status: 500 }
    )
  }
}