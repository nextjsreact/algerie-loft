import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'
import { taskSchema } from '@/lib/validations'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireAuthAPI()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  if (!['admin', 'manager'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Permission refusée' }, { status: 403 })
  }

  const body = await request.json()
  const validatedData = taskSchema.parse(body)

  const supabase = await createClient(true)

  const { data: existing, error: fetchErr } = await supabase
    .from('tasks')
    .select('id, title, assigned_to, due_date, status, loft_id')
    .eq('id', id)
    .single()

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })
  }

  const { data: updated, error: updateErr } = await supabase
    .from('tasks')
    .update({
      ...validatedData,
      due_date: validatedData.due_date ? new Date(validatedData.due_date).toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  const newAssignedTo = validatedData.assigned_to || null
  const oldAssignedTo = existing.assigned_to || null
  const updaterName = session.user.full_name || 'Manager'

  let loftName: string | undefined
  const loftId = validatedData.loft_id || existing.loft_id
  if (loftId) {
    const { data: loft } = await supabase.from('lofts').select('name').eq('id', loftId).single()
    loftName = loft?.name
  }

  const notifications: Array<{ user_id: string; title: string; message: string }> = []

  if (newAssignedTo && newAssignedTo !== oldAssignedTo && newAssignedTo !== session.user.id) {
    notifications.push({
      user_id: newAssignedTo,
      title: 'Nouvelle tâche assignée',
      message: `"${validatedData.title}" vous a été assignée par ${updaterName}${loftName ? ` (${loftName})` : ''}${validatedData.due_date ? `. Échéance: ${new Date(validatedData.due_date).toLocaleDateString('fr-FR')}` : ''}`,
    })
  }

  const assigneeToNotify = newAssignedTo || oldAssignedTo
  if (assigneeToNotify && assigneeToNotify !== session.user.id && newAssignedTo === oldAssignedTo) {
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

    notifications.push({
      user_id: assigneeToNotify,
      title: 'Tâche modifiée',
      message: changes.length > 0
        ? `${updaterName} a modifié la tâche "${validatedData.title}" : ${changes.join(', ')}`
        : `${updaterName} a mis à jour la tâche "${validatedData.title}"${loftName ? ` (${loftName})` : ''}`,
    })
  }

  for (const notif of notifications) {
    await supabase.from('notifications').insert({
      ...notif,
      title_key: 'taskUpdated',
      message_key: 'taskUpdatedMessage',
      type: 'info',
      link: `/tasks/${id}`,
      sender_id: session.user.id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ task: updated })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const anonSupabase = await createClient()
  const { data: { user }, error: authError } = await anonSupabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = await createClient(true)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Permission refusée — admin uniquement' }, { status: 403 })
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('id, title, assigned_to')
    .eq('id', id)
    .single()

  if (!task) return NextResponse.json({ error: 'Tâche introuvable' }, { status: 404 })

  await supabase.from('notifications').delete().eq('link', `/tasks/${id}`)

  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (task.assigned_to && task.assigned_to !== user.id) {
    const deleterName = profile.full_name || 'Admin'
    await supabase.from('notifications').insert({
      user_id: task.assigned_to,
      title: 'Tâche supprimée',
      message: `La tâche "${task.title}" qui vous était assignée a été supprimée par ${deleterName}.`,
      title_key: 'taskDeleted',
      message_key: 'taskDeletedMessage',
      type: 'warning',
      link: '/tasks',
      sender_id: user.id,
      is_read: false,
      created_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ success: true })
}
