"use client"

import { useEffect } from 'react'

export default function HeartbeatCheck() {
  useEffect(() => {
    const check = () => {
      fetch('/api/auth/heartbeat', { method: 'POST', credentials: 'include' })
        .then(r => {
          if (r.status === 401) {
            window.location.href = '/api/auth/force-logout'
            return null
          }
          return r.json()
        })
        .then(d => {
          if (d && d.force_logout) {
            window.location.href = '/api/auth/force-logout'
          }
        })
        .catch(() => {})
    }

    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  return null
}
