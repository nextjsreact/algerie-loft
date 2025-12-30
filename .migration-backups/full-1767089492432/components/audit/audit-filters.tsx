"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { 
  Filter, 
  Search, 
  RotateCcw, 
  Calendar,
  User,
  Database,
  Activity
} from 'lucide-react'
import { AuditFilters as AuditFiltersType, AuditAction, AuditableTable } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'

interface AuditFiltersProps {
  filters: AuditFiltersType
  onFiltersChange: (filters: AuditFiltersType) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  className?: string
  availableUsers?: Array<{ id: string; email: string; full_name?: string }>
  loading?: boolean
}

export function AuditFilters({ 
  filters, 
  onFiltersChange, 
  onApplyFilters,
  onResetFilters,
  className,
  availableUsers = [],
  loading = false
}: AuditFiltersProps) {
  const t = useTranslations('audit')
  
  // Local state for form inputs
  const [localFilters, setLocalFilters] = useState<AuditFiltersType>(filters)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // Sync local filters with props
  useEffect(() => {
    setLocalFilters(filters)
    
    // Set date range from filters
    if (filters.dateFrom || filters.dateTo) {
      setDateRange({
        from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        to: filters.dateTo ? new Date(filters.dateTo) : undefined
      })
    } else {
      setDateRange(undefined)
    }
  }, [filters])

  // Update local filter state
  const updateLocalFilter = (key: keyof AuditFiltersType, value: string | undefined) => {
    // Treat "all" as undefined (no filter)
    const filterValue = value === "all" ? undefined : value || undefined
    const newFilters = { ...localFilters, [key]: filterValue }
    setLocalFilters(newFilters)
  }

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    const newFilters = {
      ...localFilters,
      dateFrom: range?.from?.toISOString(),
      dateTo: range?.to?.toISOString()
    }
    setLocalFilters(newFilters)
  }

  // Apply filters
  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    onApplyFilters()
  }

  // Reset filters
  const handleResetFilters = () => {
    const emptyFilters: AuditFiltersType = {}
    setLocalFilters(emptyFilters)
    setDateRange(undefined)
    onFiltersChange(emptyFilters)
    onResetFilters()
  }

  // Check if filters are active
  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== ''
  )

  // Available table names
  const tableNames: Array<{ value: AuditableTable; label: string }> = [
    { value: 'transactions', label: t('tables.transactions') },
    { value: 'tasks', label: t('tables.tasks') },
    { value: 'reservations', label: t('tables.reservations') },
    { value: 'lofts', label: t('tables.lofts') }
  ]

  // Available actions
  const actions: Array<{ value: AuditAction; label: string }> = [
    { value: 'INSERT', label: t('actions.created') },
    { value: 'UPDATE', label: t('actions.updated') },
    { value: 'DELETE', label: t('actions.deleted') }
  ]

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          {t('filters')}
          {hasActiveFilters && (
            <span className="text-sm font-normal text-muted-foreground">
              ({t('filtersActive')})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            {t('search')}
          </Label>
          <Input
            id="search"
            placeholder={t('searchPlaceholder')}
            value={localFilters.search || ''}
            onChange={(e) => updateLocalFilter('search', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            {t('searchDescription')}
          </p>
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Table Name Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t('tableName')}
            </Label>
            <Select 
              value={localFilters.tableName || 'all'} 
              onValueChange={(value) => updateLocalFilter('tableName', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('allTables')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTables')}</SelectItem>
                {tableNames.map(table => (
                  <SelectItem key={table.value} value={table.value}>
                    {table.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('action')}
            </Label>
            <Select 
              value={localFilters.action || 'all'} 
              onValueChange={(value) => updateLocalFilter('action', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('allActions')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allActions')}</SelectItem>
                {actions.map(action => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User Filter */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('user')}
            </Label>
            <Select 
              value={localFilters.userId || 'all'} 
              onValueChange={(value) => updateLocalFilter('userId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('allUsers')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allUsers')}</SelectItem>
                {availableUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Record ID Filter */}
          <div className="space-y-2">
            <Label htmlFor="recordId">
              {t('recordId')}
            </Label>
            <Input
              id="recordId"
              placeholder={t('recordIdPlaceholder')}
              value={localFilters.recordId || ''}
              onChange={(e) => updateLocalFilter('recordId', e.target.value)}
            />
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('dateRange')}
          </Label>
          <DatePickerWithRange
            value={dateRange}
            onChange={handleDateRangeChange}
            className="w-full max-w-sm"
          />
          <p className="text-xs text-muted-foreground">
            {t('dateRangeDescription')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button 
            onClick={handleApplyFilters}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {t('applyFilters')}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleResetFilters}
            disabled={loading || !hasActiveFilters}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t('resetFilters')}
          </Button>

          {hasActiveFilters && (
            <span className="text-sm text-muted-foreground">
              {t('activeFiltersCount', { 
                count: Object.values(localFilters).filter(v => v !== undefined && v !== '').length 
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}