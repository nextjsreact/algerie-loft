import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Test basic notification creation with minimal fields
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: session.user.id,
          title: 'Basic Notification Test',
          message: 'Testing basic notification functionality without type column',
          link: '/tasks',
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select()

      if (error) {
        throw error
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Basic notification created successfully!',
        notification: data[0]
      })
    } catch (notificationError: any) {
      console.error('Basic notification creation failed:', notificationError)
      
      return NextResponse.json({ 
        success: false, 
        error: 'Basic notification creation failed',
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