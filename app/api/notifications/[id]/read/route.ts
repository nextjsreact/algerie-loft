import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// title_keys that are "read receipts" — reading them must NOT trigger another notification (no loop)
const READ_RECEIPT_KEYS = ['notificationRead', 'notificationsRead', 'Notification Read']

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const anonSupabase = await createClient()
  const { data: { user }, error: authError } = await anonSupabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = await createClient(true)

  // Fetch the notification
  const { data: notif, error: notifErr } = await supabase
    .from('notifications')
    .select('id, user_id, title, title_key, sender_id, link, is_read')
    .eq('id', params.id)
    .single()

  if (notifErr || !notif) return NextResponse.json({ error: 'Notification introuvable' }, { status: 404 })
  if (notif.user_id !== user.id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Already read — nothing to do
  if (notif.is_read) return NextResponse.json({ success: true })

  // Mark as read
  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', params.id)

  // Only notify the sender if:
  // 1. There is a sender
  // 2. The sender is not the reader
  // 3. This notification is NOT itself a read receipt (prevents infinite loop)
  const isReadReceipt = READ_RECEIPT_KEYS.includes(notif.title_key || '') ||
    notif.title === 'Notification lue' ||
    notif.title === 'Notifications lues'

  if (notif.sender_id && notif.sender_id !== user.id && !isReadReceipt) {
    const { data: reader } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const readerName = reader?.full_name || 'Un employé'

    await supabase.from('notifications').insert({
      user_id: notif.sender_id,
      title: 'Notification lue',
      message: `${readerName} a lu votre notification : "${notif.title || 'Nouvelle tâche assignée'}"`,
      title_key: 'notificationRead',
      message_key: 'notificationReadMessage',
      type: 'info',
      link: notif.link || '/tasks',
      sender_id: user.id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ success: true })
}
