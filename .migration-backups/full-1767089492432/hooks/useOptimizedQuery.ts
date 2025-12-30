'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface QueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number; // Time in ms before data is considered stale
  cacheTime?: number; // Time in ms to keep data in cache
  retry?: number;
  retryDelay?: number;
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isStale: boolean;
}

// Simple in-memory cache
const queryCache = new Map<string, {
  data: any;
  timestamp: number;
  staleTime: number;
  cacheTime: number;
}>();

// Cleanup stale cache entries
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (now - value.timestamp > value.cacheTime) {
      queryCache.delete(key);
    }
  }
}, 60000); // Cleanup every minute

export function useOptimizedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    retry = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if we have cached data
  const getCachedData = useCallback(() => {
    const cached = queryCache.get(queryKey);
    if (cached) {
      const now = Date.now();
      const isExpired = now - cached.timestamp > cached.cacheTime;
      const isStaleData = now - cached.timestamp > cached.staleTime;
      
      if (!isExpired) {
        return { data: cached.data, isStale: isStaleData };
      }
    }
    return null;
  }, [queryKey]);

  // Execute query with retry logic
  const executeQuery = useCallback(async (isRefetch = false) => {
    if (!enabled && !isRefetch) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first (unless it's a manual refetch)
    if (!isRefetch) {
      const cached = getCachedData();
      if (cached) {
        setData(cached.data);
        setIsStale(cached.isStale);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);
    abortControllerRef.current = new AbortController();

    const attemptQuery = async (attempt: number): Promise<void> => {
      try {
        const result = await queryFn();
        
        // Cache the result
        queryCache.set(queryKey, {
          data: result,
          timestamp: Date.now(),
          staleTime,
          cacheTime
        });

        setData(result);
        setIsStale(false);
        setError(null);
        retryCountRef.current = 0;
      } catch (err) {
        const error = err as Error;
        
        if (error.name === 'AbortError') {
          return; // Request was cancelled
        }

        if (attempt < retry) {
          retryCountRef.current = attempt + 1;
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
          return attemptQuery(attempt + 1);
        }

        setError(error);
        console.error(`Query failed after ${retry} attempts:`, error);
      } finally {
        setLoading(false);
      }
    };

    await attemptQuery(0);
  }, [enabled, queryFn, queryKey, retry, retryDelay, staleTime, cacheTime, getCachedData]);

  // Refetch function
  const refetch = useCallback(async () => {
    await executeQuery(true);
  }, [executeQuery]);

  // Initial query execution
  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  // Handle window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (isStale) {
        executeQuery(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, isStale, executeQuery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    isStale
  };
}

// Clear cache utility
export function clearQueryCache(pattern?: string) {
  if (pattern) {
    for (const key of queryCache.keys()) {
      if (key.includes(pattern)) {
        queryCache.delete(key);
      }
    }
  } else {
    queryCache.clear();
  }
}

// Get cache stats
export function getCacheStats() {
  return {
    size: queryCache.size,
    keys: Array.from(queryCache.keys()),
    totalMemory: JSON.stringify(Array.from(queryCache.values())).length
  };
}