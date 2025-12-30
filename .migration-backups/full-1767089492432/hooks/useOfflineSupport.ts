'use client';

import { useState, useEffect, useCallback } from 'react';
import { CacheManager } from '@/lib/performance/enhanced-caching';

export interface OfflineState {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
}

export interface OfflineData {
  lofts: any[];
  testimonials: any[];
  stats: any;
  lastUpdated: string;
}

/**
 * Hook for managing offline and slow connection support
 */
export const useOfflineSupport = () => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  });

  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  // Initialize service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          setServiceWorkerReady(true);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  console.log('New version available');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Monitor connection status and quality
  useEffect(() => {
    const updateConnectionStatus = () => {
      const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

      const newState: OfflineState = {
        isOnline: navigator.onLine,
        isSlowConnection: false,
        connectionType: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0
      };

      if (connection) {
        newState.connectionType = connection.type || 'unknown';
        newState.effectiveType = connection.effectiveType || 'unknown';
        newState.downlink = connection.downlink || 0;
        newState.rtt = connection.rtt || 0;
        
        // Determine if connection is slow
        newState.isSlowConnection = 
          connection.effectiveType === 'slow-2g' ||
          connection.effectiveType === '2g' ||
          (connection.downlink && connection.downlink < 0.5) ||
          (connection.rtt && connection.rtt > 2000);
      }

      setOfflineState(newState);
    };

    // Initial check
    updateConnectionStatus();

    // Listen for connection changes
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);

    // Listen for connection quality changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionStatus);
    }

    return () => {
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
      if (connection) {
        connection.removeEventListener('change', updateConnectionStatus);
      }
    };
  }, []);

  // Load offline data from cache
  const loadOfflineData = useCallback(async () => {
    try {
      const cacheManager = CacheManager.getInstance();
      const guestCache = cacheManager.getCache('guestData');
      
      const cachedLofts = guestCache.get('featured-lofts') || [];
      const cachedTestimonials = guestCache.get('testimonials') || [];
      const cachedStats = guestCache.get('homepage-stats') || {};
      
      setOfflineData({
        lofts: cachedLofts,
        testimonials: cachedTestimonials,
        stats: cachedStats,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }, []);

  // Cache data for offline use
  const cacheForOffline = useCallback(async (data: {
    lofts?: any[];
    testimonials?: any[];
    stats?: any;
  }) => {
    try {
      const cacheManager = CacheManager.getInstance();
      const guestCache = cacheManager.getCache('guestData');
      
      if (data.lofts) {
        guestCache.set('featured-lofts', data.lofts);
      }
      if (data.testimonials) {
        guestCache.set('testimonials', data.testimonials);
      }
      if (data.stats) {
        guestCache.set('homepage-stats', data.stats);
      }
      
      await loadOfflineData();
    } catch (error) {
      console.error('Failed to cache offline data:', error);
    }
  }, [loadOfflineData]);

  // Fetch with offline fallback
  const fetchWithFallback = useCallback(async <T>(
    url: string,
    options: RequestInit = {},
    fallbackData?: T
  ): Promise<T> => {
    try {
      // Add timeout for slow connections
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache successful responses
      if (serviceWorkerReady) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CACHE_RESPONSE',
          url,
          data
        });
      }
      
      return data;
    } catch (error) {
      console.warn(`Fetch failed for ${url}, using fallback:`, error);
      
      // Try to get from cache first
      if (serviceWorkerReady) {
        try {
          const cachedResponse = await caches.match(url);
          if (cachedResponse) {
            return await cachedResponse.json();
          }
        } catch (cacheError) {
          console.warn('Cache lookup failed:', cacheError);
        }
      }
      
      // Use provided fallback data
      if (fallbackData !== undefined) {
        return fallbackData;
      }
      
      throw error;
    }
  }, [serviceWorkerReady]);

  // Preload critical resources
  const preloadCriticalResources = useCallback(async (urls: string[]) => {
    if (!serviceWorkerReady) return;
    
    try {
      navigator.serviceWorker.controller?.postMessage({
        type: 'CACHE_URLS',
        urls
      });
    } catch (error) {
      console.error('Failed to preload resources:', error);
    }
  }, [serviceWorkerReady]);

  // Clear offline cache
  const clearOfflineCache = useCallback(async () => {
    try {
      if (serviceWorkerReady) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CLEAR_CACHE'
        });
      }
      
      const cacheManager = CacheManager.getInstance();
      cacheManager.clearAll();
      
      setOfflineData(null);
    } catch (error) {
      console.error('Failed to clear offline cache:', error);
    }
  }, [serviceWorkerReady]);

  // Get connection quality indicator
  const getConnectionQuality = useCallback((): 'excellent' | 'good' | 'poor' | 'offline' => {
    if (!offlineState.isOnline) return 'offline';
    if (offlineState.isSlowConnection) return 'poor';
    
    if (offlineState.downlink > 2) return 'excellent';
    if (offlineState.downlink > 0.5) return 'good';
    
    return 'poor';
  }, [offlineState]);

  // Load offline data on mount
  useEffect(() => {
    loadOfflineData();
  }, [loadOfflineData]);

  return {
    // State
    offlineState,
    offlineData,
    serviceWorkerReady,
    
    // Connection quality
    connectionQuality: getConnectionQuality(),
    
    // Methods
    fetchWithFallback,
    cacheForOffline,
    loadOfflineData,
    preloadCriticalResources,
    clearOfflineCache,
    
    // Utilities
    isOnline: offlineState.isOnline,
    isSlowConnection: offlineState.isSlowConnection,
    hasOfflineData: offlineData !== null
  };
};

/**
 * Hook for progressive loading with placeholders
 */
export const useProgressiveLoading = <T>(
  fetchFn: () => Promise<T>,
  fallbackData?: T,
  options: {
    enablePlaceholder?: boolean;
    placeholderDelay?: number;
    retryAttempts?: number;
    retryDelay?: number;
  } = {}
) => {
  const {
    enablePlaceholder = true,
    placeholderDelay = 300,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const { isOnline, isSlowConnection } = useOfflineSupport();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Show placeholder after delay for slow connections
      let placeholderTimeout: NodeJS.Timeout | null = null;
      if (enablePlaceholder && (isSlowConnection || !isOnline)) {
        placeholderTimeout = setTimeout(() => {
          setShowPlaceholder(true);
        }, placeholderDelay);
      }
      
      const result = await fetchFn();
      
      if (placeholderTimeout) {
        clearTimeout(placeholderTimeout);
      }
      
      setData(result);
      setShowPlaceholder(false);
      setRetryCount(0);
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      // Use fallback data if available
      if (fallbackData) {
        setData(fallbackData);
      }
      
      // Retry logic
      if (retryCount < retryAttempts) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadData();
        }, retryDelay * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, fallbackData, enablePlaceholder, placeholderDelay, retryAttempts, retryDelay, retryCount, isSlowConnection, isOnline]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const retry = useCallback(() => {
    setRetryCount(0);
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    showPlaceholder,
    retryCount,
    retry,
    hasData: data !== null,
    isRetrying: retryCount > 0
  };
};