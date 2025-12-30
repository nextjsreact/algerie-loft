/**
 * Loft Data Caching Service
 * Implements caching layer for frequently accessed loft data
 * Requirements: 1.7, 1.9 from reservation data consistency fix spec
 */

import { cacheManager, CacheStrategy } from '@/lib/cache-manager';
import { logger } from '@/lib/logger';
import { TestLoft } from '@/lib/data/test-lofts';

export interface LoftCacheOptions {
  ttl?: number;
  strategy?: CacheStrategy;
  includeTestData?: boolean;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  averageResponseTime: number;
  cacheSize: number;
  lastUpdated: string;
}

export interface LoftSearchCacheKey {
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  amenities?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Specialized caching service for loft data with performance monitoring
 */
export class LoftCacheService {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    cacheSize: 0,
    lastUpdated: new Date().toISOString()
  };

  private responseTimes: number[] = [];
  private readonly MAX_RESPONSE_TIMES = 1000;

  // Cache TTL configurations
  private readonly CACHE_TTLS = {
    LOFT_DETAILS: 10 * 60 * 1000, // 10 minutes
    LOFT_SEARCH: 5 * 60 * 1000,   // 5 minutes
    LOFT_AVAILABILITY: 2 * 60 * 1000, // 2 minutes
    LOFT_PRICING: 5 * 60 * 1000,   // 5 minutes
    TEST_DATA: 30 * 60 * 1000      // 30 minutes (test data changes less frequently)
  };

  constructor() {
    // Update metrics periodically
    setInterval(() => this.updateMetrics(), 60000); // Every minute
  }

