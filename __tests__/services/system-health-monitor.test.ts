/**
 * Tests for System Health Monitor
 * Validates system health monitoring and alerting functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { systemHealthMonitor } from '@/lib/services/system-health-monitor';

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/lib/services/loft-cache-service', () => ({
  loftCacheService: {
    getCacheStats: vi.fn(() => ({
      metrics: {
        hitRate: 85.5,
        totalRequests: 1000,
        cacheSize: 150,
        averageResponseTime: 45
      }
    }))
  }
}));

vi.mock('@/lib/monitoring/reservation-monitoring', () => ({
  reservationMonitoringService: {
    getReservationMetrics: vi.fn(() => Promise.resolve({
      total_reservations: 50,
      successful_reservations: 45,
      failed_reservations: 2,
      cancelled_reservations: 3,
      conversion_rate: 90.0,
      average_booking_time: 1200,
      payment_success_rate: 95.5,
      error_rate: 4.0,
      security_incidents: 0
    }))
  }
}));

vi.mock('@/lib/performance/monitoring', () => ({
  globalPerformanceMonitor: {
    getStats: vi.fn(() => ({
      totalRequests: 500,
      averageResponseTime: 850,
      p95ResponseTime: 1200,
      errorRate: 2.5,
      slowestRoutes: [],
      requestsByRole: {},
      dbPerformance: {
        averageQueryTime: 150,
        slowQueries: 2
      }
    }))
  }
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => ({
          data: [{ id: '1', name: 'Test Loft' }],
          error: null
        }))
      }))
    })),
    rpc: vi.fn(() => ({
      limit: vi.fn(() => ({
        data: [],
        error: null
      }))
    }))
  }))
}));

describe('SystemHealthMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    systemHealthMonitor.stopMonitoring();
  });

  describe('Health Check Initialization', () => {
    it('should initialize with unknown status', () => {
      const healthStatus = systemHealthMonitor.getHealthStatus();
      
      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('timestamp');
      expect(healthStatus).toHaveProperty('uptime');
      expect(healthStatus).toHaveProperty('components');
      expect(healthStatus).toHaveProperty('metrics');
      expect(healthStatus).toHaveProperty('alerts');
      expect(healthStatus).toHaveProperty('recommendations');
    });

    it('should have all required components', () => {
      const healthStatus = systemHealthMonitor.getHealthStatus();
      
      expect(healthStatus.components).toHaveProperty('database');
      expect(healthStatus.components).toHaveProperty('cache');
      expect(healthStatus.components).toHaveProperty('reservationSystem');
      expect(healthStatus.components).toHaveProperty('dataConsistency');
    });
  });

  describe('Health Check Execution', () => {
    it('should perform comprehensive health check', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus.status).toMatch(/healthy|warning|critical|unknown/);
      expect(healthStatus).toHaveProperty('timestamp');
      expect(healthStatus).toHaveProperty('components');
      expect(healthStatus).toHaveProperty('metrics');
    });

    it('should check database health', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus.components.database).toHaveProperty('status');
      expect(healthStatus.components.database).toHaveProperty('lastCheck');
      expect(healthStatus.components.database).toHaveProperty('errorCount');
      expect(healthStatus.components.database).toHaveProperty('details');
      
      expect(typeof healthStatus.components.database.errorCount).toBe('number');
      expect(typeof healthStatus.components.database.details).toBe('string');
    });

    it('should check cache health', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus.components.cache).toHaveProperty('status');
      expect(healthStatus.components.cache).toHaveProperty('metrics');
      
      if (healthStatus.components.cache.metrics) {
        expect(healthStatus.components.cache.metrics).toHaveProperty('hitRate');
        expect(healthStatus.components.cache.metrics).toHaveProperty('totalRequests');
      }
    });

    it('should check reservation system health', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus.components.reservationSystem).toHaveProperty('status');
      expect(healthStatus.components.reservationSystem).toHaveProperty('metrics');
      
      if (healthStatus.components.reservationSystem.metrics) {
        expect(healthStatus.components.reservationSystem.metrics).toHaveProperty('total_reservations');
        expect(healthStatus.components.reservationSystem.metrics).toHaveProperty('conversion_rate');
      }
    });

    it('should check data consistency', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus.components.dataConsistency).toHaveProperty('status');
      expect(healthStatus.components.dataConsistency).toHaveProperty('metrics');
      
      if (healthStatus.components.dataConsistency.metrics) {
        expect(healthStatus.components.dataConsistency.metrics).toHaveProperty('loftDataConsistent');
        expect(healthStatus.components.dataConsistency.metrics).toHaveProperty('reservationIntegrityValid');
      }
    });
  });

  describe('System Metrics', () => {
    it('should collect system metrics', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus.metrics).toHaveProperty('responseTime');
      expect(healthStatus.metrics).toHaveProperty('errorRate');
      expect(healthStatus.metrics).toHaveProperty('cacheHitRate');
      expect(healthStatus.metrics).toHaveProperty('memoryUsage');
      expect(healthStatus.metrics).toHaveProperty('activeConnections');
      
      expect(typeof healthStatus.metrics.responseTime).toBe('number');
      expect(typeof healthStatus.metrics.errorRate).toBe('number');
      expect(typeof healthStatus.metrics.cacheHitRate).toBe('number');
      expect(typeof healthStatus.metrics.memoryUsage).toBe('number');
    });

    it('should track uptime', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof healthStatus.uptime).toBe('number');
    });
  });

  describe('Alert Management', () => {
    it('should generate alerts for critical issues', async () => {
      // Mock high error rate to trigger alert
      const mockPerformanceMonitor = await import('@/lib/performance/monitoring');
      vi.mocked(mockPerformanceMonitor.globalPerformanceMonitor.getStats).mockReturnValue({
        totalRequests: 100,
        averageResponseTime: 6000, // High response time
        p95ResponseTime: 8000,
        errorRate: 15, // High error rate
        slowestRoutes: [],
        requestsByRole: {},
        dbPerformance: {
          averageQueryTime: 2500,
          slowQueries: 10
        }
      });

      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      // Should have alerts for high response time and error rate
      expect(healthStatus.alerts.length).toBeGreaterThan(0);
    });

    it('should track active alerts', () => {
      const activeAlerts = systemHealthMonitor.getActiveAlerts();
      
      expect(Array.isArray(activeAlerts)).toBe(true);
      activeAlerts.forEach(alert => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('timestamp');
        expect(alert.resolved).toBe(false);
      });
    });

    it('should resolve alerts', async () => {
      // First generate an alert
      const mockPerformanceMonitor = await import('@/lib/performance/monitoring');
      vi.mocked(mockPerformanceMonitor.globalPerformanceMonitor.getStats).mockReturnValue({
        totalRequests: 100,
        averageResponseTime: 6000,
        p95ResponseTime: 8000,
        errorRate: 15,
        slowestRoutes: [],
        requestsByRole: {},
        dbPerformance: { averageQueryTime: 150, slowQueries: 0 }
      });

      await systemHealthMonitor.performHealthCheck();
      const activeAlerts = systemHealthMonitor.getActiveAlerts();
      
      if (activeAlerts.length > 0) {
        const alertId = activeAlerts[0].id;
        const resolved = systemHealthMonitor.resolveAlert(alertId);
        
        expect(resolved).toBe(true);
      }
    });
  });

  describe('Status Determination', () => {
    it('should determine overall status from components', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      const componentStatuses = Object.values(healthStatus.components).map(c => c.status);
      
      if (componentStatuses.includes('critical')) {
        expect(healthStatus.status).toBe('critical');
      } else if (componentStatuses.includes('warning')) {
        expect(healthStatus.status).toBe('warning');
      } else if (componentStatuses.every(s => s === 'healthy')) {
        expect(healthStatus.status).toBe('healthy');
      }
    });

    it('should generate recommendations based on status', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(Array.isArray(healthStatus.recommendations)).toBe(true);
      
      healthStatus.recommendations.forEach(recommendation => {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring with custom interval', () => {
      const customInterval = 30000; // 30 seconds
      
      expect(() => {
        systemHealthMonitor.startMonitoring(customInterval);
      }).not.toThrow();
    });

    it('should stop monitoring', () => {
      systemHealthMonitor.startMonitoring();
      
      expect(() => {
        systemHealthMonitor.stopMonitoring();
      }).not.toThrow();
    });
  });

  describe('Custom Health Checks', () => {
    it('should add custom health check', async () => {
      const customCheckName = 'customService';
      const mockCustomCheck = vi.fn().mockResolvedValue({
        status: 'healthy' as const,
        lastCheck: new Date().toISOString(),
        errorCount: 0,
        details: 'Custom service is running'
      });

      await systemHealthMonitor.addCustomCheck(customCheckName, mockCustomCheck);
      
      expect(mockCustomCheck).toHaveBeenCalled();
    });

    it('should handle custom check failures', async () => {
      const customCheckName = 'failingService';
      const mockFailingCheck = vi.fn().mockRejectedValue(new Error('Service down'));

      await systemHealthMonitor.addCustomCheck(customCheckName, mockFailingCheck);
      
      expect(mockFailingCheck).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Mock database error
      const mockSupabase = await import('@/lib/supabase/client');
      vi.mocked(mockSupabase.createClient).mockReturnValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: null,
              error: { message: 'Connection failed' }
            }))
          }))
        })),
        rpc: vi.fn()
      } as any);

      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus.components.database.status).toBe('critical');
      expect(healthStatus.components.database.details).toContain('Connection failed');
    });

    it('should handle cache service errors', async () => {
      // Mock cache error
      const mockCacheService = await import('@/lib/services/loft-cache-service');
      vi.mocked(mockCacheService.loftCacheService.getCacheStats).mockImplementation(() => {
        throw new Error('Cache service unavailable');
      });

      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus.components.cache.status).toBe('critical');
    });

    it('should handle reservation monitoring errors', async () => {
      // Mock reservation monitoring error
      const mockReservationMonitoring = await import('@/lib/monitoring/reservation-monitoring');
      vi.mocked(mockReservationMonitoring.reservationMonitoringService.getReservationMetrics)
        .mockRejectedValue(new Error('Monitoring service down'));

      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus.components.reservationSystem.status).toBe('critical');
    });
  });

  describe('Performance Thresholds', () => {
    it('should respect response time thresholds', async () => {
      // Mock slow response times
      const mockPerformanceMonitor = await import('@/lib/performance/monitoring');
      vi.mocked(mockPerformanceMonitor.globalPerformanceMonitor.getStats).mockReturnValue({
        totalRequests: 100,
        averageResponseTime: 3000, // Above warning threshold
        p95ResponseTime: 4000,
        errorRate: 2,
        slowestRoutes: [],
        requestsByRole: {},
        dbPerformance: { averageQueryTime: 150, slowQueries: 0 }
      });

      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      // Should generate warning for slow response time
      const responseTimeAlerts = healthStatus.alerts.filter(
        alert => alert.type === 'performance' && alert.message.includes('response time')
      );
      
      expect(responseTimeAlerts.length).toBeGreaterThan(0);
    });

    it('should respect error rate thresholds', async () => {
      // Mock high error rate
      const mockPerformanceMonitor = await import('@/lib/performance/monitoring');
      vi.mocked(mockPerformanceMonitor.globalPerformanceMonitor.getStats).mockReturnValue({
        totalRequests: 100,
        averageResponseTime: 500,
        p95ResponseTime: 800,
        errorRate: 12, // Above critical threshold
        slowestRoutes: [],
        requestsByRole: {},
        dbPerformance: { averageQueryTime: 150, slowQueries: 0 }
      });

      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      // Should generate critical alert for high error rate
      const errorRateAlerts = healthStatus.alerts.filter(
        alert => alert.type === 'error' && alert.severity === 'critical'
      );
      
      expect(errorRateAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('Data Consistency Checks', () => {
    it('should validate loft data consistency', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      expect(healthStatus.components.dataConsistency).toHaveProperty('metrics');
      
      if (healthStatus.components.dataConsistency.metrics) {
        expect(healthStatus.components.dataConsistency.metrics).toHaveProperty('loftDataConsistent');
        expect(typeof healthStatus.components.dataConsistency.metrics.loftDataConsistent).toBe('boolean');
      }
    });

    it('should validate reservation integrity', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      if (healthStatus.components.dataConsistency.metrics) {
        expect(healthStatus.components.dataConsistency.metrics).toHaveProperty('reservationIntegrityValid');
        expect(typeof healthStatus.components.dataConsistency.metrics.reservationIntegrityValid).toBe('boolean');
      }
    });

    it('should check foreign key constraints', async () => {
      const healthStatus = await systemHealthMonitor.performHealthCheck();
      
      if (healthStatus.components.dataConsistency.metrics) {
        expect(healthStatus.components.dataConsistency.metrics).toHaveProperty('foreignKeyConstraintsValid');
        expect(typeof healthStatus.components.dataConsistency.metrics.foreignKeyConstraintsValid).toBe('boolean');
      }
    });
  });
});