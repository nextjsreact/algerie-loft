"use client"

import { useEffect } from 'react'

export default function Heartbeat() {
  useEffect(() => {
    const send = () => {
      fetch('/api/auth/heartbeat', { method: 'POST' }).catch(() => {})
    }
    send()
    const interval = setInterval(send, 60_000)
    return () => clearInterval(interval)
  }, [])

  return null
}
