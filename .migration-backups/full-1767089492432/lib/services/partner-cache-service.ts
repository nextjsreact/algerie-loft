/**
 * Partner Cache Service
 * 
 * Provides intelligent caching for frequently accessed partner data
 * to improve dashboard performance and reduce database load.
 */

import { PartnerProfile, PartnerDashboardStats, PartnerPropertyView, PartnerReservationSummary } from '@/types/partner';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
  memoryUsage: number;
}

export class PartnerCacheService {
  private static cache = new Map<string, CacheEntry<any>>();
  private static stats = {
    hits: 0,
    misses: 0
  };

  // Cache TTL configurations (in milliseconds)
  private static readonly TTL_CONFIG = {
    PARTNER_PROFILE: 15 * 60 * 1000, // 15 minutes
    DASHBOARD_STATS: 5 * 60 * 1000,  // 5 minutes
    PROPERTIES_LIST: 10 * 60 * 1000, // 10 minutes
    PROPERTY_DETAILS: 30 * 60 * 1000, // 30 minutes
    RESERVATIONS_LIST: 2 * 60 * 1000, // 2 minutes
    REVENUE_REPORTS: 15 * 60 * 1000,  // 15 minutes
    PARTNER_PERMISSIONS: 60 * 60 * 1000 // 1 hour
  };

  /**
   * Get cached data or return null if not found/expired
   */
  private static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set data in cache with TTL
   */
  private static set<T>(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key
    };

