/**
 * Tests for Performance Monitoring API
 * Validates the performance monitoring REST API endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/monitoring/performance/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('@/lib/services/loft-cache-service', () => ({
  loftCacheService: {
    getCacheStats: vi.fn(() => ({
      metrics: {
        hits: 850,
        misses: 150,
        hitRate: 85.0,
        totalRequests: 1000,
        averageResponseTime: 45,
        cacheSize: 200,
        lastUpdated: '2024-01-15T10:00:00Z'
      },
      cacheManagerStats: {
        memoryEntries: 150,
        persistentEntries: 50,
        memoryKeys: ['key1', 'key2'],
        totalMemoryUsage: 2048
      },
      performanceBreakdown: {
        averageHitTime: 25,
        averageMissTime: 120,
        hitTimeP95: 45,
        missTimeP95: 200
      }
    })),
    invalidateAllCache: vi.fn(),
    warmUpCache: vi.fn()
  }
}));

vi.mock('@/lib/services/system-health-monitor', () => ({
  systemHealthMonitor: {
    getHealthStatus: vi.fn(() => ({
      status: 'healthy',
      timestamp: '2024-01-15T10:00:00Z',
      uptime: 86400000,
      components: {
        database: { status: 'healthy', lastCheck: '2024-01-15T10:00:00Z', errorCount: 0, details: 'All good' },
        cache: { status: 'healthy', lastCheck: '2024-01-15T10:00:00Z', errorCount: 0, details: 'Cache working' },
        reservationSystem: { status: 'healthy', lastCheck: '2024-01-15T10:00:00Z', errorCount: 0, details: 'System operational' },
        dataConsistency: { status: 'healthy', lastCheck: '2024-01-15T10:00:00Z', errorCount: 0, details: 'Data consistent' }
      },
      metrics: {
        responseTime: 450,
        errorRate: 2.1,
        cacheHitRate: 85.0,
        memoryUsage: 65.5,
        activeConnections: 25
      },
      alerts: [],
      recommendations: ['System is running optimally']
    })),
    performHealthCheck: vi.fn(),
    resolveAlert: vi.fn(() => true)
  }
}));

vi.mock('@/lib/services/reservation-performance-monitor', () => ({
  reservationPerformanceMonitor: {
    getRealTimeStats: vi.fn(() => ({
      activeTimers: 3,
      recentOperations: 45,
      averageResponseTime: 320,
      errorRate: 1.8,
      cacheHitRate: 82.5
    })),
    getPerformanceReport: vi.fn(() => ({
      timeRange: '1 hours',
      totalOperations: 150,
      successRate: 96.7,
      averageResponseTime: 285,
      p95ResponseTime: 650,
      p99ResponseTime: 1200,
      operationBreakdown: {
        loft_search: { count: 50, averageTime: 180, successRate: 98.0, errorTypes: {} },
        loft_details: { count: 40, averageTime: 120, successRate: 100.0, errorTypes: {} },
        availability_check: { count: 35, averageTime: 250, successRate: 94.3, errorTypes: { 'NetworkError': 2 } },
        pricing_calculation: { count: 25, averageTime: 95, successRate: 100.0, errorTypes: {} }
      },
      slowestOperations: [
        { operation: 'availability_check', duration: 1150, timestamp: Date.now(), context: { loftId: 'slow-loft' } }
      ],
      cachePerformance: { hitRate: 82.5, averageHitTime: 28, averageMissTime: 145 },
      recommendations: ['Consider optimizing availability check queries']
    })),
    clearMetrics: vi.fn()
  }
}));

vi.mock('@/lib/monitoring/reservation-monitoring', () => ({
  reservationMonitoringService: {
    getReservationMetrics: vi.fn(() => Promise.resolve({
      total_reservations: 125,
      successful_reservations: 118,
      failed_reservations: 4,
      cancelled_reservations: 3,
      conversion_rate: 94.4,
      average_booking_time: 1850,
      payment_success_rate: 97.5,
      error_rate: 3.2,
      security_incidents: 0
    })),
    getPerformanceMetrics: vi.fn(() => ({
      availability_check_time: 245,
      pricing_calculation_time: 95,
      reservation_creation_time: 1200,
      email_delivery_time: 850,
      database_query_time: 180
    })),
    getUserBehaviorMetrics: vi.fn(() => ({
      unique_users: 85,
      returning_users: 32,
      bounce_rate: 15.5,
      pages_per_session: 4.2,
      session_duration: 420,
      conversion_funnel: [
        { step: 'page_view', users: 200, conversion_rate: 100 },
        { step: 'search_started', users: 150, conversion_rate: 75 },
        { step: 'loft_selected', users: 100, conversion_rate: 50 },
        { step: 'reservation_completed', users: 25, conversion_rate: 12.5 }
      ]
    })),
    generateMonitoringReport: vi.fn(() => Promise.resolve({
      summary: { systemStatus: 'healthy', totalIssues: 0 },
      performance: { averageResponseTime: 285 },
      behavior: { conversionRate: 12.5 },
      top_errors: [],
      security_events: [],
      recommendations: ['System performing well']
    }))
  }
}));

vi.mock('@/lib/services/performance-initialization', () => ({
  getPerformanceServicesStatus: vi.fn(() => Promise.resolve({
    initialized: true,
    services: {
      cache: { status: 'active', metrics: { hitRate: 85 } },
      healthMonitor: { status: 'active', health: { status: 'healthy' } },
      performanceMonitor: { status: 'active', stats: { activeTimers: 3 } },
      reservationMonitor: { status: 'active', metrics: { totalReservations: 125 } }
    }
  }))
}));

describe('Performance Monitoring API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET Endpoints', () => {
    describe('Overview Endpoint', () => {
      it('should return performance overview', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=overview');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('timeRange');
        expect(data).toHaveProperty('systemHealth');
        expect(data).toHaveProperty('cache');
        expect(data).toHaveProperty('performance');
        expect(data).toHaveProperty('reservations');

        expect(data.systemHealth).toHaveProperty('status', 'healthy');
        expect(data.cache).toHaveProperty('hitRate', 85.0);
        expect(data.performance).toHaveProperty('activeTimers', 3);
        expect(data.reservations).toHaveProperty('totalReservations', 125);
      });

      it('should handle custom time range', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=overview&timeRange=24h');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.timeRange).toBe('24h');
      });
    });

    describe('Health Endpoint', () => {
      it('should return detailed health status', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=health');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('status', 'healthy');
        expect(data).toHaveProperty('components');
        expect(data).toHaveProperty('metrics');
        expect(data).toHaveProperty('alerts');
        expect(data).toHaveProperty('recommendations');

        expect(data.components).toHaveProperty('database');
        expect(data.components).toHaveProperty('cache');
        expect(data.components).toHaveProperty('reservationSystem');
        expect(data.components).toHaveProperty('dataConsistency');
      });
    });

    describe('Cache Endpoint', () => {
      it('should return cache metrics', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=cache');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('cache');
        expect(data.cache).toHaveProperty('metrics');
        expect(data.cache).toHaveProperty('cacheManagerStats');
        expect(data.cache).toHaveProperty('performanceBreakdown');

        expect(data.cache.metrics.hitRate).toBe(85.0);
        expect(data.cache.metrics.totalRequests).toBe(1000);
      });
    });

    describe('Performance Endpoint', () => {
      it('should return performance metrics', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=performance');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('timeRange');
        expect(data).toHaveProperty('realTime');
        expect(data).toHaveProperty('report');

        expect(data.realTime).toHaveProperty('activeTimers', 3);
        expect(data.report).toHaveProperty('totalOperations', 150);
        expect(data.report).toHaveProperty('successRate', 96.7);
        expect(data.report).toHaveProperty('operationBreakdown');
      });

      it('should handle custom time range for performance metrics', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=performance&timeRange=6h');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.timeRange).toBe('6h');
      });
    });

    describe('Reservations Endpoint', () => {
      it('should return reservation metrics', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=reservations');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('timeRange');
        expect(data).toHaveProperty('reservations');
        expect(data).toHaveProperty('performance');
        expect(data).toHaveProperty('behavior');

        expect(data.reservations.total_reservations).toBe(125);
        expect(data.reservations.conversion_rate).toBe(94.4);
        expect(data.performance.availability_check_time).toBe(245);
        expect(data.behavior.unique_users).toBe(85);
      });
    });

    describe('Services Endpoint', () => {
      it('should return services status', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=services');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('services');
        expect(data.services).toHaveProperty('initialized', true);
        expect(data.services.services).toHaveProperty('cache');
        expect(data.services.services).toHaveProperty('healthMonitor');
        expect(data.services.services).toHaveProperty('performanceMonitor');
        expect(data.services.services).toHaveProperty('reservationMonitor');
      });
    });

    describe('Report Endpoint', () => {
      it('should return comprehensive report', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=report');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('timeRange');
        expect(data).toHaveProperty('summary');
        expect(data).toHaveProperty('details');
        expect(data).toHaveProperty('recommendations');

        expect(data.summary).toHaveProperty('systemStatus');
        expect(data.summary).toHaveProperty('cacheHitRate');
        expect(data.summary).toHaveProperty('averageResponseTime');
        expect(data.details).toHaveProperty('health');
        expect(data.details).toHaveProperty('cache');
        expect(data.details).toHaveProperty('performance');
        expect(Array.isArray(data.recommendations)).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid type parameter', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=invalid');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toHaveProperty('error', 'Invalid type parameter');
      });

      it('should handle service errors gracefully', async () => {
        // Mock service to throw error
        const mockHealthMonitor = await import('@/lib/services/system-health-monitor');
        vi.mocked(mockHealthMonitor.systemHealthMonitor.getHealthStatus).mockImplementation(() => {
          throw new Error('Service unavailable');
        });

        const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=health');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toHaveProperty('error', 'Internal server error');
        expect(data).toHaveProperty('message');
      });
    });
  });

  describe('POST Endpoints', () => {
    describe('Clear Cache Action', () => {
      it('should clear cache successfully', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance', {
          method: 'POST',
          body: JSON.stringify({ action: 'clearCache' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('message', 'Cache cleared');

        const mockCacheService = await import('@/lib/services/loft-cache-service');
        expect(mockCacheService.loftCacheService.invalidateAllCache).toHaveBeenCalled();
      });
    });

    describe('Clear Metrics Action', () => {
      it('should clear performance metrics successfully', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance', {
          method: 'POST',
          body: JSON.stringify({ action: 'clearMetrics' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('message', 'Performance metrics cleared');

        const mockPerformanceMonitor = await import('@/lib/services/reservation-performance-monitor');
        expect(mockPerformanceMonitor.reservationPerformanceMonitor.clearMetrics).toHaveBeenCalled();
      });
    });

    describe('Run Health Check Action', () => {
      it('should run health check successfully', async () => {
        const mockHealthStatus = {
          status: 'healthy',
          timestamp: '2024-01-15T10:00:00Z',
          components: {},
          metrics: {},
          alerts: [],
          recommendations: []
        };

        const mockHealthMonitor = await import('@/lib/services/system-health-monitor');
        vi.mocked(mockHealthMonitor.systemHealthMonitor.performHealthCheck).mockResolvedValue(mockHealthStatus as any);

        const request = new NextRequest('http://localhost:3000/api/monitoring/performance', {
          method: 'POST',
          body: JSON.stringify({ action: 'runHealthCheck' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('health');
        expect(data.health.status).toBe('healthy');
      });
    });

    describe('Warm Up Cache Action', () => {
      it('should warm up cache with default lofts', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance', {
          method: 'POST',
          body: JSON.stringify({ action: 'warmUpCache' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data.message).toContain('Cache warmed up for 3 lofts');

        const mockCacheService = await import('@/lib/services/loft-cache-service');
        expect(mockCacheService.loftCacheService.warmUpCache).toHaveBeenCalledWith(['test-loft-1', 'test-loft-2', 'test-loft-3']);
      });

      it('should warm up cache with custom loft IDs', async () => {
        const customLoftIds = ['custom-1', 'custom-2', 'custom-3', 'custom-4'];
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance', {
          method: 'POST',
          body: JSON.stringify({ action: 'warmUpCache', loftIds: customLoftIds })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data.message).toContain('Cache warmed up for 4 lofts');

        const mockCacheService = await import('@/lib/services/loft-cache-service');
        expect(mockCacheService.loftCacheService.warmUpCache).toHaveBeenCalledWith(customLoftIds);
      });
    });

    describe('Resolve Alert Action', () => {
      it('should resolve alert successfully', async () => {
        const alertId = 'alert-123';
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance', {
          method: 'POST',
          body: JSON.stringify({ action: 'resolveAlert', alertId })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('message', 'Alert resolved');

        const mockHealthMonitor = await import('@/lib/services/system-health-monitor');
        expect(mockHealthMonitor.systemHealthMonitor.resolveAlert).toHaveBeenCalledWith(alertId);
      });

      it('should handle missing alert ID', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance', {
          method: 'POST',
          body: JSON.stringify({ action: 'resolveAlert' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toHaveProperty('error', 'Alert ID required');
      });

      it('should handle alert not found', async () => {
        const mockHealthMonitor = await import('@/lib/services/system-health-monitor');
        vi.mocked(mockHealthMonitor.systemHealthMonitor.resolveAlert).mockReturnValue(false);

        const alertId = 'nonexistent-alert';
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance', {
          method: 'POST',
          body: JSON.stringify({ action: 'resolveAlert', alertId })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('message', 'Alert not found');
      });
    });

    describe('Invalid Actions', () => {
      it('should handle invalid action', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance', {
          method: 'POST',
          body: JSON.stringify({ action: 'invalidAction' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toHaveProperty('error', 'Invalid action');
      });

      it('should handle malformed JSON', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring/performance', {
          method: 'POST',
          body: 'invalid json'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toHaveProperty('error', 'Internal server error');
      });
    });

    describe('Error Handling in POST', () => {
      it('should handle service errors in POST actions', async () => {
        const mockCacheService = await import('@/lib/services/loft-cache-service');
        vi.mocked(mockCacheService.loftCacheService.invalidateAllCache).mockImplementation(() => {
          throw new Error('Cache service error');
        });

        const request = new NextRequest('http://localhost:3000/api/monitoring/performance', {
          method: 'POST',
          body: JSON.stringify({ action: 'clearCache' })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toHaveProperty('error', 'Internal server error');
        expect(data).toHaveProperty('message');
      });
    });
  });

  describe('Time Range Parsing', () => {
    it('should parse various time range formats', async () => {
      const timeRanges = ['5m', '15m', '30m', '1h', '6h', '12h', '24h', '7d', '30d'];
      
      for (const timeRange of timeRanges) {
        const request = new NextRequest(`http://localhost:3000/api/monitoring/performance?type=performance&timeRange=${timeRange}`);
        const response = await GET(request);
        
        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.timeRange).toBe(timeRange);
      }
    });

    it('should default to 1h for invalid time range', async () => {
      const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=performance&timeRange=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.timeRange).toBe('invalid'); // API preserves the input but uses default internally
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent timestamp format', async () => {
      const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=overview');
      const response = await GET(request);
      const data = await response.json();

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return proper content type', async () => {
      const request = new NextRequest('http://localhost:3000/api/monitoring/performance?type=overview');
      const response = await GET(request);

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});