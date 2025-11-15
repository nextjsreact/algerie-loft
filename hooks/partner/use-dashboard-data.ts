/**
 * Custom hook for partner dashboard data with SWR caching
 */

import useSWR, { SWRConfiguration } from 'swr'
import { fetchDashboardData, PartnerStats, PropertySummary, RecentBooking } from '@/lib/partner/data-fetching'

export interface DashboardDataHookResult {
  stats: PartnerStats | null
  properties: PropertySummary[]
  bookings: RecentBooking[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  mutate: () => void
}

/**
 * Fetcher function for SWR
 */
async function dashboardFetcher() {
  const results = await fetchDashboardData({
    timeout: 10000,
    retries: 2,
    retryDelay: 1000,
  })

  // Check for critical errors (unauthorized)
  if (results.stats.status === 401 || results.stats.status === 403) {
    throw new Error('Unauthorized')
  }

  // Check for network/timeout errors
  if (results.stats.error) {
    const errorMsg = results.stats.error.message
    if (errorMsg.includes('timeout') || errorMsg.includes('network')) {
      throw results.stats.error
    }
  }

  return {
    stats: results.stats.data || null,
    properties: results.properties.data?.properties || [],
    bookings: results.bookings.data?.bookings || [],
  }
}

/**
 * Hook for fetching dashboard data with caching
 */
export function useDashboardData(
  options?: SWRConfiguration
): DashboardDataHookResult {
  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR(
    '/partner/dashboard',
    dashboardFetcher,
    {
      // Cache for 5 minutes
      dedupingInterval: 300000,
      // Revalidate on focus
      revalidateOnFocus: true,
      // Revalidate on reconnect
      revalidateOnReconnect: true,
      // Don't revalidate on mount if data exists
      revalidateIfStale: false,
      // Retry on error
      shouldRetryOnError: true,
      errorRetryCount: 2,
      errorRetryInterval: 5000,
      // Background revalidation
      refreshInterval: 300000, // 5 minutes
      ...options,
    }
  )

  return {
    stats: data?.stats || null,
    properties: data?.properties || [],
    bookings: data?.bookings || [],
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
  }
}

/**
 * Hook for fetching partner stats only
 */
export function usePartnerStats(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<PartnerStats>(
    '/api/partner/dashboard/stats',
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response.json()
    },
    {
      dedupingInterval: 300000,
      revalidateOnFocus: true,
      refreshInterval: 300000,
      ...options,
    }
  )

  return {
    stats: data || null,
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
  }
}

/**
 * Hook for fetching properties with caching
 */
export function usePartnerProperties(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ properties: PropertySummary[] }>(
    '/api/partner/properties?summary=true',
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response.json()
    },
    {
      dedupingInterval: 180000, // 3 minutes
      revalidateOnFocus: true,
      refreshInterval: 180000,
      ...options,
    }
  )

  return {
    properties: data?.properties || [],
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
  }
}

/**
 * Hook for fetching recent bookings with caching
 */
export function useRecentBookings(limit: number = 5, options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR<{ bookings: RecentBooking[] }>(
    `/api/bookings?limit=${limit}`,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return response.json()
    },
    {
      dedupingInterval: 120000, // 2 minutes
      revalidateOnFocus: true,
      refreshInterval: 120000,
      ...options,
    }
  )

  return {
    bookings: data?.bookings || [],
    isLoading,
    isError: !!error,
    error: error || null,
    mutate,
  }
}
