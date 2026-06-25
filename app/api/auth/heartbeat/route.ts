import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createClient(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const now = new Date().toISOString()

    await supabase
      .from('profiles')
      .update({
        is_online: true,
        last_active_at: now,
      })
      .eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[heartbeat]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
