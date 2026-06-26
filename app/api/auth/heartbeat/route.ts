import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('force_logout_at')
      .eq('id', user.id)
      .single()

    if (profile?.force_logout_at) {
      return NextResponse.json({ ok: true, force_logout: true })
    }

    await supabase
      .from('profiles')
      .update({
        is_online: true,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    let sessionId: string | null = null
    let deviceInfo: string | null = null
    try {
      const body = await request.json().catch(() => null)
      sessionId = body?.session_id || null
      deviceInfo = body?.device_info || null
    } catch {}

    if (sessionId) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
      await supabase.rpc('upsert_user_session', {
        p_user_id: user.id,
        p_session_id: sessionId,
        p_device_info: deviceInfo,
        p_ip_address: ip,
      })
    }

    await supabase.rpc('cleanup_expired_sessions')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[heartbeat]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
