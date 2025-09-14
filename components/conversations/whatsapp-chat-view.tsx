'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTranslations } from 'next-intl'
import { useNotificationSound } from '@/hooks/use-notification-sound'

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender_name?: string
}

interface WhatsAppChatViewProps {
  conversationId: string
  currentUserId: string
  onBack?: () => void
  showBackButton?: boolean
}

export function WhatsAppChatView({
  conversationId,
  currentUserId,
  onBack,
  showBackButton = false
}: WhatsAppChatViewProps) {
  const t = useTranslations('conversations')
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastMessageCountRef = useRef(0)
  const { playNotificationSound } = useNotificationSound()

  // Activer l'audio après la première interaction utilisateur
  const enableAudio = useCallback(() => {
    if (!audioEnabled) {
      setAudioEnabled(true)
      console.log('Audio notifications enabled')
    }
  }, [audioEnabled])

  // Charger les messages au montage du composant
  useEffect(() => {
    loadMessages()
    startPolling()
    markConversationAsRead() // Marquer comme lu quand on ouvre la conversation
    
    return () => {
      stopPolling()
    }
  }, [conversationId])

  // Marquer la conversation comme lue
  const markConversationAsRead = async () => {
    try {
      await fetch('/api/conversations/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
        }),
      })
      console.log('Conversation marked as read')
    } catch (error) {
      console.error('Error marking conversation as read:', error)
    }
  }

  // Faire défiler vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    scrollToBottom()
    
    // Jouer le son si de nouveaux messages sont arrivés (pas au premier chargement)
    if (messages.length > lastMessageCountRef.current && lastMessageCountRef.current > 0) {
      const newMessages = messages.slice(lastMessageCountRef.current)
      const hasNewMessagesFromOthers = newMessages.some(msg => msg.sender_id !== currentUserId)
      
      if (hasNewMessagesFromOthers && audioEnabled) {
        console.log('Playing notification sound for new messages')
        playNotificationSound()
        // Marquer comme lu après avoir reçu de nouveaux messages
        markConversationAsRead()
      }
    }
    
    lastMessageCountRef.current = messages.length
  }, [messages, currentUserId, playNotificationSound])

  const startPolling = useCallback(() => {
    // Vérifier les nouveaux messages toutes les 2 secondes
    pollingIntervalRef.current = setInterval(() => {
      loadMessages(true) // true = polling mode (silencieux)
    }, 2000)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  const loadMessages = async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true)
      }
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        const newMessages = data.messages || []
        
        // Mettre à jour les messages seulement s'il y a des changements
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
            return newMessages
          }
          return prevMessages
        })
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      if (!isPolling) {
        setLoading(false)
      }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return
    
    // Activer l'audio lors de la première interaction
    enableAudio()
    
    const messageContent = newMessage.trim()
    setNewMessage('') // Vider le champ immédiatement pour une meilleure UX
    
    try {
      setSending(true)
      const response = await fetch('/api/conversations/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          content: messageContent,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.message) {
          // Ajouter le nouveau message à la liste immédiatement
          setMessages(prev => {
            // Éviter les doublons
            const messageExists = prev.some(msg => msg.id === data.message.id)
            if (messageExists) {
              return prev
            }
            return [...prev, data.message]
          })
        }
      } else {
        console.error('Failed to send message')
        // Remettre le message dans le champ en cas d'erreur
        setNewMessage(messageContent)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remettre le message dans le champ en cas d'erreur
      setNewMessage(messageContent)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        {showBackButton && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium">Conversation</h3>
          <p className="text-sm text-gray-500">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-500 mt-8">
            Chargement des messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            {t('noMessages')}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`rounded-lg p-3 max-w-xs ${
                  message.sender_id === currentUserId 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="text-sm">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.sender_id === currentUserId 
                      ? 'text-blue-100' 
                      : 'text-gray-500'
                  }`}>
                    {new Date(message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={sending ? "Envoi en cours..." : t('typeMessage')}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            onFocus={enableAudio} // Activer l'audio quand l'utilisateur clique dans le champ
            disabled={sending}
          />
          <Button onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}