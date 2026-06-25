"use client"

import { useEffect } from 'react'

export default function HeartbeatCheck() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/auth/heartbeat', { method: 'POST' })
        .then(r => {
          if (r.status === 401) return
          return r.json()
        })
        .then(d => {
          if (d && d.force_logout) {
            window.location.href = '/api/auth/force-logout'
          }
        })
        .catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  return null
}
