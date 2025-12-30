import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { notificationIds } = body

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid notification IDs' },
        { status: 400 }
      )
    }

    console.log(`🚀 [BATCH API] Processing ${notificationIds.length} notifications for user ${session.user.id}`)

    // Use service role client for batch operation
    const supabase = await createClient(true)

    // Batch update all notifications at once
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds)
      .eq('user_id', session.user.id) // Security: ensure user owns these notifications
      .select('id')

    if (error) {
      console.error('❌ [BATCH API] Error marking notifications as read:', error)
      return NextResponse.json(
        { error: 'Failed to update notifications', details: error.message },
        { status: 500 }
      )
    }

    const endTime = performance.now()
    const processingTime = endTime - startTime

    console.log(`✅ [BATCH API] Successfully marked ${data?.length || 0} notifications as read in ${processingTime.toFixed(2)}ms`)

    return NextResponse.json({
      success: true,
      updatedCount: data?.length || 0,
      processingTime: processingTime.toFixed(2),
      message: `Successfully marked ${data?.length || 0} notifications as read`
    })

  } catch (error) {
    console.error('❌ [BATCH API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}