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

const MEMBER_ALLOWED_CATEGORIES = new Set(['task', 'general'])
const MEMBER_ALLOWED_TYPES = new Set([
  'info', 'success', 'warning', 'error', 'welcome',
  'profile_updated', 'password_changed',
  'task_assigned', 'task_updated', 'task_completed', 'task_overdue',
  'task_reassigned', 'task_due_date_changed', 'task_status_changed',
  'task_deleted', 'newTaskAssigned'
])

export function NotificationProvider({ children, userId }: { children: React.ReactNode, userId: string }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMember, setIsMember] = useState<boolean | null>(null)
  // Track if we've already set up subscriptions — prevents re-setup on re-renders
  const initializedRef = useRef<string | null>(null)
  const supabaseRef = useRef(createClient())

  // Detect if user is member (restricted notifications)
  useEffect(() => {
    if (!userId) return
    const supabase = supabaseRef.current
    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setIsMember(data?.role === 'member')
      })
      .catch(() => setIsMember(false))
  }, [userId])

  const fetchCount = useCallback(async () => {
    if (!userId) return
    try {
      const supabase = supabaseRef.current
      let query = supabase
        .from('notifications')
        .select('id, type, notification_category', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      // For members: only count task and general notifications
      if (isMember === true) {
        query = query.or(
          'notification_category.in.(task,general),and(notification_category.is.null,type.in.(task_assigned,task_updated,task_completed,task_overdue,task_reassigned,task_due_date_changed,task_status_changed,task_deleted,newTaskAssigned,info,success,warning,error,welcome,profile_updated,password_changed))'
        )
      }

      const { count } = await query.then(r => ({ count: r.count ?? 0 }))
      setUnreadCount(count)
    } catch (err) {
      console.error('Failed to fetch notification count:', err)
    }
  }, [userId, isMember])

  const refreshNotifications = fetchCount

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    // Optimistic: zero immediately
    setUnreadCount(0)
    try {
      // Must use API route — direct Supabase client is blocked by RLS
      const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      if (!res.ok) {
        console.error('mark-all-read failed:', await res.text())
        fetchCount() // revert
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      fetchCount()
    }
  }, [userId, fetchCount])

  useEffect(() => {
    if (!userId || isMember === null) return
    // Only initialize once per userId — prevents re-setup on parent re-renders
    if (initializedRef.current === `${userId}-${isMember}`) return
    initializedRef.current = `${userId}-${isMember}`

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
          const newNotif = payload.new as any
          console.log('🔔 New notification:', newNotif.title_key)

          // For members: only count task and general notifications
          if (isMember === true) {
            const category = newNotif.notification_category
            const type = newNotif.type
            const isAllowed =
              (category && MEMBER_ALLOWED_CATEGORIES.has(category)) ||
              (!category && MEMBER_ALLOWED_TYPES.has(type))
            if (!isAllowed) return
          }

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
  }, [userId, fetchCount, isMember])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifications, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}
