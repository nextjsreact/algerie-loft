"use client"

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function Heartbeat() {
  useEffect(() => {
    const supabase = createClient()
    let stopped = false

    const send = async () => {
      try {
        const res = await fetch('/api/auth/heartbeat', { method: 'POST' })
        if (!res.ok) return
        const data = await res.json()
        if (data.force_logout && !stopped) {
          await supabase.auth.signOut()
          window.location.href = '/fr/login'
        }
      } catch {
        // ignore
      }
    }

    send()
    const interval = setInterval(send, 15_000)
    return () => {
      stopped = true
      clearInterval(interval)
    }
  }, [])

  return null
}
