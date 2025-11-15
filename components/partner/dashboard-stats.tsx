"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { StatCard } from './stat-card'
import { Building2, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export interface PartnerStats {
  total_properties: number
  active_properties: number
  total_bookings: number
  upcoming_bookings: number
  monthly_earnings: number
  yearly_earnings: number
  occupancy_rate: number
  average_rating: number
  total_reviews: number
  pending_requests: number
  unread_messages: number
}

interface DashboardStatsProps {
  userId?: string
  stats?: PartnerStats | null
  onRetry?: () => void
}

function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div 
          key={i} 
          className="h-32 bg-gray-200 rounded-xl animate-pulse"
        />
      ))}
    </div>
  )
}

function StatsError({ onRetry }: { onRetry?: () => void }) {
  const t = useTranslations('partner.dashboard.error')
  
  return (
    <div className="mb-8">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('title')}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{t('message')}</span>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="ml-4"
            >
              {t('retry')}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}

export function DashboardStats({ userId, stats: initialStats, onRetry }: DashboardStatsProps) {
  const t = useTranslations('partner.dashboard.stats')
  const [stats, setStats] = useState<PartnerStats | null>(initialStats || null)
  const [loading, setLoading] = useState(!initialStats)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!initialStats && userId) {
      fetchStats()
    }
  }, [userId, initialStats])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(false)
      
      const response = await fetch('/api/partner/dashboard/stats')
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      
      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      fetchStats()
    }
  }

  if (loading) {
    return <StatsLoadingSkeleton />
  }

  if (error) {
    return <StatsError onRetry={handleRetry} />
  }

  if (!stats) {
    return <StatsError onRetry={handleRetry} />
  }

  // Calculate trend indicators (mock calculation - in real app, compare with previous period)
  const calculateTrend = (current: number, previous: number = 0): { value: number; trend: 'up' | 'down' | 'neutral' } => {
    if (previous === 0) {
      return { value: 0, trend: 'neutral' }
    }
    
    const percentChange = ((current - previous) / previous) * 100
    const roundedChange = Math.round(percentChange)
    
    if (roundedChange > 0) {
      return { value: roundedChange, trend: 'up' }
    } else if (roundedChange < 0) {
      return { value: roundedChange, trend: 'down' }
    } else {
      return { value: 0, trend: 'neutral' }
    }
  }

  // Mock previous period data for trend calculation
  // In a real app, this would come from the API
  const previousMonthEarnings = stats.monthly_earnings * 0.87 // 15% increase
  const previousOccupancy = stats.occupancy_rate - 5 // 5% increase

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        icon={Building2}
        label={t('totalProperties')}
        value={stats.total_properties}
        subtitle={t('activeProperties', { count: stats.active_properties })}
      />
      
      <StatCard
        icon={Calendar}
        label={t('bookings')}
        value={stats.total_bookings}
        subtitle={t('upcomingBookings', { count: stats.upcoming_bookings })}
      />
      
      <StatCard
        icon={DollarSign}
        label={t('monthlyRevenue')}
        value={`${stats.monthly_earnings.toLocaleString()}€`}
        change={calculateTrend(stats.monthly_earnings, previousMonthEarnings)}
      />
      
      <StatCard
        icon={TrendingUp}
        label={t('occupancyRate')}
        value={`${Math.round(stats.occupancy_rate)}%`}
        subtitle={t('excellentRate')}
        change={calculateTrend(stats.occupancy_rate, previousOccupancy)}
      />
    </div>
  )
}
