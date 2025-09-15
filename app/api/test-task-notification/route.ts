import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createNotification } from '@/app/actions/notifications'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { assignedToUserId } = body

    if (!assignedToUserId) {
      return NextResponse.json(
        { error: 'Missing assignedToUserId' },
        { status: 400 }
      )
    }

    // Simulate task assignment notification
    const taskTitle = `Test Task - ${new Date().toLocaleTimeString()}`
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7) // Due in 7 days

    console.log('Creating task assignment notification:', {
      assignedTo: assignedToUserId,
      taskTitle,
      createdBy: session.user.id,
      dueDate: dueDate.toLocaleDateString()
    })

    const result = await createNotification(
      assignedToUserId,
      "newTaskAssigned", // title_key
      "newTaskAssignedMessage", // message_key
      'info',
      `/tasks/test-task-id`,
      session.user.id,
      undefined, // title_payload
      { taskTitle, dueDate: dueDate.toLocaleDateString() } // message_payload
    )

    console.log('Task assignment notification created successfully:', result)

    return NextResponse.json({
      success: true,
      notification: result,
      message: 'Task assignment notification created successfully'
    })
  } catch (error) {
    console.error('Error creating task assignment notification:', error)
    return NextResponse.json(
      { error: 'Failed to create task assignment notification', details: error },
      { status: 500 }
    )
  }
}