    this.cache.set(key, entry);
  }

  /**
   * Generate cache key for partner profile
   */
  private static getPartnerProfileKey(partnerId: string): string {
    return `partner_profile:${partnerId}`;
  }

  /**
   * Generate cache key for dashboard stats
   */
  private static getDashboardStatsKey(partnerId: string): string {
    return `dashboard_stats:${partnerId}`;
  }

  /**
   * Generate cache key for properties list
   */
  private static getPropertiesListKey(partnerId: string, filters?: any): string {
    const filterHash = filters ? btoa(JSON.stringify(filters)) : 'all';
    return `properties_list:${partnerId}:${filterHash}`;
  }

  /**
   * Generate cache key for property details
   */
  private static getPropertyDetailsKey(partnerId: string, loftId: string): string {
    return `property_details:${partnerId}:${loftId}`;
  }

  /**
   * Generate cache key for reservations list
   */
  private static getReservationsListKey(partnerId: string, filters?: any): string {
    const filterHash = filters ? btoa(JSON.stringify(filters)) : 'all';
    return `reservations_list:${partnerId}:${filterHash}`;
  }

  /**
   * Generate cache key for revenue reports
   */
  private static getRevenueReportsKey(partnerId: string, dateRange: any): string {
    const rangeHash = btoa(JSON.stringify(dateRange));
    return `revenue_reports:${partnerId}:${rangeHash}`;
  }

  /**
   * Cache partner profile
   */
  static cachePartnerProfile(partnerId: string, profile: PartnerProfile): void {
    const key = this.getPartnerProfileKey(partnerId);
    this.set(key, profile, this.TTL_CONFIG.PARTNER_PROFILE);
  }

  /**
   * Get cached partner profile
   */
  static getCachedPartnerProfile(partnerId: string): PartnerProfile | null {
    const key = this.getPartnerProfileKey(partnerId);
    return this.get<PartnerProfile>(key);
  }

  /**
   * Cache dashboard statistics
   */
  static cacheDashboardStats(partnerId: string, stats: PartnerDashboardStats): void {
    const key = this.getDashboardStatsKey(partnerId);
    this.set(key, stats, this.TTL_CONFIG.DASHBOARD_STATS);
  }

  /**
   * Get cached dashboard statistics
   */
  static getCachedDashboardStats(partnerId: string): PartnerDashboardStats | null {
    const key = this.getDashboardStatsKey(partnerId);
    return this.get<PartnerDashboardStats>(key);
  }

  /**
   * Cache properties list
   */
  static cachePropertiesList(partnerId: string, properties: PartnerPropertyView[], filters?: any): void {
    const key = this.getPropertiesListKey(partnerId, filters);
    this.set(key, properties, this.TTL_CONFIG.PROPERTIES_LIST);
  }

  /**
   * Get cached properties list
   */
  static getCachedPropertiesList(partnerId: string, filters?: any): PartnerPropertyView[] | null {
    const key = this.getPropertiesListKey(partnerId, filters);
    return this.get<PartnerPropertyView[]>(key);
  }

  /**
   * Cache property details
   */
  static cachePropertyDetails(partnerId: string, loftId: string, property: PartnerPropertyView): void {
    const key = this.getPropertyDetailsKey(partnerId, loftId);
    this.set(key, property, this.TTL_CONFIG.PROPERTY_DETAILS);
  }

  /**
   * Get cached property details
   */
  static getCachedPropertyDetails(partnerId: string, loftId: string): PartnerPropertyView | null {
    const key = this.getPropertyDetailsKey(partnerId, loftId);
    return this.get<PartnerPropertyView>(key);
  }

  /**
   * Cache reservations list
   */
  static cacheReservationsList(partnerId: string, reservations: PartnerReservationSummary[], filters?: any): void {
    const key = this.getReservationsListKey(partnerId, filters);
    this.set(key, reservations, this.TTL_CONFIG.RESERVATIONS_LIST);
  }

  /**
   * Get cached reservations list
   */
  static getCachedReservationsList(partnerId: string, filters?: any): PartnerReservationSummary[] | null {
    const key = this.getReservationsListKey(partnerId, filters);
    return this.get<PartnerReservationSummary[]>(key);
  }

  /**
   * Cache revenue reports
   */
  static cacheRevenueReports(partnerId: string, dateRange: any, reports: any): void {
    const key = this.getRevenueReportsKey(partnerId, dateRange);
    this.set(key, reports, this.TTL_CONFIG.REVENUE_REPORTS);
  }

  /**
   * Get cached revenue reports
   */
  static getCachedRevenueReports(partnerId: string, dateRange: any): any | null {
    const key = this.getRevenueReportsKey(partnerId, dateRange);
    return this.get<any>(key);
  }

  /**
   * Cache partner permissions
   */
  static cachePartnerPermissions(partnerId: string, permissions: any): void {
    const key = `partner_permissions:${partnerId}`;
    this.set(key, permissions, this.TTL_CONFIG.PARTNER_PERMISSIONS);
  }

  /**
   * Get cached partner permissions
   */
  static getCachedPartnerPermissions(partnerId: string): any | null {
    const key = `partner_permissions:${partnerId}`;
    return this.get<any>(key);
  }

  /**
   * Invalidate all cache entries for a specific partner
   */
  static invalidatePartnerCache(partnerId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (key.includes(partnerId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate specific cache entries
   */
  static invalidateCache(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  static clearCache(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0;
    for (const [key, entry] of this.cache) {
      memoryUsage += key.length * 2; // String characters are 2 bytes each
      memoryUsage += JSON.stringify(entry.data).length * 2;
      memoryUsage += 32; // Overhead for timestamp, ttl, etc.
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: Math.round(memoryUsage / 1024) // Convert to KB
    };
  }

  /**
   * Clean up expired entries
   */
  static cleanupExpiredEntries(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Preload partner dashboard data
   */
  static async preloadPartnerDashboard(
    partnerId: string,
    dataFetchers: {
      fetchProfile: () => Promise<PartnerProfile>;
      fetchStats: () => Promise<PartnerDashboardStats>;
      fetchProperties: () => Promise<PartnerPropertyView[]>;
      fetchReservations: () => Promise<PartnerReservationSummary[]>;
    }
  ): Promise<void> {
    try {
      // Fetch all data in parallel
      const [profile, stats, properties, reservations] = await Promise.all([
        dataFetchers.fetchProfile(),
        dataFetchers.fetchStats(),
        dataFetchers.fetchProperties(),
        dataFetchers.fetchReservations()
      ]);

      // Cache all the data
      this.cachePartnerProfile(partnerId, profile);
      this.cacheDashboardStats(partnerId, stats);
      this.cachePropertiesList(partnerId, properties);
      this.cacheReservationsList(partnerId, reservations);

    } catch (error) {
      console.error('[PARTNER CACHE] Preload failed:', error);
    }
  }

  /**
   * Warm up cache for multiple partners
   */
  static async warmUpCache(
    partnerIds: string[],
    dataFetcher: (partnerId: string) => Promise<{
      profile: PartnerProfile;
      stats: PartnerDashboardStats;
    }>
  ): Promise<void> {
    const promises = partnerIds.map(async (partnerId) => {
      try {
        const data = await dataFetcher(partnerId);
        this.cachePartnerProfile(partnerId, data.profile);
        this.cacheDashboardStats(partnerId, data.stats);
      } catch (error) {
        console.error(`[PARTNER CACHE] Warm up failed for partner ${partnerId}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get cache entry details for debugging
   */
  static getCacheEntry(key: string): CacheEntry<any> | null {
    return this.cache.get(key) || null;
  }

  /**
   * List all cache keys (for debugging)
   */
  static getCacheKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entries by pattern
   */
  static getCacheEntriesByPattern(pattern: string): Array<{ key: string; entry: CacheEntry<any> }> {
    const entries: Array<{ key: string; entry: CacheEntry<any> }> = [];
    
    for (const [key, entry] of this.cache) {
      if (key.includes(pattern)) {
        entries.push({ key, entry });
      }
    }

    return entries;
  }
}

// Utility functions for common caching patterns

/**
 * Cache-first data fetcher
 */
export async function getCachedOrFetch<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number,
  cacheService: typeof PartnerCacheService = PartnerCacheService
): Promise<T> {
  // Try to get from cache first
  const cached = cacheService['get']<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache the result
  cacheService['set'](cacheKey, data, ttl);
  
  return data;
}

/**
 * Background refresh pattern
 */
export async function getCachedWithBackgroundRefresh<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number,
  refreshThreshold: number = 0.8 // Refresh when 80% of TTL has passed
): Promise<T> {
  const entry = PartnerCacheService['cache'].get(cacheKey);
  
  if (entry) {
    const age = Date.now() - entry.timestamp;
    const shouldRefresh = age > (entry.ttl * refreshThreshold);
    
    if (shouldRefresh) {
      // Return cached data immediately, refresh in background
      fetcher().then(freshData => {
        PartnerCacheService['set'](cacheKey, freshData, ttl);
      }).catch(error => {
        console.error('[PARTNER CACHE] Background refresh failed:', error);
      });
    }
    
    return entry.data;
  }

  // No cached data, fetch synchronously
  const data = await fetcher();
  PartnerCacheService['set'](cacheKey, data, ttl);
  return data;
}

/**
 * Batch cache operations
 */
export class PartnerCacheBatch {
  private operations: Array<() => void> = [];

  add<T>(key: string, data: T, ttl: number): this {
    this.operations.push(() => {
      PartnerCacheService['set'](key, data, ttl);
    });
    return this;
  }

  execute(): void {
    this.operations.forEach(op => op());
    this.operations = [];
  }
}

// Auto cleanup service
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup(intervalMs: number = 5 * 60 * 1000): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  cleanupInterval = setInterval(() => {
    const cleaned = PartnerCacheService.cleanupExpiredEntries();
    if (cleaned > 0) {
      console.log(`[PARTNER CACHE] Cleaned up ${cleaned} expired entries`);
    }
  }, intervalMs);
}

export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}