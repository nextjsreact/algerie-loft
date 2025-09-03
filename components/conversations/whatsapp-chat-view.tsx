'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTranslations } from 'next-intl'

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
  const [messages, setMessages] = useState<any[]>([])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    
    // Add message logic here
    console.log('Sending message:', newMessage)
    setNewMessage('')
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
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            {t('noMessages')}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="flex gap-2">
                <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('typeMessage')}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}