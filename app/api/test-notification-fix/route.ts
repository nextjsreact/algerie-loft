import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createNotification } from '@/app/actions/notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Test the notification system with the current user
    try {
      await createNotification(
        session.user.id,
        "Notification System Test",
        "This is a test to verify that task notifications are working correctly after the database fix.",
        'success',
        '/tasks'
      )

      return NextResponse.json({ 
        success: true, 
        message: 'Notification system is working correctly!',
        userId: session.user.id
      })
    } catch (notificationError: any) {
      console.error('Notification creation failed:', notificationError)
      
      return NextResponse.json({ 
        success: false, 
        error: 'Notification creation failed',
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