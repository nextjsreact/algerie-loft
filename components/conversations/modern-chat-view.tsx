'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Phone, Video, MoreVertical, Send, Smile, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ModernMessagesList } from './modern-messages-list'
import { TypingIndicator } from './typing-indicator'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { SimpleMessage } from '@/lib/services/conversations-simple'

interface ModernChatViewProps {
  conversationId: string
  currentUserId: string
  onBack?: () => void
  showBackButton?: boolean
}

export function ModernChatView({
  conversationId,
  currentUserId,
  onBack,
  showBackButton = false
}: ModernChatViewProps) {
  const t = useTranslations('conversations')
  const [messages, setMessages] = useState<SimpleMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [conversationInfo, setConversationInfo] = useState<any>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Charger les messages initiaux
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/conversations/${conversationId}/messages`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
          setConversationInfo(data.conversation)
        }
      } catch (error) {
        console.error('Error loading messages:', error)
        toast.error(t('errorLoadingMessages'))
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [conversationId, t])

  // Configuration Supabase Realtime
  useEffect(() => {
    const supabase = createClient()
    
    // Marquer comme lu
    const markAsRead = async () => {
      try {
        await fetch(`/api/conversations/${conversationId}/mark-read`, {
          method: 'POST'
        })
      } catch (error) {
        console.error('Error marking as read:', error)
      }
    }

    markAsRead()

    // Écouter les nouveaux messages
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as SimpleMessage
          setMessages(prev => [...prev, newMessage])
          markAsRead()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  // Gestion de la frappe (typing indicator)
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout

    const handleTyping = () => {
      if (!isTyping) {
        setIsTyping(true)
        // Envoyer l'événement de frappe (à implémenter)
      }

      clearTimeout(typingTimeout)
      typingTimeout = setTimeout(() => {
        setIsTyping(false)
        // Arrêter l'événement de frappe (à implémenter)
      }, 1000)
    }

    const input = inputRef.current
    if (input) {
      input.addEventListener('input', handleTyping)
      return () => {
        input.removeEventListener('input', handleTyping)
        clearTimeout(typingTimeout)
      }
    }
  }, [isTyping])

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    const messageContent = newMessage.trim()
    setNewMessage('')
    setIsSending(true)

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent
        })
      })

      if (response.ok) {
        const sentMessage = await response.json()
        // Le message sera ajouté via Realtime
      } else {
        const error = await response.json()
        toast.error(error.message || t('errorSending'))
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(t('errorSendingMessage'))
      setNewMessage(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getConversationName = () => {
    if (!conversationInfo) return t('conversation')
    
    if (conversationInfo.name) return conversationInfo.name
    
    if (conversationInfo.type === 'direct') {
      const otherParticipant = conversationInfo.participants?.find(
        (p: any) => p.user_id !== currentUserId
      )
      return otherParticipant?.user?.full_name || t('user')
    }
    
    return `${t('group')} ${conversationInfo.id.slice(0, 8)}`
  }

  const getConversationAvatar = () => {
    if (!conversationInfo || conversationInfo.type !== 'direct') return null
    
    const otherParticipant = conversationInfo.participants?.find(
      (p: any) => p.user_id !== currentUserId
    )
    return otherParticipant?.user?.avatar_url
  }

  const getConversationInitials = () => {
    const name = getConversationName()
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header de la conversation */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {showBackButton && (
          <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={getConversationAvatar()} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getConversationInitials()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{getConversationName()}</h2>
          <p className="text-xs text-muted-foreground">
            {conversationInfo?.type === 'direct' ? t('online') : `${conversationInfo?.participants?.length || 0} ${t('participants')}`}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-hidden">
        <ModernMessagesList
          messages={messages}
          currentUserId={currentUserId}
          conversationId={conversationId}
        />
      </div>

      {/* Indicateur de frappe */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-2">
          <TypingIndicator users={typingUsers} />
        </div>
      )}

      {/* Zone de saisie */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder={t('typeMessage')}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
              className="message-input pr-10 resize-none min-h-[40px] max-h-[120px]"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || isSending}
            size="sm"
            className="h-10 w-10 p-0 rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}