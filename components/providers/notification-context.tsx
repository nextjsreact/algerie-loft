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
  // Use a ref so closures always see the latest value without stale captures
  const blockUntilRef = useRef<number>(0)
  const supabase = createClient()

  const isBlocked = () => Date.now() < blockUntilRef.current

  // Fetch unread count via API (uses service role — bypasses RLS)
  const refreshNotifications = useCallback(async () => {
    if (!userId || isBlocked()) return
    try {
      const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' })
      if (res.ok) {
        const { count } = await res.json()
        setUnreadCount(count || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notification count:', err)
    }
  }, [userId])

  // Mark all as read via API (uses service role)
  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    // Optimistic: set to 0 immediately
    setUnreadCount(0)
    // Block all updates (poll + realtime) for 15 seconds
    // This covers: the API call + read-receipt inserts + any realtime events
    blockUntilRef.current = Date.now() + 15_000
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' })
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    // Initial fetch
    refreshNotifications()

    // Poll every 10 seconds as reliable fallback
    const pollInterval = setInterval(refreshNotifications, 10_000)

    // Real-time subscription for instant updates
    let subscription: any = null
    try {
      subscription = supabase
        .channel(`notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            // Skip all realtime events during block window
            if (isBlocked()) return
            const notif = payload.new as any
            console.log('🔔 New notification received:', notif)
            setUnreadCount(prev => prev + 1)
            document.dispatchEvent(new CustomEvent('notification-received', { detail: notif }))
          }
        )
        // Do NOT handle UPDATE events — they cause double-decrement when mark-all-read fires
        // The poll handles eventual consistency
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Notification realtime subscription active')
          }
        })
    } catch (err) {
      console.warn('Realtime subscription failed (non-critical):', err)
    }

    return () => {
      clearInterval(pollInterval)
      if (subscription) {
        supabase.removeChannel(subscription).catch(() => {})
      }
    }
  }, [userId])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifications, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}
