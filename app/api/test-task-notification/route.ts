import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createNotification } from '@/app/actions/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetUserId, type = 'info' } = body
    
    // Use the provided targetUserId or default to current user for testing
    const userId = targetUserId || session.user.id
    
    // Create a test task notification
    const notification = await createNotification(
      userId,
      'Test Task Assignment',
      `This is a test task notification sent at ${new Date().toLocaleTimeString()}. You have been assigned a new task.`,
      type,
      '/tasks/test-task-id'
    )

    console.log('✅ Test task notification created:', notification)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test task notification sent successfully',
      notification: notification?.[0] || notification
    })
  } catch (error) {
    console.error('❌ Error creating test task notification:', error)
    return NextResponse.json(
      { error: 'Failed to create test notification', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}