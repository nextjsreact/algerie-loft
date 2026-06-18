import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = await createClient(true)

    // Detect user role to filter notifications for members
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'member'
    const isMemberRestricted = userRole === 'member'

    let query = serviceSupabase
      .from('notifications')
      .select('id, type, notification_category', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    // For members: only count task and general notifications
    if (isMemberRestricted) {
      query = query.or(
        'notification_category.in.(task,general),and(notification_category.is.null,type.in.(task_assigned,task_updated,task_completed,task_overdue,task_reassigned,task_due_date_changed,task_status_changed,task_deleted,newTaskAssigned,info,success,warning,error,welcome,profile_updated,password_changed))'
      )
    }

    const { count, error } = await query

    if (error) {
      console.error('Error counting notifications:', error)
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: count || 0 }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch (error: any) {
    console.error('API Error fetching notification count:', error)
    return NextResponse.json({ count: 0 })
  }
}
