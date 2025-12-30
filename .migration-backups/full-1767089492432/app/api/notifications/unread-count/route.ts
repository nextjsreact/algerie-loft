import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    try {
      // Get unread notifications count
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false)

      if (error) {
        // If notifications table doesn't exist, return 0
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('Notifications table not set up yet, returning 0 count')
          return NextResponse.json({ count: 0 })
        }
        throw error
      }

      return NextResponse.json({ count: count || 0 })
    } catch (notificationError: any) {
      // Handle notifications system not being available
      if (notificationError.code === '42P01' || notificationError.message?.includes('does not exist')) {
        console.log('Notifications system not available, returning 0 count')
        return NextResponse.json({ count: 0 })
      }
      throw notificationError
    }
  } catch (error: any) {
    // Final fallback for any other errors
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.log('Database tables not available, returning 0 notification count')
      return NextResponse.json({ count: 0 })
    }
    
    console.error('API Error fetching notification count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification count' }, 
      { status: 500 }
    )
  }
}