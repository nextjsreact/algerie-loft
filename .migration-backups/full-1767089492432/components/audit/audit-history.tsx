"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { 
  History, 
  Filter, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  User,
  Activity
} from 'lucide-react'
import { AuditLogItem } from './audit-log-item'
import { AuditLog } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'

interface AuditHistoryProps {
  tableName: string
  recordId: string
  className?: string
  showFilters?: boolean
  maxHeight?: string
}

export function AuditHistory({ 
  tableName, 
  recordId, 
  className,
  showFilters = true,
  maxHeight = "600px"
}: AuditHistoryProps) {
  const t = useTranslations('audit')
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter states
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [userFilter, setUserFilter] = useState<string>('all')
  
  // Derived data
  const [uniqueUsers, setUniqueUsers] = useState<string[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])

  // Fetch audit logs
  const fetchAuditLogs = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await fetch(`/api/audit/entity/${tableName}/${recordId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Handle both API response formats
      const auditLogs = data.data?.auditHistory || data.logs || []
      setLogs(auditLogs)
      
      // Extract unique users for filter
      const users = Array.from(new Set(
        auditLogs
          .map((log: AuditLog) => log.userEmail)
          .filter(Boolean)
      )) as string[]
      setUniqueUsers(users)
      
    } catch (err) {
      console.error('Error fetching audit logs:', err)
      setError(err instanceof Error ? err.message : t('fetchError'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Apply filters to logs
  useEffect(() => {
    let filtered = [...logs]

    // Filter by action
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter)
    }

    // Filter by user
    if (userFilter !== 'all') {
      filtered = filtered.filter(log => log.userEmail === userFilter)
    }

    // Filter by date range
    if (dateRange?.from || dateRange?.to) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp)
        const fromDate = dateRange.from ? new Date(dateRange.from) : null
        const toDate = dateRange.to ? new Date(dateRange.to) : null

        if (fromDate && logDate < fromDate) return false
        if (toDate && logDate > toDate) return false
        return true
      })
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    setFilteredLogs(filtered)
  }, [logs, actionFilter, userFilter, dateRange])

  // Initial load
  useEffect(() => {
    fetchAuditLogs()
  }, [tableName, recordId])

  // Get table display name
  const getTableDisplayName = (tableName: string) => {
    const tableNames: Record<string, string> = {
      transactions: t('tables.transactions'),
      tasks: t('tables.tasks'),
      reservations: t('tables.reservations'),
      lofts: t('tables.lofts')
    }
    return tableNames[tableName] || tableName
  }

  // Get statistics
  const getStatistics = () => {
    const total = logs.length
    const creates = logs.filter(log => log.action === 'INSERT').length
    const updates = logs.filter(log => log.action === 'UPDATE').length
    const deletes = logs.filter(log => log.action === 'DELETE').length
    const uniqueUsersCount = uniqueUsers.length

    return { total, creates, updates, deletes, uniqueUsersCount }
  }

  const stats = getStatistics()

  // Reset filters
  const resetFilters = () => {
    setActionFilter('all')
    setUserFilter('all')
    setDateRange(undefined)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>{t('auditHistory')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>{t('auditHistory')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={() => fetchAuditLogs()}
              >
                {t('retry')}
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>
              {t('auditHistoryFor')} {getTableDisplayName(tableName)}
            </CardTitle>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAuditLogs(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            {t('refresh')}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{stats.total}</span>
            <span className="text-muted-foreground">{t('totalChanges')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="default" className="text-xs">
              {stats.creates} {t('created')}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="text-xs">
              {stats.updates} {t('updated')}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="destructive" className="text-xs">
              {stats.deletes} {t('deleted')}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{stats.uniqueUsersCount}</span>
            <span className="text-muted-foreground">{t('users')}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        {showFilters && (logs.length > 0 || actionFilter !== 'all' || userFilter !== 'all' || dateRange) && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">{t('filters')}</span>
              {(actionFilter !== 'all' || userFilter !== 'all' || dateRange) && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  {t('clearFilters')}
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Action Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('action')}</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allActions')}</SelectItem>
                    <SelectItem value="INSERT">{t('actions.created')}</SelectItem>
                    <SelectItem value="UPDATE">{t('actions.updated')}</SelectItem>
                    <SelectItem value="DELETE">{t('actions.deleted')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* User Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('user')}</label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allUsers')}</SelectItem>
                    {uniqueUsers.map(user => (
                      <SelectItem key={user} value={user}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('dateRange')}</label>
                <DatePickerWithRange
                  value={dateRange}
                  onChange={setDateRange}
                  className="w-full"
                />
              </div>
            </div>

            {/* Active filters indicator */}
            {filteredLogs.length !== logs.length && (
              <div className="text-sm text-muted-foreground">
                {t('showingResults', { 
                  filtered: filteredLogs.length, 
                  total: logs.length 
                })}
              </div>
            )}
          </div>
        )}

        {/* Audit logs timeline */}
        <div 
          className="space-y-4 overflow-y-auto"
          style={{ maxHeight }}
        >
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {logs.length === 0 ? t('noAuditLogs') : t('noMatchingLogs')}
              </p>
              <p className="text-sm">
                {logs.length === 0 
                  ? t('noAuditLogsDescription')
                  : t('tryAdjustingFilters')
                }
              </p>
            </div>
          ) : (
            <>
              {/* Timeline header */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Calendar className="h-4 w-4" />
                <span>{t('chronologicalOrder')}</span>
              </div>

              {/* Timeline items */}
              {filteredLogs.map((log, index) => (
                <div key={log.id} className="relative">
                  {/* Timeline connector */}
                  {index < filteredLogs.length - 1 && (
                    <div className="absolute left-4 top-16 w-0.5 h-8 bg-border" />
                  )}
                  
                  <AuditLogItem 
                    log={log} 
                    className="relative z-10"
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}