'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Calendar, Clock, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from '@/lib/i18n/context'
import { createClient } from '@/utils/supabase/client'

interface BillStats {
  upcomingBills: number
  overdueBills: number
  dueToday: number
  totalLoftsWithBills: number
}

export function BillMonitoringStats() {
  const t = useTranslations("dashboard");
  const [stats, setStats] = useState<BillStats>({
    upcomingBills: 0,
    overdueBills: 0,
    dueToday: 0,
    totalLoftsWithBills: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Check if user is authenticated before making API call
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('User not authenticated, skipping bill stats fetch')
        setLoading(false)
        return
      }
      
      const response = await fetch('/api/bill-monitoring/stats')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
        setLastUpdated(new Date())
      } else {
        throw new Error(result.error || 'Failed to fetch stats')
      }
    } catch (error) {
      console.error('Error fetching bill stats:', error)
      // Only show toast error if it's not an authentication issue
      if (!error.message.includes('NEXT_REDIRECT')) {
        toast.error('Failed to load bill monitoring statistics')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (count: number, type: 'overdue' | 'due_today' | 'upcoming') => {
    if (count === 0) return 'text-green-600'
    
    switch (type) {
      case 'overdue':
        return 'text-red-600'
      case 'due_today':
        return 'text-orange-600'
      case 'upcoming':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (count: number, type: 'overdue' | 'due_today' | 'upcoming') => {
    if (count === 0) return <CheckCircle className="h-4 w-4 text-green-500" />
    
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'due_today':
        return <Clock className="h-4 w-4 text-orange-500" />
      case 'upcoming':
        return <Calendar className="h-4 w-4 text-blue-500" />
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading && !lastUpdated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
{t('dashboard.billMonitoring')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
{t('dashboard.billMonitoring')}
        </CardTitle>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
{t('dashboard.updated')} {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Overdue Bills */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200">
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.overdueBills, 'overdue')}
              <div>
                <p className="text-sm font-medium">{t('dashboard.overdue')}</p>
                <p className="text-xs text-gray-600">{t('dashboard.billsPastDue')}</p>
              </div>
            </div>
            <div className={`text-2xl font-bold ${getStatusColor(stats.overdueBills, 'overdue')}`}>
              {stats.overdueBills}
            </div>
          </div>

          {/* Due Today */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-orange-50 border-orange-200">
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.dueToday, 'due_today')}
              <div>
                <p className="text-sm font-medium">{t('dashboard.dueToday')}</p>
                <p className="text-xs text-gray-600">{t('dashboard.billsDueNow')}</p>
              </div>
            </div>
            <div className={`text-2xl font-bold ${getStatusColor(stats.dueToday, 'due_today')}`}>
              {stats.dueToday}
            </div>
          </div>

          {/* Upcoming Bills */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.upcomingBills, 'upcoming')}
              <div>
                <p className="text-sm font-medium">{t('dashboard.upcoming')}</p>
                <p className="text-xs text-gray-600">{t('dashboard.next30Days')}</p>
              </div>
            </div>
            <div className={`text-2xl font-bold ${getStatusColor(stats.upcomingBills, 'upcoming')}`}>
              {stats.upcomingBills}
            </div>
          </div>

          {/* Total Lofts with Bills */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">{t('dashboard.active')}</p>
                <p className="text-xs text-gray-600">{t('dashboard.loftsWithBills')}</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalLoftsWithBills}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('dashboard.systemStatus')}</span>
            <div className="flex items-center gap-2">
              {stats.overdueBills === 0 && stats.dueToday === 0 ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
{t('dashboard.allBillsCurrent')}
                </Badge>
              ) : stats.overdueBills > 0 ? (
                <Badge variant="destructive">
{t('dashboard.actionRequired')}
                </Badge>
              ) : (
                <Badge variant="secondary">
{t('dashboard.attentionNeeded')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}