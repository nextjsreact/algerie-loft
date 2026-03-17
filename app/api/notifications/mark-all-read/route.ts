import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const anonSupabase = await createClient()
    const { data: { user }, error: authError } = await anonSupabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const supabase = await createClient(true)

    // Fetch unread notifications that have a sender (to notify them)
    const { data: unread } = await supabase
      .from('notifications')
      .select('id, sender_id, title')
      .eq('user_id', user.id)
      .eq('is_read', false)

    // Mark all as read
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Get reader's name
    const { data: reader } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    const readerName = reader?.full_name || 'Un employé'

    // Notify each unique sender once
    if (unread && unread.length > 0) {
      const uniqueSenders = [...new Set(
        unread
          .filter(n => n.sender_id && n.sender_id !== user.id)
          .map(n => n.sender_id)
      )]

      for (const senderId of uniqueSenders) {
        const senderNotifs = unread.filter(n => n.sender_id === senderId)
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
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
