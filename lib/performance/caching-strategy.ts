/**
 * Caching Strategy for Dual-Audience Homepage
 * Implements static content caching and API response caching
 */

import { unstable_cache } from 'next/cache';

// Cache configuration constants
export const CACHE_KEYS = {
  LOFTS_FEATURED: 'lofts-featured',
  LOFTS_SEARCH: 'lofts-search',
  TESTIMONIALS: 'testimonials',
  STATS: 'homepage-stats',
  OWNER_METRICS: 'owner-metrics',
  CASE_STUDIES: 'case-studies',
  TRANSLATIONS: 'translations',
  CURRENCY_RATES: 'currency-rates',
} as const;

export const CACHE_DURATIONS = {
  STATIC_CONTENT: 3600, // 1 hour
  DYNAMIC_CONTENT: 300, // 5 minutes
  USER_SPECIFIC: 60, // 1 minute
  TRANSLATIONS: 86400, // 24 hours
  CURRENCY_RATES: 1800, // 30 minutes
  SEARCH_RESULTS: 180, // 3 minutes
} as const;

export const CACHE_TAGS = {
  LOFTS: 'lofts',
  USERS: 'users',
  BOOKINGS: 'bookings',
  CONTENT: 'content',
  ANALYTICS: 'analytics',
} as const;

// Generic cache wrapper with error handling
export const createCachedFunction = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyPrefix: string,
  duration: number,
  tags: string[] = []
) => {
  return unstable_cache(
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      try {
        return await fn(...args);
      } catch (error) {
        console.error(`Cache function error for ${keyPrefix}:`, error);
        throw error;
      }
    },
    [keyPrefix],
    {
      revalidate: duration,
      tags,
    }
  );
};

// Featured lofts cache (high priority for homepage)
export const getCachedFeaturedLofts = createCachedFunction(
  async (locale: string = 'fr', limit: number = 6) => {
    // This would be replaced with actual Supabase call
    const response = await fetch(`/api/lofts/featured?locale=${locale}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch featured lofts');
    return response.json();
  },
  CACHE_KEYS.LOFTS_FEATURED,
  CACHE_DURATIONS.STATIC_CONTENT,
  [CACHE_TAGS.LOFTS, CACHE_TAGS.CONTENT]
);

// Search results cache with parameters
export const getCachedSearchResults = createCachedFunction(
  async (searchParams: {
    location?: string;
    checkin?: string;
    checkout?: string;
    guests?: number;
    priceMin?: number;
    priceMax?: number;
    amenities?: string[];
  }) => {
    const queryString = new URLSearchParams({
      ...searchParams,
      amenities: searchParams.amenities?.join(',') || '',
    }).toString();
    
    const response = await fetch(`/api/lofts/search?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch search results');
    return response.json();
  },
  CACHE_KEYS.LOFTS_SEARCH,
  CACHE_DURATIONS.SEARCH_RESULTS,
  [CACHE_TAGS.LOFTS]
);

// Testimonials cache
export const getCachedTestimonials = createCachedFunction(
  async (locale: string = 'fr', limit: number = 10) => {
    const response = await fetch(`/api/testimonials?locale=${locale}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch testimonials');
    return response.json();
  },
  CACHE_KEYS.TESTIMONIALS,
  CACHE_DURATIONS.STATIC_CONTENT,
  [CACHE_TAGS.CONTENT]
);

// Homepage statistics cache
export const getCachedHomepageStats = createCachedFunction(
  async () => {
    const response = await fetch('/api/stats/homepage');
    if (!response.ok) throw new Error('Failed to fetch homepage stats');
    return response.json();
  },
  CACHE_KEYS.STATS,
  CACHE_DURATIONS.DYNAMIC_CONTENT,
  [CACHE_TAGS.ANALYTICS]
);

// Owner metrics cache
export const getCachedOwnerMetrics = createCachedFunction(
  async () => {
    const response = await fetch('/api/owner/metrics');
    if (!response.ok) throw new Error('Failed to fetch owner metrics');
    return response.json();
  },
  CACHE_KEYS.OWNER_METRICS,
  CACHE_DURATIONS.DYNAMIC_CONTENT,
  [CACHE_TAGS.ANALYTICS]
);

// Case studies cache
export const getCachedCaseStudies = createCachedFunction(
  async (locale: string = 'fr', limit: number = 3) => {
    const response = await fetch(`/api/case-studies?locale=${locale}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch case studies');
    return response.json();
  },
  CACHE_KEYS.CASE_STUDIES,
  CACHE_DURATIONS.STATIC_CONTENT,
  [CACHE_TAGS.CONTENT]
);

// Translation cache
export const getCachedTranslations = createCachedFunction(
  async (locale: string, namespace: string = 'common') => {
    const response = await fetch(`/api/translations/${locale}/${namespace}`);
    if (!response.ok) throw new Error('Failed to fetch translations');
    return response.json();
  },
  CACHE_KEYS.TRANSLATIONS,
  CACHE_DURATIONS.TRANSLATIONS,
  [CACHE_TAGS.CONTENT]
);

// Currency rates cache
export const getCachedCurrencyRates = createCachedFunction(
  async (baseCurrency: string = 'DZD') => {
    const response = await fetch(`/api/currency/rates?base=${baseCurrency}`);
    if (!response.ok) throw new Error('Failed to fetch currency rates');
    return response.json();
  },
  CACHE_KEYS.CURRENCY_RATES,
  CACHE_DURATIONS.CURRENCY_RATES,
  [CACHE_TAGS.CONTENT]
);

// Client-side cache management
export class ClientCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 100; // Maximum number of cached items

  set(key: string, data: any, ttlSeconds: number = 300) {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredItems++;
      } else {
        validItems++;
      }
    }

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      hitRate: validItems / this.cache.size,
    };
  }
}

