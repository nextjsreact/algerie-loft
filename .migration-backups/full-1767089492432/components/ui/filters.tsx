'use client'

import { useState } from 'react'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export interface FilterOption {
  label: string
  value: string
  count?: number
}

export interface FilterGroup {
  key: string
  label: string
  options: FilterOption[]
}

interface FiltersProps {
  filterGroups: FilterGroup[]
  activeFilters: Record<string, string[]>
  onFilterChange: (filterKey: string, values: string[]) => void
  onClearAll: () => void
}

export function Filters({ filterGroups, activeFilters, onFilterChange, onClearAll }: FiltersProps) {
  const totalActiveFilters = Object.values(activeFilters).flat().length

  const handleFilterToggle = (filterKey: string, value: string) => {
    const currentValues = activeFilters[filterKey] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    onFilterChange(filterKey, newValues)
  }

  const removeFilter = (filterKey: string, value: string) => {
    const currentValues = activeFilters[filterKey] || []
    const newValues = currentValues.filter(v => v !== value)
    onFilterChange(filterKey, newValues)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {totalActiveFilters > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {totalActiveFilters}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {filterGroups.map((group) => (
              <div key={group.key}>
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {group.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={(activeFilters[group.key] || []).includes(option.value)}
                    onCheckedChange={() => handleFilterToggle(group.key, option.value)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {option.count}
                        </span>
                      )}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {totalActiveFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {totalActiveFilters > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([filterKey, values]) =>
            values.map((value) => {
              const group = filterGroups.find(g => g.key === filterKey)
              const option = group?.options.find(o => o.value === value)
              return (
                <Badge key={`${filterKey}-${value}`} variant="secondary" className="gap-1">
                  {option?.label || value}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => removeFilter(filterKey, value)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// Hook for filter functionality
export function useFilters<T>(
  items: T[],
  activeFilters: Record<string, string[]>,
  filterFunctions: Record<string, (item: T, values: string[]) => boolean>
) {
  return items.filter(item => {
    return Object.entries(activeFilters).every(([filterKey, values]) => {
      if (values.length === 0) return true
      const filterFn = filterFunctions[filterKey]
      return filterFn ? filterFn(item, values) : true
    })
  })
}