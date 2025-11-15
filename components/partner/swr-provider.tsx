'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

interface SWRProviderProps {
  children: ReactNode
}

/**
 * SWR Provider for partner dashboard
 * Configures global SWR settings for data caching and revalidation
 */
export function PartnerSWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global fetcher with error handling
        fetcher: async (url: string) => {
          const response = await fetch(url)
          
          // Handle non-OK responses
          if (!response.ok) {
            const error = new Error(`HTTP ${response.status}`)
            throw error
          }
          
          return response.json()
        },
        
        // Cache configuration
        dedupingInterval: 2000, // Dedupe requests within 2 seconds
        
        // Revalidation settings
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        revalidateIfStale: true,
        
        // Error retry configuration
        shouldRetryOnError: true,
        errorRetryCount: 2,
        errorRetryInterval: 5000,
        
        // Loading timeout
        loadingTimeout: 10000,
        
        // Focus throttle
        focusThrottleInterval: 5000,
        
        // Keep previous data while revalidating
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  )
}
