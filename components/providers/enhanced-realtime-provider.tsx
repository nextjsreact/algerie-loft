'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useSupabase } from './supabase-provider'
import { toast } from 'sonner'
import { useNotificationSound } from '@/lib/hooks/use-notification-sound'
import { safeCallback } from '@/lib/utils/callback-safety'
import { useTranslations } from 'next-intl'

interface EnhancedRealtimeContextType {
  unreadMessagesCount: number
  unreadNotificationsCount: number
  isOnline: boolean
  refreshCounts: () => Promise<void>
  playSound: (type: 'success' | 'info' | 'warning' | 'error') => void
}

const EnhancedRealtimeContext = createContext<EnhancedRealtimeContextType>({
  unreadMessagesCount: 0,
  unreadNotificationsCount: 0,
  isOnline: true,
  refreshCounts: async () => {},
  playSound: () => {}
})

export function useEnhancedRealtime() {
  return useContext(EnhancedRealtimeContext)
}

interface EnhancedRealtimeProviderProps {
  children: React.ReactNode
  userId: string
}

export function EnhancedRealtimeProvider({ children, userId }: EnhancedRealtimeProviderProps) {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const { playNotificationSound } = useNotificationSound()
  // Gestion sécurisée des traductions avec fallback
  let t: any;
  try {
    t = useTranslations('notifications');
  } catch (error) {
    // Fallback si les traductions ne sont pas disponibles
    t = (key: string) => key;
  }
  const { supabase } = useSupabase()

  const refreshCounts = useCallback(async () => {
    try {
      // Refresh message count avec gestion d'erreur robuste
      try {
        const messageResponse = await fetch('/api/conversations/unread-count', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (messageResponse.ok) {
          const data = await messageResponse.json()
          setUnreadMessagesCount(data.count || 0)
        } else {
          setUnreadMessagesCount(0)
        }
      } catch (messageError) {
        setUnreadMessagesCount(0)
      }

      // Refresh notification count avec gestion d'erreur
      try {
        const notificationResponse = await fetch('/api/notifications/unread-count', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (notificationResponse.ok) {
          const data = await notificationResponse.json()
          setUnreadNotificationsCount(data.count || 0)
        } else {
          setUnreadNotificationsCount(0)
        }
      } catch (notificationError) {
        setUnreadNotificationsCount(0)
      }
      
    } catch (error) {
      // Erreur générale - ne pas faire planter l'app
      setUnreadMessagesCount(0)
      setUnreadNotificationsCount(0)
    }
  }, [supabase])

  const playSound = useCallback((type: 'success' | 'info' | 'warning' | 'error') => {
    const safePlay = safeCallback(playNotificationSound, () => {
      console.log('Sound playback not available')
    })
    safePlay(type)
  }, [playNotificationSound])

  useEffect(() => {
    // Initial counts fetch
    refreshCounts()

    // The aggressive polling was causing rate-limiting issues.
    // The 30-second interval below is sufficient.
  }, [refreshCounts])

  useEffect(() => {
    // Check if WebSocket is available
    if (typeof window === 'undefined' || !window.WebSocket) {
      return
    }

    // Set up real-time subscription for task notifications
    let notificationsSubscription: any = null
    
    try {
      notificationsSubscription = supabase
        .channel('user_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          async (payload) => {
            try {
          const newNotification = payload.new as any
          

          
          // Determine notification type and sound
          const notificationType = newNotification.type || 'info'
          const isTaskNotification = newNotification.link?.includes('/tasks/')
          
          // Play sound based on notification type (with safety check)
          if (typeof playNotificationSound === 'function') {
            try {
              playNotificationSound(notificationType as any)
            } catch (soundError) {
              console.warn('Sound playback failed:', soundError)
            }
          }
          
          // Update unread count immediately
          setUnreadNotificationsCount(prev => prev + 1)
          
          // Show enhanced toast notification
          const toastOptions: any = {
            description: newNotification.message,
            duration: 6000, // Show for 6 seconds
            action: newNotification.link ? {
              label: t('view'),
              onClick: () => {
                window.location.href = newNotification.link
              }
            } : undefined
          }

          // Different toast styles based on type
          switch (notificationType) {
            case 'success':
              toast.success(newNotification.title, toastOptions)
              break
            case 'warning':
              toast.warning(newNotification.title, toastOptions)
              break
            case 'error':
              toast.error(newNotification.title, toastOptions)
              break
            default:
              toast.info(newNotification.title, toastOptions)
          }

          // Enhanced browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id,
              badge: '/favicon.ico',
              requireInteraction: isTaskNotification, // Keep task notifications visible longer
              silent: false // Allow system sound
            })

            notification.onclick = () => {
              window.focus()
              if (newNotification.link) {
                window.location.href = newNotification.link
              }
              notification.close()
            }

            // Auto-close after 8 seconds for non-task notifications
            if (!isTaskNotification) {
              setTimeout(() => notification.close(), 8000)
            }
          }

          // Trigger page refresh for sidebar badge updates
          // This ensures the red dot appears immediately
          window.dispatchEvent(new CustomEvent('notification-received', {
            detail: { type: notificationType, count: unreadNotificationsCount + 1 }
          }))
            } catch (callbackError) {
              // Erreur silencieuse pour éviter le spam de logs
            }
          }
        )
      .subscribe()
    } catch (error) {
      // Erreur silencieuse pour les notifications temps réel
    }



    // Monitor online status
    const handleOnline = () => {
      setIsOnline(true)
      refreshCounts() // Refresh counts when coming back online
    }
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('🔔 Notifications enabled!', {
            description: 'You\'ll now receive instant notifications for tasks and messages.'
          })
        }
      })
    }

    // Set up periodic refresh (every 30 seconds as backup)
    const refreshInterval = setInterval(refreshCounts, 30000)

    return () => {
      if (notificationsSubscription) {
        try {
          // Use the correct method to unsubscribe
          supabase.removeChannel(notificationsSubscription)
        } catch (error) {
          // Erreur silencieuse lors du cleanup
        }
      }
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(refreshInterval)
    }
  }, [userId, supabase, refreshCounts, playNotificationSound])

  return (
    <EnhancedRealtimeContext.Provider value={{
      unreadMessagesCount,
      unreadNotificationsCount,
      isOnline,
      refreshCounts,
      playSound
    }}>
      {children}
    </EnhancedRealtimeContext.Provider>
  )
}