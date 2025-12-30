'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon, MapPin, User, Users, DollarSign, Filter, RotateCcw, ChevronDown, X } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { Calendar } from '@/components/ui/calendar'

interface FilterPanelProps {
  filters: any
  onFiltersChange: (filters: any) => void
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  isLoading: boolean
  filterOptions: {
    regions: Array<{ value: string; label: string }>
    owners: Array<{ value: string; label: string }>
    zoneAreas: Array<{ id: string; name: string }>
    ownersData: Array<{ id: string; name: string }>
  }
}

const ALL_STATUSES = [
  { value: 'available', label: 'available' },
  { value: 'occupied', label: 'occupied' },
  { value: 'maintenance', label: 'maintenance' },
  { value: 'personal_use', label: 'personal_use' },
];

export function FilterPanel({ filters, onFiltersChange, dateRange, onDateRangeChange, isLoading, filterOptions }: FilterPanelProps) {
  const t = useTranslations('availability')

  const regions = filterOptions.regions.length > 0 ? filterOptions.regions.map(region => ({
    ...region,
    label: region.label.startsWith('availability:') ? t(region.label.replace('availability:', '')) : region.label
  })) : [
    { value: 'all', label: t('allRegions') }
  ]

  const owners = filterOptions.owners.length > 0 ? filterOptions.owners.slice(1) : []

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const resetFilters = () => {
    onFiltersChange({
      region: 'all',
      owners: [],
      guests: 2,
      minPrice: 0,
      maxPrice: 1000000,
      statuses: []
    })
    onDateRangeChange({
      from: new Date(),
      to: addDays(new Date(), 29),
    })
  }

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'region') return value !== 'all'
    if (key === 'owners') return Array.isArray(value) && value.length > 0
    if (key === 'statuses') return Array.isArray(value) && value.length > 0
    if (key === 'guests') return value !== 2
    if (key === 'minPrice') return value !== 0
    if (key === 'maxPrice') return value !== 1000000
    return false
  }).length + (dateRange?.from || dateRange?.to ? 1 : 0)

  const handleOwnerToggle = (ownerValue: string) => {
    const currentOwners = filters.owners || []
    const updatedOwners = currentOwners.includes(ownerValue)
      ? currentOwners.filter((owner: string) => owner !== ownerValue)
      : [...currentOwners, ownerValue]
    
    handleFilterChange('owners', updatedOwners)
  }

  const clearAllOwners = () => {
    handleFilterChange('owners', [])
  }

  const selectAllOwners = () => {
    handleFilterChange('owners', owners.map(owner => owner.value))
  }

  const getSelectedOwnersText = () => {
    const selectedOwners = filters.owners || []
    if (selectedOwners.length === 0) {
      return t('allOwners')
    }
    if (selectedOwners.length === 1) {
      const owner = owners.find(o => o.value === selectedOwners[0])
      return owner?.label || selectedOwners[0]
    }
    return t('ownersSelected', { count: selectedOwners.length })
  }

  const handleStatusToggle = (statusValue: string) => {
    const currentStatuses = filters.statuses || []
    const updatedStatuses = currentStatuses.includes(statusValue)
      ? currentStatuses.filter((status: string) => status !== statusValue)
      : [...currentStatuses, statusValue]
    
    handleFilterChange('statuses', updatedStatuses)
  }

  const clearAllStatuses = () => {
    handleFilterChange('statuses', [])
  }

  const selectAllStatuses = () => {
    handleFilterChange('statuses', ALL_STATUSES.map(status => status.value))
  }

  const getSelectedStatusesText = () => {
    const selectedStatuses = filters.statuses || []
    if (selectedStatuses.length === 0) {
      return t('allStatuses')
    }
    if (selectedStatuses.length === 1) {
      const status = ALL_STATUSES.find(s => s.value === selectedStatuses[0])
      return t(status?.label || selectedStatuses[0])
    }
    return t('statusesSelected', { count: selectedStatuses.length })
  }

  return (
    <Card className="bg-gradient-to-br from-gray-50/50 to-slate-50/50 dark:from-gray-800/50 dark:to-slate-800/50 border-0 shadow-xl backdrop-blur-sm sticky top-8">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-blue-500"></div>
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              {t('filters')}
            </CardTitle>
          </div>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {t('filtersDescription')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-green-600" />
            {t('dateRange')}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className="w-full justify-center text-center font-normal text-sm"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>{t('pickDate')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        {/* Status Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4 text-yellow-600" />
            {t('status')}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between text-left font-normal"
              >
                <span className="truncate">{getSelectedStatusesText()}</span>
                <div className="flex items-center gap-1">
                  {filters.statuses && filters.statuses.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {filters.statuses.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{t('selectStatuses')}</h4>
                  {filters.statuses && filters.statuses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllStatuses}
                      className="h-6 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      {t('clearAll')}
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-2">
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAllStatuses}
                    className="w-full justify-start text-xs h-8"
                  >
                    {t('selectAll')}
                  </Button>
                  {ALL_STATUSES.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={filters.statuses?.includes(status.value) || false}
                        onCheckedChange={() => handleStatusToggle(status.value)}
                      />
                      <Label
                        htmlFor={`status-${status.value}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {t(status.label)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Separator />

        {/* Region Filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            {t('region')}
          </Label>
          <select
            value={filters.region}
            onChange={(e) => handleFilterChange('region', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {regions.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </div>

        {/* Owner Filter - Multi-select */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-purple-600" />
            {t('owners')}
          </Label>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between text-left font-normal"
              >
                <span className="truncate">{getSelectedOwnersText()}</span>
                <div className="flex items-center gap-1">
                  {filters.owners && filters.owners.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {filters.owners.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </div>
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-full p-0" align="start">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{t('selectOwners')}</h4>
                  {filters.owners && filters.owners.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllOwners}
                      className="h-6 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      {t('clearAll')}
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {t('loadingOwners')}
                    </span>
                  </div>
                ) : owners.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">{t('noOwnersFound')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllOwners}
                      className="w-full justify-start text-xs h-8"
                    >
                      {t('selectAll')}
                    </Button>
                    
                    {owners.map((owner) => (
                      <div key={owner.value} className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm">
                        <Checkbox
                          id={`owner-${owner.value}`}
                          checked={filters.owners?.includes(owner.value) || false}
                          onCheckedChange={() => handleOwnerToggle(owner.value)}
                        />
                        <Label
                          htmlFor={`owner-${owner.value}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {owner.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Affichage des propriétaires sélectionnés */}
          {filters.owners && filters.owners.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.owners.map((ownerValue: string) => {
                const owner = owners.find(o => o.value === ownerValue)
                return (
                  <Badge
                    key={ownerValue}
                    variant="secondary"
                    className="text-xs px-2 py-1"
                  >
                    {owner?.label || ownerValue}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOwnerToggle(ownerValue)}
                      className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Guests */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-600" />
            {t('guests')}
          </Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={filters.guests}
            onChange={(e) => handleFilterChange('guests', parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            {t('priceRange')}
          </Label>
          <div className="space-y-2">
            <div>
              <Label htmlFor="minPrice" className="text-xs text-muted-foreground">
                {t('minPrice')}
              </Label>
              <Input
                id="minPrice"
                type="number"
                min="0"
                step="1000"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value === '' ? '' : parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="maxPrice" className="text-xs text-muted-foreground">
                {t('maxPrice')}
              </Label>
              <Input
                id="maxPrice"
                type="number"
                min="0"
                step="1000"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value === '' ? '' : parseInt(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={resetFilters}
            variant="outline" 
            className="w-full flex items-center gap-2 hover:bg-gradient-to-r hover:from-gray-500 hover:to-slate-500 hover:text-white hover:border-transparent transition-all duration-300"
          >
            <RotateCcw className="h-4 w-4" />
            {t('resetFilters')}
          </Button>
        </div>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700/50">
            <p className="text-xs text-green-700 dark:text-green-300 font-medium">
              {t('activeFilters', { count: activeFiltersCount })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}