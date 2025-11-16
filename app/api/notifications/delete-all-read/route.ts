import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Delete all read notifications for current user
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', session.user.id)
      .eq('is_read', true)

    if (error) {
      console.error('Error deleting read notifications:', error)
      return NextResponse.json(
        { error: 'Failed to delete read notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'All read notifications deleted'
    })

  } catch (error) {
    console.error('Delete all read API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