  /**
   * Cache loft search results with optimized key generation
   */
  async cacheLoftSearch<T>(
    searchOptions: LoftSearchCacheKey,
    fetchFn: () => Promise<T>,
    options: LoftCacheOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = this.generateSearchCacheKey(searchOptions);
    
    try {
      const result = await cacheManager.get(
        cacheKey,
        fetchFn,
        {
          ttl: options.ttl || this.CACHE_TTLS.LOFT_SEARCH,
          strategy: options.strategy || CacheStrategy.CACHE_FIRST,
          version: '1.0'
        }
      );

      this.recordCacheHit(Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordCacheMiss(Date.now() - startTime);
      logger.error('Loft search cache error', { error, searchOptions });
      throw error;
    }
  }

  /**
   * Cache individual loft details
   */
  async cacheLoftDetails<T>(
    loftId: string,
    fetchFn: () => Promise<T>,
    options: LoftCacheOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = `loft_details:${loftId}`;
    
    try {
      const result = await cacheManager.get(
        cacheKey,
        fetchFn,
        {
          ttl: options.ttl || this.CACHE_TTLS.LOFT_DETAILS,
          strategy: options.strategy || CacheStrategy.CACHE_FIRST,
          version: '1.0'
        }
      );

      this.recordCacheHit(Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordCacheMiss(Date.now() - startTime);
      logger.error('Loft details cache error', { error, loftId });
      throw error;
    }
  }

  /**
   * Cache loft availability data
   */
  async cacheLoftAvailability<T>(
    loftId: string,
    checkIn: string,
    checkOut: string,
    fetchFn: () => Promise<T>,
    options: LoftCacheOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = `loft_availability:${loftId}:${checkIn}:${checkOut}`;
    
    try {
      const result = await cacheManager.get(
        cacheKey,
        fetchFn,
        {
          ttl: options.ttl || this.CACHE_TTLS.LOFT_AVAILABILITY,
          strategy: options.strategy || CacheStrategy.STALE_WHILE_REVALIDATE,
          version: '1.0'
        }
      );

      this.recordCacheHit(Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordCacheMiss(Date.now() - startTime);
      logger.error('Loft availability cache error', { error, loftId, checkIn, checkOut });
      throw error;
    }
  }

  /**
   * Cache pricing calculations
   */
  async cacheLoftPricing<T>(
    loftId: string,
    checkIn: string,
    checkOut: string,
    guests: number,
    fetchFn: () => Promise<T>,
    options: LoftCacheOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = `loft_pricing:${loftId}:${checkIn}:${checkOut}:${guests}`;
    
    try {
      const result = await cacheManager.get(
        cacheKey,
        fetchFn,
        {
          ttl: options.ttl || this.CACHE_TTLS.LOFT_PRICING,
          strategy: options.strategy || CacheStrategy.CACHE_FIRST,
          version: '1.0'
        }
      );

      this.recordCacheHit(Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordCacheMiss(Date.now() - startTime);
      logger.error('Loft pricing cache error', { error, loftId, checkIn, checkOut, guests });
      throw error;
    }
  }

  /**
   * Cache test loft data with longer TTL
   */
  async cacheTestLoftData<T>(
    fetchFn: () => Promise<T>,
    options: LoftCacheOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const cacheKey = 'test_loft_data:all';
    
    try {
      const result = await cacheManager.get(
        cacheKey,
        fetchFn,
        {
          ttl: options.ttl || this.CACHE_TTLS.TEST_DATA,
          strategy: options.strategy || CacheStrategy.CACHE_FIRST,
          version: '1.0'
        }
      );

      this.recordCacheHit(Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordCacheMiss(Date.now() - startTime);
      logger.error('Test loft data cache error', { error });
      throw error;
    }
  }

  /**
   * Invalidate cache for specific loft
   */
  invalidateLoftCache(loftId: string): void {
    try {
      // Invalidate all cache entries related to this loft
      const patterns = [
        `loft_details:${loftId}`,
        `loft_availability:${loftId}:*`,
        `loft_pricing:${loftId}:*`
      ];

      patterns.forEach(pattern => {
        if (pattern.includes('*')) {
          // For wildcard patterns, we need to clear related entries
          // This is a simplified approach - in production, you might want a more sophisticated pattern matching
          this.invalidateCacheByPattern(pattern);
        } else {
          cacheManager.delete(pattern);
        }
      });

      // Also invalidate search results as they might include this loft
      this.invalidateSearchCache();

      logger.info('Invalidated cache for loft', { loftId });
    } catch (error) {
      logger.error('Error invalidating loft cache', { error, loftId });
    }
  }

  /**
   * Invalidate all search cache entries
   */
  invalidateSearchCache(): void {
    try {
      // Clear all search-related cache entries
      this.invalidateCacheByPattern('loft_search:*');
      logger.info('Invalidated all search cache entries');
    } catch (error) {
      logger.error('Error invalidating search cache', { error });
    }
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAllCache(): void {
    try {
      cacheManager.clear();
      this.resetMetrics();
      logger.info('Invalidated all cache entries');
    } catch (error) {
      logger.error('Error invalidating all cache', { error });
    }
  }

  /**
   * Get cache performance metrics
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Get detailed cache statistics
   */
  getCacheStats(): {
    metrics: CacheMetrics;
    cacheManagerStats: any;
    performanceBreakdown: {
      averageHitTime: number;
      averageMissTime: number;
      hitTimeP95: number;
      missTimeP95: number;
    };
  } {
    const cacheManagerStats = cacheManager.getStats();
    
    // Calculate performance breakdown
    const hitTimes = this.responseTimes.filter((_, index) => index < this.metrics.hits);
    const missTimes = this.responseTimes.filter((_, index) => index >= this.metrics.hits);
    
    const performanceBreakdown = {
      averageHitTime: hitTimes.length > 0 ? hitTimes.reduce((a, b) => a + b, 0) / hitTimes.length : 0,
      averageMissTime: missTimes.length > 0 ? missTimes.reduce((a, b) => a + b, 0) / missTimes.length : 0,
      hitTimeP95: this.calculateP95(hitTimes),
      missTimeP95: this.calculateP95(missTimes)
    };

    return {
      metrics: this.metrics,
      cacheManagerStats,
      performanceBreakdown
    };
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(loftIds: string[]): Promise<void> {
    logger.info('Starting cache warm-up', { loftCount: loftIds.length });
    
    try {
      const warmUpPromises = loftIds.map(async (loftId) => {
        try {
          // Warm up loft details
          await this.cacheLoftDetails(loftId, async () => {
            // This would typically fetch from database
            return { id: loftId, warmedUp: true };
          });
        } catch (error) {
          logger.warn('Cache warm-up failed for loft', { loftId, error });
        }
      });

      await Promise.allSettled(warmUpPromises);
      logger.info('Cache warm-up completed', { loftCount: loftIds.length });
    } catch (error) {
      logger.error('Cache warm-up error', { error });
    }
  }

  /**
   * Private helper methods
   */

  private generateSearchCacheKey(options: LoftSearchCacheKey): string {
    // Create a deterministic cache key from search options
    const keyParts = [
      'loft_search',
      options.guests || 'any',
      options.minPrice || 'min',
      options.maxPrice || 'max',
      options.location || 'any',
      (options.amenities || []).sort().join(',') || 'none',
      options.page || 1,
      options.limit || 10,
      options.sortBy || 'name',
      options.sortOrder || 'asc'
    ];

    return keyParts.join(':');
  }

  private recordCacheHit(responseTime: number): void {
    this.metrics.hits++;
    this.metrics.totalRequests++;
    this.recordResponseTime(responseTime);
    this.updateHitRate();
  }

  private recordCacheMiss(responseTime: number): void {
    this.metrics.misses++;
    this.metrics.totalRequests++;
    this.recordResponseTime(responseTime);
    this.updateHitRate();
  }

  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    
    // Keep only recent response times
    if (this.responseTimes.length > this.MAX_RESPONSE_TIMES) {
      this.responseTimes = this.responseTimes.slice(-this.MAX_RESPONSE_TIMES);
    }

    // Update average response time
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  private updateHitRate(): void {
    this.metrics.hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;
  }

  private updateMetrics(): void {
    try {
      if (cacheManager && typeof cacheManager.getStats === 'function') {
        const cacheManagerStats = cacheManager.getStats();
        this.metrics.cacheSize = cacheManagerStats.memoryEntries + cacheManagerStats.persistentEntries;
      } else {
        // Fallback: estimate cache size from memory cache
        this.metrics.cacheSize = this.memoryCache.size;
      }
      this.metrics.lastUpdated = new Date().toISOString();
    } catch (error) {
      console.warn('Error updating cache metrics:', error);
      this.metrics.lastUpdated = new Date().toISOString();
    }
  }

  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      cacheSize: 0,
      lastUpdated: new Date().toISOString()
    };
    this.responseTimes = [];
  }

  private invalidateCacheByPattern(pattern: string): void {
    // This is a simplified pattern matching - in production you might want Redis or similar
    const cacheStats = cacheManager.getStats();
    const keysToDelete = cacheStats.memoryKeys.filter(key => 
      this.matchesPattern(key, pattern)
    );

    keysToDelete.forEach(key => cacheManager.delete(key));
  }

  private matchesPattern(key: string, pattern: string): boolean {
    if (!pattern.includes('*')) {
      return key === pattern;
    }

    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  private calculateP95(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] || 0;
  }
}

// Export singleton instance
export const loftCacheService = new LoftCacheService();

/**
 * Cache decorator for loft-related functions
 */
export function withLoftCache(
  cacheKey: string,
  ttl?: number,
  strategy?: CacheStrategy
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const fullCacheKey = `${cacheKey}:${JSON.stringify(args)}`;
      
      return await cacheManager.get(
        fullCacheKey,
        () => method.apply(this, args),
        { ttl, strategy, version: '1.0' }
      );
    };

    return descriptor;
  };
}