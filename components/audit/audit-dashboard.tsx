"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Download, 
  AlertCircle, 
  Activity,
  Users,
  Database,
  TrendingUp,
  Eye
} from 'lucide-react'
import { AuditFilters } from './audit-filters'
import { AuditTable } from './audit-table'
import { AuditLogItem } from './audit-log-item'
import { AuditExport } from './audit-export'
import { AuditLog, AuditFilters as AuditFiltersType, UserRole } from '@/lib/types'
import { AuditPermissionManager } from '@/lib/permissions/audit-permissions'
import { cn } from '@/lib/utils'

interface AuditDashboardProps {
  userRole: UserRole
  userId: string
  className?: string
}

interface AuditStats {
  totalLogs: number
  todayLogs: number
  uniqueUsers: number
  topActions: Array<{ action: string; count: number }>
}

export function AuditDashboard({ userRole, userId, className }: AuditDashboardProps) {
  const t = useTranslations('audit')
  
  // State management
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedLogs, setSelectedLogs] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; email: string; full_name?: string }>>([])
  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    todayLogs: 0,
    uniqueUsers: 0,
    topActions: []
  })
  
  // Filter state
  const [filters, setFilters] = useState<AuditFiltersType>({})
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<AuditLog | null>(null)

  // Check permissions
  const canExport = AuditPermissionManager.canExportAuditLogs(userRole)
  const accessLevel = AuditPermissionManager.getAuditAccessLevel(userRole)

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value)
        }
      })

      const response = await fetch(`/api/audit/logs?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setLogs(data.logs || [])
      setFilteredLogs(data.logs || [])
      
      // Calculate statistics
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayLogs = (data.logs || []).filter((log: AuditLog) => 
        new Date(log.timestamp) >= today
      ).length

      const uniqueUsers = new Set(
        (data.logs || []).map((log: AuditLog) => log.userId).filter(Boolean)
      ).size

      const actionCounts: Record<string, number> = {}
      ;(data.logs || []).forEach((log: AuditLog) => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
      })

      const topActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

      setStats({
        totalLogs: data.logs?.length || 0,
        todayLogs,
        uniqueUsers,
        topActions
      })

      // Extract unique users from audit logs for filters
      const availableUsersList = Array.from(
        new Map(
          data.logs
            .filter(log => log.userEmail) // Include all users, even "Unknown User"
            .map(log => [log.userEmail, { // Use email as unique key instead of userId
              id: log.userId || log.userEmail, // Use userId if available, otherwise email
              email: log.userEmail,
              full_name: log.userEmail === 'Unknown User' ? 'Unknown User' : log.userEmail.split('@')[0]
            }])
        ).values()
      )
      setAvailableUsers(availableUsersList)
      
    } catch (err) {
      console.error('Error fetching audit logs:', err)
      setError(err instanceof Error ? err.message : t('fetchError'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters, t])

  // Initial load
  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  // Handle filter changes
  const handleFiltersChange = (newFilters: AuditFiltersType) => {
    setFilters(newFilters)
  }

  // Apply filters to logs
  useEffect(() => {
    let filtered = [...logs]

    // Filter by table name
    if (filters.tableName && filters.tableName !== 'all') {
      filtered = filtered.filter(log => log.tableName === filters.tableName)
    }

    // Filter by action
    if (filters.action && filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action)
    }

    // Filter by user
    if (filters.userId && filters.userId !== 'all') {
      filtered = filtered.filter(log => log.userId === filters.userId || log.userEmail === filters.userId)
    }

    // Filter by record ID
    if (filters.recordId) {
      filtered = filtered.filter(log => log.recordId.toLowerCase().includes(filters.recordId!.toLowerCase()))
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.dateFrom!))
    }
    if (filters.dateTo) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.dateTo!))
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(log => 
        log.userEmail.toLowerCase().includes(searchTerm) ||
        log.action.toLowerCase().includes(searchTerm) ||
        log.tableName.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredLogs(filtered)
  }, [logs, filters])

  // Apply filters
  const handleApplyFilters = () => {
    fetchAuditLogs()
  }

  // Reset filters
  const handleResetFilters = () => {
    setFilters({})
    setSelectedLogs([])
  }

  // Handle export
  const handleExportSelected = async (selectedIds: string[]) => {
    if (!canExport) {
      setError(t('exportNotAllowed'))
      return
    }

    try {
      const response = await fetch('/api/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logIds: selectedIds }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export error:', err)
      setError(t('exportError'))
    }
  }

  // Handle view details
  const handleViewDetails = (log: AuditLog) => {
    setSelectedLogForDetails(log)
  }

  // Get action display name
  const getActionDisplayName = (action: string) => {
    const actionNames: Record<string, string> = {
      INSERT: t('actions.created'),
      UPDATE: t('actions.updated'),
      DELETE: t('actions.deleted')
    }
    return actionNames[action] || action
  }

  if (error && !logs.length) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
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
    <div className={cn("space-y-6", className)}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('totalLogs')}</p>
                <p className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('todayLogs')}</p>
                <p className="text-2xl font-bold">{stats.todayLogs.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('uniqueUsers')}</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('topAction')}</p>
                <p className="text-lg font-bold">
                  {stats.topActions[0] ? getActionDisplayName(stats.topActions[0].action) : t('none')}
                </p>
                {stats.topActions[0] && (
                  <p className="text-sm text-muted-foreground">
                    {stats.topActions[0].count} {t('times')}
                  </p>
                )}
              </div>
              <Database className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Actions Summary */}
      {stats.topActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('topActions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.topActions.map(({ action, count }) => (
                <Badge key={action} variant="secondary" className="flex items-center gap-2">
                  {getActionDisplayName(action)}
                  <span className="bg-muted px-2 py-1 rounded text-xs">
                    {count}
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <AuditFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        availableUsers={availableUsers}
        loading={loading || refreshing}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <Database className="h-4 w-4 mr-2" />
            {t('tableView')}
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            <Activity className="h-4 w-4 mr-2" />
            {t('timelineView')}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAuditLogs(true)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            {t('refresh')}
          </Button>

          {canExport && (
            <AuditExport 
              filters={filters}
              className="inline-flex"
            />
          )}

          {canExport && selectedLogs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportSelected(selectedLogs)}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('exportSelected')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'table' ? (
        <AuditTable
          logs={filteredLogs}
          loading={loading}
          selectedLogs={selectedLogs}
          onSelectionChange={setSelectedLogs}
          onExportSelected={canExport ? handleExportSelected : undefined}
          onViewDetails={handleViewDetails}
          showSelection={canExport}
          showActions={true}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('auditTimeline')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">{t('noAuditLogs')}</p>
                  <p className="text-sm">{t('noAuditLogsDescription')}</p>
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <div key={log.id} className="relative">
                    {index < filteredLogs.length - 1 && (
                      <div className="absolute left-4 top-16 w-0.5 h-8 bg-border" />
                    )}
                    <AuditLogItem log={log} className="relative z-10" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Modal/Sidebar */}
      {selectedLogForDetails && (
        <Card className="fixed inset-y-0 right-0 w-96 z-50 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('auditDetails')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLogForDetails(null)}
            >
              ×
            </Button>
          </CardHeader>
          <CardContent className="overflow-y-auto">
            <AuditLogItem log={selectedLogForDetails} showDetails={true} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}