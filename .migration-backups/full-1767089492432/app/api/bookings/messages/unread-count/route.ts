import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

// GET /api/bookings/messages/unread-count - Get unread message count for user
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    const { count, error } = await supabase
      .from('booking_messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', session.user.id)
      .eq('is_read', false)

    if (error) {
      // If booking_messages table doesn't exist, return 0
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('Booking messages table not set up yet, returning 0 count')
        return NextResponse.json({ count: 0 })
      }
      throw error
    }

    return NextResponse.json({ count: count || 0 })

  } catch (error: any) {
    // Handle table not existing
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.log('Booking messages system not available, returning 0 count')
      return NextResponse.json({ count: 0 })
    }
    
    console.error('API Error fetching unread message count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch unread message count' }, 
      { status: 500 }
    )
  }
}