'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/ui/search'
import { cn } from '@/lib/utils'
import { Conversation } from '@/lib/services/conversations'
import { Users, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ConversationsListProps {
  conversations: Conversation[]
  currentUserId: string
  onConversationClick?: (conversationId: string) => void
}

export function ConversationsList({ conversations, currentUserId, onConversationClick }: ConversationsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const pathname = usePathname()
  const t = useTranslations('conversations')

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    // Search in conversation title
    if (conversation.title?.toLowerCase().includes(searchLower)) {
      return true
    }
    
    // Search in participant names
    return conversation.participants?.some(participant => 
      participant.name?.toLowerCase().includes(searchLower)
    )
  })

  const handleConversationClick = (conversationId: string) => {
    if (onConversationClick) {
      onConversationClick(conversationId)
    }
  }

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder={t('searchConversations')}
        value={searchTerm}
        onChange={setSearchTerm}
      />
      
      <div className="space-y-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? t('noConversationsFound') : t('noConversations')}
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isActive = pathname === `/conversations/${conversation.id}`
            
            return (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
                onClick={() => handleConversationClick(conversation.id)}
                className={cn(
                  "block p-4 rounded-lg border transition-colors hover:bg-muted/50",
                  isActive && "bg-muted border-primary"
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback>
                      {conversation.is_group ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium truncate">
                        {conversation.title || t('untitledConversation')}
                      </h3>
                      <div className="flex items-center gap-2">
                        {conversation.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                          </span>
                        )}
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {conversation.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message}
                      </p>
                    )}
                    
                    {conversation.is_group && conversation.participants && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversation.participants.length} {t('participants')}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}