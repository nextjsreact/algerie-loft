import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const anonSupabase = await createClient()
  const { data: { user }, error: authError } = await anonSupabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = await createClient(true)

  const { data: notif, error: notifErr } = await supabase
    .from('notifications')
    .select('id, user_id, is_read')
    .eq('id', params.id)
    .single()

  if (notifErr || !notif) return NextResponse.json({ error: 'Notification introuvable' }, { status: 404 })
  if (notif.user_id !== user.id) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  if (notif.is_read) return NextResponse.json({ success: true })

  await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', params.id)

  return NextResponse.json({ success: true })
}
