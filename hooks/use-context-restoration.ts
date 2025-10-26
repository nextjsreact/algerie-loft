'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { SessionManager, URLManager, SearchContext } from '@/lib/context-preservation'
import { Currency } from '@/lib/currency'
import { Locale } from '@/i18n'

export interface RestoredContext {
  searchContext: SearchContext
  currency: Currency
  isRestored: boolean
}

/**
 * Hook to restore user context after language changes
 */
export function useContextRestoration() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale() as Locale
  const [restoredContext, setRestoredContext] = useState<RestoredContext>({
    searchContext: {},
    currency: 'DZD',
    isRestored: false
  })

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    let contextToRestore: SearchContext = {}
    let currencyToRestore: Currency = 'DZD'

    try {
      // First, try to get preserved context from session storage (from language change)
      const preservedContext = sessionStorage.getItem('preserved-search-context')
      if (preservedContext) {
        const parsed = JSON.parse(preservedContext)
        contextToRestore = URLManager.paramsToSearchContext(parsed)
        
        // Clear the preserved context after using it
        sessionStorage.removeItem('preserved-search-context')
      } else {
        // If no preserved context, get from current URL parameters
        const currentParams = URLManager.getSearchParams()
        contextToRestore = URLManager.paramsToSearchContext(currentParams)
      }

      // Get saved user preferences
      const preferences = SessionManager.getPreferences()
      currencyToRestore = preferences.currency

      // Update session with current context
      SessionManager.updateSearchContext(contextToRestore)

    } catch (error) {
      console.warn('Failed to restore context:', error)
    }

    setRestoredContext({
      searchContext: contextToRestore,
      currency: currencyToRestore,
      isRestored: true
    })
  }, [locale, searchParams])

  /**
   * Update search context and URL
   */
  const updateSearchContext = (newContext: Partial<SearchContext>) => {
    const updatedContext = {
      ...restoredContext.searchContext,
      ...newContext
    }

    // Update session
    SessionManager.updateSearchContext(updatedContext)

    // Update URL parameters
    const params = URLManager.searchContextToParams(updatedContext)
    const currentParams = URLManager.getSearchParams()
    
    // Only update URL if parameters actually changed
    const hasChanges = Object.entries(params).some(([key, value]) => 
      currentParams[key] !== value
    )

    if (hasChanges) {
      URLManager.updateSearchParams(params, true)
    }

    // Update local state
    setRestoredContext(prev => ({
      ...prev,
      searchContext: updatedContext
    }))
  }

  /**
   * Update currency preference
   */
  const updateCurrency = (currency: Currency) => {
    SessionManager.updatePreferences({ currency })
    setRestoredContext(prev => ({
      ...prev,
      currency
    }))
  }

  /**
   * Clear all context
   */
  const clearContext = () => {
    SessionManager.clearSession()
    URLManager.updateSearchParams({
      location: null,
      checkin: null,
      checkout: null,
      guests: null,
      minPrice: null,
      maxPrice: null,
      amenities: null,
      sort: null,
      view: null
    }, true)

    setRestoredContext({
      searchContext: {},
      currency: 'DZD',
      isRestored: true
    })
  }

  /**
   * Add loft to view history
   */
  const addToViewHistory = (loftId: string) => {
    SessionManager.addToViewHistory(loftId)
  }

  /**
   * Get view history
   */
  const getViewHistory = () => {
    return SessionManager.getViewHistory()
  }

  /**
   * Update booking progress
   */
  const updateBookingProgress = (progress: {
    step: number
    loftId?: string
    selectedDates?: { checkIn: string; checkOut: string }
    guestCount?: number
  }) => {
    SessionManager.updateBookingProgress(progress)
  }

  /**
   * Get booking progress
   */
  const getBookingProgress = () => {
    return SessionManager.getBookingProgress()
  }

  return {
    ...restoredContext,
    updateSearchContext,
    updateCurrency,
    clearContext,
    addToViewHistory,
    getViewHistory,
    updateBookingProgress,
    getBookingProgress
  }
}

/**
 * Hook for preserving context during navigation
 */
export function useContextPreservation() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const preserveAndNavigate = (newLocale: Locale, currentPath?: string) => {
    if (!mounted || typeof window === 'undefined') return

    // Save current search context
    const currentParams = URLManager.getSearchParams()
    const searchContext = URLManager.paramsToSearchContext(currentParams)
    SessionManager.updateSearchContext(searchContext)

    // Navigate to new locale with preserved context
    const path = currentPath || window.location.pathname
    const newPath = URLManager.preserveSearchParams(newLocale, path)
    
    // Use window.location for full page reload to ensure proper locale switching
    window.location.href = newPath
  }

  return {
    preserveAndNavigate,
    mounted
  }
}