import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET: check last 10 notifications in DB (admin only)
export async function GET(request: NextRequest) {
  const session = await requireAuthAPI()
  if (!session || !['admin', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient(true)

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, message, type, is_read, created_at, sender_id')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 500 })
  }

  return NextResponse.json({ count: data?.length, notifications: data })
}

// POST: send a test notification to a user
export async function POST(request: NextRequest) {
  const session = await requireAuthAPI()
  if (!session || !['admin', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { target_user_id } = await request.json()
  if (!target_user_id) {
    return NextResponse.json({ error: 'target_user_id required' }, { status: 400 })
  }

  const supabase = await createClient(true)

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: target_user_id,
      title: 'Test notification',
      message: 'Ceci est une notification de test envoyée par ' + (session.user.full_name || session.user.email),
      type: 'info',
      link: '/tasks',
      sender_id: session.user.id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message, details: error }, { status: 500 })
  }

  return NextResponse.json({ success: true, notification: data })
}
