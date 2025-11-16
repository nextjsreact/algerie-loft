import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get notifications from database
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (notifError) {
      console.error('Error fetching notifications:', notifError)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Transform to match expected format
    const transformedNotifications = notifications?.map(notif => ({
      id: notif.id,
      type: notif.type || 'system',
      title: notif.title,
      message: notif.message,
      timestamp: notif.created_at,
      read: notif.is_read,
      priority: 'medium',
      actionUrl: notif.type === 'partner_registration' ? '/partner/pending' : undefined,
      actionLabel: notif.type === 'partner_registration' ? 'Voir les demandes' : undefined
    })) || []

    return NextResponse.json({ notifications: transformedNotifications })

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