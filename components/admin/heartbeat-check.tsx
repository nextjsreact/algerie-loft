"use client"

import { useEffect } from 'react'

export default function HeartbeatCheck() {
  useEffect(() => {
    let mounted = true

    const check = async () => {
      try {
        const r = await fetch('/api/auth/heartbeat', { method: 'POST', credentials: 'include' })
        if (!mounted) return

        if (r.status === 401) return

        const d = await r.json()
        if (d?.force_logout) {
          window.location.href = '/api/auth/force-logout'
        }
      } catch {
        // ignore
      }
    }

    check()
    const interval = setInterval(check, 10000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  return null
}
