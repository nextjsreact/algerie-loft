'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useNotificationSound } from '@/lib/hooks/use-notification-sound'
import { useTranslations } from 'next-intl'

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
  const { playNotificationSound } = useNotificationSound()
  
  // Safe translation hook with error handling
  let t: any;
  try {
    t = useTranslations('notifications');
  } catch (error) {
    t = (key: string) => key; // Fallback
  }
  
  const supabase = createClient()
  
  const refreshNotifications = async () => {
    if (!userId) return;
    
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (!error) {
        setUnreadCount(count || 0)
        console.log(`📊 Notification count updated: ${count}`)
      }
    } catch (error) {
      console.error('Failed to fetch notifications count:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }

  useEffect(() => {
    if (!userId) return;
    
    // Initial fetch
    refreshNotifications()

    // Set up real-time subscription
    const subscription = supabase
      .channel('notification-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('🔔 New notification received:', payload)
          
          // Update count
          setUnreadCount(prev => prev + 1)
          
          // Play sound
          const notificationType = (payload.new as any).type || 'info'
          playNotificationSound(notificationType as any)
          
          // Show toast
          const notification = payload.new as any
          toast[notificationType as 'success' | 'info' | 'warning' | 'error' || 'info'](notification.title, {
            description: notification.message,
            duration: 6000,
            action: notification.link ? {
              label: t('view'),
              onClick: () => {
                window.location.href = notification.link
              }
            } : undefined
          })
          
          // Force UI update
          document.dispatchEvent(new CustomEvent('notification-received', { detail: notification }))
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
        async (payload) => {
          console.log('🔔 Notification updated:', payload)
          
          // If notification was marked as read, decrease count
          const oldNotification = payload.old as any
          const newNotification = payload.new as any
          
          if (!oldNotification.is_read && newNotification.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, supabase, playNotificationSound])

  // Return default context if no userId
  if (!userId) {
    return (
      <NotificationContext.Provider value={{ unreadCount: 0, refreshNotifications: async () => {}, markAllAsRead: async () => {} }}>
        {children}
      </NotificationContext.Provider>
    )
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifications, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  )
}