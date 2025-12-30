'use client'

import { useEffect, useRef, useState } from 'react'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Message } from '@/lib/services/conversations'
import { MoreVertical, Edit, Trash2, Reply } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

interface MessagesListProps {
  messages: Message[]
  currentUserId: string
  conversationId: string
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar: boolean
  showTimestamp: boolean
}

function MessageBubble({ message, isOwn, showAvatar, showTimestamp }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'MMM d, HH:mm')
    }
  }

  return (
    <div className={cn(
      "flex gap-3 group",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {showAvatar ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={(message.sender as any)?.avatar_url} />
            <AvatarFallback className="text-xs">
              {message.sender.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender name and timestamp */}
        {showTimestamp && (
          <div className={cn(
            "flex items-center gap-2 mb-1 text-xs text-muted-foreground",
            isOwn ? "flex-row-reverse" : "flex-row"
          )}>
            {!isOwn && (
              <span className="font-medium">
                {message.sender.full_name || message.sender.email}
              </span>
            )}
            <span>{formatMessageTime(message.created_at)}</span>
          </div>
        )}

        {/* Message bubble */}
        <div className="relative group/message">
          <div className={cn(
            "rounded-2xl px-4 py-2 break-words",
            isOwn 
              ? "bg-primary text-primary-foreground rounded-br-md" 
              : "bg-muted rounded-bl-md"
          )}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            
            {message.edited && (
              <span className="text-xs opacity-70 ml-2">(edited)</span>
            )}
          </div>

          {/* Message actions */}
          {isOwn && (
            <div className="absolute top-0 right-0 -mr-8 opacity-0 group-hover/message:opacity-100 transition-opacity">
              <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem className="gap-2 text-xs">
                    <Edit className="h-3 w-3" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-xs">
                    <Reply className="h-3 w-3" />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-xs text-destructive">
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
      return 'Today'
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMMM d, yyyy')
    }
  }

  return (
    <div className="flex items-center justify-center my-4">
      <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
        {formatDate(date)}
      </div>
    </div>
  )
}

export function MessagesList({ messages, currentUserId, conversationId }: MessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
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
    const isAtBottom = scrollHeight - scrollTop === clientHeight
    setShouldAutoScroll(isAtBottom)
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👋</span>
          </div>
          <h3 className="font-semibold mb-2">Start the conversation</h3>
          <p className="text-sm text-muted-foreground">
            Send a message to begin your conversation
          </p>
        </div>
      </div>
    )
  }

  // Group messages by date and determine which messages should show avatars/timestamps
  const groupedMessages: Array<{ type: 'date'; date: string } | { type: 'message'; message: Message; showAvatar: boolean; showTimestamp: boolean }> = []
  
  let lastDate = ''
  let lastSenderId = ''
  let lastMessageTime = 0

  messages.forEach((message, index) => {
    const messageDate = new Date(message.created_at).toDateString()
    const messageTime = new Date(message.created_at).getTime()
    
    // Add date separator if date changed
    if (messageDate !== lastDate) {
      groupedMessages.push({ type: 'date', date: message.created_at })
      lastDate = messageDate
      lastSenderId = ''
    }
    
    // Determine if we should show avatar and timestamp
    const isNewSender = message.sender_id !== lastSenderId
    const isTimeDifferent = messageTime - lastMessageTime > 5 * 60 * 1000 // 5 minutes
    const showTimestamp = isNewSender || isTimeDifferent
    const showAvatar = showTimestamp
    
    groupedMessages.push({
      type: 'message',
      message,
      showAvatar,
      showTimestamp
    })
    
    lastSenderId = message.sender_id
    lastMessageTime = messageTime
  })

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 space-y-2"
      onScroll={handleScroll}
    >
      {groupedMessages.map((item, index) => {
        if (item.type === 'date') {
          return <DateSeparator key={`date-${index}`} date={item.date} />
        }
        
        return (
          <MessageBubble
            key={item.message.id}
            message={item.message}
            isOwn={item.message.sender_id === currentUserId}
            showAvatar={item.showAvatar}
            showTimestamp={item.showTimestamp}
          />
        )
      })}
      
      <div ref={messagesEndRef} />
    </div>
  )
}