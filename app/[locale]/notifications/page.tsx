'use client'

import { useEffect, useState, useRef } from 'react'
import { NotificationsWrapper } from '@/components/notifications/notifications-wrapper'
import { useNotifications } from '@/components/providers/notification-context'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const initialLoadDone = useRef(false)

  const loadNotifications = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session')
      if (!sessionRes.ok) {
        window.location.href = '/login'
        return
      }
      const sessionData = await sessionRes.json()
      setSession(sessionData)

      const notifRes = await fetch('/api/notifications', { cache: 'no-store' })
      if (notifRes.ok) {
        const { notifications: notifs } = await notifRes.json()
        setNotifications(notifs || [])
      }
    } catch (err) {
      console.error('Error loading notifications page:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialLoadDone.current) return
    initialLoadDone.current = true
    loadNotifications()
    // No event listener here — we don't want re-fetches overwriting local state
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
      onNotificationRead={async (id: string) => {
        await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
        // Don't re-fetch — wrapper handles local state update
      }}
    />
  )
}
