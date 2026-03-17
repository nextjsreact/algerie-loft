import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST: send a real notification to a target user, exactly like task creation does
export async function POST(request: NextRequest) {
  const session = await requireAuthAPI()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { target_user_id } = await request.json()
  if (!target_user_id) return NextResponse.json({ error: 'target_user_id requis' }, { status: 400 })

  const supabase = await createClient(true)

  // Exactly the same insert as in POST /api/tasks
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: target_user_id,
      title: 'Nouvelle tâche assignée',
      message: `"Tâche de test" vous a été assignée par ${session.user.full_name || 'Admin'}. Échéance: 17/03/2026`,
      title_key: 'newTaskAssigned',
      message_key: 'newTaskAssignedMessage',
      type: 'info',
      link: '/tasks',
      sender_id: session.user.id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, code: error.code, details: error.details })
  }

  // Now verify it's readable for that user
  const { data: verify, error: verifyErr } = await supabase
    .from('notifications')
    .select('id, user_id, title, message, is_read, created_at')
    .eq('id', data.id)
    .single()

  return NextResponse.json({
    ok: true,
    inserted: data,
    verify: verify || verifyErr?.message,
    message: `Notification envoyée à ${target_user_id}. Demande à cet utilisateur d'aller sur /api/debug/notif-chain pour confirmer.`
  })
}
