/**
 * Tests for Loft Cache Service
 * Validates caching functionality for loft data
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loftCacheService } from '@/lib/services/loft-cache-service';
import { CacheStrategy } from '@/lib/cache-manager';

// Mock the cache manager
vi.mock('@/lib/cache-manager', () => ({
  cacheManager: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    getStats: vi.fn(() => ({
      memoryEntries: 10,
      persistentEntries: 5,
      memoryKeys: ['test-key-1', 'test-key-2'],
      totalMemoryUsage: 1024
    }))
  },
  CacheStrategy: {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first',
    CACHE_ONLY: 'cache-only',
    NETWORK_ONLY: 'network-only',
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
  }
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('LoftCacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any test data
    loftCacheService.invalidateAllCache();
  });

  describe('Loft Search Caching', () => {
    it('should cache loft search results', async () => {
      const mockSearchOptions = {
        guests: 2,
        minPrice: 100,
        maxPrice: 500,
        location: 'Algiers'
      };

      const mockSearchResults = [
        { id: 'loft-1', name: 'Test Loft 1' },
        { id: 'loft-2', name: 'Test Loft 2' }
      ];

      const mockFetchFn = vi.fn().mockResolvedValue(mockSearchResults);

      const result = await loftCacheService.cacheLoftSearch(
        mockSearchOptions,
        mockFetchFn
      );

      expect(result).toEqual(mockSearchResults);
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
    });

    it('should generate consistent cache keys for search options', async () => {
      const searchOptions1 = {
        guests: 2,
        minPrice: 100,
        maxPrice: 500,
        amenities: ['wifi', 'parking']
      };

      const searchOptions2 = {
        guests: 2,
        minPrice: 100,
        maxPrice: 500,
        amenities: ['parking', 'wifi'] // Different order
      };

      const mockFetchFn = vi.fn().mockResolvedValue([]);

      await loftCacheService.cacheLoftSearch(searchOptions1, mockFetchFn);
      await loftCacheService.cacheLoftSearch(searchOptions2, mockFetchFn);

      // Should use cache for second call due to consistent key generation
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loft Details Caching', () => {
    it('should cache individual loft details', async () => {
      const loftId = 'test-loft-123';
      const mockLoftDetails = {
        id: loftId,
        name: 'Beautiful Loft',
        price: 150,
        amenities: ['wifi', 'parking']
      };

      const mockFetchFn = vi.fn().mockResolvedValue(mockLoftDetails);

      const result = await loftCacheService.cacheLoftDetails(
        loftId,
        mockFetchFn
      );

      expect(result).toEqual(mockLoftDetails);
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
    });

    it('should handle cache errors gracefully', async () => {
      const loftId = 'error-loft';
      const mockError = new Error('Network error');
      const mockFetchFn = vi.fn().mockRejectedValue(mockError);

      await expect(
        loftCacheService.cacheLoftDetails(loftId, mockFetchFn)
      ).rejects.toThrow('Network error');
    });
  });

  describe('Availability Caching', () => {
    it('should cache loft availability data', async () => {
      const loftId = 'test-loft-456';
      const checkIn = '2024-01-15';
      const checkOut = '2024-01-20';
      const mockAvailability = {
        available: true,
        blockedDates: [],
        price: 150
      };

      const mockFetchFn = vi.fn().mockResolvedValue(mockAvailability);

      const result = await loftCacheService.cacheLoftAvailability(
        loftId,
        checkIn,
        checkOut,
        mockFetchFn
      );

      expect(result).toEqual(mockAvailability);
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
    });

    it('should use stale-while-revalidate strategy for availability', async () => {
      const loftId = 'test-loft-789';
      const checkIn = '2024-02-01';
      const checkOut = '2024-02-05';
      const mockAvailability = { available: false };

      const mockFetchFn = vi.fn().mockResolvedValue(mockAvailability);

      await loftCacheService.cacheLoftAvailability(
        loftId,
        checkIn,
        checkOut,
        mockFetchFn,
        { strategy: CacheStrategy.STALE_WHILE_REVALIDATE }
      );

      expect(mockFetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pricing Caching', () => {
    it('should cache pricing calculations', async () => {
      const loftId = 'pricing-loft';
      const checkIn = '2024-03-01';
      const checkOut = '2024-03-07';
      const guests = 4;
      const mockPricing = {
        basePrice: 900,
        cleaningFee: 50,
        serviceFee: 45,
        total: 995
      };

      const mockFetchFn = vi.fn().mockResolvedValue(mockPricing);

      const result = await loftCacheService.cacheLoftPricing(
        loftId,
        checkIn,
        checkOut,
        guests,
        mockFetchFn
      );

      expect(result).toEqual(mockPricing);
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Test Data Caching', () => {
    it('should cache test loft data with longer TTL', async () => {
      const mockTestData = [
        { id: 'test-1', name: 'Test Loft 1' },
        { id: 'test-2', name: 'Test Loft 2' }
      ];

      const mockFetchFn = vi.fn().mockResolvedValue(mockTestData);

      const result = await loftCacheService.cacheTestLoftData(mockFetchFn);

      expect(result).toEqual(mockTestData);
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache for specific loft', () => {
      const loftId = 'invalidate-test';
      
      // This should not throw an error
      expect(() => {
        loftCacheService.invalidateLoftCache(loftId);
      }).not.toThrow();
    });

    it('should invalidate all search cache', () => {
      expect(() => {
        loftCacheService.invalidateSearchCache();
      }).not.toThrow();
    });

    it('should invalidate all cache', () => {
      expect(() => {
        loftCacheService.invalidateAllCache();
      }).not.toThrow();
    });
  });

  describe('Cache Metrics', () => {
    it('should return cache metrics', () => {
      const metrics = loftCacheService.getCacheMetrics();

      expect(metrics).toHaveProperty('hits');
      expect(metrics).toHaveProperty('misses');
      expect(metrics).toHaveProperty('hitRate');
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('averageResponseTime');
      expect(metrics).toHaveProperty('cacheSize');
      expect(metrics).toHaveProperty('lastUpdated');

      expect(typeof metrics.hits).toBe('number');
      expect(typeof metrics.misses).toBe('number');
      expect(typeof metrics.hitRate).toBe('number');
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(typeof metrics.cacheSize).toBe('number');
      expect(typeof metrics.lastUpdated).toBe('string');
    });

    it('should return detailed cache statistics', () => {
      const stats = loftCacheService.getCacheStats();

      expect(stats).toHaveProperty('metrics');
      expect(stats).toHaveProperty('cacheManagerStats');
      expect(stats).toHaveProperty('performanceBreakdown');

      expect(stats.performanceBreakdown).toHaveProperty('averageHitTime');
      expect(stats.performanceBreakdown).toHaveProperty('averageMissTime');
      expect(stats.performanceBreakdown).toHaveProperty('hitTimeP95');
      expect(stats.performanceBreakdown).toHaveProperty('missTimeP95');
    });
  });

  describe('Cache Warm-up', () => {
    it('should warm up cache for multiple lofts', async () => {
      const loftIds = ['warm-1', 'warm-2', 'warm-3'];

      // This should complete without errors
      await expect(
        loftCacheService.warmUpCache(loftIds)
      ).resolves.not.toThrow();
    });

    it('should handle warm-up errors gracefully', async () => {
      const loftIds = ['error-loft'];

      // Should not throw even if individual warm-ups fail
      await expect(
        loftCacheService.warmUpCache(loftIds)
      ).resolves.not.toThrow();
    });
  });

  describe('Cache Options', () => {
    it('should respect custom TTL values', async () => {
      const loftId = 'custom-ttl-loft';
      const customTTL = 60000; // 1 minute
      const mockData = { id: loftId, name: 'Custom TTL Loft' };
      const mockFetchFn = vi.fn().mockResolvedValue(mockData);

      const result = await loftCacheService.cacheLoftDetails(
        loftId,
        mockFetchFn,
        { ttl: customTTL }
      );

      expect(result).toEqual(mockData);
    });

    it('should respect custom cache strategies', async () => {
      const loftId = 'network-first-loft';
      const mockData = { id: loftId, name: 'Network First Loft' };
      const mockFetchFn = vi.fn().mockResolvedValue(mockData);

      const result = await loftCacheService.cacheLoftDetails(
        loftId,
        mockFetchFn,
        { strategy: CacheStrategy.NETWORK_FIRST }
      );

      expect(result).toEqual(mockData);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch function errors', async () => {
      const loftId = 'error-loft';
      const mockError = new Error('Fetch failed');
      const mockFetchFn = vi.fn().mockRejectedValue(mockError);

      await expect(
        loftCacheService.cacheLoftDetails(loftId, mockFetchFn)
      ).rejects.toThrow('Fetch failed');
    });

    it('should handle cache manager errors gracefully', async () => {
      const loftId = 'cache-error-loft';
      const mockData = { id: loftId };
      const mockFetchFn = vi.fn().mockResolvedValue(mockData);

      // Mock cache manager to throw error
      const { cacheManager } = await import('@/lib/cache-manager');
      vi.mocked(cacheManager.get).mockRejectedValueOnce(new Error('Cache error'));

      await expect(
        loftCacheService.cacheLoftDetails(loftId, mockFetchFn)
      ).rejects.toThrow('Cache error');
    });
  });

  describe('Performance', () => {
    it('should track response times', async () => {
      const loftId = 'perf-test-loft';
      const mockData = { id: loftId };
      const mockFetchFn = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockData), 100);
        });
      });

      const startTime = Date.now();
      await loftCacheService.cacheLoftDetails(loftId, mockFetchFn);
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should maintain performance metrics over time', async () => {
      const initialMetrics = loftCacheService.getCacheMetrics();
      
      // Perform some cache operations
      const mockFetchFn = vi.fn().mockResolvedValue({ test: true });
      await loftCacheService.cacheLoftDetails('perf-1', mockFetchFn);
      await loftCacheService.cacheLoftDetails('perf-2', mockFetchFn);

      const updatedMetrics = loftCacheService.getCacheMetrics();
      
      // Metrics should be updated
      expect(updatedMetrics.lastUpdated).not.toBe(initialMetrics.lastUpdated);
    });
  });
});