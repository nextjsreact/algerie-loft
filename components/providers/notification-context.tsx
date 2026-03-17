'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

interface NotificationContextType {
  unreadCount: number
  refreshNotifications: () => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refreshNotifications: async () => {},
  markAllAsRead: async () => {}
})

export function useNotifications() {
  return useContext(NotificationContext)
}

export function NotificationProvider({ children, userId }: { children: React.ReactNode, userId: string }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const fetchCount = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' })
      if (res.ok) {
        const { count } = await res.json()
        setUnreadCount(count ?? 0)
      }
    } catch (err) {
      console.error('Failed to fetch notification count:', err)
    }
  }, [userId])

  const refreshNotifications = fetchCount

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    // Optimistic: zero immediately
    setUnreadCount(0)
    await fetch('/api/notifications/mark-all-read', { method: 'POST' })
    // Re-fetch after a short delay to confirm DB state
    setTimeout(fetchCount, 2000)
  }, [userId, fetchCount])

  useEffect(() => {
    if (!userId) return

    fetchCount()

    // Poll every 15 seconds
    const pollInterval = setInterval(fetchCount, 15_000)

    // Realtime: only listen for INSERT (new notifications coming in)
    let subscription: any = null
    try {
      subscription = supabase
        .channel(`notif-${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
          (payload) => {
            const notif = payload.new as any
            console.log('🔔 Realtime INSERT:', notif.title_key)
            setUnreadCount(prev => prev + 1)
            document.dispatchEvent(new CustomEvent('notification-received', { detail: notif }))
          }
        )
        .subscribe()
    } catch (err) {
      console.warn('Realtime subscription failed:', err)
    }

    return () => {
      clearInterval(pollInterval)
      if (subscription) supabase.removeChannel(subscription).catch(() => {})
    }
  }, [userId])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifications, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}
