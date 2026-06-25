import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { verifySuperuserAPI } from '@/lib/superuser/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifySuperuserAPI()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient(true)

    const now = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_online: false,
        force_logout_at: now,
      })
      .eq('id', id)

    if (updateError) throw updateError

    await supabase
      .from('audit_logs')
      .insert({
        user_id: auth.superuser?.user_id,
        action_type: 'force_logout',
        entity_type: 'user',
        entity_id: id,
        details: { forced_by: auth.superuser?.user_id, forced_at: now },
      })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[superuser/online/disconnect]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