// Global client cache instance
export const clientCache = new ClientCache();

// Cache-aware fetch wrapper
export const cachedFetch = async (
  url: string,
  options: RequestInit = {},
  ttlSeconds: number = 300
): Promise<any> => {
  const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;
  
  // Check client cache first
  const cached = clientCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Cache-Control': `max-age=${ttlSeconds}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store in client cache
    clientCache.set(cacheKey, data, ttlSeconds);
    
    return data;
  } catch (error) {
    console.error(`Cached fetch error for ${url}:`, error);
    throw error;
  }
};

// Preload critical data for homepage
export const preloadHomepageData = async (locale: string = 'fr') => {
  const preloadPromises = [
    getCachedFeaturedLofts(locale, 6),
    getCachedTestimonials(locale, 6),
    getCachedHomepageStats(),
    getCachedCurrencyRates(),
  ];

  try {
    await Promise.allSettled(preloadPromises);
  } catch (error) {
    console.warn('Some homepage data failed to preload:', error);
  }
};

// Cache invalidation utilities
export const invalidateCache = (tags: string[]) => {
  // In a real implementation, this would use Next.js revalidateTag
  // For now, we'll clear client cache for matching patterns
  const keysToDelete: string[] = [];
  
  for (const [key] of clientCache['cache']) {
    if (tags.some(tag => key.includes(tag))) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => clientCache.delete(key));
};

// Cache warming for critical paths
export const warmCache = async () => {
  const locales = ['fr', 'en', 'ar'];
  
  const warmingPromises = locales.flatMap(locale => [
    getCachedFeaturedLofts(locale),
    getCachedTestimonials(locale),
    getCachedTranslations(locale, 'homepage'),
  ]);

  // Add non-locale specific data
  warmingPromises.push(
    getCachedHomepageStats(),
    getCachedOwnerMetrics(),
    getCachedCurrencyRates()
  );

  try {
    await Promise.allSettled(warmingPromises);
    console.log('Cache warming completed');
  } catch (error) {
    console.warn('Cache warming partially failed:', error);
  }
};

// Performance monitoring for cache
export const getCachePerformanceMetrics = () => {
  const clientStats = clientCache.getStats();
  
  return {
    client: clientStats,
    timestamp: new Date().toISOString(),
  };
};

// Service Worker cache management (for offline support)
export const setupServiceWorkerCache = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registered:', registration);
    }).catch(error => {
      console.error('Service Worker registration failed:', error);
    });
  }
};