'use client'

import { useState, useEffect } from 'react'
import { WhatsAppLayout } from '@/components/conversations/whatsapp-layout'
import { Loader2, MessageSquare } from 'lucide-react'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Get current user
        const sessionRes = await fetch('/api/auth/session')
        if (!sessionRes.ok) {
          setError('Non authentifié')
          setLoading(false)
          return
        }
        const sessionData = await sessionRes.json()
        const userId = sessionData?.user?.id
        if (!userId) {
          setError('Session introuvable')
          setLoading(false)
          return
        }
        setCurrentUserId(userId)

        // Get conversations
        const convRes = await fetch('/api/conversations/list')
        if (convRes.ok) {
          const data = await convRes.json()
          setConversations(data.conversations || [])
        }
      } catch (err) {
        console.error('Error loading conversations:', err)
        setError('Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <MessageSquare className="h-16 w-16 text-muted-foreground/40" />
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!currentUserId) return null

  return (
    <WhatsAppLayout
      conversations={conversations}
      currentUserId={currentUserId}
    />
  )
}
