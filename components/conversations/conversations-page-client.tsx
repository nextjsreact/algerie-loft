'use client'

import { useState, useEffect } from 'react'
import { MessagesSquare, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useTranslations } from "next-intl"

interface ConversationsPageClientProps {
  conversations: any[]
  currentUserId: string
}

export function ConversationsPageClient({ conversations, currentUserId }: ConversationsPageClientProps) {
  const t = useTranslations('conversations')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // Fonction pour récupérer les compteurs de messages non lus
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

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <MessagesSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('noConversations')}</h3>
        <p className="text-muted-foreground mb-4">{t('startFirstConversation')}</p>
        <Link href="/conversations/new">
          <Button>{t('newConversation')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('conversations')}</h1>
        <Link href="/conversations/new">
          <Button>{t('newConversation')}</Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {conversations.map((conversation) => {
          const unreadCount = unreadCounts[conversation.id] || 0
          
          return (
            <div key={conversation.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{conversation.title || t('untitledConversation')}</h3>
                  {conversation.last_message && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {conversation.last_message}
                    </p>
                  )}
                  {conversation.last_message_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(conversation.last_message_at).toLocaleString()}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                  <Link href={`/conversations/${conversation.id}`}>
                    <Button variant="outline" size="sm">{t('view')}</Button>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}