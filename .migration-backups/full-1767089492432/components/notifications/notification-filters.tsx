'use client'

import React from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface NotificationFiltersProps {
  filters: {
    category: string
    unread_only: boolean
  }
  onFiltersChange: (filters: any) => void
  className?: string
}

export function NotificationFilters({
  filters,
  onFiltersChange,
  className
}: NotificationFiltersProps) {
  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: category === 'all' ? '' : category
    })
  }

  const handleUnreadOnlyChange = (unread_only: boolean) => {
    onFiltersChange({
      ...filters,
      unread_only
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      category: '',
      unread_only: false
    })
  }

  const hasActiveFilters = filters.category || filters.unread_only

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`relative ${className}`}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-1 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <Select
                value={filters.category || 'all'}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="booking">Bookings</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="unread-only" className="text-sm font-medium">
                Unread only
              </Label>
              <Switch
                id="unread-only"
                checked={filters.unread_only}
                onCheckedChange={handleUnreadOnlyChange}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                Active filters:
                <div className="mt-1 flex flex-wrap gap-1">
                  {filters.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {filters.category}
                    </span>
                  )}
                  {filters.unread_only && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Unread only
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}