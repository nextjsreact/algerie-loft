'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createOptimizedFetch, LocalStorageCache, performanceMonitor } from '@/lib/performance/immediate-optimizations'

interface Loft {
  id: string
  name: string
  address: string
  price_per_night: number
  status: string
  max_guests?: number
  average_rating?: number
  photos?: Array<{ url: string; alt_text?: string }>
  created_at: string
  updated_at: string
}

interface UseOptimizedLoftsOptions {
  pageSize?: number
  cacheTime?: number
  staleTime?: number
  refetchOnFocus?: boolean
  refetchOnReconnect?: boolean
}

interface UseOptimizedLoftsResult {
  lofts: Loft[]
  loading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  search: (term: string) => void
  filter: (status: string) => void
  searchTerm: string
  filterStatus: string
}

const optimizedFetch = createOptimizedFetch('/api')
const cache = LocalStorageCache.getInstance()

export function useOptimizedLofts(options: UseOptimizedLoftsOptions = {}): UseOptimizedLoftsResult {
  const {
    pageSize = 20,
    cacheTime = 300000, // 5 minutes
    staleTime = 60000,  // 1 minute
    refetchOnFocus = true,
    refetchOnReconnect = true
  } = options

  const [lofts, setLofts] = useState<Loft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Clé de cache basée sur les paramètres
  const cacheKey = useMemo(() => 
    `lofts:${page}:${pageSize}:${searchTerm}:${filterStatus}`,
    [page, pageSize, searchTerm, filterStatus]
  )

  // Fonction de chargement des lofts
  const fetchLofts = useCallback(async (
    currentPage: number = 1,
    append: boolean = false
  ) => {
    try {
      performanceMonitor.startTiming('fetch-lofts')
      
      // Vérifier le cache d'abord
      const cacheKey = `lofts:${currentPage}:${pageSize}:${searchTerm}:${filterStatus}`
      const cachedData = cache.get(cacheKey)
      
      if (cachedData && Date.now() - cachedData.timestamp < staleTime) {
        console.log('🎯 Using cached lofts data')
        if (append) {
          setLofts(prev => [...prev, ...cachedData.lofts])
        } else {
          setLofts(cachedData.lofts)
        }
        setTotalCount(cachedData.totalCount)
        setHasMore(cachedData.hasMore)
        setLoading(false)
        performanceMonitor.endTiming('fetch-lofts')
        return
      }

      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus && { status: filterStatus })
      })

      const response = await optimizedFetch(`/lofts?${params}`, {
        ttl: cacheTime
      })

      if (response.error) {
        throw new Error(response.error)
      }

      const { lofts: newLofts, totalCount: total, hasMore: more } = response

      // Mettre en cache
      cache.set(cacheKey, {
        lofts: newLofts,
        totalCount: total,
        hasMore: more,
        timestamp: Date.now()
      }, cacheTime)

      if (append) {
        setLofts(prev => {
          // Éviter les doublons
          const existingIds = new Set(prev.map(loft => loft.id))
          const uniqueNewLofts = newLofts.filter((loft: Loft) => !existingIds.has(loft.id))
          return [...prev, ...uniqueNewLofts]
        })
      } else {
        setLofts(newLofts)
      }

      setTotalCount(total)
      setHasMore(more)
      
      performanceMonitor.endTiming('fetch-lofts')
    } catch (err) {
      console.error('Error fetching lofts:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }, [pageSize, searchTerm, filterStatus, cacheTime, staleTime])

  // Chargement initial
  useEffect(() => {
    setPage(1)
    fetchLofts(1, false)
  }, [searchTerm, filterStatus, fetchLofts])

  // Fonction pour charger plus de lofts
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    
    const nextPage = page + 1
    setPage(nextPage)
    await fetchLofts(nextPage, true)
  }, [loading, hasMore, page, fetchLofts])

  // Fonction de rafraîchissement
  const refresh = useCallback(async () => {
    // Vider le cache pour cette requête
    cache.clear()
    setPage(1)
    await fetchLofts(1, false)
  }, [fetchLofts])

  // Fonction de recherche avec debounce
  const search = useCallback((term: string) => {
    performanceMonitor.startTiming('search-lofts')
    setSearchTerm(term)
    setPage(1)
    performanceMonitor.endTiming('search-lofts')
  }, [])

  // Fonction de filtrage
  const filter = useCallback((status: string) => {
    performanceMonitor.startTiming('filter-lofts')
    setFilterStatus(status)
    setPage(1)
    performanceMonitor.endTiming('filter-lofts')
  }, [])

  // Refetch sur focus
  useEffect(() => {
    if (!refetchOnFocus) return

    const handleFocus = () => {
      // Vérifier si les données sont stales
      const cachedData = cache.get(cacheKey)
      if (!cachedData || Date.now() - cachedData.timestamp > staleTime) {
        refresh()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnFocus, cacheKey, staleTime, refresh])

  // Refetch sur reconnexion
  useEffect(() => {
    if (!refetchOnReconnect) return

    const handleOnline = () => {
      refresh()
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [refetchOnReconnect, refresh])

  return {
    lofts,
    loading,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
    search,
    filter,
    searchTerm,
    filterStatus
  }
}

// Hook pour un loft spécifique
export function useOptimizedLoft(loftId: string) {
  const [loft, setLoft] = useState<Loft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLoft = useCallback(async () => {
    if (!loftId) return

    try {
      performanceMonitor.startTiming('fetch-single-loft')
      
      // Vérifier le cache
      const cacheKey = `loft:${loftId}`
      const cachedLoft = cache.get(cacheKey)
      
      if (cachedLoft && Date.now() - cachedLoft.timestamp < 300000) { // 5 minutes
        setLoft(cachedLoft.data)
        setLoading(false)
        performanceMonitor.endTiming('fetch-single-loft')
        return
      }

      setLoading(true)
      setError(null)

      const response = await optimizedFetch(`/lofts/${loftId}`, {
        ttl: 300000 // 5 minutes
      })

      if (response.error) {
        throw new Error(response.error)
      }

      // Mettre en cache
      cache.set(cacheKey, {
        data: response.loft,
        timestamp: Date.now()
      }, 300000)

      setLoft(response.loft)
      performanceMonitor.endTiming('fetch-single-loft')
    } catch (err) {
      console.error('Error fetching loft:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }, [loftId])

  useEffect(() => {
    fetchLoft()
  }, [fetchLoft])

  const refresh = useCallback(() => {
    cache.set(`loft:${loftId}`, null) // Invalider le cache
    fetchLoft()
  }, [loftId, fetchLoft])

  return {
    loft,
    loading,
    error,
    refresh
  }
}

export default useOptimizedLofts