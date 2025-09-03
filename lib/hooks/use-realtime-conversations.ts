'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Conversation, Message } from '@/lib/services/conversations'
import { toast } from 'sonner'

interface RealtimeConversationsHook {
  conversations: Conversation[]
  unreadCount: number
  isLoading: boolean
  refreshConversations: () => Promise<void>
  markConversationAsRead: (conversationId: string) => void
}

export function useRealtimeConversations(
  initialConversations: Conversation[],
  currentUserId: string
): RealtimeConversationsHook {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  // Calculate total unread count
  const unreadCount = conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0)

  const refreshConversations = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const updatedConversations = await response.json()
        setConversations(updatedConversations)
      }
    } catch (error) {
      console.error('Failed to refresh conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markConversationAsRead = useCallback((conversationId: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    )
  }, [])

  const updateConversationWithNewMessage = useCallback((message: Message) => {
    setConversations(prev => {
      const updatedConversations = prev.map(conv => {
        if (conv.id === message.conversation_id) {
          return {
            ...conv,
            last_message: message,
            updated_at: message.created_at,
            unread_count: message.sender_id === currentUserId ? 0 : (conv.unread_count || 0) + 1
          }
        }
        return conv
      })

      // Sort by updated_at (most recent first)
      return updatedConversations.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
    })

    // Show notification for messages from others
    if (message.sender_id !== currentUserId) {
      const conversation = conversations.find(c => c.id === message.conversation_id)
      const senderName = message.sender?.full_name || 'Someone'
      const conversationName = conversation?.name || senderName
      
      // Dispatch custom event for sound notification
      document.dispatchEvent(new CustomEvent('new-message-received', { 
        detail: { message, senderName, conversationName } 
      }))
      
      toast.success(`New message from ${senderName}`, {
        description: message.content.length > 50 
          ? message.content.substring(0, 50) + '...' 
          : message.content,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = `/conversations/${message.conversation_id}`
          }
        }
      })

      // Browser notification (if permission granted)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New message from ${senderName}`, {
          body: message.content,
          icon: '/favicon.ico',
          tag: message.conversation_id // Prevent duplicate notifications
        })
      }
    }
  }, [conversations, currentUserId])

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const newMessage = payload.new as any
          
          // Check if this message is for a conversation the user participates in
          supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', newMessage.conversation_id)
            .eq('user_id', currentUserId)
            .single()
            .then(({ data, error }) => {
              if (data && !error) {
                // Fetch full message data with sender info
                supabase
                  .from('messages')
                  .select(`
                    *,
                    sender:profiles!inner(*)
                  `)
                  .eq('id', newMessage.id)
                  .single<Message>()
              }
            })
        }
      )
      .subscribe()

    // Subscribe to conversation updates
    const conversationsSubscription = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          const updatedConversation = payload.new as any
          setConversations(prev => 
            prev.map(conv => 
              conv.id === updatedConversation.id 
                ? { ...conv, ...updatedConversation }
                : conv
            )
          )
        }
      )
      .subscribe()

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      messagesSubscription.unsubscribe()
      conversationsSubscription.unsubscribe()
    }
  }, [supabase, currentUserId, updateConversationWithNewMessage])

  return {
    conversations,
    unreadCount,
    isLoading,
    refreshConversations,
    markConversationAsRead
  }
}