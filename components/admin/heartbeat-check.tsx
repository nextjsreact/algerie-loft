"use client"

import { useEffect } from 'react'

function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem('heartbeat_session_id')
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem('heartbeat_session_id', sid)
    }
    return sid
  } catch {
    return 'fallback-' + Math.random().toString(36).slice(2)
  }
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent
  if (/Mobi|Android|iPhone/i.test(ua)) return 'Mobile'
  if (/Tablet|iPad/i.test(ua)) return 'Tablette'
  return 'Desktop'
}

export default function HeartbeatCheck() {
  useEffect(() => {
    let mounted = true
    const sessionId = getOrCreateSessionId()

    const check = async () => {
      try {
        const r = await fetch('/api/auth/heartbeat', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            device_info: getDeviceInfo(),
          }),
        })
        if (!mounted) return

        if (r.status === 401) return

        const d = await r.json()
        if (d?.force_logout) {
          sessionStorage.removeItem('heartbeat_session_id')
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
