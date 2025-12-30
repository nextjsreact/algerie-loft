'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { ExtendedNotification, ExtendedBookingMessage } from '@/lib/types-notification-extensions'

interface BookingRealtimeContextType {
  unreadNotificationCount: number
  unreadMessageCount: number
  isOnline: boolean
  refreshUnreadCounts: () => Promise<void>
}

const BookingRealtimeContext = createContext<BookingRealtimeContextType>({
  unreadNotificationCount: 0,
  unreadMessageCount: 0,
  isOnline: true,
  refreshUnreadCounts: async () => {}
})

export function useBookingRealtime() {
  return useContext(BookingRealtimeContext)
}

interface BookingRealtimeProviderProps {
  children: React.ReactNode
  userId: string
  userRole: 'client' | 'partner' | 'admin' | 'manager' | 'executive' | 'member' | 'guest'
}

export function BookingRealtimeProvider({ 
  children, 
  userId, 
  userRole 
}: BookingRealtimeProviderProps) {
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const supabase = createClient()
  const t = useTranslations('notifications')

  const refreshUnreadCounts = async () => {
    try {
      // Fetch unread notification count
      const notificationResponse = await fetch('/api/notifications/unread-count')
      if (notificationResponse.ok) {
        const { count } = await notificationResponse.json()
        setUnreadNotificationCount(count)
      }

      // Fetch unread message count for bookings
      const messageResponse = await fetch('/api/bookings/messages/unread-count')
      if (messageResponse.ok) {
        const { count } = await messageResponse.json()
        setUnreadMessageCount(count)
      }
    } catch (error) {
      console.error('Failed to refresh unread counts:', error)
    }
  }

  useEffect(() => {
    // Initial count fetch
    refreshUnreadCounts()

    // Set up real-time subscription for booking notifications
    const notificationsSubscription = supabase
      .channel('booking_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          const newNotification = payload.new as ExtendedNotification
          
          // Update unread count
          setUnreadNotificationCount(prev => prev + 1)
          
          // Show toast notification
          const toastVariant = getToastVariant(newNotification.type)
          const categoryIcon = getCategoryIcon(newNotification.notification_category)
          
          toast.success(newNotification.title, {
            description: newNotification.message,
            icon: categoryIcon,
            action: newNotification.link ? {
              label: t('view'),
              onClick: () => {
                window.location.href = newNotification.link!
              }
            } : undefined
          })

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id,
              badge: '/favicon.ico'
            })
            
            notification.onclick = () => {
              window.focus()
              if (newNotification.link) {
                window.location.href = newNotification.link
              }
            }
          }
        }
      )
      .subscribe()

    // Set up real-time subscription for booking messages
    const messagesSubscription = supabase
      .channel('booking_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_messages',
          filter: `recipient_id=eq.${userId}`
        },
        async (payload) => {
          const newMessage = payload.new as ExtendedBookingMessage
          
          // Update unread message count
          setUnreadMessageCount(prev => prev + 1)
          
          try {
            // Get sender info and booking details
            const [senderResponse, bookingResponse] = await Promise.all([
              supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', newMessage.sender_id)
                .single(),
              supabase
                .from('bookings')
                .select('loft:lofts(name)')
                .eq('id', newMessage.booking_id)
                .single()
            ])

            const senderName = senderResponse.data?.full_name || 
                              senderResponse.data?.email || 
                              'Someone'
            const loftName = bookingResponse.data?.loft?.name || 'your booking'

            // Show toast notification
            toast.success(`New message from ${senderName}`, {
              description: newMessage.message_type === 'attachment' 
                ? `Sent a file: ${newMessage.attachment_name || 'attachment'}`
                : newMessage.message.length > 50 
                  ? newMessage.message.substring(0, 50) + '...' 
                  : newMessage.message,
              action: {
                label: t('view'),
                onClick: () => {
                  window.location.href = `/bookings/${newMessage.booking_id}/messages`
                }
              }
            })

            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification(`New message about ${loftName}`, {
                body: newMessage.message_type === 'attachment' 
                  ? `${senderName} sent you a file`
                  : newMessage.message,
                icon: '/favicon.ico',
                tag: newMessage.booking_id
              })
              
              notification.onclick = () => {
                window.focus()
                window.location.href = `/bookings/${newMessage.booking_id}/messages`
              }
            }

          } catch (error) {
            console.error('Error processing message notification:', error)
          }
        }
      )
      .subscribe()

    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      notificationsSubscription.unsubscribe()
      messagesSubscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [userId, supabase, t])

  const getToastVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'default'
      case 'warning':
      case 'error':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'booking':
        return '📅'
      case 'payment':
        return '💳'
      case 'message':
        return '💬'
      case 'system':
        return '⚙️'
      default:
        return '🔔'
    }
  }

  return (
    <BookingRealtimeContext.Provider value={{
      unreadNotificationCount,
      unreadMessageCount,
      isOnline,
      refreshUnreadCounts
    }}>
      {children}
    </BookingRealtimeContext.Provider>
  )
}