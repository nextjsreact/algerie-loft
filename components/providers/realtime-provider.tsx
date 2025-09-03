'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface RealtimeContextType {
  unreadMessagesCount: number
  isOnline: boolean
  refreshUnreadCount: () => Promise<void>
}

const RealtimeContext = createContext<RealtimeContextType>({
  unreadMessagesCount: 0,
  isOnline: true,
  refreshUnreadCount: async () => {}
})

export function useRealtime() {
  return useContext(RealtimeContext)
}

interface RealtimeProviderProps {
  children: React.ReactNode
  userId: string
}

export function RealtimeProvider({ children, userId }: RealtimeProviderProps) {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const supabase = createClient()
  const t = useTranslations('notifications');

  const refreshUnreadCount = async () => {
    try {
      const response = await fetch('/api/conversations/unread-count')
      if (response.ok) {
        const { count } = await response.json()
        setUnreadMessagesCount(count)
      }
    } catch (error) {
      console.error('Failed to refresh unread count:', error)
    }
  }

  useEffect(() => {
    // Initial unread count fetch
    refreshUnreadCount()

    // Set up real-time subscription for new messages (only if conversations system is set up)
    let messagesSubscription: any = null
    
    // Check if conversations system is available before subscribing
    const checkConversationsSystem = async () => {
      try {
        const { error } = await supabase
          .from('conversation_participants')
          .select('id', { count: 'exact', head: true })
          .limit(1)
        
        if (!error) {
          // Conversations system is available, set up subscription
          messagesSubscription = supabase
            .channel('user_messages')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `sender_id=neq.${userId}` // Only messages not from current user
              },
              async (payload) => {
                const newMessage = payload.new as any
                
                try {
                  // Check if this message is in a conversation the user participates in
                  const { data: participation } = await supabase
                    .from('conversation_participants')
                    .select('id')
                    .eq('conversation_id', newMessage.conversation_id)
                    .eq('user_id', userId)
                    .single()

                  if (participation) {
                    // Get sender info for notification
                    const { data: sender } = await supabase
                      .from('profiles')
                      .select('full_name, email')
                      .eq('id', newMessage.sender_id)
                      .single()

                    const senderName = sender?.full_name || sender?.email || 'Someone'
                    
                    // Update unread count
                    setUnreadMessagesCount(prev => prev + 1)
                    
                    // Show toast notification
                    toast.success(t('notifications.newMessageFrom').replace('{name}', senderName), {
                      description: newMessage.content.length > 50 
                        ? newMessage.content.substring(0, 50) + '...' 
                        : newMessage.content,
                      action: {
                        label: t('notifications.view'),
                        onClick: () => {
                          window.location.href = `/conversations/${newMessage.conversation_id}`
                        }
                      }
                    })

                    // Browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                      new Notification(t('notifications.newMessageFrom').replace('{name}', senderName), {
                        body: newMessage.content,
                        icon: '/favicon.ico',
                        tag: newMessage.conversation_id
                      })
                    }
                  }
                } catch (error) {
                  console.error('Error processing message notification:', error)
                }
              }
            )
            .subscribe()
        } else {
          console.log('Conversations system not available, skipping message subscriptions')
        }
      } catch (error) {
        console.log('Conversations system not available, skipping message subscriptions:', error)
      }
    }
    
    checkConversationsSystem()

    // Set up real-time subscription for task notifications
    const notificationsSubscription = supabase
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
          const newNotification = payload.new as any
          
          // Show toast notification for task-related notifications
          const isTaskNotification = newNotification.link?.includes('/tasks/')
          const notificationType = newNotification.type || 'info'
          
          let toastVariant = 'default'
          if (notificationType === 'success') toastVariant = 'default'
          else if (notificationType === 'warning') toastVariant = 'destructive'
          else if (notificationType === 'error') toastVariant = 'destructive'
          
          toast.success(newNotification.title, {
            description: newNotification.message,
            action: newNotification.link ? {
              label: t('notifications.view'),
              onClick: () => {
                window.location.href = newNotification.link
              }
            } : undefined
          })

          // Browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/favicon.ico',
              tag: newNotification.id
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
      if (messagesSubscription) {
        messagesSubscription.unsubscribe()
      }
      notificationsSubscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [userId, supabase])

  return (
    <RealtimeContext.Provider value={{
      unreadMessagesCount,
      isOnline,
      refreshUnreadCount
    }}>
      {children}
    </RealtimeContext.Provider>
  )
}