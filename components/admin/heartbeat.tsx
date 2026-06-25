"use client"

import { useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function Heartbeat() {
  const supabaseRef = useRef<ReturnType<typeof createBrowserClient> | null>(null)

  useEffect(() => {
    supabaseRef.current = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  useEffect(() => {
    const send = async () => {
      try {
        const res = await fetch('/api/auth/heartbeat', { method: 'POST' })
        if (!res.ok) return
        const data = await res.json()
        if (data.force_logout && supabaseRef.current) {
          await supabaseRef.current.auth.signOut()
          window.location.href = '/fr/login'
        }
      } catch {
        // ignore
      }
    }
    send()
    const interval = setInterval(send, 30_000)
    return () => clearInterval(interval)
  }, [])

  return null
}
