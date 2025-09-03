'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, MoreVertical, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ConversationsSidebarProps {
  conversations: any[]
  currentUserId: string
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
}

export function ConversationsSidebar({
  conversations,
  currentUserId,
  selectedConversationId,
  onSelectConversation
}: ConversationsSidebarProps) {
  const t = useTranslations('conversations')
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // Récupérer les compteurs de messages non lus
  const fetchUnreadCounts = async () => {
    try {
      const response = await fetch('/api/conversations/unread-by-conversation')
      if (response.ok) {
        const counts = await response.json()
        setUnreadCounts(counts)
      }
    } catch (error) {
      console.error('Error fetching unread counts:', error)
    }
  }

  useEffect(() => {
    fetchUnreadCounts()
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchUnreadCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  // Filtrer les conversations selon la recherche
  const filteredConversations = conversations.filter(conversation =>
    conversation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.participants?.some((p: any) => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date)
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm')
    } else if (isYesterday(messageDate)) {
      return t('yesterday')
    } else {
      return format(messageDate, 'dd/MM')
    }
  }

  return (
    <div className="w-80 bg-white border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{t('conversations')}</h2>
          <Link href="/conversations/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('searchConversations')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{searchQuery ? t('noConversationsFound') : t('noConversations')}</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const unreadCount = unreadCounts[conversation.id] || 0
            const isSelected = conversation.id === selectedConversationId
            
            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                  isSelected && "bg-blue-50 border-r-2 border-r-blue-500"
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback>
                      {conversation.title?.charAt(0) || 'C'}
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
                            {formatMessageTime(conversation.last_message_at)}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 text-xs">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {conversation.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}