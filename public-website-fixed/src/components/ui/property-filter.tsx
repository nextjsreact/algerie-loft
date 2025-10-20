'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from './button'
import { Card } from './card'

export interface PropertyFilters {
  type?: string[]
  city?: string[]
  features?: string[]
  search?: string
}

interface PropertyFilterProps {
  filters: PropertyFilters
  onFiltersChange: (filters: PropertyFilters) => void
  availableTypes: string[]
  availableCities: string[]
  availableFeatures: string[]
  className?: string
}

export function PropertyFilter({
  filters,
  onFiltersChange,
  availableTypes,
  availableCities,
  availableFeatures,
  className = ''
}: PropertyFilterProps) {
  const t = useTranslations('portfolio')
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchTerm, setSearchTerm] = useState(filters.search || '')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFiltersChange({ ...filters, search: searchTerm || undefined })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, filters, onFiltersChange])

  const handleTypeToggle = (type: string) => {
    const currentTypes = filters.type || []
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type]
    
    onFiltersChange({
      ...filters,
      type: newTypes.length > 0 ? newTypes : undefined
    })
  }

  const handleCityToggle = (city: string) => {
    const currentCities = filters.city || []
    const newCities = currentCities.includes(city)
      ? currentCities.filter(c => c !== city)
      : [...currentCities, city]
    
    onFiltersChange({
      ...filters,
      city: newCities.length > 0 ? newCities : undefined
    })
  }

  const handleFeatureToggle = (feature: string) => {
    const currentFeatures = filters.features || []
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter(f => f !== feature)
      : [...currentFeatures, feature]
    
    onFiltersChange({
      ...filters,
      features: newFeatures.length > 0 ? newFeatures : undefined
    })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    onFiltersChange({})
  }

  const hasActiveFilters = !!(
    filters.search ||
    (filters.type && filters.type.length > 0) ||
    (filters.city && filters.city.length > 0) ||
    (filters.features && filters.features.length > 0)
  )

  const activeFilterCount = [
    filters.search,
    ...(filters.type || []),
    ...(filters.city || []),
    ...(filters.features || [])
  ].filter(Boolean).length

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('filters.title')}
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {activeFilterCount} {t('filters.active')}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden"
          >
            {isExpanded ? t('filters.hide') : t('filters.show')}
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className={`space-y-4 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
        {/* Property Types */}
        {availableTypes.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {t('filters.propertyType')}
            </h4>
            <div className="space-y-2">
              {availableTypes.map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(filters.type || []).includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">
                    {t(`types.${type}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Cities */}
        {availableCities.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {t('filters.location')}
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availableCities.map((city) => (
                <label key={city} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(filters.city || []).includes(city)}
                    onChange={() => handleCityToggle(city)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {city}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        {availableFeatures.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {t('filters.features')}
            </h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availableFeatures.slice(0, 10).map((feature) => (
                <label key={feature} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={(filters.features || []).includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {feature}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="w-full"
            >
              {t('filters.clearAll')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}