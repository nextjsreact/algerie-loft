/**
 * Enhanced Caching System for Dual-Audience Homepage
 * Implements multi-level caching for static content and API responses
 */

// Cache configuration
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  strategy: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
  persistent: boolean; // Whether to persist to localStorage
}

// Default cache configurations for different content types
export const CACHE_CONFIGS = {
  staticContent: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 100,
    strategy: 'lru' as const,
    persistent: true
  },
  apiResponses: {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 50,
    strategy: 'lru' as const,
    persistent: false
  },
  guestData: {
    ttl: 15 * 60 * 1000, // 15 minutes
    maxSize: 30,
    strategy: 'lru' as const,
    persistent: true
  },
  ownerData: {
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 20,
    strategy: 'lru' as const,
    persistent: true
  },
  translations: {
    ttl: 60 * 60 * 1000, // 1 hour
    maxSize: 10,
    strategy: 'lfu' as const,
    persistent: true
  }
} as const;

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

// Enhanced cache implementation
export class EnhancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private storageKey: string;

  constructor(name: string, config: Partial<CacheConfig> = {}) {
    this.config = { ...CACHE_CONFIGS.staticContent, ...config };
    this.storageKey = `cache_${name}`;
    
    // Load from localStorage if persistent
    if (this.config.persistent && typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  // Get item from cache
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.data;
  }

  // Set item in cache
  set(key: string, data: T): void {
    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now()
    };
    
    this.cache.set(key, entry);
    this.saveToStorage();
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Delete specific key
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) this.saveToStorage();
    return result;
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  // Get cache statistics
  getStats(): {
    size: number;
    hitRate: number;
    keys: string[];
    totalAccesses: number;
  } {
    let totalAccesses = 0;
    const keys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      totalAccesses += entry.accessCount;
      keys.push(key);
    }
    
    return {
      size: this.cache.size,
      hitRate: totalAccesses > 0 ? (this.cache.size / totalAccesses) * 100 : 0,
      keys,
      totalAccesses
    };
  }

  // Evict entries based on strategy
  private evict(): void {
    if (this.cache.size === 0) return;
    
    let keyToEvict: string;
    
    switch (this.config.strategy) {
      case 'lru': // Least Recently Used
        keyToEvict = this.findLRUKey();
        break;
      case 'lfu': // Least Frequently Used
        keyToEvict = this.findLFUKey();
        break;
      case 'fifo': // First In, First Out
      default:
        keyToEvict = this.cache.keys().next().value;
        break;
    }
    
    this.cache.delete(keyToEvict);
  }

  private findLRUKey(): string {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  private findLFUKey(): string {
    let leastUsedKey = '';
    let leastCount = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }
    
    return leastUsedKey;
  }

  // Save to localStorage
  private saveToStorage(): void {
    if (!this.config.persistent || typeof window === 'undefined') return;
    
    try {
      const serialized = JSON.stringify(Array.from(this.cache.entries()));
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const entries = JSON.parse(stored);
        this.cache = new Map(entries);
        
        // Clean expired entries
        this.cleanExpired();
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  // Clean expired entries
  private cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      this.saveToStorage();
    }
  }
}

// Cache manager for different content types
export class CacheManager {
  private static instance: CacheManager;
  private caches = new Map<string, EnhancedCache<any>>();

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Get or create cache for specific type
  getCache<T>(type: keyof typeof CACHE_CONFIGS): EnhancedCache<T> {
    if (!this.caches.has(type)) {
      const config = CACHE_CONFIGS[type];
      this.caches.set(type, new EnhancedCache<T>(type, config));
    }
    return this.caches.get(type)!;
  }

  // Clear all caches
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  // Get global statistics
  getGlobalStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [type, cache] of this.caches.entries()) {
      stats[type] = cache.getStats();
    }
    
    return stats;
  }
}

// Cached fetch wrapper for API responses
export const cachedFetch = async <T>(
  url: string,
  options: RequestInit = {},
  cacheType: keyof typeof CACHE_CONFIGS = 'apiResponses'
): Promise<T> => {
  const cache = CacheManager.getInstance().getCache<T>(cacheType);
  const cacheKey = `${url}_${JSON.stringify(options)}`;
  
  // Try to get from cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch from network
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store in cache
    cache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('Cached fetch failed:', error);
    throw error;
  }
};

// Static content caching utilities
export const cacheStaticContent = (key: string, content: any): void => {
  const cache = CacheManager.getInstance().getCache('staticContent');
  cache.set(key, content);
};

export const getStaticContent = <T>(key: string): T | null => {
  const cache = CacheManager.getInstance().getCache<T>('staticContent');
  return cache.get(key);
};

// Guest-specific data caching
export const cacheGuestData = (key: string, data: any): void => {
  const cache = CacheManager.getInstance().getCache('guestData');
  cache.set(key, data);
};

export const getGuestData = <T>(key: string): T | null => {
  const cache = CacheManager.getInstance().getCache<T>('guestData');
  return cache.get(key);
};

// Owner-specific data caching
export const cacheOwnerData = (key: string, data: any): void => {
  const cache = CacheManager.getInstance().getCache('ownerData');
  cache.set(key, data);
};

export const getOwnerData = <T>(key: string): T | null => {
  const cache = CacheManager.getInstance().getCache<T>('ownerData');
  return cache.get(key);
};

// Translation caching
export const cacheTranslations = (locale: string, namespace: string, translations: any): void => {
  const cache = CacheManager.getInstance().getCache('translations');
  const key = `${locale}_${namespace}`;
  cache.set(key, translations);
};

export const getTranslations = (locale: string, namespace: string): any | null => {
  const cache = CacheManager.getInstance().getCache('translations');
  const key = `${locale}_${namespace}`;
  return cache.get(key);
};

// Cache warming utilities
export const warmCache = async (urls: string[]): Promise<void> => {
  const warmPromises = urls.map(async (url) => {
    try {
      await cachedFetch(url);
    } catch (error) {
      console.warn(`Failed to warm cache for ${url}:`, error);
    }
  });
  
  await Promise.allSettled(warmPromises);
};

// Cache invalidation utilities
export const invalidateCache = (pattern: string): void => {
  const manager = CacheManager.getInstance();
  const stats = manager.getGlobalStats();
  
  for (const [cacheType, cacheStats] of Object.entries(stats)) {
    const cache = manager.getCache(cacheType);
    const keysToDelete = cacheStats.keys.filter((key: string) => 
      key.includes(pattern)
    );
    
    keysToDelete.forEach((key: string) => cache.delete(key));
  }
};

// Performance monitoring
export const getCachePerformanceMetrics = (): {
  totalSize: number;
  hitRates: Record<string, number>;
  memoryUsage: number;
} => {
  const manager = CacheManager.getInstance();
  const stats = manager.getGlobalStats();
  
  let totalSize = 0;
  const hitRates: Record<string, number> = {};
  
  for (const [type, cacheStats] of Object.entries(stats)) {
    totalSize += cacheStats.size;
    hitRates[type] = cacheStats.hitRate;
  }
  
  // Estimate memory usage (rough calculation)
  const memoryUsage = totalSize * 1024; // Assume 1KB per entry on average
  
  return {
    totalSize,
    hitRates,
    memoryUsage
  };
};