/**
 * Context preservation utilities for maintaining user state across language changes
 */

import { Currency } from './currency';
import { Locale } from '@/i18n';

export interface SearchContext {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  amenities?: string[];
  sortBy?: string;
  viewMode?: 'grid' | 'list' | 'map';
}

export interface UserPreferences {
  currency: Currency;
  theme?: 'light' | 'dark' | 'system';
  notifications?: boolean;
}

export interface UserSession {
  searchContext: SearchContext;
  preferences: UserPreferences;
  bookingProgress?: {
    step: number;
    loftId?: string;
    selectedDates?: {
      checkIn: string;
      checkOut: string;
    };
    guestCount?: number;
  };
  viewHistory?: string[];
  lastActivity: number;
}

const STORAGE_KEYS = {
  SESSION: 'user-session',
  SEARCH_CONTEXT: 'search-context',
  PREFERENCES: 'user-preferences',
  BOOKING_PROGRESS: 'booking-progress'
} as const;

// Session storage utilities (survives page refresh but not browser close)
export class SessionManager {
  private static isClient = typeof window !== 'undefined';

  // Get current session
  static getSession(): UserSession | null {
    if (!this.isClient) return null;

    try {
      const stored = sessionStorage.getItem(STORAGE_KEYS.SESSION);
      if (stored) {
        const session = JSON.parse(stored) as UserSession;
        // Check if session is still valid (24 hours)
        if (Date.now() - session.lastActivity < 24 * 60 * 60 * 1000) {
          return session;
        }
      }
    } catch (error) {
      console.warn('Failed to get session:', error);
    }

    return null;
  }

  // Save session
  static saveSession(session: Partial<UserSession>): void {
    if (!this.isClient) return;

    try {
      const currentSession = this.getSession() || {
        searchContext: {},
        preferences: { currency: 'DZD' as Currency },
        lastActivity: Date.now()
      };

      const updatedSession: UserSession = {
        ...currentSession,
        ...session,
        lastActivity: Date.now()
      };

      sessionStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedSession));
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  }

  // Clear session
  static clearSession(): void {
    if (!this.isClient) return;

    try {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }

  // Update search context
  static updateSearchContext(context: Partial<SearchContext>): void {
    const session = this.getSession();
    this.saveSession({
      ...session,
      searchContext: {
        ...session?.searchContext,
        ...context
      }
    });
  }

  // Get search context
  static getSearchContext(): SearchContext {
    const session = this.getSession();
    return session?.searchContext || {};
  }

  // Update user preferences
  static updatePreferences(preferences: Partial<UserPreferences>): void {
    const session = this.getSession();
    this.saveSession({
      ...session,
      preferences: {
        ...session?.preferences,
        ...preferences
      }
    });
  }

  // Get user preferences
  static getPreferences(): UserPreferences {
    const session = this.getSession();
    return session?.preferences || { currency: 'DZD' };
  }

  // Update booking progress
  static updateBookingProgress(progress: Partial<UserSession['bookingProgress']>): void {
    const session = this.getSession();
    this.saveSession({
      ...session,
      bookingProgress: {
        ...session?.bookingProgress,
        ...progress
      }
    });
  }

  // Get booking progress
  static getBookingProgress(): UserSession['bookingProgress'] | undefined {
    const session = this.getSession();
    return session?.bookingProgress;
  }

  // Add to view history
  static addToViewHistory(loftId: string): void {
    const session = this.getSession();
    const currentHistory = session?.viewHistory || [];
    
    // Add to beginning and limit to 10 items
    const updatedHistory = [loftId, ...currentHistory.filter(id => id !== loftId)].slice(0, 10);
    
    this.saveSession({
      ...session,
      viewHistory: updatedHistory
    });
  }

  // Get view history
  static getViewHistory(): string[] {
    const session = this.getSession();
    return session?.viewHistory || [];
  }
}

// URL parameter preservation
export class URLManager {
  // Preserve search parameters when changing language
  static preserveSearchParams(newLocale: Locale, currentPath: string): string {
    if (typeof window === 'undefined') return currentPath;

    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const hash = url.hash;

    // Remove current locale from path
    const pathSegments = currentPath.split('/').filter(Boolean);
    if (pathSegments[0] && ['ar', 'fr', 'en'].includes(pathSegments[0])) {
      pathSegments.shift();
    }

    // Construct new path
    const newPath = `/${newLocale}${pathSegments.length > 0 ? '/' + pathSegments.join('/') : ''}`;
    
    // Add search parameters and hash
    const fullPath = `${newPath}${searchParams.toString() ? '?' + searchParams.toString() : ''}${hash}`;
    
    return fullPath;
  }

  // Get search parameters as object
  static getSearchParams(): Record<string, string> {
    if (typeof window === 'undefined') return {};

    const params: Record<string, string> = {};
    const urlParams = new URLSearchParams(window.location.search);
    
    urlParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  }

  // Update URL with new search parameters
  static updateSearchParams(params: Record<string, string | null>, replace = false): void {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });

    const newUrl = url.toString();
    
    if (replace) {
      window.history.replaceState({}, '', newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }
  }

  // Convert search context to URL parameters
  static searchContextToParams(context: SearchContext): Record<string, string> {
    const params: Record<string, string> = {};

    if (context.location) params.location = context.location;
    if (context.checkIn) params.checkin = context.checkIn;
    if (context.checkOut) params.checkout = context.checkOut;
    if (context.guests) params.guests = context.guests.toString();
    if (context.priceRange) {
      params.minPrice = context.priceRange.min.toString();
      params.maxPrice = context.priceRange.max.toString();
    }
    if (context.amenities?.length) params.amenities = context.amenities.join(',');
    if (context.sortBy) params.sort = context.sortBy;
    if (context.viewMode) params.view = context.viewMode;

    return params;
  }

  // Convert URL parameters to search context
  static paramsToSearchContext(params: Record<string, string>): SearchContext {
    const context: SearchContext = {};

    if (params.location) context.location = params.location;
    if (params.checkin) context.checkIn = params.checkin;
    if (params.checkout) context.checkOut = params.checkout;
    if (params.guests) context.guests = parseInt(params.guests, 10);
    if (params.minPrice && params.maxPrice) {
      context.priceRange = {
        min: parseFloat(params.minPrice),
        max: parseFloat(params.maxPrice)
      };
    }
    if (params.amenities) context.amenities = params.amenities.split(',');
    if (params.sort) context.sortBy = params.sort;
    if (params.view && ['grid', 'list', 'map'].includes(params.view)) {
      context.viewMode = params.view as 'grid' | 'list' | 'map';
    }

    return context;
  }
}

// React hook for context preservation
export function useContextPreservation() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const preserveAndNavigate = React.useCallback((newLocale: Locale) => {
    if (!mounted) return;

    // Save current search context
    const currentParams = URLManager.getSearchParams();
    const searchContext = URLManager.paramsToSearchContext(currentParams);
    SessionManager.updateSearchContext(searchContext);

    // Navigate to new locale with preserved context
    const newPath = URLManager.preserveSearchParams(newLocale, window.location.pathname);
    window.location.href = newPath;
  }, [mounted]);

  const restoreContext = React.useCallback(() => {
    if (!mounted) return;

    // Restore search context from session
    const savedContext = SessionManager.getSearchContext();
    if (Object.keys(savedContext).length > 0) {
      const params = URLManager.searchContextToParams(savedContext);
      URLManager.updateSearchParams(params, true);
    }
  }, [mounted]);

  return {
    preserveAndNavigate,
    restoreContext,
    mounted
  };
}

// Import React for the hook
import React from 'react';