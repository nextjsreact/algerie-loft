/**
 * Performance optimization and monitoring system entry point
 * Exports all performance-related utilities and components
 */

// Query optimization
export {
  optimizedLoftSearch,
  optimizedBookingQuery,
  optimizedPartnerDashboard,
  QueryPerformanceAnalyzer,
  type QueryPerformanceMetrics,
  type SearchFilters,
  type BookingQueryOptions
} from './query-optimizer';

// Cache management
export {
  MemoryCacheManager,
  CachedDataAccess,
  CacheKeyGenerator,
  CacheTags,
  CacheWarmer,
  globalCache,
  withCache,
  type CacheOptions,
  type CacheEntry,
  type CacheStats
} from './cache-manager';

// Performance monitoring
export {
  PerformanceMonitor,
  globalPerformanceMonitor,
  withPerformanceMonitoring,
  usePerformanceMonitoring,
  type PerformanceMetrics,
  type SystemHealthMetrics,
  type PerformanceStats,
  type PerformanceAlert,
  type AlertThresholds
} from './monitoring';

// Alerting system
export {
  AlertManager,
  globalAlertManager,
  type AlertRule,
  type AlertCondition,
  type AlertChannel,
  type AlertNotification,
  type AlertStats
} from './alerting';

/**
 * Initialize performance monitoring system
 */
export function initializePerformanceSystem(): void {
  // Setup alert handlers
  globalPerformanceMonitor.onAlert(async (alert) => {
    await globalAlertManager.processAlert(alert);
  });

  // Start cache warming if in production
  if (process.env.NODE_ENV === 'production') {
    const cacheWarmer = new CacheWarmer(globalCache);
    cacheWarmer.warmUp().catch(error => {
      console.error('Cache warm-up failed:', error);
    });
  }

  console.log('Performance monitoring system initialized');
}

/**
 * Performance middleware factory for API routes
 */
export function createPerformanceMiddleware() {
  return withPerformanceMonitoring(globalPerformanceMonitor);
}

/**
 * Get comprehensive performance report
 */
export function getPerformanceReport(): {
  monitoring: any;
  cache: any;
  alerts: any;
  queries: any;
} {
  return {
    monitoring: {
      stats: globalPerformanceMonitor.getStats(),
      systemHealth: globalPerformanceMonitor.getSystemHealth()
    },
    cache: {
      stats: globalCache.getStats()
    },
    alerts: {
      stats: globalAlertManager.getStats(),
      activeAlerts: globalAlertManager.getActiveAlerts(),
      recentHistory: globalAlertManager.getAlertHistory(50)
    },
    queries: {
      metrics: QueryPerformanceAnalyzer.getAllMetrics()
    }
  };
}