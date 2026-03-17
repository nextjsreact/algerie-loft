import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuthAPI()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { status } = await request.json()
  if (!['todo', 'in_progress', 'completed'].includes(status)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const supabase = await createClient(true)

  // Fetch the task to get creator and title
  const { data: task, error: taskErr } = await supabase
    .from('tasks')
    .select('id, title, user_id, assigned_to, status')
    .eq('id', params.id)
    .single()

  if (taskErr || !task) {
    return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
  }

  // Update the task status
  const { data: updated, error: updateErr } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single()

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Notify the task creator if different from the person updating
  if (task.user_id && task.user_id !== session.user.id) {
    const statusLabels: Record<string, string> = {
      todo: 'À faire',
      in_progress: 'En cours',
      completed: 'Terminée',
    }
    const updaterName = session.user.full_name || 'Un employé'
    const statusLabel = statusLabels[status] || status

    await supabase.from('notifications').insert({
      user_id: task.user_id,
      title: `Statut de tâche mis à jour`,
      message: `${updaterName} a changé le statut de "${task.title}" à "${statusLabel}"`,
      title_key: 'taskStatusUpdated',
      message_key: 'taskStatusUpdatedMessage',
      type: 'info',
      link: `/tasks/${task.id}`,
      sender_id: session.user.id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ task: updated })
}
