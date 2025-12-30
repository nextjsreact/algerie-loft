/**
 * Cache management system for multi-role booking system
 * Provides in-memory caching with TTL and Redis-ready architecture
 */

import { logger } from '@/lib/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum cache size
  tags?: string[]; // Cache tags for invalidation
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
  hits: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

/**
 * In-memory cache manager with TTL support
 */
export class MemoryCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 300) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Clean expired entries every 5 minutes
    setInterval(() => this.cleanExpired(), 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: (options.ttl || this.defaultTTL) * 1000, // Convert to milliseconds
      tags: options.tags || [],
      hits: 0
    };

    this.cache.set(key, entry);
    this.stats.sets++;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Clear cache by tags
   */
  clearByTags(tags: string[]): number {
    let cleared = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    this.stats.deletes += cleared;
    return cleared;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // String characters are 2 bytes
      size += JSON.stringify(entry.data).length * 2;
      size += 100; // Overhead for entry metadata
    }
    
    return size;
  }
}

/**
 * Cache key generators for different data types
 */
export class CacheKeyGenerator {
  static loftSearch(filters: any): string {
    const filterStr = JSON.stringify(filters);
    return `loft_search:${Buffer.from(filterStr).toString('base64')}`;
  }

  static userBookings(userId: string, role: string): string {
    return `user_bookings:${role}:${userId}`;
  }

  static partnerDashboard(partnerId: string): string {
    return `partner_dashboard:${partnerId}`;
  }

  static loftDetails(loftId: string): string {
    return `loft_details:${loftId}`;
  }

  static loftAvailability(loftId: string, month: string): string {
    return `loft_availability:${loftId}:${month}`;
  }

  static partnerProperties(partnerId: string): string {
    return `partner_properties:${partnerId}`;
  }
}

/**
 * Cache tags for invalidation strategies
 */
export class CacheTags {
  static readonly LOFTS = 'lofts';
  static readonly BOOKINGS = 'bookings';
  static readonly USERS = 'users';
  static readonly PARTNERS = 'partners';
  static readonly AVAILABILITY = 'availability';
  static readonly SEARCH = 'search';

  static forLoft(loftId: string): string[] {
    return [this.LOFTS, `loft:${loftId}`];
  }

  static forUser(userId: string): string[] {
    return [this.USERS, `user:${userId}`];
  }

  static forPartner(partnerId: string): string[] {
    return [this.PARTNERS, `partner:${partnerId}`];
  }

  static forBooking(bookingId: string): string[] {
    return [this.BOOKINGS, `booking:${bookingId}`];
  }
}

/**
 * Cached data access layer
 */
export class CachedDataAccess {
  private cache: MemoryCacheManager;

  constructor(cache?: MemoryCacheManager) {
    this.cache = cache || new MemoryCacheManager();
  }

  /**
   * Get or set cached data with fallback function
   */
  async getOrSet<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute fallback function
    try {
      const data = await fallbackFn();
      
      // Cache the result
      this.cache.set(key, data, options);
      
      return data;
    } catch (error) {
      logger.error('Cache fallback function failed', { key, error });
      throw error;
    }
  }

  /**
   * Invalidate cache entries by tags
   */
  invalidate(tags: string[]): number {
    return this.cache.clearByTags(tags);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.cache.getStats();
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
export const globalCache = new CachedDataAccess();

/**
 * Cache warming strategies
 */
export class CacheWarmer {
  private cache: CachedDataAccess;

  constructor(cache: CachedDataAccess) {
    this.cache = cache;
  }

  /**
   * Warm up frequently accessed data
   */
  async warmUp(): Promise<void> {
    logger.info('Starting cache warm-up process');

    try {
      // Warm up popular lofts (this would be enhanced with actual data)
      await this.warmPopularLofts();
      
      // Warm up common search results
      await this.warmCommonSearches();
      
      logger.info('Cache warm-up completed successfully');
    } catch (error) {
      logger.error('Cache warm-up failed', { error });
    }
  }

  private async warmPopularLofts(): Promise<void> {
    // This would be implemented with actual popular loft queries
    logger.info('Warming popular lofts cache');
  }

  private async warmCommonSearches(): Promise<void> {
    // This would be implemented with common search patterns
    logger.info('Warming common searches cache');
  }
}

/**
 * Cache middleware for API routes
 */
export function withCache<T>(
  key: string,
  options: CacheOptions = {}
) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const cacheKey = typeof key === 'function' ? key(...args) : key;
      
      return globalCache.getOrSet(
        cacheKey,
        () => method.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}