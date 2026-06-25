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

    const { data: profile } = await supabase
      .from('profiles')
      .select('force_logout_at')
      .eq('id', user.id)
      .single()

    if (profile?.force_logout_at) {
      await supabase
        .from('profiles')
        .update({ force_logout_at: null, is_online: false })
        .eq('id', user.id)

      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const all = cookieStore.getAll()
      const response = NextResponse.json({ ok: true, force_logout: true })
      for (const c of all) {
        if (c.name.startsWith('sb-')) {
          response.cookies.set(c.name, '', { maxAge: 0, path: '/' })
        }
      }
      return response
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
