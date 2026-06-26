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

    const userIds = (users || []).map(u => u.id)

    let sessionsMap: Record<string, Array<{ session_id: string; device_info: string | null; ip_address: string | null; last_seen: string }>> = {}

    if (userIds.length > 0) {
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('user_id, session_id, device_info, ip_address, last_seen')
        .in('user_id', userIds)
        .gte('last_seen', fiveMinutesAgo)
        .order('last_seen', { ascending: false })

      if (sessions) {
        for (const s of sessions) {
          if (!sessionsMap[s.user_id]) sessionsMap[s.user_id] = []
          sessionsMap[s.user_id].push({
            session_id: s.session_id,
            device_info: s.device_info,
            ip_address: s.ip_address,
            last_seen: s.last_seen,
          })
        }
      }
    }

    const enrichedUsers = (users || []).map(u => ({
      ...u,
      session_count: sessionsMap[u.id]?.length || 0,
      sessions: sessionsMap[u.id] || [],
    }))

    return NextResponse.json({ users: enrichedUsers })
  } catch (err) {
    console.error('[superuser/online]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
