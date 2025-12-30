'use client'

import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Building2, TrendingUp, Calendar, Filter, ArrowUpDown } from 'lucide-react'
import Image from 'next/image'

interface PropertySummary {
  id: string
  name: string
  address: string
  status: 'available' | 'occupied' | 'maintenance'
  price_per_night: number
  bookings_count: number
  earnings_this_month: number
  occupancy_rate: number
  average_rating: number
  images?: string[]
  next_booking?: {
    check_in: string
    check_out: string
    client_name: string
  }
}

interface PropertiesOverviewProps {
  properties: PropertySummary[]
  locale: string
  limit?: number
  showFilters?: boolean
}

type SortOption = 'name' | 'revenue' | 'occupancy'

/**
 * Optimized PropertiesOverview component with React.memo, useMemo, and useCallback
 * Only re-renders when properties, locale, or filters change
 */
export const PropertiesOverview = memo(function PropertiesOverview({ 
  properties, 
  locale, 
  limit = 3,
  showFilters = false 
}: PropertiesOverviewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('partner.dashboard')

  // Get filter and sort values from URL params
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get('status') || 'all'
  )
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'name'
  )

  // Update URL params when filters change
  useEffect(() => {
    if (!showFilters) return

    const params = new URLSearchParams(searchParams.toString())
    
    if (statusFilter !== 'all') {
      params.set('status', statusFilter)
    } else {
      params.delete('status')
    }
    
    if (sortBy !== 'name') {
      params.set('sort', sortBy)
    } else {
      params.delete('sort')
    }

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [statusFilter, sortBy, showFilters, pathname, router, searchParams])

  // Memoize status color function
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600'
      case 'occupied':
        return 'bg-amber-500 hover:bg-amber-600'
      case 'maintenance':
        return 'bg-red-500 hover:bg-red-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }, [])

  // Filter and sort properties
  const filteredAndSortedProperties = useMemo(() => {
    let result = [...properties]

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(property => property.status === statusFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'revenue':
          return b.earnings_this_month - a.earnings_this_month
        case 'occupancy':
          return b.occupancy_rate - a.occupancy_rate
        default:
          return 0
      }
    })

    return result
  }, [properties, statusFilter, sortBy])

  const displayedProperties = showFilters 
    ? filteredAndSortedProperties 
    : filteredAndSortedProperties.slice(0, limit)

  if (properties.length === 0) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle id="properties-title">{t('properties.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12" role="status" aria-live="polite">
            <div className="mb-6 flex justify-center" aria-hidden="true">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6">
                <Building2 className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
              {t('properties.noProperties')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {t('properties.noPropertiesMessage')}
            </p>
            <Button
              onClick={() => router.push(`/${locale}/partner/properties/new`)}
              size="lg"
              aria-label={t('actions.addProperty')}
              className="min-h-[44px]"
            >
              <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
              {t('actions.addProperty')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle id="properties-title">{t('properties.title')}</CardTitle>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Property filters and actions">
            {showFilters && (
              <>
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]" aria-label="Filter properties by status">
                    <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                    <SelectValue placeholder={t('properties.filters.filterByStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('properties.filters.allStatuses')}</SelectItem>
                    <SelectItem value="available">{t('properties.status.available')}</SelectItem>
                    <SelectItem value="occupied">{t('properties.status.occupied')}</SelectItem>
                    <SelectItem value="maintenance">{t('properties.status.maintenance')}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-[180px]" aria-label="Sort properties">
                    <ArrowUpDown className="h-4 w-4 mr-2" aria-hidden="true" />
                    <SelectValue placeholder={t('properties.filters.sortBy')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">{t('properties.filters.sortOptions.name')}</SelectItem>
                    <SelectItem value="revenue">{t('properties.filters.sortOptions.revenue')}</SelectItem>
                    <SelectItem value="occupancy">{t('properties.filters.sortOptions.occupancy')}</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            {!showFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/${locale}/partner/properties`)}
                aria-label={t('properties.viewAll')}
                className="min-h-[44px]"
              >
                {t('properties.viewAll')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="grid grid-cols-1 gap-4"
          role="list"
          aria-labelledby="properties-title"
        >
          {displayedProperties.map((property) => (
            <article
              key={property.id}
              role="listitem"
              className="group relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-primary"
              onClick={() => router.push(`/${locale}/partner/properties/${property.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  router.push(`/${locale}/partner/properties/${property.id}`)
                }
              }}
              tabIndex={0}
              aria-label={`${property.name}, ${t(`properties.status.${property.status}`)}, ${property.price_per_night}€ per night`}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Property Image */}
                <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[0]}
                      alt={`${property.name} property image`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 640px) 100vw, 192px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" aria-label="No image available">
                      <Building2 className="h-16 w-16 text-gray-400" aria-hidden="true" />
                    </div>
                  )}
                  {/* Status Badge on Image */}
                  <div className="absolute top-3 right-3">
                    <Badge 
                      className={`${getStatusColor(property.status)} text-white border-0`}
                      aria-label={`Status: ${t(`properties.status.${property.status}`)}`}
                    >
                      {t(`properties.status.${property.status}`)}
                    </Badge>
                  </div>
                </div>

                {/* Property Details */}
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {property.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                        <span className="mr-1" aria-hidden="true">📍</span>
                        <span className="sr-only">Address:</span>
                        {property.address}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                    <div className="flex flex-col">
                      <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t('properties.pricePerNight')}
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {property.price_per_night}€
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t('properties.bookingsCount')}
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
                        {property.bookings_count}
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t('properties.monthlyRevenue')}
                      </dt>
                      <dd className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {property.earnings_this_month}€
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t('properties.occupancy')}
                      </dt>
                      <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                        {Math.round(property.occupancy_rate)}%
                      </dd>
                    </div>
                  </dl>

                  {/* Next Booking Info */}
                  {property.next_booking && (
                    <div 
                      className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800"
                      role="status"
                      aria-label="Next booking information"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                            {t('properties.nextBooking')}
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            {property.next_booking.client_name}
                          </div>
                        </div>
                        <div className="text-right">
                          <time 
                            className="text-xs text-blue-600 dark:text-blue-400"
                            dateTime={`${property.next_booking.check_in}/${property.next_booking.check_out}`}
                          >
                            {new Date(property.next_booking.check_in).toLocaleDateString(locale, {
                              month: 'short',
                              day: 'numeric'
                            })}
                            {' - '}
                            {new Date(property.next_booking.check_out).toLocaleDateString(locale, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </time>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  )
})
