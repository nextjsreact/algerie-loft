import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'
import { taskSchema } from '@/lib/validations'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuthAPI()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  if (!['admin', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
  }

  const body = await request.json()
  const validatedData = taskSchema.parse(body)

  const supabase = await createClient(true)

  // Fetch existing task to compare changes
  const { data: existing, error: fetchErr } = await supabase
    .from('tasks')
    .select('id, title, assigned_to, due_date, status, user_id, loft_id')
    .eq('id', params.id)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
  }

  // Update the task
  const { data: updated, error: updateErr } = await supabase
    .from('tasks')
    .update({
      ...validatedData,
      due_date: validatedData.due_date ? new Date(validatedData.due_date).toISOString() : null,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  // Determine who to notify (current assignee or new assignee)
  const newAssignedTo = validatedData.assigned_to || null
  const oldAssignedTo = existing.assigned_to || null
  const updaterName = session.user.full_name || 'Manager'

  // Get loft name if needed
  let loftName: string | undefined
  const loftId = validatedData.loft_id || existing.loft_id
  if (loftId) {
    const { data: loft } = await supabase.from('lofts').select('name').eq('id', loftId).single()
    loftName = loft?.name
  }

  const notifications: Array<{ user_id: string; title: string; message: string }> = []

  // Case 1: Task reassigned to a new person
  if (newAssignedTo && newAssignedTo !== oldAssignedTo && newAssignedTo !== session.user.id) {
    notifications.push({
      user_id: newAssignedTo,
      title: 'Nouvelle tâche assignée',
      message: `"${validatedData.title}" vous a été assignée par ${updaterName}${loftName ? ` (${loftName})` : ''}${validatedData.due_date ? `. Échéance: ${new Date(validatedData.due_date).toLocaleDateString('fr-FR')}` : ''}`,
    })
  }

  // Case 2: Task modified — notify current assignee (if not the updater)
  const assigneeToNotify = newAssignedTo || oldAssignedTo
  if (assigneeToNotify && assigneeToNotify !== session.user.id && newAssignedTo === oldAssignedTo) {
    // Build a description of what changed
    const changes: string[] = []
    if (validatedData.title !== existing.title) changes.push(`titre: "${validatedData.title}"`)
    if (validatedData.due_date && new Date(validatedData.due_date).toISOString() !== existing.due_date) {
      changes.push(`échéance: ${new Date(validatedData.due_date).toLocaleDateString('fr-FR')}`)
    }
    if (validatedData.status !== existing.status) {
      const labels: Record<string, string> = { todo: 'À faire', in_progress: 'En cours', completed: 'Terminée' }
      changes.push(`statut: ${labels[validatedData.status] || validatedData.status}`)
    }
    if (loftName && validatedData.loft_id !== existing.loft_id) changes.push(`appartement: ${loftName}`)

    if (changes.length > 0) {
      notifications.push({
        user_id: assigneeToNotify,
        title: 'Tâche modifiée',
        message: `${updaterName} a modifié la tâche "${validatedData.title}" : ${changes.join(', ')}`,
      })
    } else {
      // Generic update notification even if we can't detect specific changes
      notifications.push({
        user_id: assigneeToNotify,
        title: 'Tâche modifiée',
        message: `${updaterName} a mis à jour la tâche "${validatedData.title}"${loftName ? ` (${loftName})` : ''}`,
      })
    }
  }

  // Insert all notifications
  for (const notif of notifications) {
    await supabase.from('notifications').insert({
      ...notif,
      title_key: 'taskUpdated',
      message_key: 'taskUpdatedMessage',
      type: 'info',
      link: `/tasks/${params.id}`,
      sender_id: session.user.id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ task: updated })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAuthAPI()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })

  const supabase = await createClient(true)

  // Fetch task before deleting to know who was assigned
  const { data: task } = await supabase
    .from('tasks')
    .select('id, title, assigned_to, user_id')
    .eq('id', params.id)
    .single()

  if (!task) return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })

  // Delete all notifications linked to this task (avoids orphan links to 404)
  await supabase
    .from('notifications')
    .delete()
    .eq('link', `/tasks/${params.id}`)

  // Delete the task
  const { error } = await supabase.from('tasks').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the assigned employee if different from the deleter
  if (task.assigned_to && task.assigned_to !== session.user.id) {
    const deleterName = session.user.full_name || 'Admin'
    await supabase.from('notifications').insert({
      user_id: task.assigned_to,
      title: 'Tâche supprimée',
      message: `La tâche "${task.title}" qui vous était assignée a été supprimée par ${deleterName}.`,
      title_key: 'taskDeleted',
      message_key: 'taskDeletedMessage',
      type: 'warning',
      link: '/tasks',
      sender_id: session.user.id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ success: true })
}
