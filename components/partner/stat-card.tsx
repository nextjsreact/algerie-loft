"use client"

import { memo, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  change?: {
    value: number
    trend: 'up' | 'down' | 'neutral'
  }
  subtitle?: string
  className?: string
}

/**
 * Optimized StatCard component with React.memo and useMemo
 * Only re-renders when props change
 */
export const StatCard = memo(function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  change,
  subtitle,
  className 
}: StatCardProps) {
  // Memoize trend icon to avoid recalculation
  const trendIcon = useMemo(() => {
    if (!change) return null
    
    switch (change.trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />
      case 'down':
        return <TrendingDown className="h-3 w-3" />
      case 'neutral':
        return <Minus className="h-3 w-3" />
    }
  }, [change])

  // Memoize trend color to avoid recalculation
  const trendColor = useMemo(() => {
    if (!change) return ''
    
    switch (change.trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      case 'neutral':
        return 'text-gray-600'
    }
  }, [change])

  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            {label}
          </span>
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {value}
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-sm mt-1",
            trendColor
          )}>
            {trendIcon}
            <span>
              {change.value > 0 ? '+' : ''}{change.value}%
            </span>
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  )
})
