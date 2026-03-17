import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get('id')

  const anonSupabase = await createClient()
  const { data: { user }, error: authError } = await anonSupabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = await createClient(true)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  // Try to fetch the specific task
  let taskResult = null
  let taskError = null
  if (taskId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, assigned_to, user_id')
      .eq('id', taskId)
      .single()
    taskResult = data
    taskError = error
  }

  // List all tasks to compare
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('id, title')
    .limit(10)

  return NextResponse.json({
    user_id: user.id,
    profile,
    can_delete: profile?.role === 'admin',
    queried_task_id: taskId,
    task_found: taskResult,
    task_error: taskError,
    all_tasks_sample: allTasks
  })
}
