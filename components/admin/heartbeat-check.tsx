"use client"

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function HeartbeatCheck() {
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('/api/auth/heartbeat', { method: 'POST', credentials: 'include' })
        if (r.status === 401) {
          const supabase = createClient()
          await supabase.auth.signOut()
          window.location.href = '/fr/login'
          return
        }
        const d = await r.json()
        if (d && d.force_logout) {
          const supabase = createClient()
          await supabase.auth.signOut()
          window.location.href = '/fr/login'
        }
      } catch {
        // ignore
      }
    }

    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  return null
}
