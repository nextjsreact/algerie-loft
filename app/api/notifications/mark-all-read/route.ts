import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// title_keys that are "read receipts" — reading them must NOT trigger another notification (no loop)
const READ_RECEIPT_KEYS = ['notificationRead', 'notificationsRead', 'Notification Read']

export async function POST(request: NextRequest) {
  try {
    const anonSupabase = await createClient()
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const supabase = await createClient(true)

    // Fetch unread notifications
    const { data: unread } = await supabase
      .from('notifications')
      .select('id, sender_id, title, title_key')
      .eq('user_id', user.id)
      .eq('is_read', false)

    // Mark all as read
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (!unread || unread.length === 0) return NextResponse.json({ success: true })

    // Only notify senders of NON-read-receipt notifications (prevents loop)
    const notifiable = unread.filter(n =>
      n.sender_id &&
      n.sender_id !== user.id &&
      !READ_RECEIPT_KEYS.includes(n.title_key || '') &&
      n.title !== 'Notification lue' &&
      n.title !== 'Notifications lues'
    )

    if (notifiable.length === 0) return NextResponse.json({ success: true })

    // Get reader's name
    const { data: reader } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    const readerName = reader?.full_name || 'Un employé'

    // Notify each unique sender once
    const uniqueSenders = [...new Set(notifiable.map(n => n.sender_id))]

    for (const senderId of uniqueSenders) {
      const senderNotifs = notifiable.filter(n => n.sender_id === senderId)
      const count = senderNotifs.length

      await supabase.from('notifications').insert({
        user_id: senderId,
        title: 'Notifications lues',
        message: count === 1
          ? `${readerName} a lu votre notification : "${senderNotifs[0].title || 'Nouvelle tâche assignée'}"`
          : `${readerName} a lu ${count} de vos notifications`,
        title_key: 'notificationsRead',
        message_key: 'notificationsReadMessage',
        type: 'info',
        link: '/tasks',
        sender_id: user.id,
        is_read: false,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
