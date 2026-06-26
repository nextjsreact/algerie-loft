import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const supabase = await createClient(true)

    await supabase.auth.admin.signOut(userId)

    const { error } = await supabase
      .from('profiles')
      .update({ is_online: false, force_logout_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) console.error('[force-kick] update error:', error)

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
