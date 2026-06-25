"use client"

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function Heartbeat() {
  useEffect(() => {
    const supabase = createClient()
    let stopped = false

    const check = async () => {
      try {
        console.log('[hb] checking...')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { console.log('[hb] no user'); return }

        const { data: profile } = await supabase
          .from('profiles')
          .select('force_logout_at')
          .eq('id', user.id)
          .single()

        console.log('[hb] profile:', profile)

        if (profile?.force_logout_at && !stopped) {
          console.log('[hb] force_logout DETECTED:', profile.force_logout_at)
          await supabase
            .from('profiles')
            .update({ force_logout_at: null, is_online: false })
            .eq('id', user.id)

          console.log('[hb] calling signOut...')
          await supabase.auth.signOut()
          console.log('[hb] redirected')
          window.location.href = '/fr/login'
        } else {
          await supabase
            .from('profiles')
            .update({ is_online: true, last_active_at: new Date().toISOString() })
            .eq('id', user.id)
        }
      } catch (err) {
        console.log('[hb] error:', err)
      }
    }

    check()
    const interval = setInterval(check, 15_000)
    return () => {
      stopped = true
      clearInterval(interval)
    }
  }, [])

  return null
}
