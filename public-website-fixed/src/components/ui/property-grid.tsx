'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Property } from '@/types/sanity'
import { PropertyCard } from './property-card'
import { Button } from './button'

interface PropertyGridProps {
  properties: Property[]
  loading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  className?: string
}

export function PropertyGrid({
  properties,
  loading = false,
  hasMore = false,
  onLoadMore,
  className = ''
}: PropertyGridProps) {
  const t = useTranslations('portfolio')
  const [displayCount, setDisplayCount] = useState(12)

  const displayedProperties = properties.slice(0, displayCount)
  const canShowMore = properties.length > displayCount

  const handleShowMore = () => {
    if (onLoadMore && hasMore) {
      onLoadMore()
    } else {
      setDisplayCount(prev => prev + 12)
    }
  }

  // Reset display count when properties change (e.g., after filtering)
  useEffect(() => {
    setDisplayCount(12)
  }, [properties])

  if (loading && properties.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <PropertyCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('noProperties.title')}
          </h3>
          <p className="text-gray-500">
            {t('noProperties.description')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedProperties.map((property) => (
          <PropertyCard key={property._id} property={property} />
        ))}
      </div>

      {/* Load More Button */}
      {(canShowMore || hasMore) && (
        <div className="text-center mt-8">
          <Button
            onClick={handleShowMore}
            disabled={loading}
            className="min-w-[200px]"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('loading')}
              </>
            ) : (
              t('loadMore')
            )}
          </Button>
        </div>
      )}

      {/* Loading more items */}
      {loading && properties.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[...Array(3)].map((_, index) => (
            <PropertyCardSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}
    </div>
  )
}

function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  )
}