/**
 * Integration Tests for Reservation Data Consistency
 * Tests the complete reservation system with data consistency checks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@/lib/supabase/client';
import { loftCacheService } from '@/lib/services/loft-cache-service';
import { systemHealthMonitor } from '@/lib/services/system-health-monitor';
import { reservationPerformanceMonitor } from '@/lib/services/reservation-performance-monitor';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { id: 'test-loft-1', name: 'Test Loft', price_per_night: 150 },
          error: null
        })),
        limit: vi.fn(() => Promise.resolve({
          data: [{ id: 'test-loft-1', name: 'Test Loft' }],
          error: null
        }))
      })),
      limit: vi.fn(() => Promise.resolve({
        data: [{ id: 'test-loft-1', name: 'Test Loft' }],
        error: null
      })),
      gte: vi.fn(() => ({
        lte: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    })),
    insert: vi.fn(() => Promise.resolve({
      data: { id: 'new-reservation-1', status: 'pending' },
      error: null
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({
        data: { id: 'reservation-1', status: 'confirmed' },
        error: null
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({
        data: null,
        error: null
      }))
    }))
  })),
  rpc: vi.fn(() => Promise.resolve({
    data: true,
    error: null
  }))
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('Reservation Data Consistency Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loftCacheService.invalidateAllCache();
    reservationPerformanceMonitor.clearMetrics();
  });

  afterEach(() => {
    systemHealthMonitor.stopMonitoring();
  });

  describe('Loft Data Consistency', () => {
    it('should maintain consistency between cache and database', async () => {
      const loftId = 'consistency-test-loft';
      const mockLoftData = {
        id: loftId,
        name: 'Consistency Test Loft',
        price_per_night: 200,
        max_guests: 4,
        status: 'available'
      };

      // Mock database response
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockLoftData,
        error: null
      });

      // First fetch - should hit database
      const fetchFromDb = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from('lofts')
          .select('*')
          .eq('id', loftId)
          .single();
        return data;
      };

      const result1 = await loftCacheService.cacheLoftDetails(loftId, fetchFromDb);
      expect(result1).toEqual(mockLoftData);

      // Second fetch - should hit cache
      const result2 = await loftCacheService.cacheLoftDetails(loftId, fetchFromDb);
      expect(result2).toEqual(mockLoftData);

      // Verify cache metrics
      const cacheStats = loftCacheService.getCacheStats();
      expect(cacheStats.metrics.totalRequests).toBeGreaterThan(0);
    });

    it('should invalidate cache when loft data changes', async () => {
      const loftId = 'update-test-loft';
      const originalData = {
        id: loftId,
        name: 'Original Loft',
        price_per_night: 150
      };
      const updatedData = {
        id: loftId,
        name: 'Updated Loft',
        price_per_night: 180
      };

      // Mock initial fetch
      const fetchFn = vi.fn()
        .mockResolvedValueOnce(originalData)
        .mockResolvedValueOnce(updatedData);

      // First fetch
      const result1 = await loftCacheService.cacheLoftDetails(loftId, fetchFn);
      expect(result1).toEqual(originalData);

      // Simulate data update and cache invalidation
      loftCacheService.invalidateLoftCache(loftId);

      // Second fetch should get updated data
      const result2 = await loftCacheService.cacheLoftDetails(loftId, fetchFn);
      expect(result2).toEqual(updatedData);

      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Reservation Flow Integration', () => {
    it('should handle complete reservation flow with monitoring', async () => {
      const loftId = 'reservation-flow-loft';
      const checkIn = '2024-02-01';
      const checkOut = '2024-02-05';
      const guests = 2;

      // Step 1: Check availability
      const availabilityResult = await reservationPerformanceMonitor.measureAvailabilityCheck(
        loftId,
        checkIn,
        checkOut,
        async () => {
          const supabase = createClient();
          const { data } = await supabase.rpc('check_loft_availability', {
            p_loft_id: loftId,
            p_check_in: checkIn,
            p_check_out: checkOut
          });
          return data;
        }
      );

      expect(availabilityResult).toBe(true);

      // Step 2: Calculate pricing
      const pricingResult = await reservationPerformanceMonitor.measurePricingCalculation(
        loftId,
        guests,
        `${checkIn}_${checkOut}`,
        async () => {
          return {
            basePrice: 600, // 4 nights * 150
            cleaningFee: 50,
            serviceFee: 32.5,
            taxes: 129.78,
            total: 812.28
          };
        }
      );

      expect(pricingResult).toHaveProperty('total');
      expect(pricingResult.total).toBeGreaterThan(0);

      // Step 3: Create reservation
      const reservationResult = await reservationPerformanceMonitor.measureReservationCreation(
        loftId,
        async () => {
          const supabase = createClient();
          const { data } = await supabase
            .from('reservations')
            .insert({
              loft_id: loftId,
              check_in_date: checkIn,
              check_out_date: checkOut,
              guest_count: guests,
              total_amount: pricingResult.total,
              status: 'pending'
            });
          return data;
        },
        { guestCount: guests }
      );

      expect(reservationResult).toHaveProperty('id');

      // Verify performance metrics were recorded
      const performanceReport = reservationPerformanceMonitor.getPerformanceReport();
      expect(performanceReport.totalOperations).toBeGreaterThan(0);
      expect(performanceReport.operationBreakdown).toHaveProperty('availability_check');
      expect(performanceReport.operationBreakdown).toHaveProperty('pricing_calculation');
      expect(performanceReport.operationBreakdown).toHaveProperty('reservation_creation');
    });

    it('should handle reservation conflicts correctly', async () => {
      const loftId = 'conflict-test-loft';
      const checkIn = '2024-03-01';
      const checkOut = '2024-03-05';

      // Mock conflicting reservation exists
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: false, // Not available
        error: null
      });

      const availabilityResult = await reservationPerformanceMonitor.measureAvailabilityCheck(
        loftId,
        checkIn,
        checkOut,
        async () => {
          const supabase = createClient();
          const { data } = await supabase.rpc('check_loft_availability', {
            p_loft_id: loftId,
            p_check_in: checkIn,
            p_check_out: checkOut
          });
          return data;
        }
      );

      expect(availabilityResult).toBe(false);

      // Should not proceed with reservation creation
      const performanceReport = reservationPerformanceMonitor.getPerformanceReport();
      expect(performanceReport.operationBreakdown).toHaveProperty('availability_check');
      expect(performanceReport.operationBreakdown).not.toHaveProperty('reservation_creation');
    });
  });

  describe('System Health Integration', () => {
    it('should perform comprehensive health check', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();

      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('components');
      expect(healthStatus).toHaveProperty('metrics');

      // Verify all components are checked
      expect(healthStatus.components).toHaveProperty('database');
      expect(healthStatus.components).toHaveProperty('cache');
      expect(healthStatus.components).toHaveProperty('reservationSystem');
      expect(healthStatus.components).toHaveProperty('dataConsistency');

      // Each component should have required properties
      Object.values(healthStatus.components).forEach(component => {
        expect(component).toHaveProperty('status');
        expect(component).toHaveProperty('lastCheck');
        expect(component).toHaveProperty('errorCount');
        expect(component).toHaveProperty('details');
      });
    });

    it('should detect and alert on performance issues', async () => {
      // Simulate slow operation
      const slowOperation = async () => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ slow: true }), 3000); // 3 seconds - exceeds threshold
        });
      };

      await reservationPerformanceMonitor.measureLoftSearch(slowOperation);

      const performanceReport = reservationPerformanceMonitor.getPerformanceReport();
      expect(performanceReport.recommendations.length).toBeGreaterThan(0);
      expect(performanceReport.recommendations.some(r => 
        r.includes('loft_search') || r.includes('Optimize')
      )).toBe(true);
    });

    it('should maintain system metrics over time', async () => {
      // Perform multiple operations
      const operations = [
        () => reservationPerformanceMonitor.measureLoftSearch(async () => []),
        () => reservationPerformanceMonitor.measureLoftDetails('test-1', async () => ({})),
        () => reservationPerformanceMonitor.measureAvailabilityCheck('test-1', '2024-01-01', '2024-01-02', async () => true),
        () => reservationPerformanceMonitor.measurePricingCalculation('test-1', 2, '2024-01-01_2024-01-02', async () => ({ total: 100 }))
      ];

      for (const operation of operations) {
        await operation();
      }

      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus.metrics.responseTime).toBeGreaterThan(0);
      expect(healthStatus.metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(healthStatus.uptime).toBeGreaterThan(0);
    });
  });

  describe('Cache Performance Integration', () => {
    it('should optimize cache performance for frequent queries', async () => {
      const popularLoftId = 'popular-loft';
      const mockLoftData = {
        id: popularLoftId,
        name: 'Popular Loft',
        price_per_night: 200
      };

      const fetchFn = vi.fn().mockResolvedValue(mockLoftData);

      // Simulate multiple requests for the same loft
      const requests = Array(10).fill(null).map(() => 
        loftCacheService.cacheLoftDetails(popularLoftId, fetchFn)
      );

      const results = await Promise.all(requests);

      // All requests should return the same data
      results.forEach(result => {
        expect(result).toEqual(mockLoftData);
      });

      // Should only hit the database once due to caching
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Cache metrics should show high hit rate
      const cacheStats = loftCacheService.getCacheStats();
      expect(cacheStats.metrics.hitRate).toBeGreaterThan(80);
    });

    it('should handle cache warm-up effectively', async () => {
      const loftIds = ['warm-1', 'warm-2', 'warm-3', 'warm-4', 'warm-5'];

      await loftCacheService.warmUpCache(loftIds);

      // Verify cache has been populated
      const cacheStats = loftCacheService.getCacheStats();
      expect(cacheStats.metrics.totalRequests).toBeGreaterThan(0);
    });
  });

  describe('Database Query Optimization', () => {
    it('should execute optimized queries for availability checks', async () => {
      const loftId = 'query-optimization-loft';
      const checkIn = '2024-04-01';
      const checkOut = '2024-04-05';

      const queryResult = await reservationPerformanceMonitor.measureDatabaseQuery(
        'availability_check',
        async () => {
          const supabase = createClient();
          const { data } = await supabase.rpc('check_loft_availability', {
            p_loft_id: loftId,
            p_check_in: checkIn,
            p_check_out: checkOut
          });
          return data;
        },
        { table: 'reservations', operation: 'availability_check' }
      );

      expect(queryResult).toBeDefined();

      const performanceReport = reservationPerformanceMonitor.getPerformanceReport();
      const dbOperations = performanceReport.operationBreakdown.database_query;
      
      if (dbOperations) {
        expect(dbOperations.averageTime).toBeLessThan(2000); // Should be under 2 seconds
      }
    });

    it('should handle complex reservation queries efficiently', async () => {
      const complexQuery = async () => {
        const supabase = createClient();
        
        // Simulate complex query with joins and filters
        const { data } = await supabase
          .from('reservations')
          .select(`
            *,
            lofts:loft_id (
              name,
              price_per_night,
              max_guests
            )
          `)
          .gte('check_in_date', '2024-01-01')
          .lte('check_out_date', '2024-12-31')
          .limit(50);
        
        return data;
      };

      const result = await reservationPerformanceMonitor.measureDatabaseQuery(
        'complex_reservation_query',
        complexQuery,
        { table: 'reservations', operation: 'SELECT_WITH_JOINS' }
      );

      expect(Array.isArray(result)).toBe(true);

      const performanceReport = reservationPerformanceMonitor.getPerformanceReport();
      expect(performanceReport.operationBreakdown).toHaveProperty('database_query');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().select().eq().single.mockRejectedValueOnce(
        new Error('Connection timeout')
      );

      const loftId = 'error-test-loft';
      const fetchFn = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('lofts')
          .select('*')
          .eq('id', loftId)
          .single();
        
        if (error) throw error;
        return data;
      };

      await expect(
        loftCacheService.cacheLoftDetails(loftId, fetchFn)
      ).rejects.toThrow('Connection timeout');

      // Health check should detect the issue
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      expect(healthStatus.components.database.errorCount).toBeGreaterThan(0);
    });

    it('should recover from cache failures', async () => {
      const loftId = 'cache-failure-loft';
      const mockData = { id: loftId, name: 'Test Loft' };
      
      // First call succeeds
      const fetchFn = vi.fn().mockResolvedValue(mockData);
      const result1 = await loftCacheService.cacheLoftDetails(loftId, fetchFn);
      expect(result1).toEqual(mockData);

      // Simulate cache failure by clearing cache
      loftCacheService.invalidateAllCache();

      // Second call should still work by fetching from source
      const result2 = await loftCacheService.cacheLoftDetails(loftId, fetchFn);
      expect(result2).toEqual(mockData);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track end-to-end reservation performance', async () => {
      const startTime = Date.now();

      // Simulate complete reservation flow
      await reservationPerformanceMonitor.measureLoftSearch(async () => [
        { id: 'loft-1', name: 'Loft 1' },
        { id: 'loft-2', name: 'Loft 2' }
      ]);

      await reservationPerformanceMonitor.measureLoftDetails('loft-1', async () => ({
        id: 'loft-1',
        name: 'Selected Loft',
        price_per_night: 150
      }));

      await reservationPerformanceMonitor.measureAvailabilityCheck(
        'loft-1',
        '2024-05-01',
        '2024-05-05',
        async () => true
      );

      await reservationPerformanceMonitor.measurePricingCalculation(
        'loft-1',
        2,
        '2024-05-01_2024-05-05',
        async () => ({ total: 600 })
      );

      await reservationPerformanceMonitor.measureReservationCreation(
        'loft-1',
        async () => ({ id: 'reservation-123', status: 'confirmed' })
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const performanceReport = reservationPerformanceMonitor.getPerformanceReport();
      
      expect(performanceReport.totalOperations).toBe(5);
      expect(performanceReport.successRate).toBe(100);
      expect(performanceReport.averageResponseTime).toBeLessThan(totalTime);
      
      // Verify all operations are tracked
      expect(performanceReport.operationBreakdown).toHaveProperty('loft_search');
      expect(performanceReport.operationBreakdown).toHaveProperty('loft_details');
      expect(performanceReport.operationBreakdown).toHaveProperty('availability_check');
      expect(performanceReport.operationBreakdown).toHaveProperty('pricing_calculation');
      expect(performanceReport.operationBreakdown).toHaveProperty('reservation_creation');
    });

    it('should provide actionable performance recommendations', async () => {
      // Generate various performance scenarios
      const scenarios = [
        { operation: 'loft_search', delay: 1500 }, // Slow search
        { operation: 'availability_check', delay: 1000 }, // Slow availability
        { operation: 'pricing_calculation', delay: 500 }, // Acceptable pricing
        { operation: 'reservation_creation', delay: 2500 } // Very slow creation
      ];

      for (const scenario of scenarios) {
        const slowFn = () => new Promise(resolve => 
          setTimeout(() => resolve({ test: true }), scenario.delay)
        );

        switch (scenario.operation) {
          case 'loft_search':
            await reservationPerformanceMonitor.measureLoftSearch(slowFn);
            break;
          case 'availability_check':
            await reservationPerformanceMonitor.measureAvailabilityCheck('test', '2024-01-01', '2024-01-02', slowFn);
            break;
          case 'pricing_calculation':
            await reservationPerformanceMonitor.measurePricingCalculation('test', 2, '2024-01-01_2024-01-02', slowFn);
            break;
          case 'reservation_creation':
            await reservationPerformanceMonitor.measureReservationCreation('test', slowFn);
            break;
        }
      }

      const performanceReport = reservationPerformanceMonitor.getPerformanceReport();
      
      expect(performanceReport.recommendations.length).toBeGreaterThan(0);
      
      // Should recommend optimizing slow operations
      const hasSearchOptimization = performanceReport.recommendations.some(r => 
        r.includes('loft_search') || r.includes('search')
      );
      const hasReservationOptimization = performanceReport.recommendations.some(r => 
        r.includes('reservation_creation') || r.includes('creation')
      );
      
      expect(hasSearchOptimization || hasReservationOptimization).toBe(true);
    });
  });
});