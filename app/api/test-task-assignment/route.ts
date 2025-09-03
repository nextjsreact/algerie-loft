import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { notifyTaskAssignment } from '@/lib/services/task-notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow admins/managers to test
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { assignedUserId } = body

    if (!assignedUserId) {
      return NextResponse.json(
        { error: 'Missing assignedUserId' }, 
        { status: 400 }
      )
    }

    // Test task assignment notification
    try {
      await notifyTaskAssignment(
        {
          taskId: 'test-task-123',
          taskTitle: 'Test Task Assignment Notification',
          assignedTo: assignedUserId,
          createdBy: session.user.id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'todo',
          description: 'This is a test task to verify notifications work'
        },
        assignedUserId,
        session.user.id
      )

      return NextResponse.json({ 
        success: true, 
        message: 'Task assignment notification sent successfully!',
        assignedTo: assignedUserId,
        assignedBy: session.user.id
      })
    } catch (notificationError: any) {
      console.error('Task assignment notification failed:', notificationError)
      
      return NextResponse.json({ 
        success: false, 
        error: 'Task assignment notification failed',
        details: notificationError.message,
        code: notificationError.code
      }, { status: 500 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}