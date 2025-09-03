'use client'

import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SimpleMessage } from '@/lib/services/conversations-simple'
import { Check, CheckCheck, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

interface ModernMessagesListProps {
  messages: SimpleMessage[]
  currentUserId: string
  conversationId: string
}

interface MessageBubbleProps {
  message: SimpleMessage
  isOwn: boolean
  showAvatar: boolean
  showTimestamp: boolean
  isLastInGroup: boolean
}

function MessageBubble({ message, isOwn, showAvatar, showTimestamp, isLastInGroup }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)
  const t = useTranslations('common')

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return format(date, 'HH:mm')
  }

  return (
    <div className={cn(
      "flex gap-2 group px-4",
      isOwn ? "flex-row-reverse" : "flex-row",
      isLastInGroup ? "mb-4" : "mb-1"
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8">
        {showAvatar && !isOwn ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={(message as any)?.sender_avatar} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {message.sender_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[75%] md:max-w-[60%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender name (only for group chats and not own messages) */}
        {showTimestamp && !isOwn && (
          <div className="text-xs text-muted-foreground mb-1 px-3">
            {message.sender_name}
          </div>
        )}

        {/* Message bubble */}
        <div className="relative group/message">
          <div className={cn(
            "message-bubble rounded-2xl px-4 py-2 break-words shadow-sm transition-all duration-200 hover:shadow-md",
            isOwn 
              ? "bg-primary text-primary-foreground rounded-br-md" 
              : "bg-muted hover:bg-muted/80 rounded-bl-md",
            // Ajustements pour les messages groupés
            !isLastInGroup && isOwn && "rounded-br-lg",
            !isLastInGroup && !isOwn && "rounded-bl-lg"
          )}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
            
            {/* Timestamp et statut de lecture */}
            <div className={cn(
              "flex items-center gap-1 mt-1",
              isOwn ? "justify-end" : "justify-start"
            )}>
              <span className={cn(
                "text-xs opacity-70",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {formatMessageTime(message.created_at)}
              </span>
              
              {/* Indicateurs de lecture pour les messages envoyés */}
              {isOwn && (
                <div className="flex items-center">
                  <CheckCheck className={cn(
                    "h-3 w-3",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  )} />
                </div>
              )}
            </div>
          </div>

          {/* Menu d'actions (visible au hover) */}
          <div className={cn(
            "absolute top-0 opacity-0 group-hover/message:opacity-100 transition-opacity",
            isOwn ? "-left-8" : "-right-8"
          )}>
            <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="action-button h-6 w-6 p-0 bg-background shadow-sm">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-32">
                <DropdownMenuItem className="text-xs">
                  Répondre
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs">
                  {t('transfer')}
                </DropdownMenuItem>
                {isOwn && (
                  <>
                    <DropdownMenuItem className="text-xs">
                      {t('edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs text-destructive">
                      {t('delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}

function DateSeparator({ date }: { date: string }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return "Aujourd'hui"
    } else if (isYesterday(date)) {
      return 'Hier'
    } else {
      return format(date, 'EEEE d MMMM yyyy', { locale: fr })
    }
  }

  return (
    <div className="flex items-center justify-center my-6">
      <div className="bg-muted/80 text-muted-foreground text-xs px-3 py-1.5 rounded-full shadow-sm">
        {formatDate(date)}
      </div>
    </div>
  )
}

export function ModernMessagesList({ messages, currentUserId, conversationId }: ModernMessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom()
    }
  }, [messages, shouldAutoScroll])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10
    setShouldAutoScroll(isAtBottom)
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="font-semibold text-lg mb-2">Commencez la conversation</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Envoyez un message pour démarrer votre conversation. 
            Vos messages apparaîtront ici.
          </p>
        </div>
      </div>
    )
  }

  // Grouper les messages par date et déterminer l'affichage
  const groupedMessages: Array<{ 
    type: 'date' 
    date: string 
  } | { 
    type: 'message' 
    message: SimpleMessage 
    showAvatar: boolean 
    showTimestamp: boolean 
    isLastInGroup: boolean 
  }> = []
  
  let lastDate = ''
  let lastSenderId = ''
  let lastMessageTime = 0

  messages.forEach((message, index) => {
    const messageDate = new Date(message.created_at)
    const messageDateString = messageDate.toDateString()
    const messageTime = messageDate.getTime()
    const nextMessage = messages[index + 1]
    
    // Ajouter séparateur de date si nécessaire
    if (messageDateString !== lastDate) {
      groupedMessages.push({ type: 'date', date: message.created_at })
      lastDate = messageDateString
      lastSenderId = ''
    }
    
    // Déterminer si on doit afficher l'avatar et le timestamp
    const isNewSender = message.sender_id !== lastSenderId
    const isTimeDifferent = messageTime - lastMessageTime > 5 * 60 * 1000 // 5 minutes
    const showTimestamp = isNewSender || isTimeDifferent
    const showAvatar = showTimestamp
    
    // Déterminer si c'est le dernier message du groupe
    const isLastInGroup = !nextMessage || 
      nextMessage.sender_id !== message.sender_id ||
      new Date(nextMessage.created_at).getTime() - messageTime > 5 * 60 * 1000 ||
      !isSameDay(new Date(nextMessage.created_at), messageDate)
    
    groupedMessages.push({
      type: 'message',
      message,
      showAvatar,
      showTimestamp,
      isLastInGroup
    })
    
    lastSenderId = message.sender_id
    lastMessageTime = messageTime
  })

  return (
    <div 
      ref={containerRef}
      className="messages-container flex-1 overflow-y-auto py-4 scroll-smooth"
      onScroll={handleScroll}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f1f5f9' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      {groupedMessages.map((item, index) => {
        if (item.type === 'date') {
          return <DateSeparator key={`date-${index}`} date={item.date} />
        }
        
        return (
          <MessageBubble
            key={item.message.id || `message-${index}`}
            message={item.message}
            isOwn={item.message.sender_id === currentUserId}
            showAvatar={item.showAvatar}
            showTimestamp={item.showTimestamp}
            isLastInGroup={item.isLastInGroup}
          />
        )
      })}
      
      <div ref={messagesEndRef} />
    </div>
  )
}