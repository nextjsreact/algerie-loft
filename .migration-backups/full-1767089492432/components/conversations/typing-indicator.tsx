'use client'

import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  users: string[]
  className?: string
}

export function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} est en train d'écrire...`
    } else if (users.length === 2) {
      return `${users[0]} et ${users[1]} sont en train d'écrire...`
    } else {
      return `${users[0]} et ${users.length - 1} autres sont en train d'écrire...`
    }
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <div className="flex gap-1">
        <div className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
        <div className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
        <div className="typing-dot w-2 h-2 bg-muted-foreground/60 rounded-full" />
      </div>
      <span className="text-xs">{getTypingText()}</span>
    </div>
  )
}