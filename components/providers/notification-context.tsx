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
  // Track if we've already set up subscriptions — prevents re-setup on re-renders
  const initializedRef = useRef<string | null>(null)
  const supabaseRef = useRef(createClient())

  const fetchCount = useCallback(async () => {
    if (!userId) return
    try {
      const { count } = await supabaseRef.current
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .then(r => ({ count: r.count ?? 0 }))
      setUnreadCount(count)
    } catch (err) {
      console.error('Failed to fetch notification count:', err)
    }
  }, [userId])

  const refreshNotifications = fetchCount

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    // Optimistic: zero immediately
    setUnreadCount(0)
    try {
      await supabaseRef.current
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      // Revert on error
      fetchCount()
    }
  }, [userId, fetchCount])

  useEffect(() => {
    if (!userId) return
    // Only initialize once per userId — prevents re-setup on parent re-renders
    if (initializedRef.current === userId) return
    initializedRef.current = userId

    const supabase = supabaseRef.current

    fetchCount()

    // Poll every 30 seconds as fallback
    const pollInterval = setInterval(fetchCount, 30_000)

    // Realtime: listen for INSERT only (new notifications)
    const subscription = supabase
      .channel(`notif-count-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('🔔 New notification:', (payload.new as any).title_key)
          setUnreadCount(prev => prev + 1)
          document.dispatchEvent(new CustomEvent('notification-received', { detail: payload.new }))
        }
      )
      .subscribe()

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(subscription).catch(() => {})
      initializedRef.current = null
    }
  }, [userId, fetchCount])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifications, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}
