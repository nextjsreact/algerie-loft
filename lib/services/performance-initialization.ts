/**
 * Performance and Monitoring Initialization Service
 * Sets up caching, monitoring, and health checks for the reservation system
 * Requirements: 1.7, 1.9 from reservation data consistency fix spec
 */

import { logger } from '@/lib/logger';
import { loftCacheService } from './loft-cache-service';
import { systemHealthMonitor } from './system-health-monitor';
import { reservationPerformanceMonitor } from './reservation-performance-monitor';
import { reservationMonitoringService } from '@/lib/monitoring/reservation-monitoring';

export interface PerformanceConfig {
  enableCaching: boolean;
  enableHealthMonitoring: boolean;
  enablePerformanceMonitoring: boolean;
  healthCheckInterval: number;
  cacheWarmupEnabled: boolean;
  performanceThresholds?: {
    responseTime: number;
    errorRate: number;
    cacheHitRate: number;
    memoryUsage: number;
  };
}

export interface InitializationResult {
  success: boolean;
  services: {
    cache: boolean;
    healthMonitor: boolean;
    performanceMonitor: boolean;
    reservationMonitor: boolean;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Performance and monitoring initialization service
 */
export class PerformanceInitializationService {
  private initialized = false;
  private config: PerformanceConfig;

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enableCaching: true,
      enableHealthMonitoring: true,
      enablePerformanceMonitoring: true,
      healthCheckInterval: 60000, // 1 minute
      cacheWarmupEnabled: true,
      performanceThresholds: {
        responseTime: 2000,
        errorRate: 5,
        cacheHitRate: 70,
        memoryUsage: 80
      },
      ...config
    };
  }

  /**
   * Initialize all performance and monitoring services
   */
  async initialize(): Promise<InitializationResult> {
    if (this.initialized) {
      logger.warn('Performance services already initialized');
      return {
        success: true,
        services: { cache: true, healthMonitor: true, performanceMonitor: true, reservationMonitor: true },
        errors: [],
        warnings: ['Services already initialized']
      };
    }

    logger.info('Initializing performance and monitoring services', { config: this.config });

    const result: InitializationResult = {
      success: true,
      services: {
        cache: false,
        healthMonitor: false,
        performanceMonitor: false,
        reservationMonitor: false
      },
      errors: [],
      warnings: []
    };

    try {
      // Initialize caching service
      if (this.config.enableCaching) {
        await this.initializeCaching(result);
      }

      // Initialize health monitoring
      if (this.config.enableHealthMonitoring) {
        await this.initializeHealthMonitoring(result);
      }

      // Initialize performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        await this.initializePerformanceMonitoring(result);
      }

      // Initialize reservation monitoring
      await this.initializeReservationMonitoring(result);

      // Set up error handlers and cleanup
      this.setupErrorHandlers();
      this.setupCleanupHandlers();

      this.initialized = true;
      
      logger.info('Performance services initialization completed', {
        success: result.success,
        services: result.services,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      result.errors.push(errorMessage);
      result.success = false;
      
      logger.error('Performance services initialization failed', { error: errorMessage });
      return result;
    }
  }

  /**
   * Get initialization status
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (requires re-initialization)
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Performance configuration updated', { config: this.config });
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down performance services');

    try {
      // Stop health monitoring
      systemHealthMonitor.stopMonitoring();

      // Clear performance metrics
      reservationPerformanceMonitor.clearMetrics();

      // Clear cache if needed
      if (process.env.NODE_ENV !== 'production') {
        loftCacheService.invalidateAllCache();
      }

      this.initialized = false;
      logger.info('Performance services shutdown completed');
    } catch (error) {
      logger.error('Error during performance services shutdown', { error });
    }
  }

  /**
   * Get comprehensive status of all services
   */
  async getServicesStatus(): Promise<{
    initialized: boolean;
    services: {
      cache: { status: string; metrics: any };
      healthMonitor: { status: string; health: any };
      performanceMonitor: { status: string; stats: any };
      reservationMonitor: { status: string; metrics: any };
    };
  }> {
    try {
      const [cacheStats, healthStatus, perfStats, reservationMetrics] = await Promise.allSettled([
        Promise.resolve(loftCacheService.getCacheStats()),
        systemHealthMonitor.getHealthStatus(),
        Promise.resolve(reservationPerformanceMonitor.getRealTimeStats()),
        reservationMonitoringService.getReservationMetrics('1h')
      ]);

      return {
        initialized: this.initialized,
        services: {
          cache: {
            status: cacheStats.status === 'fulfilled' ? 'active' : 'error',
            metrics: cacheStats.status === 'fulfilled' ? cacheStats.value : null
          },
          healthMonitor: {
            status: healthStatus.status === 'fulfilled' ? 'active' : 'error',
            health: healthStatus.status === 'fulfilled' ? healthStatus.value : null
          },
          performanceMonitor: {
            status: perfStats.status === 'fulfilled' ? 'active' : 'error',
            stats: perfStats.status === 'fulfilled' ? perfStats.value : null
          },
          reservationMonitor: {
            status: reservationMetrics.status === 'fulfilled' ? 'active' : 'error',
            metrics: reservationMetrics.status === 'fulfilled' ? reservationMetrics.value : null
          }
        }
      };
    } catch (error) {
      logger.error('Error getting services status', { error });
      return {
        initialized: this.initialized,
        services: {
          cache: { status: 'unknown', metrics: null },
          healthMonitor: { status: 'unknown', health: null },
          performanceMonitor: { status: 'unknown', stats: null },
          reservationMonitor: { status: 'unknown', metrics: null }
        }
      };
    }
  }

  /**
   * Private initialization methods
   */

  private async initializeCaching(result: InitializationResult): Promise<void> {
    try {
      logger.info('Initializing caching service');

      // Test cache functionality
      await loftCacheService.cacheTestLoftData(async () => {
        return { test: true, timestamp: Date.now() };
      });

      // Warm up cache if enabled
      if (this.config.cacheWarmupEnabled) {
        await this.warmUpCache(result);
      }

      result.services.cache = true;
      logger.info('Caching service initialized successfully');
    } catch (error) {
      const errorMessage = `Cache initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMessage);
      logger.error('Caching service initialization failed', { error });
    }
  }

  private async initializeHealthMonitoring(result: InitializationResult): Promise<void> {
    try {
      logger.info('Initializing health monitoring service');

      // Start health monitoring with configured interval
      systemHealthMonitor.startMonitoring(this.config.healthCheckInterval);

      // Perform initial health check
      const initialHealth = await systemHealthMonitor.performHealthCheck();
      
      if (initialHealth.status === 'critical') {
        result.warnings.push('Initial health check shows critical issues');
      }

      result.services.healthMonitor = true;
      logger.info('Health monitoring service initialized successfully', {
        initialStatus: initialHealth.status
      });
    } catch (error) {
      const errorMessage = `Health monitoring initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMessage);
      logger.error('Health monitoring service initialization failed', { error });
    }
  }

