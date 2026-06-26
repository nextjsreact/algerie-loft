"use client"

import { useEffect } from 'react'

export default function HeartbeatCheck() {
  useEffect(() => {
    console.log('[hb] HeartbeatCheck mounted')
    let mounted = true

    const check = async () => {
      try {
        console.log('[hb] polling...')
        const r = await fetch('/api/auth/heartbeat', { method: 'POST', credentials: 'include' })
        if (!mounted) return

        console.log('[hb] status:', r.status)

        if (r.status === 401) {
          console.log('[hb] 401 -> redirecting to force-logout')
          window.location.href = '/api/auth/force-logout'
          return
        }

        const d = await r.json()
        console.log('[hb] response:', d)
        if (d?.force_logout) {
          console.log('[hb] force_logout detected -> redirecting')
          window.location.href = '/api/auth/force-logout'
        }
      } catch (err) {
        console.log('[hb] fetch error:', err)
      }
    }

    check()
    const interval = setInterval(check, 10000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  return null
}