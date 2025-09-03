'use client'

import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  count: number
  className?: string
  showZero?: boolean
  maxCount?: number
}

export function NotificationBadge({ 
  count, 
  className, 
  showZero = false, 
  maxCount = 99 
}: NotificationBadgeProps) {
  if (count === 0 && !showZero) {
    return null
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString()

  return (
    <div className={cn(
      "inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium min-w-5 h-5 px-1",
      className
    )}>
      {displayCount}
    </div>
  )
}

// Red dot indicator for when you just want to show "new" without count
export function NotificationDot({ 
  show, 
  className 
}: { 
  show: boolean
  className?: string 
}) {
  if (!show) return null

  return (
    <div className={cn(
      "w-2 h-2 bg-destructive rounded-full",
      className
    )} />
  )
}