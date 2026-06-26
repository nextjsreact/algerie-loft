"use client"

import { useEffect } from 'react'

export default function HeartbeatCheck() {
  useEffect(() => {
    console.log('[hb] UNIQUE_MARKER_1782483512 HeartbeatCheck mounted')
    let mounted = true

    const check = async () => {
      try {
        console.log('[hb] UNIQUE_MARKER_1782483512 polling...')
        const r = await fetch('/api/auth/heartbeat', { method: 'POST', credentials: 'include' })
        if (!mounted) return

        console.log('[hb] UNIQUE_MARKER_1782483512 status:', r.status)

        if (r.status === 401) {
          console.log('[hb] UNIQUE_MARKER_1782483512 401 -> redirecting to force-logout')
          window.location.href = '/api/auth/force-logout'
          return
        }

        const d = await r.json()
        console.log('[hb] UNIQUE_MARKER_1782483512 response:', d)
        if (d?.force_logout) {
          console.log('[hb] UNIQUE_MARKER_1782483512 force_logout detected -> redirecting')
          window.location.href = '/api/auth/force-logout'
        }
      } catch (err) {
        console.log('[hb] UNIQUE_MARKER_1782483512 fetch error:', err)
      }
    }

    check()
    const interval = setInterval(check, 10000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  return null
}
