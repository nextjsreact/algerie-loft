'use client'

import { useState, useEffect } from 'react'
import { ModernNewConversation } from '@/components/conversations/modern-new-conversation'
import { Loader2 } from 'lucide-react'

export default function NewConversationPage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => { if (d?.user?.id) setUserId(d.user.id) })
      .catch(() => {})
  }, [])

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <ModernNewConversation
      currentUserId={userId}
      showBackButton={true}
    />
  )
}
