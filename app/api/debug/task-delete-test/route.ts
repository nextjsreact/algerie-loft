import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const anonSupabase = await createClient()
  const { data: { user }, error: authError } = await anonSupabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const supabase = await createClient(true)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .single()

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title')
    .limit(5)

  return NextResponse.json({
    user_id: user.id,
    user_email: user.email,
    profile,
    can_delete: profile?.role === 'admin',
    sample_tasks: tasks
  })
}
