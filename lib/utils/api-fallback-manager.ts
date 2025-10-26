/**
 * API Fallback Manager
 * Handles API failures with graceful degradation and fallback strategies
 */

import { offlineDataManager } from './offline-data-manager';

export interface APIFallbackConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  enableFallback: boolean;
  fallbackDelay: number;
}

export interface APIResponse<T> {
  data: T | null;
  error: Error | null;
  isFromFallback: boolean;
  isFromCache: boolean;
  retryCount: number;
  responseTime: number;
}

const DEFAULT_CONFIG: APIFallbackConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 8000,
  enableFallback: true,
  fallbackDelay: 2000
};

export class APIFallbackManager {
  private static instance: APIFallbackManager;
  private config: APIFallbackConfig;
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private constructor(config: Partial<APIFallbackConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<APIFallbackConfig>): APIFallbackManager {
    if (!APIFallbackManager.instance) {
      APIFallbackManager.instance = new APIFallbackManager(config);
    }
    return APIFallbackManager.instance;
  }

  /**
   * Fetch with comprehensive fallback strategy
   */
  async fetchWithFallback<T>(
    url: string,
    options: RequestInit = {},
    fallbackKey?: string,
    locale: string = 'fr'
  ): Promise<APIResponse<T>> {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: Error | null = null;

    // Check cache first
    const cached = this.getFromCache<T>(url);
    if (cached) {
      return {
        data: cached,
        error: null,
        isFromFallback: false,
        isFromCache: true,
        retryCount: 0,
        responseTime: Date.now() - startTime
      };
    }

    // Attempt network request with retries
    while (retryCount <= this.config.maxRetries) {
      try {
        const data = await this.attemptNetworkRequest<T>(url, options);
        
        // Cache successful response
        this.setCache(url, data, 300000); // 5 minutes TTL
        
        return {
          data,
          error: null,
          isFromFallback: false,
          isFromCache: false,
          retryCount,
          responseTime: Date.now() - startTime
        };
      } catch (error) {
        lastError = error as Error;
        retryCount++;
        
        if (retryCount <= this.config.maxRetries) {
          await this.delay(this.config.retryDelay * retryCount);
        }
      }
    }

    // All network attempts failed, try fallback strategies
    if (this.config.enableFallback) {
      try {
        const fallbackData = await this.getFallbackData<T>(fallbackKey, locale, url);
        
        return {
          data: fallbackData,
          error: lastError,
          isFromFallback: true,
          isFromCache: false,
          retryCount,
          responseTime: Date.now() - startTime
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    // Complete failure
    return {
      data: null,
      error: lastError || new Error('Request failed'),
      isFromFallback: false,
      isFromCache: false,
      retryCount,
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Attempt a single network request with timeout
   */
  private async attemptNetworkRequest<T>(url: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get fallback data from various sources
   */
  private async getFallbackData<T>(
    fallbackKey?: string,
    locale: string = 'fr',
    url?: string
  ): Promise<T> {
    // Wait for fallback delay to avoid immediate fallback
    await this.delay(this.config.fallbackDelay);

    // Try offline data manager first
    if (fallbackKey) {
      try {
        const offlineData = await offlineDataManager.fetchWithFallback(
          url || '',
          fallbackKey as any,
          locale
        );
        return offlineData;
      } catch (error) {
        console.warn('Offline data manager fallback failed:', error);
      }
    }

    // Try service worker cache
    if (typeof window !== 'undefined' && 'caches' in window && url) {
      try {
        const cache = await caches.open('loft-algerie-v1');
        const cachedResponse = await cache.match(url);
        
        if (cachedResponse) {
          return await cachedResponse.json();
        }
      } catch (error) {
        console.warn('Service worker cache fallback failed:', error);
      }
    }

    // Try localStorage fallback
    if (typeof window !== 'undefined' && url) {
      try {
        const storageKey = `fallback_${btoa(url)}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
          const { data, timestamp } = JSON.parse(stored);
          
          // Check if data is not too old (24 hours)
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            return data;
          }
        }
      } catch (error) {
        console.warn('localStorage fallback failed:', error);
      }
    }

    throw new Error('No fallback data available');
  }

  /**
   * Cache management
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.requestCache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.requestCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        const storageKey = `fallback_${btoa(key)}`;
        localStorage.setItem(storageKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to store fallback data:', error);
      }
    }
  }

  /**
   * Utility methods
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.requestCache.clear();
    
    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('fallback_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Failed to clear localStorage fallbacks:', error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    hitRate: number;
  } {
    const keys = Array.from(this.requestCache.keys());
    
    return {
      size: this.requestCache.size,
      keys,
      hitRate: 0 // Would need to track hits/misses for accurate calculation
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<APIFallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Health check for API endpoints
   */
  async healthCheck(endpoints: string[]): Promise<{
    endpoint: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
  }[]> {
    const results = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const startTime = Date.now();
        
        try {
          const response = await this.attemptNetworkRequest(endpoint, { method: 'HEAD' });
          
          return {
            endpoint,
            status: 'healthy' as const,
            responseTime: Date.now() - startTime
          };
        } catch (error) {
          const responseTime = Date.now() - startTime;
          
          return {
            endpoint,
            status: responseTime > this.config.timeout ? 'down' : 'degraded' as const,
            responseTime
          };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          endpoint: endpoints[index],
          status: 'down' as const,
          responseTime: this.config.timeout
        };
      }
    });
  }
}

// Export singleton instance
export const apiFallbackManager = APIFallbackManager.getInstance();

// Convenience functions for common API calls
export const fetchLofts = (locale: string = 'fr', limit: number = 6) =>
  apiFallbackManager.fetchWithFallback(
    `/api/lofts/featured?locale=${locale}&limit=${limit}`,
    {},
    'lofts',
    locale
  );

export const fetchTestimonials = (locale: string = 'fr', limit: number = 6) =>
  apiFallbackManager.fetchWithFallback(
    `/api/testimonials?locale=${locale}&limit=${limit}`,
    {},
    'testimonials',
    locale
  );

export const fetchHomepageStats = () =>
  apiFallbackManager.fetchWithFallback(
    '/api/stats/homepage',
    {},
    'stats'
  );

export const fetchOwnerMetrics = () =>
  apiFallbackManager.fetchWithFallback(
    '/api/owner/metrics',
    {},
    'ownerMetrics'
  );

export const searchLofts = (params: Record<string, any>) => {
  const queryString = new URLSearchParams(params).toString();
  return apiFallbackManager.fetchWithFallback(
    `/api/lofts/search?${queryString}`,
    {},
    'lofts',
    params.locale || 'fr'
  );
};