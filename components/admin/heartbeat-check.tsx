"use client"

import { useEffect } from 'react'

export default function HeartbeatCheck() {
  useEffect(() => {
    let mounted = true

    const check = async () => {
      try {
        const r = await fetch('/api/auth/heartbeat', { method: 'POST', credentials: 'include' })
        if (!mounted) return

        if (r.status === 401) {
          window.location.href = '/api/auth/force-logout'
          return
        }

        const d = await r.json()
        if (d?.force_logout) {
          window.location.href = '/api/auth/force-logout'
        }
      } catch {
        // ignore network errors
      }
    }

    check()
    const interval = setInterval(check, 10000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  return null
}
