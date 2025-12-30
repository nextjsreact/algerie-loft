import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createNotification } from '@/lib/services/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { targetUserId, title, message, type = 'info' } = body

    if (!targetUserId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: targetUserId, title, message' },
        { status: 400 }
      )
    }

    console.log('Creating test notification:', {
      targetUserId,
      title,
      message,
      type,
      senderId: session.user.id
    })

    const result = await createNotification(
      targetUserId,
      title,
      message,
      type,
      undefined, // no link
      session.user.id // sender_id
    )

    console.log('Notification created successfully:', result)

    return NextResponse.json({
      success: true,
      notification: result,
      message: 'Test notification created successfully'
    })
  } catch (error) {
    console.error('Error creating test notification:', error)
    return NextResponse.json(
      { error: 'Failed to create test notification', details: error },
      { status: 500 }
    )
  }
}