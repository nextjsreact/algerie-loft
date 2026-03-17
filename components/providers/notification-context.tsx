'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
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
  const [blockPoll, setBlockPoll] = useState(false)
  const supabase = createClient()

  const [blockPoll, setBlockPoll] = useState(false)

  // Fetch unread count via API (uses service role — bypasses RLS)
  const refreshNotifications = useCallback(async () => {
    if (!userId || blockPoll) return
    try {
      const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' })
      if (res.ok) {
        const { count } = await res.json()
        setUnreadCount(count || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notification count:', err)
    }
  }, [userId, blockPoll])

  // Mark all as read via API (uses service role)
  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    try {
      // Set count to 0 immediately
      setUnreadCount(0)
      // Block polling for 5s to prevent read-receipt notifications from bumping count back up
      setBlockPoll(true)
      setTimeout(() => setBlockPoll(false), 5000)
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
            const notif = payload.new as any
            console.log('🔔 New notification received:', notif)
            // Don't increment count for read-receipt notifications we triggered ourselves
            // (those are sent TO the sender, not to us — but just in case)
            setUnreadCount(prev => prev + 1)
            document.dispatchEvent(new CustomEvent('notification-received', { detail: notif }))
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const oldN = payload.old as any
            const newN = payload.new as any
            if (!oldN.is_read && newN.is_read) {
              setUnreadCount(prev => Math.max(0, prev - 1))
            }
          }
        )
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
