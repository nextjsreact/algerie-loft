'use client'

import { useState, useEffect } from 'react'
import { ConversationsSidebar } from './conversations-sidebar'
import { ModernChatView } from './modern-chat-view'
import { ConversationWelcome } from './conversation-welcome'
import { cn } from '@/lib/utils'

interface ModernConversationsLayoutProps {
  conversations: any[]
  currentUserId: string
  selectedConversationId?: string
}

export function ModernConversationsLayout({ 
  conversations, 
  currentUserId, 
  selectedConversationId 
}: ModernConversationsLayoutProps) {
  const [selectedId, setSelectedId] = useState<string | null>(selectedConversationId || null)
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setShowSidebar(window.innerWidth >= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSelectConversation = (conversationId: string) => {
    setSelectedId(conversationId)
    if (isMobile) {
      setShowSidebar(false)
    }
  }

  const handleBackToSidebar = () => {
    if (isMobile) {
      setShowSidebar(true)
      setSelectedId(null)
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar des conversations */}
      <div className={cn(
        "border-r border-border bg-background transition-all duration-300",
        isMobile ? (showSidebar ? "w-full" : "w-0 overflow-hidden") : "w-80"
      )}>
        <ConversationsSidebar
          conversations={conversations}
          currentUserId={currentUserId}
          selectedConversationId={selectedId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      {/* Zone de chat principale */}
      <div className={cn(
        "flex-1 flex flex-col",
        isMobile && showSidebar ? "hidden" : "flex"
      )}>
        {selectedId ? (
          <ModernChatView
            conversationId={selectedId}
            currentUserId={currentUserId}
            onBack={handleBackToSidebar}
            showBackButton={isMobile}
          />
        ) : (
          <ConversationWelcome />
        )}
      </div>
    </div>
  )
}