  private async initializePerformanceMonitoring(result: InitializationResult): Promise<void> {
    try {
      logger.info('Initializing performance monitoring service');

      // Set up performance thresholds if provided
      if (this.config.performanceThresholds) {
        // Performance monitor uses default thresholds, but we can log the configuration
        logger.info('Performance thresholds configured', {
          thresholds: this.config.performanceThresholds
        });
      }

      // Test performance monitoring
      const testTimerId = reservationPerformanceMonitor.startTiming('initialization_test');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      reservationPerformanceMonitor.endTiming(testTimerId, 'initialization_test', true);

      result.services.performanceMonitor = true;
      logger.info('Performance monitoring service initialized successfully');
    } catch (error) {
      const errorMessage = `Performance monitoring initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMessage);
      logger.error('Performance monitoring service initialization failed', { error });
    }
  }

  private async initializeReservationMonitoring(result: InitializationResult): Promise<void> {
    try {
      logger.info('Initializing reservation monitoring service');

      // Test reservation monitoring
      await reservationMonitoringService.trackUserBehavior('system_initialization', 'system');

      result.services.reservationMonitor = true;
      logger.info('Reservation monitoring service initialized successfully');
    } catch (error) {
      const errorMessage = `Reservation monitoring initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMessage);
      logger.error('Reservation monitoring service initialization failed', { error });
    }
  }

  private async warmUpCache(result: InitializationResult): Promise<void> {
    try {
      logger.info('Starting cache warm-up');

      // Warm up with common test loft IDs
      const testLoftIds = [
        'test-loft-1',
        'test-loft-2',
        'test-loft-3',
        'test-loft-4',
        'test-loft-5'
      ];

      await loftCacheService.warmUpCache(testLoftIds);
      
      logger.info('Cache warm-up completed', { loftCount: testLoftIds.length });
    } catch (error) {
      const warningMessage = `Cache warm-up failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.warnings.push(warningMessage);
      logger.warn('Cache warm-up failed', { error });
    }
  }

  private setupErrorHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception in performance services', { error });
      
      // Track the error
      reservationMonitoringService.trackReservationError(
        error,
        'uncaught_exception',
        undefined,
        { step: 'system_error' }
      );
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection in performance services', { reason, promise });
      
      // Track the error
      reservationMonitoringService.trackReservationError(
        reason instanceof Error ? reason : new Error(String(reason)),
        'unhandled_rejection',
        undefined,
        { step: 'promise_rejection' }
      );
    });
  }

  private setupCleanupHandlers(): void {
    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down performance services');
      await this.shutdown();
    });

    // Graceful shutdown on SIGINT
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down performance services');
      await this.shutdown();
    });
  }
}

// Export singleton instance
export const performanceInitializationService = new PerformanceInitializationService();

/**
 * Convenience function to initialize all performance services
 */
export async function initializePerformanceServices(
  config?: Partial<PerformanceConfig>
): Promise<InitializationResult> {
  if (config) {
    performanceInitializationService.updateConfig(config);
  }
  
  return await performanceInitializationService.initialize();
}

/**
 * Convenience function to get services status
 */
export async function getPerformanceServicesStatus() {
  return await performanceInitializationService.getServicesStatus();
}

/**
 * Convenience function to shutdown services
 */
export async function shutdownPerformanceServices(): Promise<void> {
  await performanceInitializationService.shutdown();
}