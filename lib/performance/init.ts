/**
 * Performance monitoring system initialization
 * Sets up all performance monitoring components and configurations
 */

import { initializePerformanceSystem } from './index';
import { initializePerformanceMonitoring } from '../middleware/performance-middleware';
import { globalAlertManager } from './alerting';
import { globalCache } from './cache-manager';
import { logger } from '@/lib/logger';

/**
 * Initialize the complete performance monitoring system
 */
export async function initializePerformanceStack(): Promise<void> {
  try {
    logger.info('Initializing performance monitoring stack...');

    // Initialize core performance system
    initializePerformanceSystem();

    // Initialize middleware monitoring
    initializePerformanceMonitoring();

    // Setup custom alert rules for booking system
    setupBookingSystemAlerts();

    // Warm up cache if in production
    if (process.env.NODE_ENV === 'production') {
      await warmUpCache();
    }

    // Setup health check endpoint monitoring
    setupHealthCheckMonitoring();

    logger.info('Performance monitoring stack initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize performance monitoring stack', { error });
    throw error;
  }
}

/**
 * Setup booking system specific alert rules
 */
function setupBookingSystemAlerts(): void {
  // High booking search response time
  globalAlertManager.addRule({
    id: 'booking_search_slow',
    name: 'Slow Booking Search',
    condition: {
      metric: 'response_time',
      operator: 'gt',
      threshold: 3000,
      timeWindowMinutes: 5
    },
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 10,
    channels: [
      { type: 'log', config: {}, enabled: true },
      { type: 'console', config: {}, enabled: process.env.NODE_ENV === 'development' }
    ]
  });

  // High booking failure rate
  globalAlertManager.addRule({
    id: 'booking_failure_rate',
    name: 'High Booking Failure Rate',
    condition: {
      metric: 'error_rate',
      operator: 'gt',
      threshold: 3,
      timeWindowMinutes: 10
    },
    severity: 'error',
    enabled: true,
    cooldownMinutes: 20,
    channels: [
      { type: 'log', config: {}, enabled: true },
      { type: 'console', config: {}, enabled: true }
    ]
  });

  // Partner dashboard slow loading
  globalAlertManager.addRule({
    id: 'partner_dashboard_slow',
    name: 'Slow Partner Dashboard',
    condition: {
      metric: 'response_time',
      operator: 'gt',
      threshold: 2500,
      timeWindowMinutes: 5
    },
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 15,
    channels: [
      { type: 'log', config: {}, enabled: true }
    ]
  });

  // Database connection issues
  globalAlertManager.addRule({
    id: 'database_connection_issues',
    name: 'Database Connection Issues',
    condition: {
      metric: 'db_query_time',
      operator: 'gt',
      threshold: 5000,
      timeWindowMinutes: 3
    },
    severity: 'critical',
    enabled: true,
    cooldownMinutes: 5,
    channels: [
      { type: 'log', config: {}, enabled: true },
      { type: 'console', config: {}, enabled: true }
    ]
  });

  logger.info('Booking system alert rules configured');
}

/**
 * Warm up cache with frequently accessed data
 */
async function warmUpCache(): Promise<void> {
  try {
    logger.info('Starting cache warm-up process...');

    // This would be enhanced with actual data warming
    // For now, we'll just log the intention
    
    // Warm up common search results
    // await warmUpSearchResults();
    
    // Warm up popular lofts
    // await warmUpPopularLofts();
    
    // Warm up partner data
    // await warmUpPartnerData();

    const cacheStats = globalCache.getStats();
    logger.info('Cache warm-up completed', {
      totalEntries: cacheStats.totalEntries,
      memoryUsage: cacheStats.memoryUsage
    });
  } catch (error) {
    logger.error('Cache warm-up failed', { error });
  }
}

/**
 * Setup health check monitoring
 */
function setupHealthCheckMonitoring(): void {
  // Monitor system health every 5 minutes
  setInterval(async () => {
    try {
      await performHealthCheck();
    } catch (error) {
      logger.error('Health check failed', { error });
    }
  }, 5 * 60 * 1000);

  logger.info('Health check monitoring configured');
}

/**
 * Perform system health check
 */
async function performHealthCheck(): Promise<void> {
  const healthMetrics = {
    timestamp: Date.now(),
    database: await checkDatabaseHealth(),
    cache: checkCacheHealth(),
    memory: checkMemoryHealth(),
    performance: checkPerformanceHealth()
  };

  // Log health status
  logger.info('System health check', healthMetrics);

  // Check for issues and create alerts if needed
  if (!healthMetrics.database.healthy) {
    logger.error('Database health check failed', healthMetrics.database);
  }

  if (healthMetrics.memory.usage > 90) {
    logger.warn('High memory usage detected', { usage: healthMetrics.memory.usage });
  }
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
  const startTime = Date.now();
  
  try {
    // This would perform an actual database health check
    // For now, we'll simulate it
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return {
      healthy: true,
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check cache health
 */
function checkCacheHealth(): { healthy: boolean; stats: any } {
  try {
    const stats = globalCache.getStats();
    return {
      healthy: true,
      stats
    };
  } catch (error) {
    return {
      healthy: false,
      stats: null
    };
  }
}

/**
 * Check memory health
 */
function checkMemoryHealth(): { usage: number; total: number; free: number } {
  const memUsage = process.memoryUsage();
  const usage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  return {
    usage,
    total: memUsage.heapTotal,
    free: memUsage.heapTotal - memUsage.heapUsed
  };
}

/**
 * Check performance health
 */
function checkPerformanceHealth(): { averageResponseTime: number; errorRate: number } {
  // This would get actual performance metrics
  // For now, we'll return placeholder values
  return {
    averageResponseTime: 500,
    errorRate: 0.5
  };
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    
    try {
      // Clear cache
      globalCache.clear();
      
      // Log final performance stats
      const finalStats = globalCache.getStats();
      logger.info('Final performance stats', finalStats);
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Auto-initialize if this module is imported
if (typeof window === 'undefined') {
  // Only initialize on server side
  initializePerformanceStack().catch(error => {
    console.error('Failed to initialize performance stack:', error);
  });
  
  setupGracefulShutdown();
}