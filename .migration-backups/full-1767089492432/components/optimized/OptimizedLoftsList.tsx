'use client'

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'
import { MapPin, Users, Star } from 'lucide-react'
import { debounce, performanceMonitor } from '@/lib/performance/immediate-optimizations'

interface Loft {
  id: string
  name: string
  address: string
  price_per_night: number
  status: string
  max_guests?: number
  average_rating?: number
  photos?: Array<{ url: string; alt_text?: string }>
}

interface OptimizedLoftsListProps {
  lofts: Loft[]
  loading?: boolean
  onLoftClick?: (loft: Loft) => void
  onLoadMore?: () => void
  hasMore?: boolean
  searchTerm?: string
  filterStatus?: string
}

// Composant de carte de loft memoized
const LoftCard = memo(({ 
  loft, 
  onClick 
}: { 
  loft: Loft
  onClick?: (loft: Loft) => void 
}) => {
  const handleClick = useCallback(() => {
    onClick?.(loft)
  }, [loft, onClick])

  const getStatusColor = useCallback((status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
      case 'disponible':
        return 'bg-green-100 text-green-800'
      case 'occupied':
      case 'occupé':
        return 'bg-red-100 text-red-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0
    }).format(price)
  }, [])

  const mainPhoto = loft.photos?.[0]

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 h-full"
      onClick={handleClick}
    >
      <div className="relative h-48 overflow-hidden rounded-t-lg">
        {mainPhoto ? (
          <Image
            src={mainPhoto.url}
            alt={mainPhoto.alt_text || loft.name}
            fill
            className="object-cover transition-transform duration-200 hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <MapPin className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <Badge className={getStatusColor(loft.status)}>
            {loft.status}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1">{loft.name}</CardTitle>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="line-clamp-1">{loft.address}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {loft.max_guests && (
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{loft.max_guests}</span>
              </div>
            )}
            {loft.average_rating && (
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                <span>{loft.average_rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <div className="font-bold text-lg">
              {formatPrice(loft.price_per_night)}
            </div>
            <div className="text-sm text-gray-600">par nuit</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

LoftCard.displayName = 'LoftCard'

// Composant de skeleton pour le chargement
const LoftCardSkeleton = memo(() => (
  <Card className="h-full">
    <Skeleton className="h-48 w-full rounded-t-lg" />
    <CardHeader className="pb-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </CardHeader>
    <CardContent className="pt-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="text-right">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
))

LoftCardSkeleton.displayName = 'LoftCardSkeleton'

export const OptimizedLoftsList = memo<OptimizedLoftsListProps>(({
  lofts,
  loading = false,
  onLoftClick,
  onLoadMore,
  hasMore = false,
  searchTerm = '',
  filterStatus = ''
}) => {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)

  // Filtrage optimisé avec useMemo
  const filteredLofts = useMemo(() => {
    performanceMonitor.startTiming('lofts-filtering')
    
    let filtered = lofts

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(loft => 
        loft.name.toLowerCase().includes(searchLower) ||
        loft.address.toLowerCase().includes(searchLower)
      )
    }

    if (filterStatus && filterStatus !== 'all') {
      filtered = filtered.filter(loft => 
        loft.status.toLowerCase() === filterStatus.toLowerCase()
      )
    }

    performanceMonitor.endTiming('lofts-filtering')
    return filtered
  }, [lofts, searchTerm, filterStatus])

  // Virtualisation pour les grandes listes
  const virtualizer = useVirtualizer({
    count: Math.ceil(filteredLofts.length / 3), // 3 colonnes
    getScrollElement: () => containerRef,
    estimateSize: () => 350, // Hauteur estimée d'une ligne
    overscan: 2, // Nombre d'éléments à pré-rendre
  })

  // Callback optimisé pour le clic
  const handleLoftClick = useCallback((loft: Loft) => {
    performanceMonitor.startTiming('loft-click-handler')
    onLoftClick?.(loft)
    performanceMonitor.endTiming('loft-click-handler')
  }, [onLoftClick])

  // Scroll infini optimisé
  const debouncedLoadMore = useMemo(
    () => debounce(() => {
      if (hasMore && onLoadMore) {
        performanceMonitor.startTiming('load-more')
        onLoadMore()
        performanceMonitor.endTiming('load-more')
      }
    }, 300),
    [hasMore, onLoadMore]
  )

  // Détection du scroll pour le chargement infini
  useEffect(() => {
    if (!containerRef) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = containerRef
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        debouncedLoadMore()
      }
    }

    containerRef.addEventListener('scroll', handleScroll)
    return () => containerRef.removeEventListener('scroll', handleScroll)
  }, [containerRef, debouncedLoadMore])

  if (loading && filteredLofts.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <LoftCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (filteredLofts.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun loft trouvé
        </h3>
        <p className="text-gray-600">
          Essayez de modifier vos critères de recherche
        </p>
      </div>
    )
  }

  // Pour les petites listes, rendu normal
  if (filteredLofts.length <= 12) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLofts.map((loft) => (
          <LoftCard
            key={loft.id}
            loft={loft}
            onClick={handleLoftClick}
          />
        ))}
        {loading && (
          <>
            {Array.from({ length: 3 }, (_, i) => (
              <LoftCardSkeleton key={`skeleton-${i}`} />
            ))}
          </>
        )}
      </div>
    )
  }

  // Pour les grandes listes, rendu virtualisé
  return (
    <div
      ref={setContainerRef}
      className="h-[600px] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * 3
          const rowLofts = filteredLofts.slice(startIndex, startIndex + 3)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
                {rowLofts.map((loft) => (
                  <LoftCard
                    key={loft.id}
                    loft={loft}
                    onClick={handleLoftClick}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {Array.from({ length: 3 }, (_, i) => (
            <LoftCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      )}
    </div>
  )
})

OptimizedLoftsList.displayName = 'OptimizedLoftsList'

export default OptimizedLoftsList