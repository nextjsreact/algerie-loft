import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {}

  // 1. Check auth
  const session = await requireAuthAPI()
  results.auth = session
    ? { ok: true, userId: session.user.id, role: session.user.role, name: session.user.full_name }
    : { ok: false, error: 'No session' }

  if (!session) return NextResponse.json(results)

  const supabase = await createClient(true)

  // 2. Check notifications table columns
  const { data: cols, error: colErr } = await supabase
    .from('notifications')
    .select('id, user_id, title, message, title_key, message_key, type, is_read, created_at')
    .limit(1)
  results.columns_check = colErr
    ? { ok: false, error: colErr.message, code: colErr.code }
    : { ok: true, sample: cols?.[0] || 'table empty' }

  // 3. Count all notifications for current user
  const { count: myCount, error: countErr } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
  results.my_notifications_count = countErr
    ? { ok: false, error: countErr.message }
    : { ok: true, count: myCount }

  // 4. List all users (to pick a target for test)
  const { data: users, error: usersErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .neq('id', session.user.id)
    .limit(10)
  results.other_users = usersErr
    ? { ok: false, error: usersErr.message }
    : { ok: true, users: users?.map(u => ({ id: u.id, name: u.full_name, role: u.role })) }

  // 5. Try inserting a test notification to self
  const { data: inserted, error: insertErr } = await supabase
    .from('notifications')
    .insert({
      user_id: session.user.id,
      title: 'TEST - Notification de diagnostic',
      message: 'Si tu vois ça, les notifications fonctionnent!',
      type: 'info',
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()
  results.insert_test = insertErr
    ? { ok: false, error: insertErr.message, code: insertErr.code, details: insertErr.details }
    : { ok: true, inserted_id: inserted?.id }

  // 6. Fetch latest 5 notifications for current user
  const { data: latest, error: latestErr } = await supabase
    .from('notifications')
    .select('id, title, message, type, is_read, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  results.my_latest = latestErr
    ? { ok: false, error: latestErr.message }
    : { ok: true, notifications: latest }

  return NextResponse.json(results, { status: 200 })
}

// POST: send test notification to a specific user
export async function POST(request: NextRequest) {
  const session = await requireAuthAPI()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { target_user_id } = await request.json()
  const supabase = await createClient(true)

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: target_user_id || session.user.id,
      title: 'Test tâche assignée',
      message: `Tâche de test assignée par ${session.user.full_name || 'Admin'}`,
      type: 'info',
      link: '/tasks',
      sender_id: session.user.id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ ok: false, error: error.message, code: error.code, details: error.details })
  return NextResponse.json({ ok: true, notification: data })
}
