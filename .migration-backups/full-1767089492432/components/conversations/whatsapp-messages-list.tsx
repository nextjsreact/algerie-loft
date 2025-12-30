'use client'

import { useEffect, useRef, useState } from 'react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SimpleMessage } from '@/lib/services/conversations-simple'
import { Check, CheckCheck, MoreVertical, Reply, Forward, Star, Copy, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface WhatsAppMessagesListProps {
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
  isFirstInGroup: boolean
}

function MessageBubble({ message, isOwn, showAvatar, showTimestamp, isLastInGroup, isFirstInGroup }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return format(date, 'HH:mm')
  }

  return (
    <div 
      className={cn(
        "flex gap-2 group px-4 relative",
        isOwn ? "flex-row-reverse" : "flex-row",
        isLastInGroup ? "mb-3" : "mb-0.5"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8">
        {showAvatar && !isOwn ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={(message as any)?.sender_avatar} />
            <AvatarFallback className="text-xs bg-[#00a884] text-white">
              {message.sender_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[65%] relative",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender name (only for group chats and not own messages) */}
        {showTimestamp && !isOwn && (
          <div className="text-xs text-[#667781] dark:text-[#8696a0] mb-1 px-3">
            {message.sender_name}
          </div>
        )}

        {/* Message bubble */}
        <div className="relative group/message">
          <div className={cn(
            "rounded-lg px-3 py-2 break-words shadow-sm transition-all duration-200 relative",
            isOwn 
              ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef]" 
              : "bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef]",
            // Ajustements pour les messages groupés - style WhatsApp
            isFirstInGroup && isOwn && "rounded-tr-lg",
            isFirstInGroup && !isOwn && "rounded-tl-lg",
            isLastInGroup && isOwn && "rounded-br-md",
            isLastInGroup && !isOwn && "rounded-bl-md",
            !isFirstInGroup && !isLastInGroup && isOwn && "rounded-tr-md rounded-br-md",
            !isFirstInGroup && !isLastInGroup && !isOwn && "rounded-tl-md rounded-bl-md"
          )}>
            {/* Tail pour le dernier message du groupe */}
            {isLastInGroup && (
              <div className={cn(
                "absolute bottom-0 w-3 h-3",
                isOwn 
                  ? "right-0 translate-x-1 bg-[#d9fdd3] dark:bg-[#005c4b]" 
                  : "left-0 -translate-x-1 bg-white dark:bg-[#202c33]",
                "clip-path-tail"
              )} />
            )}
            
            <p className="text-sm whitespace-pre-wrap leading-relaxed pr-12">
              {message.content}
            </p>
            
            {/* Timestamp et statut de lecture */}
            <div className={cn(
              "absolute bottom-1 right-2 flex items-center gap-1",
              isOwn ? "text-[#667781] dark:text-[#8696a0]" : "text-[#667781] dark:text-[#8696a0]"
            )}>
              <span className="text-xs">
                {formatMessageTime(message.created_at)}
              </span>
              
              {/* Indicateurs de lecture pour les messages envoyés */}
              {isOwn && (
                <div className="flex items-center">
                  <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
                </div>
              )}
            </div>
          </div>

          {/* Menu d'actions (visible au hover) */}
          {isHovered && (
            <div className={cn(
              "absolute top-0 z-10 opacity-100 transition-opacity",
              isOwn ? "-left-12" : "-right-12"
            )}>
              <div className="flex items-center gap-1 bg-white dark:bg-[#2a3942] rounded-full shadow-lg p-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#f5f6f6] dark:hover:bg-[#313d45]">
                  <Reply className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#f5f6f6] dark:hover:bg-[#313d45]">
                  <Forward className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#f5f6f6] dark:hover:bg-[#313d45]">
                  <Star className="h-3 w-3" />
                </Button>
                <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#f5f6f6] dark:hover:bg-[#313d45]">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwn ? "end" : "start"} className="w-40">
                    <DropdownMenuItem className="text-xs">
                      <Copy className="h-3 w-3 mr-2" />
                      Copier
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">
                      <Reply className="h-3 w-3 mr-2" />
                      Répondre
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">
                      <Forward className="h-3 w-3 mr-2" />
                      Transférer
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">
                      <Star className="h-3 w-3 mr-2" />
                      Marquer
                    </DropdownMenuItem>
                    {isOwn && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs text-destructive">
                          <Trash2 className="h-3 w-3 mr-2" />
                          {t('delete')}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
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
    <div className="flex items-center justify-center my-4">
      <div className="bg-[#e9edef] dark:bg-[#2a3942] text-[#667781] dark:text-[#8696a0] text-xs px-3 py-1.5 rounded-full shadow-sm">
        {formatDate(date)}
      </div>
    </div>
  )
}

export function WhatsAppMessagesList({ messages, currentUserId, conversationId }: WhatsAppMessagesListProps) {
  const t = useTranslations('conversations')
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
      <div className="flex-1 flex items-center justify-center p-8 bg-[#efeae2] dark:bg-[#0b141a]">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-[#d9fdd3] dark:bg-[#005c4b] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="font-semibold text-lg mb-2 text-[#111b21] dark:text-[#e9edef]">
            Commencez la conversation
          </h3>
          <p className="text-sm text-[#667781] dark:text-[#8696a0] leading-relaxed">
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
    isFirstInGroup: boolean
  }> = []
  
  let lastDate = ''
  let lastSenderId = ''
  let lastMessageTime = 0

  messages.forEach((message, index) => {
    const messageDate = new Date(message.created_at)
    const messageDateString = messageDate.toDateString()
    const messageTime = messageDate.getTime()
    const nextMessage = messages[index + 1]
    const prevMessage = messages[index - 1]
    
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
    
    // Déterminer si c'est le premier/dernier message du groupe
    const isFirstInGroup = !prevMessage || 
      prevMessage.sender_id !== message.sender_id ||
      messageTime - new Date(prevMessage.created_at).getTime() > 5 * 60 * 1000 ||
      !isSameDay(new Date(prevMessage.created_at), messageDate)
    
    const isLastInGroup = !nextMessage || 
      nextMessage.sender_id !== message.sender_id ||
      new Date(nextMessage.created_at).getTime() - messageTime > 5 * 60 * 1000 ||
      !isSameDay(new Date(nextMessage.created_at), messageDate)
    
    groupedMessages.push({
      type: 'message',
      message,
      showAvatar,
      showTimestamp,
      isLastInGroup,
      isFirstInGroup
    })
    
    lastSenderId = message.sender_id
    lastMessageTime = messageTime
  })

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto py-4 scroll-smooth bg-[#efeae2] dark:bg-[#0b141a]"
      onScroll={handleScroll}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpolygon points='50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40'/%3E%3C/g%3E%3C/svg%3E")`,
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
            isFirstInGroup={item.isFirstInGroup}
          />
        )
      })}
      
      <div ref={messagesEndRef} />
    </div>
  )
}