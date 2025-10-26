'use client'

import { useState, useEffect, useCallback } from 'react'
import { homepageIntegration, type LoftAvailabilityData, type SearchFilters } from '@/lib/services/homepage-integration'

export interface UseHomepageDataReturn {
  featuredLofts: LoftAvailabilityData[]
  searchResults: LoftAvailabilityData[]
  ownerMetrics: {
    averageOccupancyRate: number
    averageRevenueIncrease: string
    totalProperties: number
    averageRating: number
  }
  isLoading: boolean
  error: string | null
  searchLofts: (filters: SearchFilters) => Promise<void>
  checkAvailability: (loftId: string, checkIn: string, checkOut: string, guests?: number) => Promise<boolean>
}

export function useHomepageData(): UseHomepageDataReturn {
  const [featuredLofts, setFeaturedLofts] = useState<LoftAvailabilityData[]>([])
  const [searchResults, setSearchResults] = useState<LoftAvailabilityData[]>([])
  const [ownerMetrics, setOwnerMetrics] = useState({
    averageOccupancyRate: 0,
    averageRevenueIncrease: '0%',
    totalProperties: 0,
    averageRating: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load featured lofts and owner metrics in parallel
      const [lofts, metrics] = await Promise.all([
        homepageIntegration.getFeaturedLofts(),
        homepageIntegration.getOwnerMetrics()
      ])

      setFeaturedLofts(lofts)
      setOwnerMetrics(metrics)
    } catch (err) {
      console.error('Error loading homepage data:', err)
      setError('Failed to load homepage data')
    } finally {
      setIsLoading(false)
    }
  }

  const searchLofts = useCallback(async (filters: SearchFilters) => {
    try {
      setIsLoading(true)
      setError(null)

      const results = await homepageIntegration.searchLofts(filters)
      setSearchResults(results)
    } catch (err) {
      console.error('Error searching lofts:', err)
      setError('Failed to search lofts')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const checkAvailability = useCallback(async (
    loftId: string,
    checkIn: string,
    checkOut: string,
    guests: number = 1
  ): Promise<boolean> => {
    try {
      const availability = await homepageIntegration.checkLoftAvailability(
        loftId,
        checkIn,
        checkOut,
        guests
      )
      return availability.available
    } catch (err) {
      console.error('Error checking availability:', err)
      return false
    }
  }, [])

  return {
    featuredLofts,
    searchResults,
    ownerMetrics,
    isLoading,
    error,
    searchLofts,
    checkAvailability
  }
}

// Hook for user session integration
export function useUserSession() {
  const [session, setSession] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSession()
  }, [])

  const loadSession = async () => {
    try {
      const userSession = await homepageIntegration.getUserSession()
      setSession(userSession)
    } catch (err) {
      console.error('Error loading user session:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return { session, isLoading, refreshSession: loadSession }
}