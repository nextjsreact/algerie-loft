/**
 * Tests for Reservation Performance Monitor
 * Validates performance tracking for reservation operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { reservationPerformanceMonitor } from '@/lib/services/reservation-performance-monitor';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('ReservationPerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reservationPerformanceMonitor.clearMetrics();
  });

  afterEach(() => {
    reservationPerformanceMonitor.clearMetrics();
  });

  describe('Performance Timing', () => {
    it('should start and end timing correctly', () => {
      const operation = 'test_operation';
      const context = { testId: '123' };

      const timerId = reservationPerformanceMonitor.startTiming(operation, context);
      
      expect(timerId).toBeDefined();
      expect(typeof timerId).toBe('string');
      expect(timerId).toContain(operation);
    });

    it('should calculate duration correctly', async () => {
      const operation = 'duration_test';
      const timerId = reservationPerformanceMonitor.startTiming(operation);
      
      // Wait a small amount of time
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const duration = reservationPerformanceMonitor.endTiming(timerId, operation, true);
      
      expect(duration).toBeGreaterThanOrEqual(50);
      expect(typeof duration).toBe('number');
    });

    it('should handle missing timer gracefully', () => {
      const invalidTimerId = 'invalid_timer_id';
      const duration = reservationPerformanceMonitor.endTiming(invalidTimerId, 'test_op', true);
      
      expect(duration).toBe(0);
    });
  });

  describe('Operation Measurement', () => {
    it('should measure loft search performance', async () => {
      const mockSearchResults = [
        { id: 'loft-1', name: 'Test Loft 1' },
        { id: 'loft-2', name: 'Test Loft 2' }
      ];

      const mockSearchFn = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockSearchResults), 100);
        });
      });

      const context = {
        searchOptions: { guests: 2, location: 'Algiers' },
        userId: 'user-123'
      };

      const result = await reservationPerformanceMonitor.measureLoftSearch(
        mockSearchFn,
        context
      );

      expect(result).toEqual(mockSearchResults);
      expect(mockSearchFn).toHaveBeenCalledTimes(1);
    });

    it('should measure loft details fetch performance', async () => {
      const loftId = 'test-loft-456';
      const mockLoftDetails = {
        id: loftId,
        name: 'Beautiful Loft',
        price: 150
      };

      const mockFetchFn = vi.fn().mockResolvedValue(mockLoftDetails);

      const result = await reservationPerformanceMonitor.measureLoftDetails(
        loftId,
        mockFetchFn,
        { userId: 'user-789' }
      );

      expect(result).toEqual(mockLoftDetails);
      expect(mockFetchFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Reports', () => {
    it('should generate empty report when no metrics', () => {
      const report = reservationPerformanceMonitor.getPerformanceReport();

      expect(report).toHaveProperty('timeRange');
      expect(report).toHaveProperty('totalOperations');
      expect(report).toHaveProperty('successRate');
      expect(report).toHaveProperty('averageResponseTime');
      expect(report).toHaveProperty('operationBreakdown');
      expect(report).toHaveProperty('recommendations');

      expect(report.totalOperations).toBe(0);
      expect(report.successRate).toBe(0);
      expect(report.averageResponseTime).toBe(0);
    });

    it('should generate report with metrics', async () => {
      // Generate some test metrics
      const mockFn = vi.fn().mockResolvedValue({ test: true });
      
      await reservationPerformanceMonitor.measureLoftSearch(mockFn);
      await reservationPerformanceMonitor.measureLoftDetails('test-loft', mockFn);
      
      const report = reservationPerformanceMonitor.getPerformanceReport();

      expect(report.totalOperations).toBeGreaterThan(0);
      expect(report.operationBreakdown).toHaveProperty('loft_search');
      expect(report.operationBreakdown).toHaveProperty('loft_details');
    });
  });

  describe('Real-time Statistics', () => {
    it('should provide real-time stats', () => {
      const stats = reservationPerformanceMonitor.getRealTimeStats();

      expect(stats).toHaveProperty('activeTimers');
      expect(stats).toHaveProperty('recentOperations');
      expect(stats).toHaveProperty('averageResponseTime');
      expect(stats).toHaveProperty('errorRate');
      expect(stats).toHaveProperty('cacheHitRate');

      expect(typeof stats.activeTimers).toBe('number');
      expect(typeof stats.recentOperations).toBe('number');
      expect(typeof stats.averageResponseTime).toBe('number');
      expect(typeof stats.errorRate).toBe('number');
      expect(typeof stats.cacheHitRate).toBe('number');
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should clear all metrics', () => {
      // Add some metrics first
      reservationPerformanceMonitor.recordMetric({
        operation: 'cleanup_test',
        duration: 100,
        timestamp: Date.now(),
        success: true,
        context: {}
      });

      let stats = reservationPerformanceMonitor.getRealTimeStats();
      expect(stats.recentOperations).toBeGreaterThan(0);

      reservationPerformanceMonitor.clearMetrics();

      stats = reservationPerformanceMonitor.getRealTimeStats();
      expect(stats.recentOperations).toBe(0);
      expect(stats.activeTimers).toBe(0);
    });
  });
});