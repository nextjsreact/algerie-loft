'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, MoreVertical, MessageSquare, Archive, Settings, Users, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import { enUS, fr, ar } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface WhatsAppSidebarProps {
  conversations: any[]
  currentUserId: string
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
}

export function WhatsAppSidebar({
  conversations,
  currentUserId,
  selectedConversationId,
  onSelectConversation
}: WhatsAppSidebarProps) {
  const t = useTranslations('conversations')
  const locale = useLocale()
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups'>('all')

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
    const interval = setInterval(fetchUnreadCounts, 3000)
    return () => clearInterval(interval)
  }, [])

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return t('yesterday')
    } else {
      const locales: { [key: string]: Locale } = {
        en: enUS,
        fr: fr,
        ar: ar,
      };
      return format(date, 'dd/MM', { locale: locales[locale] || enUS })
    }
  }

  const getConversationName = (conversation: any) => {
    if (conversation.name) return conversation.name
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(
        (p: any) => p.user_id !== currentUserId
      )
      let name = otherParticipant?.user?.full_name || t('conversation')
      
      // Corriger les noms génériques
      if (name === 'member1') name = t('conversations.member1')
      if (name === 'Team Member') name = 'Membre'
      
      return name
    }
    
    return `${t('group')} ${conversation.id.slice(0, 8)}`
  }

  const getConversationAvatar = (conversation: any) => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants?.find(
        (p: any) => p.user_id !== currentUserId
      )
      return otherParticipant?.user?.avatar_url
    }
    return null
  }

  const getConversationInitials = (conversation: any) => {
    const name = getConversationName(conversation)
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  const filteredConversations = conversations.filter(conv => {
    const name = getConversationName(conv).toLowerCase()
    const matchesSearch = name.includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false
    
    switch (filter) {
      case 'unread':
        return unreadCounts[conv.id] > 0
      case 'groups':
        return conv.type === 'group'
      default:
        return true
    }
  })

  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#202c33]">
      {/* Header */}
      <div className="p-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#e9edef] dark:border-[#313d45]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[#00a884] text-white font-medium">
                {/* Initiales de l'utilisateur actuel */}
                {(currentUserId || '').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-medium text-[#111b21] dark:text-[#e9edef]">{t('title')}</h1>
              {totalUnread > 0 && (
                <p className="text-xs text-[#667781] dark:text-[#8696a0]">
                  {t('totalUnread', { count: totalUnread })}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#54656f] dark:text-[#8696a0] hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942]">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilter('all')} className={filter === 'all' ? 'bg-muted' : ''}>
                  {t('all')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('unread')} className={filter === 'unread' ? 'bg-muted' : ''}>
                  {t('unread')} ({Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('groups')} className={filter === 'groups' ? 'bg-muted' : ''}>
                  {t('groups')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#54656f] dark:text-[#8696a0] hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942]">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/conversations/new" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    {t('newConversation')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  {t('archived')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  {t('settings')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#667781] dark:text-[#8696a0]" />
          <Input
            placeholder={t('searchOrCreateNewConversation')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-[#2a3942] border-[#e9edef] dark:border-[#313d45] text-[#111b21] dark:text-[#e9edef] placeholder:text-[#667781] dark:placeholder:text-[#8696a0] focus:border-[#00a884] dark:focus:border-[#00a884]"
          />
        </div>
      </div>

      {/* Filtres rapides */}
      <div className="px-4 py-2 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#e9edef] dark:border-[#313d45]">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className={cn(
              "h-7 px-3 text-xs",
              filter === 'all' 
                ? "bg-[#00a884] text-white hover:bg-[#00a884]/90" 
                : "text-[#667781] dark:text-[#8696a0] hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942]"
            )}
          >
            {t('all')}
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
            className={cn(
              "h-7 px-3 text-xs",
              filter === 'unread' 
                ? "bg-[#00a884] text-white hover:bg-[#00a884]/90" 
                : "text-[#667781] dark:text-[#8696a0] hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942]"
            )}
          >
            {t('unread')} {totalUnread > 0 && `(${totalUnread})`}
          </Button>
          <Button
            variant={filter === 'groups' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('groups')}
            className={cn(
              "h-7 px-3 text-xs",
              filter === 'groups' 
                ? "bg-[#00a884] text-white hover:bg-[#00a884]/90" 
                : "text-[#667781] dark:text-[#8696a0] hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942]"
            )}
          >
            {t('groups')}
          </Button>
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="h-16 w-16 text-[#667781] dark:text-[#8696a0] mb-4 opacity-50" />
            <h3 className="font-medium mb-2 text-[#111b21] dark:text-[#e9edef]">
              {searchQuery ? t('noResults') : t('noConversations')}
            </h3>
            <p className="text-sm text-[#667781] dark:text-[#8696a0] mb-4">
              {searchQuery
                ? t('tryDifferentSearch')
                : t('startNewToBegin')
              }
            </p>
            {!searchQuery && (
              <Button size="sm" asChild className="bg-[#00a884] hover:bg-[#00a884]/90">
                <Link href="/conversations/new">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('startNewConversation')}
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId
              const unreadCount = unreadCounts[conversation.id] || 0
              const hasUnread = unreadCount > 0

              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-[#e9edef] dark:border-[#313d45] last:border-b-0",
                    isSelected 
                      ? "bg-[#f5f6f6] dark:bg-[#2a3942]" 
                      : "hover:bg-[#f5f6f6] dark:hover:bg-[#2a3942]"
                  )}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getConversationAvatar(conversation)} />
                      <AvatarFallback className={cn(
                        "font-medium text-white",
                        conversation.type === 'group' ? "bg-[#667781]" : "bg-[#00a884]"
                      )}>
                        {conversation.type === 'group' ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          getConversationInitials(conversation)
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {/* Indicateur en ligne pour les conversations directes */}
                    {conversation.type === 'direct' && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-[#00a884] border-2 border-white dark:border-[#202c33] rounded-full" />
                    )}
                  </div>

                  {/* Contenu de la conversation */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={cn(
                        "font-medium truncate text-[#111b21] dark:text-[#e9edef]",
                        hasUnread && "font-semibold"
                      )}>
                        {getConversationName(conversation)}
                      </h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-[#667781] dark:text-[#8696a0]">
                          {formatLastMessageTime(conversation.updated_at)}
                        </span>
                        {hasUnread && (
                          <Badge className="ml-1 h-5 min-w-[20px] flex items-center justify-center px-1.5 bg-[#00a884] hover:bg-[#00a884] text-white text-xs font-bold rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-sm truncate text-[#667781] dark:text-[#8696a0]",
                        hasUnread && "text-[#111b21] dark:text-[#e9edef] font-medium"
                      )}>
                        {
                          conversation.last_message?.content === 'Aucun message' && locale === 'en'
                            ? t('noMessage')
                            : conversation.last_message?.content || t('noMessage')
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}