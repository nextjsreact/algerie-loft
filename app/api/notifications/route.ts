import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Notification categories/types allowed for member role (without is_staff)
const MEMBER_ALLOWED_CATEGORIES = new Set(['task', 'general'])
const MEMBER_ALLOWED_TYPES_PREFIXES = ['task_', 'newTaskAssigned']
const MEMBER_ALLOWED_TYPES = new Set([
  'info', 'success', 'warning', 'error', 'welcome',
  'profile_updated', 'password_changed',
  'task_assigned', 'task_updated', 'task_completed', 'task_overdue',
  'task_reassigned', 'task_due_date_changed', 'task_status_changed',
  'task_deleted', 'newTaskAssigned'
])

function isNotificationAllowedForMember(notification: any): boolean {
  // Check by category first
  if (notification.notification_category) {
    if (MEMBER_ALLOWED_CATEGORIES.has(notification.notification_category)) return true
    // If it has a category that's NOT in the allowed list, block it
    return false
  }
  // Check by type
  if (notification.type) {
    if (MEMBER_ALLOWED_TYPES.has(notification.type)) return true
    if (MEMBER_ALLOWED_TYPES_PREFIXES.some(prefix => notification.type.startsWith(prefix))) return true
    return false
  }
  // No category/type info — allow (general notification)
  return true
}

export async function GET(request: NextRequest) {
  try {
    // Use anon client to get current user identity
    const anonSupabase = await createClient()
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Detect user role to filter notifications for members
    const serviceSupabase = await createClient(true)
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role || 'member'
    const isMemberRestricted = userRole === 'member'

    // Use service role to fetch notifications (bypass RLS)
    const supabase = await createClient(true)
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    // For members: only fetch task and general notifications
    if (isMemberRestricted) {
      query = query.or(
        `notification_category.in.(task,general),and(notification_category.is.null,type.in.(${Object.values(MEMBER_ALLOWED_TYPES).join(',')}))`
      )
    }

    const { data: notifications, error: notifError } = await query

    if (notifError) {
      console.error('Error fetching notifications:', notifError)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Client-side filter as safety net
    const filtered = isMemberRestricted
      ? (notifications || []).filter(isNotificationAllowedForMember)
      : notifications || []

    return NextResponse.json({ notifications: filtered })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { type, title, message, priority = 'medium', actionUrl, actionLabel } = await request.json()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // In a real implementation, you would insert into notifications table
    const newNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      priority,
      actionUrl,
      actionLabel
    }

    // Here you would also trigger real-time notification via WebSocket
    console.log('New notification created:', newNotification)

    return NextResponse.json({ notification: newNotification })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la notification' },
      { status: 500 }
    )
  }
}