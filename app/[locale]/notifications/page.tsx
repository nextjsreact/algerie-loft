'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { NotificationsWrapper, type AirbnbNotificationItem } from '@/components/notifications/notifications-wrapper'
import { useNotifications } from '@/components/providers/notification-context'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [airbnbNotifications, setAirbnbNotifications] = useState<AirbnbNotificationItem[]>([])
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const initialLoadDone = useRef(false)
  const { refreshNotifications } = useNotifications()

  const loadNotifications = useCallback(async () => {
    try {
      const sessionRes = await fetch('/api/auth/session')
      if (!sessionRes.ok) {
        window.location.href = '/login'
        return
      }
      const sessionData = await sessionRes.json()
      setSession(sessionData)

      const [notifRes, airbnbRes] = await Promise.all([
        fetch('/api/notifications', { cache: 'no-store' }),
        fetch('/api/airbnb/notifications?limit=100', { cache: 'no-store' }),
      ])

      if (notifRes.ok) {
        const { notifications: notifs } = await notifRes.json()
        setNotifications(notifs || [])
      }
      if (airbnbRes.ok) {
        const data = await airbnbRes.json()
        setAirbnbNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error('Error loading notifications page:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    const handler = () => {
      fetch('/api/airbnb/notifications?limit=100', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setAirbnbNotifications(data.notifications || []) })
        .catch(() => {})
    }
    window.addEventListener('airbnb-notifications-changed', handler)
    return () => window.removeEventListener('airbnb-notifications-changed', handler)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!session) return null

  return (
    <NotificationsWrapper
      notifications={notifications}
      userRole={session.user?.role || 'employee'}
      userId={session.user?.id || ''}
      airbnbNotifications={airbnbNotifications}
      onNotificationRead={async (id: string) => {
        await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
        refreshNotifications()
      }}
      onAirbnbNotificationRead={async (id: string) => {
        const res = await fetch(`/api/airbnb/notifications/${id}/read`, { method: 'POST' })
        if (!res.ok) throw new Error('Failed to mark as read')
      }}
      onAirbnbMarkAllRead={async () => {
        const res = await fetch('/api/airbnb/notifications/read-all', { method: 'POST' })
        if (!res.ok) throw new Error('Failed to mark all as read')
      }}
    />
  )
}
