import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { verifySuperuserAPI } from '@/lib/superuser/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await verifySuperuserAPI()
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 })
    }

    const supabase = await createClient(true)

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_online, last_active_at, force_logout_at')
      .eq('is_online', true)
      .gte('last_active_at', fiveMinutesAgo)
      .order('last_active_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ users: users || [] })
  } catch (err) {
    console.error('[superuser/online]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
