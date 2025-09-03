import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type = 'info', title, message, userId } = body
    
    const supabase = await createClient()
    
    // Use the provided userId or default to current user
    const targetUserId = userId || session.user.id
    
    // Create a test notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        title: title || `Test ${type} notification`,
        message: message || `This is a test ${type} notification sent at ${new Date().toLocaleTimeString()}`,
        type: type,
        is_read: false,
        link: '/notifications'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating test notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    console.log('✅ Test notification created:', data)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test notification sent successfully',
      notification: data
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}