'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { SearchAnalytics, SearchFilters, SearchQuery, SearchPattern } from '@/lib/analytics/search-analytics'

interface SearchAnalyticsContextType {
  analytics: SearchAnalytics | null
  isInitialized: boolean
  currentSearch: SearchQuery | null
  searchHistory: SearchQuery[]
  searchPatterns: SearchPattern | null
  startSearch: (query: string, filters: SearchFilters, source?: SearchQuery['source']) => string
  completeSearch: (searchId: string, results: { id: string; [key: string]: any }[]) => void
  trackResultClick: (searchId: string, loftId: string, position: number) => void
  trackResultView: (searchId: string, loftId: string, viewDuration: number) => void
  trackConversion: (searchId: string, loftId: string, conversionType: 'view' | 'inquiry' | 'booking' | 'favorite', value?: number, metadata?: Record<string, any>) => void
  trackFilterUsage: (filterType: string, filterValue: any, searchId?: string) => void
  trackAutocomplete: (query: string, suggestion: string, position: number) => void
}

const SearchAnalyticsContext = createContext<SearchAnalyticsContextType>({
  analytics: null,
  isInitialized: false,
  currentSearch: null,
  searchHistory: [],
  searchPatterns: null,
  startSearch: () => '',
  completeSearch: () => {},
  trackResultClick: () => {},
  trackResultView: () => {},
  trackConversion: () => {},
  trackFilterUsage: () => {},
  trackAutocomplete: () => {},
})

interface SearchAnalyticsProviderProps {
  children: React.ReactNode
  userId?: string
  sessionId?: string
}

export function SearchAnalyticsProvider({ children, userId, sessionId }: SearchAnalyticsProviderProps) {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentSearch, setCurrentSearch] = useState<SearchQuery | null>(null)
  const [searchHistory, setSearchHistory] = useState<SearchQuery[]>([])
  const [searchPatterns, setSearchPatterns] = useState<SearchPattern | null>(null)

  useEffect(() => {
    const initAnalytics = () => {
      if (typeof window === 'undefined') return

      const searchAnalytics = SearchAnalytics.getInstance()
      searchAnalytics.init(userId, sessionId)
      
      setAnalytics(searchAnalytics)
      setIsInitialized(true)
      setSearchHistory(searchAnalytics.getSearchHistory())
      setSearchPatterns(searchAnalytics.getSearchPatterns())
    }

    initAnalytics()
  }, [userId, sessionId])

  // Update current search and patterns periodically
  useEffect(() => {
    if (!analytics || !isInitialized) return

    const interval = setInterval(() => {
      setCurrentSearch(analytics.getCurrentSearch())
      setSearchHistory(analytics.getSearchHistory())
      setSearchPatterns(analytics.getSearchPatterns())
    }, 1000)

    return () => clearInterval(interval)
  }, [analytics, isInitialized])

  const contextValue: SearchAnalyticsContextType = {
    analytics,
    isInitialized,
    currentSearch,
    searchHistory,
    searchPatterns,
    startSearch: (query: string, filters: SearchFilters, source?: SearchQuery['source']) => {
      if (!analytics) return ''
      const searchId = analytics.startSearch(query, filters, source)
      setCurrentSearch(analytics.getCurrentSearch())
      return searchId
    },
    completeSearch: (searchId: string, results: { id: string; [key: string]: any }[]) => {
      if (!analytics) return
      analytics.completeSearch(searchId, results)
      setCurrentSearch(analytics.getCurrentSearch())
      setSearchHistory(analytics.getSearchHistory())
      setSearchPatterns(analytics.getSearchPatterns())
    },
    trackResultClick: (searchId: string, loftId: string, position: number) => {
      analytics?.trackResultClick(searchId, loftId, position)
    },
    trackResultView: (searchId: string, loftId: string, viewDuration: number) => {
      analytics?.trackResultView(searchId, loftId, viewDuration)
    },
    trackConversion: (searchId: string, loftId: string, conversionType: 'view' | 'inquiry' | 'booking' | 'favorite', value?: number, metadata?: Record<string, any>) => {
      analytics?.trackConversion(searchId, loftId, conversionType, value, metadata)
    },
    trackFilterUsage: (filterType: string, filterValue: any, searchId?: string) => {
      analytics?.trackFilterUsage(filterType, filterValue, searchId)
    },
    trackAutocomplete: (query: string, suggestion: string, position: number) => {
      analytics?.trackAutocomplete(query, suggestion, position)
    },
  }

  return (
    <SearchAnalyticsContext.Provider value={contextValue}>
      {children}
    </SearchAnalyticsContext.Provider>
  )
}

export function useSearchAnalytics() {
  const context = useContext(SearchAnalyticsContext)
  
  if (!context) {
    throw new Error('useSearchAnalytics must be used within a SearchAnalyticsProvider')
  }

  return context
}

// Hook for tracking search widget interactions
export function useSearchWidget() {
  const { startSearch, completeSearch, trackFilterUsage, trackAutocomplete } = useSearchAnalytics()
  const [activeSearchId, setActiveSearchId] = useState<string>('')

  const handleSearchStart = (query: string, filters: SearchFilters, source: SearchQuery['source'] = 'homepage') => {
    const searchId = startSearch(query, filters, source)
    setActiveSearchId(searchId)
    return searchId
  }

  const handleSearchComplete = (results: { id: string; [key: string]: any }[]) => {
    if (activeSearchId) {
      completeSearch(activeSearchId, results)
      setActiveSearchId('')
    }
  }

  const handleFilterChange = (filterType: string, filterValue: any) => {
    trackFilterUsage(filterType, filterValue, activeSearchId)
  }

  const handleAutocompleteSelect = (query: string, suggestion: string, position: number) => {
    trackAutocomplete(query, suggestion, position)
  }

  return {
    activeSearchId,
    handleSearchStart,
    handleSearchComplete,
    handleFilterChange,
    handleAutocompleteSelect,
  }
}

// Hook for tracking search results
export function useSearchResults(searchId: string) {
  const { trackResultClick, trackResultView, trackConversion } = useSearchAnalytics()
  const [viewStartTime, setViewStartTime] = useState<number>(0)

  const handleResultClick = (loftId: string, position: number) => {
    trackResultClick(searchId, loftId, position)
  }

  const handleResultView = (loftId: string) => {
    setViewStartTime(Date.now())
    
    return () => {
      if (viewStartTime > 0) {
        const viewDuration = Date.now() - viewStartTime
        trackResultView(searchId, loftId, viewDuration)
      }
    }
  }

  const handleConversion = (loftId: string, conversionType: 'view' | 'inquiry' | 'booking' | 'favorite', value?: number, metadata?: Record<string, any>) => {
    trackConversion(searchId, loftId, conversionType, value, metadata)
  }

  return {
    handleResultClick,
    handleResultView,
    handleConversion,
  }
}