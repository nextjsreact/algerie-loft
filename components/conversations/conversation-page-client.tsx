'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ConversationHeader } from '@/components/conversations/conversation-header'
import { MessagesList } from '@/components/conversations/messages-list'
import { MessageInputRealtime } from '@/components/conversations/message-input-realtime'
import { Conversation, Message } from '@/lib/services/conversations'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface ConversationPageClientProps {
  initialConversation: Conversation
  initialMessages: Message[]
  currentUserId: string
}

export function ConversationPageClient({
  initialConversation,
  initialMessages,
  currentUserId
}: ConversationPageClientProps) {
  const [conversation, setConversation] = useState(initialConversation)
  const [messages, setMessages] = useState(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations('conversations')
  const supabase = createClient()
  const router = useRouter()

  const addMessage = useCallback((newMessage: Message) => {
    setMessages(prev => {
      // Check if message already exists to prevent duplicates
      if (prev.some(msg => msg.id === newMessage.id)) {
        return prev
      }
      return [...prev, newMessage]
    })
  }, [])

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ))
  }, [])

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])

  // Set up real-time subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          // Only add if it's not from the current user (to avoid duplicates)
          if (newMessage.sender_id !== currentUserId) {
            addMessage(newMessage)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message
          updateMessage(updatedMessage.id, updatedMessage)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const deletedMessage = payload.old as Message
          deleteMessage(deletedMessage.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation.id, currentUserId, addMessage, updateMessage, deleteMessage, supabase])

  const handleSendMessage = async (content: string, messageType: 'text' | 'image' = 'text') => {
    if (!content.trim()) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content: content.trim(),
          message_type: messageType
        })
        .select()
        .single()

      if (error) throw error

      // Add the message immediately for the sender
      addMessage(data as Message)
      
      // Update conversation's last message
      setConversation(prev => ({
        ...prev,
        last_message: content.trim(),
        last_message_at: new Date().toISOString()
      }))

    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(t('errorSendingMessage'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ConversationHeader 
        conversation={conversation}
        currentUserId={currentUserId}
      />
      
      <div className="flex-1 overflow-hidden">
        <MessagesList 
          messages={messages}
          currentUserId={currentUserId}
          conversationId={conversation.id}
        />
      </div>
      
      <MessageInputRealtime
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder={t('typeMessage')}
      />
    </div>
  )
}