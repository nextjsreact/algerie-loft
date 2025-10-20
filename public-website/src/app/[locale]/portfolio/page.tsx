'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Property, Locale } from '@/types/sanity'
import { 
  getAllProperties, 
  getPropertyTypes, 
  getPropertyCities, 
  getPropertyFeatures 
} from '@/lib/sanity-queries'
import { PropertyFilter, PropertyFilters } from '@/components/ui/property-filter'
import { PropertyGrid } from '@/components/ui/property-grid'

interface PortfolioPageState {
  properties: Property[]
  loading: boolean
  hasMore: boolean
  total: number
  availableTypes: string[]
  availableCities: string[]
  availableFeatures: string[]
}

export default function PortfolioPage() {
  const t = useTranslations('portfolio')
  const locale = useLocale() as Locale
  
  const [state, setState] = useState<PortfolioPageState>({
    properties: [],
    loading: true,
    hasMore: false,
    total: 0,
    availableTypes: [],
    availableCities: [],
    availableFeatures: []
  })
  
  const [filters, setFilters] = useState<PropertyFilters>({})
  const [currentOffset, setCurrentOffset] = useState(0)

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [types, cities, features] = await Promise.all([
          getPropertyTypes(),
          getPropertyCities(),
          getPropertyFeatures(locale)
        ])
        
        setState(prev => ({
          ...prev,
          availableTypes: types,
          availableCities: cities,
          availableFeatures: features
        }))
      } catch (error) {
        console.error('Error loading filter options:', error)
      }
    }
    
    loadFilterOptions()
  }, [locale])

  // Load properties based on filters
  const loadProperties = useCallback(async (
    newFilters: PropertyFilters, 
    offset: number = 0, 
    append: boolean = false
  ) => {
    setState(prev => ({ ...prev, loading: true }))
    
    try {
      const result = await getAllProperties({
        type: newFilters.type,
        city: newFilters.city,
        features: newFilters.features,
        search: newFilters.search,
        limit: 12,
        offset
      })
      
      setState(prev => ({
        ...prev,
        properties: append ? [...prev.properties, ...result.items] : result.items,
        hasMore: result.hasMore,
        total: result.total,
        loading: false
      }))
    } catch (error) {
      console.error('Error loading properties:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  // Initial load and filter changes
  useEffect(() => {
    setCurrentOffset(0)
    loadProperties(filters, 0, false)
  }, [filters, loadProperties])

  // Handle filter changes
  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters)
  }

  // Handle load more
  const handleLoadMore = () => {
    const newOffset = currentOffset + 12
    setCurrentOffset(newOffset)
    loadProperties(filters, newOffset, true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {t('title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
              {t('subtitle')}
            </p>
            
            {/* Stats */}
            <div className="flex justify-center items-center gap-8 text-sm text-gray-500">
              <span>
                {state.total} {state.total === 1 ? 'propriété' : 'propriétés'}
              </span>
              {state.availableTypes.length > 0 && (
                <span>
                  {state.availableTypes.length} types disponibles
                </span>
              )}
              {state.availableCities.length > 0 && (
                <span>
                  {state.availableCities.length} villes
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-8">
              <PropertyFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                availableTypes={state.availableTypes}
                availableCities={state.availableCities}
                availableFeatures={state.availableFeatures}
              />
            </div>
          </div>

          {/* Properties Grid */}
          <div className="flex-1">
            <PropertyGrid
              properties={state.properties}
              loading={state.loading}
              hasMore={state.hasMore}
              onLoadMore={handleLoadMore}
            />
          </div>
        </div>
      </div>
    </div>
  )
}