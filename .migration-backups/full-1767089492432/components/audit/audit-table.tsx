"use client"

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal,
  Download,
  Eye,
  Plus,
  Edit,
  Trash2,
  User,
  Clock,
  Database,
  ExternalLink
} from 'lucide-react'
import { AuditLog } from '@/lib/types'
import { cn } from '@/lib/utils'

interface AuditTableProps {
  logs: AuditLog[]
  loading?: boolean
  selectedLogs?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onExportSelected?: (selectedIds: string[]) => void
  onViewDetails?: (log: AuditLog) => void
  className?: string
  showSelection?: boolean
  showActions?: boolean
}

type SortField = 'timestamp' | 'action' | 'tableName' | 'userEmail'
type SortDirection = 'asc' | 'desc'

export function AuditTable({
  logs,
  loading = false,
  selectedLogs = [],
  onSelectionChange,
  onExportSelected,
  onViewDetails,
  className,
  showSelection = true,
  showActions = true
}: AuditTableProps) {
  const t = useTranslations('audit')
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Sort logs
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime()
          bValue = new Date(b.timestamp).getTime()
          break
        case 'action':
          aValue = a.action
          bValue = b.action
          break
        case 'tableName':
          aValue = a.tableName
          bValue = b.tableName
          break
        case 'userEmail':
          aValue = a.userEmail || ''
          bValue = b.userEmail || ''
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [logs, sortField, sortDirection])

  // Handle selection
  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? logs.map(log => log.id) : [])
    }
  }

  const handleSelectLog = (logId: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedLogs, logId]
        : selectedLogs.filter(id => id !== logId)
      onSelectionChange(newSelection)
    }
  }

  // Get action configuration
  const getActionConfig = (action: string) => {
    switch (action) {
      case 'INSERT':
        return {
          icon: Plus,
          variant: 'default' as const,
          label: t('actions.created'),
          color: 'text-green-600'
        }
      case 'UPDATE':
        return {
          icon: Edit,
          variant: 'secondary' as const,
          label: t('actions.updated'),
          color: 'text-blue-600'
        }
      case 'DELETE':
        return {
          icon: Trash2,
          variant: 'destructive' as const,
          label: t('actions.deleted'),
          color: 'text-red-600'
        }
      default:
        return {
          icon: Eye,
          variant: 'outline' as const,
          label: action,
          color: 'text-gray-600'
        }
    }
  }

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

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  // Check if all logs are selected
  const allSelected = logs.length > 0 && selectedLogs.length === logs.length
  const someSelected = selectedLogs.length > 0 && selectedLogs.length < logs.length

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {t('auditLogs')}
            <span className="text-sm font-normal text-muted-foreground">
              ({logs.length} {t('entries')})
            </span>
          </CardTitle>

          {showSelection && selectedLogs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {t('selectedCount', { count: selectedLogs.length })}
              </span>
              {onExportSelected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExportSelected(selectedLogs)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t('exportSelected')}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {showSelection && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected || undefined}
                      onCheckedChange={handleSelectAll}
                      aria-label={t('selectAll')}
                    />
                  </TableHead>
                )}
                
                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('timestamp')}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('timestamp')}
                    {renderSortIcon('timestamp')}
                  </div>
                </TableHead>

                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('action')}
                >
                  <div className="flex items-center gap-2">
                    {t('action')}
                    {renderSortIcon('action')}
                  </div>
                </TableHead>

                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('tableName')}
                >
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {t('table')}
                    {renderSortIcon('tableName')}
                  </div>
                </TableHead>

                <TableHead>{t('recordId')}</TableHead>

                <TableHead 
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('userEmail')}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('user')}
                    {renderSortIcon('userEmail')}
                  </div>
                </TableHead>

                <TableHead>{t('changes')}</TableHead>

                {showActions && (
                  <TableHead className="w-12">
                    <span className="sr-only">{t('actionsColumn')}</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                // Loading skeleton
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {showSelection && (
                      <TableCell>
                        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : sortedLogs.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={showSelection && showActions ? 8 : showSelection || showActions ? 7 : 6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">{t('noAuditLogs')}</p>
                    <p className="text-sm">{t('noAuditLogsDescription')}</p>
                  </TableCell>
                </TableRow>
              ) : (
                sortedLogs.map((log) => {
                  const actionConfig = getActionConfig(log.action)
                  const ActionIcon = actionConfig.icon
                  const { date, time } = formatTimestamp(log.timestamp)
                  const isSelected = selectedLogs.includes(log.id)

                  return (
                    <TableRow 
                      key={log.id}
                      className={cn(
                        "hover:bg-muted/50 transition-colors",
                        isSelected && "bg-muted/30"
                      )}
                    >
                      {showSelection && (
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleSelectLog(log.id, checked as boolean)
                            }
                            aria-label={t('selectLog')}
                          />
                        </TableCell>
                      )}

                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{date}</div>
                          <div className="text-xs text-muted-foreground">{time}</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={actionConfig.variant} className="flex items-center gap-1 w-fit">
                          <ActionIcon className="h-3 w-3" />
                          {actionConfig.label}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {getTableDisplayName(log.tableName)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {log.recordId.slice(0, 8)}...
                        </code>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {log.userEmail || t('unknownUser')}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {log.changedFields && log.changedFields.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">
                              {log.changedFields.length}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t('fieldsChanged')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {log.action === 'INSERT' ? t('newRecord') : 
                             log.action === 'DELETE' ? t('recordDeleted') : 
                             t('noChanges')}
                          </span>
                        )}
                      </TableCell>

                      {showActions && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">{t('openMenu')}</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {onViewDetails && (
                                <DropdownMenuItem onClick={() => onViewDetails(log)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {t('viewDetails')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => navigator.clipboard.writeText(log.recordId)}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {t('copyRecordId')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination info */}
        {!loading && sortedLogs.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div>
              {t('showingEntries', { 
                start: 1, 
                end: sortedLogs.length, 
                total: logs.length 
              })}
            </div>
            {selectedLogs.length > 0 && (
              <div>
                {t('selectedEntries', { count: selectedLogs.length })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}