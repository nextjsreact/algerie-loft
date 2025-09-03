'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Conversation } from '@/lib/services/conversations'
import { 
  MoreVertical, 
  Users, 
  Settings, 
  UserPlus, 
  Archive,
  Trash2,
  Phone,
  Video
} from 'lucide-react'

interface ConversationHeaderProps {
  conversation: Conversation
  currentUserId: string
}

export function ConversationHeader({ conversation, currentUserId }: ConversationHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const t = useTranslations('conversations')

  const getConversationName = () => {
    if (conversation.name) {
      return conversation.name
    }
    
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.user_id !== currentUserId
      )
      return otherParticipant?.user.full_name || otherParticipant?.user.email || t('unknownUser')
    }
    
    return `${t('group')} ${conversation.id.slice(0, 8)}`
  }

  const getConversationAvatar = () => {
    if (conversation.type === 'direct') {
      const otherParticipant = conversation.participants.find(
        p => p.user_id !== currentUserId
      )
      return otherParticipant?.user.avatar_url
    }
    return null
  }

  const getConversationInitials = () => {
    const name = getConversationName()
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={getConversationAvatar()} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {getConversationInitials()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold truncate">{getConversationName()}</h2>
            {conversation.type === 'group' && (
              <Badge variant="secondary" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {conversation.participants.length}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {conversation.type === 'direct' 
              ? t('online')
              : `${conversation.participants.length} ${t('participants')}`
            }
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Video className="h-4 w-4" />
        </Button>
        
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {conversation.type === 'group' && (
              <>
                <DropdownMenuItem>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('addMembers')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('groupSettings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem>
              <Archive className="w-4 h-4 mr-2" />
              {t('archiveConversation')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              {t('deleteConversation')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}