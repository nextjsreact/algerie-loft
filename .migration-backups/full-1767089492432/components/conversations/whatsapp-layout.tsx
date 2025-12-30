'use client'

import { useState, useEffect } from 'react'
import { WhatsAppSidebar } from './whatsapp-sidebar'
import { WhatsAppChatView } from './whatsapp-chat-view'
import { WhatsAppWelcome } from './whatsapp-welcome'
import { cn } from '@/lib/utils'

interface WhatsAppLayoutProps {
  conversations: any[]
  currentUserId: string
  selectedConversationId?: string
}

export function WhatsAppLayout({ 
  conversations, 
  currentUserId, 
  selectedConversationId 
}: WhatsAppLayoutProps) {
  const [selectedId, setSelectedId] = useState<string | null>(selectedConversationId || null)
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setShowSidebar(!mobile || !selectedId)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [selectedId])

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

  // Gestion du redimensionnement de la sidebar
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return
    setIsResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(Math.max(e.clientX, 300), 600)
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#f0f2f5] dark:bg-[#111b21] overflow-hidden">
      {/* Sidebar des conversations */}
      <div 
        className={cn(
          "bg-white dark:bg-[#202c33] border-r border-[#e9edef] dark:border-[#313d45] transition-all duration-300 flex-shrink-0",
          isMobile ? (showSidebar ? "w-full" : "w-0 overflow-hidden") : "relative"
        )}
        style={!isMobile ? { width: `${sidebarWidth}px` } : {}}
      >
        <WhatsAppSidebar
          conversations={conversations}
          currentUserId={currentUserId}
          selectedConversationId={selectedId}
          onSelectConversation={handleSelectConversation}
        />
        
        {/* Resize handle */}
        {!isMobile && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary/20 transition-colors"
            onMouseDown={handleMouseDown}
          />
        )}
      </div>

      {/* Zone de chat principale */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        isMobile && showSidebar ? "hidden" : "flex"
      )}>
        {selectedId ? (
          <WhatsAppChatView
            conversationId={selectedId}
            currentUserId={currentUserId}
            onBack={handleBackToSidebar}
            showBackButton={isMobile}
          />
        ) : (
          <WhatsAppWelcome />
        )}
      </div>
    </div>
  )
}