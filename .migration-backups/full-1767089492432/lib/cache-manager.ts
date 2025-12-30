'use client';

// Cache strategies
export enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  CACHE_ONLY = 'cache-only',
  NETWORK_ONLY = 'network-only',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate'
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
}

interface CacheOptions {
  ttl?: number; // Default 5 minutes
  strategy?: CacheStrategy;
  version?: string;
  serialize?: (data: any) => string;
  deserialize?: (data: string) => any;
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_MEMORY_ENTRIES = 1000;
  private readonly STORAGE_PREFIX = 'loft-cache-';

  constructor() {
    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
    
    // Load persistent cache on initialization
    this.loadPersistentCache();
  }

  // Get data from cache
  async get<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttl = this.DEFAULT_TTL,
      strategy = CacheStrategy.CACHE_FIRST,
      version = '1.0',
      serialize = JSON.stringify,
      deserialize = JSON.parse
    } = options;

    const cacheKey = this.getCacheKey(key, version);

    switch (strategy) {
      case CacheStrategy.CACHE_FIRST:
        return this.cacheFirst(cacheKey, fetchFn, ttl, serialize, deserialize);
      
      case CacheStrategy.NETWORK_FIRST:
        return this.networkFirst(cacheKey, fetchFn, ttl, serialize, deserialize);
      
      case CacheStrategy.CACHE_ONLY:
        return this.cacheOnly(cacheKey, deserialize);
      
      case CacheStrategy.NETWORK_ONLY:
        return this.networkOnly(fetchFn);
      
      case CacheStrategy.STALE_WHILE_REVALIDATE:
        return this.staleWhileRevalidate(cacheKey, fetchFn, ttl, serialize, deserialize);
      
      default:
        return this.cacheFirst(cacheKey, fetchFn, ttl, serialize, deserialize);
    }
  }

  // Cache-first strategy
  private async cacheFirst<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number,
    serialize: (data: any) => string,
    deserialize: (data: string) => any
  ): Promise<T> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }

    // Check persistent cache
    const persistentEntry = this.getPersistentCache<T>(key, deserialize);
    if (persistentEntry && !this.isExpired(persistentEntry)) {
      // Update memory cache
      this.memoryCache.set(key, persistentEntry);
      return persistentEntry.data;
    }

    // Fetch from network
    const data = await fetchFn();
    this.set(key, data, ttl, serialize);
    return data;
  }

  // Network-first strategy
  private async networkFirst<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number,
    serialize: (data: any) => string,
    deserialize: (data: string) => any
  ): Promise<T> {
    try {
      const data = await fetchFn();
      this.set(key, data, ttl, serialize);
      return data;
    } catch (error) {
      // Fallback to cache if network fails
      const cachedEntry = this.memoryCache.get(key) || this.getPersistentCache<T>(key, deserialize);
      if (cachedEntry) {
        console.warn('Network failed, using cached data:', error);
        return cachedEntry.data;
      }
      throw error;
    }
  }

  // Cache-only strategy
  private async cacheOnly<T>(
    key: string,
    deserialize: (data: string) => any
  ): Promise<T> {
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }

    const persistentEntry = this.getPersistentCache<T>(key, deserialize);
    if (persistentEntry && !this.isExpired(persistentEntry)) {
      return persistentEntry.data;
    }

    throw new Error(`No cached data found for key: ${key}`);
  }

  // Network-only strategy
  private async networkOnly<T>(fetchFn: () => Promise<T>): Promise<T> {
    return fetchFn();
  }

  // Stale-while-revalidate strategy
  private async staleWhileRevalidate<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number,
    serialize: (data: any) => string,
    deserialize: (data: string) => any
  ): Promise<T> {
    const cachedEntry = this.memoryCache.get(key) || this.getPersistentCache<T>(key, deserialize);
    
    if (cachedEntry) {
      // Return stale data immediately
      if (this.isExpired(cachedEntry)) {
        // Revalidate in background
        fetchFn().then(data => {
          this.set(key, data, ttl, serialize);
        }).catch(error => {
          console.warn('Background revalidation failed:', error);
        });
      }
      return cachedEntry.data;
    }

    // No cached data, fetch from network
    const data = await fetchFn();
    this.set(key, data, ttl, serialize);
    return data;
  }

  // Set data in cache
  set<T>(
    key: string, 
    data: T, 
    ttl: number = this.DEFAULT_TTL,
    serialize: (data: any) => string = JSON.stringify
  ): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: '1.0'
    };

    // Memory cache
    this.memoryCache.set(key, entry);
    this.enforceMemoryLimit();

    // Persistent cache (localStorage)
    this.setPersistentCache(key, entry, serialize);
  }

  // Delete from cache
  delete(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_PREFIX + key);
    }
  }

  // Clear all cache
  clear(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.STORAGE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    }
  }

  // Get cache statistics
  getStats() {
    const memorySize = this.memoryCache.size;
    const persistentSize = typeof window !== 'undefined' 
      ? Object.keys(localStorage).filter(key => key.startsWith(this.STORAGE_PREFIX)).length 
      : 0;

    return {
      memoryEntries: memorySize,
      persistentEntries: persistentSize,
      memoryKeys: Array.from(this.memoryCache.keys()),
      totalMemoryUsage: this.calculateMemoryUsage()
    };
  }

  // Private methods
  private getCacheKey(key: string, version: string): string {
    return `${key}:${version}`;
  }

  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanup(): void {
    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Clean persistent cache
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.STORAGE_PREFIX))
        .forEach(key => {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const entry = JSON.parse(data);
              if (this.isExpired(entry)) {
                localStorage.removeItem(key);
              }
            }
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key);
          }
        });
    }
  }

  private enforceMemoryLimit(): void {
    if (this.memoryCache.size > this.MAX_MEMORY_ENTRIES) {
      // Remove oldest entries
      const entries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toRemove = entries.slice(0, this.memoryCache.size - this.MAX_MEMORY_ENTRIES);
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  private setPersistentCache<T>(
    key: string, 
    entry: CacheEntry<T>,
    serialize: (data: any) => string
  ): void {
    if (typeof window !== 'undefined') {
      try {
        const serializedEntry = {
          ...entry,
          data: serialize(entry.data)
        };
        localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(serializedEntry));
      } catch (error) {
        console.warn('Failed to save to persistent cache:', error);
      }
    }
  }

  private getPersistentCache<T>(
    key: string,
    deserialize: (data: string) => any
  ): CacheEntry<T> | null {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(this.STORAGE_PREFIX + key);
        if (data) {
          const entry = JSON.parse(data);
          return {
            ...entry,
            data: deserialize(entry.data)
          };
        }
      } catch (error) {
        console.warn('Failed to load from persistent cache:', error);
        // Remove corrupted entry
        localStorage.removeItem(this.STORAGE_PREFIX + key);
      }
    }
    return null;
  }

  private loadPersistentCache(): void {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.STORAGE_PREFIX))
        .forEach(storageKey => {
          try {
            const data = localStorage.getItem(storageKey);
            if (data) {
              const entry = JSON.parse(data);
              if (!this.isExpired(entry)) {
                const cacheKey = storageKey.replace(this.STORAGE_PREFIX, '');
                this.memoryCache.set(cacheKey, {
                  ...entry,
                  data: JSON.parse(entry.data)
                });
              } else {
                localStorage.removeItem(storageKey);
              }
            }
          } catch (error) {
            localStorage.removeItem(storageKey);
          }
        });
    }
  }

  private calculateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      totalSize += JSON.stringify(entry).length;
    }
    return totalSize;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();