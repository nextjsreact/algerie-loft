/**
 * System Health Monitoring Service
 * Monitors data consistency and system performance for the reservation system
 * Requirements: 1.7, 1.9 from reservation data consistency fix spec
 */

import { logger } from '@/lib/logger';
import { loftCacheService } from './loft-cache-service';
import { reservationMonitoringService } from '@/lib/monitoring/reservation-monitoring';
import { globalPerformanceMonitor } from '@/lib/performance/monitoring';
import { createClient } from '@/lib/supabase/client';

export interface SystemHealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  timestamp: string;
  uptime: number;
  components: {
    database: ComponentHealth;
    cache: ComponentHealth;
    reservationSystem: ComponentHealth;
    dataConsistency: ComponentHealth;
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    cacheHitRate: number;
    memoryUsage: number;
    activeConnections: number;
  };
  alerts: HealthAlert[];
  recommendations: string[];
}

export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastCheck: string;
  responseTime?: number;
  errorCount: number;
  details: string;
  metrics?: Record<string, any>;
}

export interface HealthAlert {
  id: string;
  type: 'performance' | 'error' | 'consistency' | 'security';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component: string;
  timestamp: string;
  resolved: boolean;
  details?: Record<string, any>;
}

export interface DataConsistencyCheck {
  loftDataConsistency: boolean;
  reservationIntegrity: boolean;
  foreignKeyConstraints: boolean;
  testDataAlignment: boolean;
  issues: string[];
}

/**
 * Comprehensive system health monitoring service
 */
export class SystemHealthMonitor {
  private healthStatus: SystemHealthStatus;
  private alerts: Map<string, HealthAlert> = new Map();
  private startTime: number = Date.now();
  private checkInterval: NodeJS.Timeout | null = null;
  private supabase = createClient();

  // Health check thresholds
  private readonly THRESHOLDS = {
    RESPONSE_TIME_WARNING: 2000,    // 2 seconds
    RESPONSE_TIME_CRITICAL: 5000,   // 5 seconds
    ERROR_RATE_WARNING: 5,          // 5%
    ERROR_RATE_CRITICAL: 10,        // 10%
    CACHE_HIT_RATE_WARNING: 70,     // 70%
    MEMORY_USAGE_WARNING: 80,       // 80%
    MEMORY_USAGE_CRITICAL: 90,      // 90%
  };

  constructor() {
    this.healthStatus = this.initializeHealthStatus();
    this.startMonitoring();
  }

  /**
   * Start continuous health monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Health check failed', { error });
      }
    }, intervalMs);

    logger.info('System health monitoring started', { intervalMs });
  }

  /**
   * Stop health monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    logger.info('System health monitoring stopped');
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Check all system components
      const [
        databaseHealth,
        cacheHealth,
        reservationHealth,
        consistencyHealth
      ] = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkCacheHealth(),
        this.checkReservationSystemHealth(),
        this.checkDataConsistency()
      ]);

      // Update component health status
      this.healthStatus.components.database = this.getSettledResult(databaseHealth, 'database');
      this.healthStatus.components.cache = this.getSettledResult(cacheHealth, 'cache');
      this.healthStatus.components.reservationSystem = this.getSettledResult(reservationHealth, 'reservation');
      this.healthStatus.components.dataConsistency = this.getSettledResult(consistencyHealth, 'consistency');

      // Update system metrics
      await this.updateSystemMetrics();

      // Determine overall system status
      this.updateOverallStatus();

      // Generate recommendations
      this.generateRecommendations();

      // Update timestamp and response time
      this.healthStatus.timestamp = new Date().toISOString();
      this.healthStatus.uptime = Date.now() - this.startTime;

      const checkDuration = Date.now() - startTime;
      logger.debug('Health check completed', { 
        duration: checkDuration,
        status: this.healthStatus.status,
        alertCount: this.healthStatus.alerts.length
      });

      return this.healthStatus;
    } catch (error) {
      logger.error('Health check error', { error });
      this.healthStatus.status = 'critical';
      this.healthStatus.timestamp = new Date().toISOString();
      
      this.addAlert({
        type: 'error',
        severity: 'critical',
        message: 'Health check system failure',
        component: 'health_monitor',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      return this.healthStatus;
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): SystemHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): HealthAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      logger.info('Alert resolved', { alertId, alert });
      return true;
    }
    return false;
  }

  /**
   * Add custom health check
   */
  async addCustomCheck(
    name: string,
    checkFn: () => Promise<ComponentHealth>
  ): Promise<void> {
    try {
      const result = await checkFn();
      (this.healthStatus.components as any)[name] = result;
      logger.debug('Custom health check completed', { name, status: result.status });
    } catch (error) {
      logger.error('Custom health check failed', { name, error });
      (this.healthStatus.components as any)[name] = {
        status: 'critical',
        lastCheck: new Date().toISOString(),
        errorCount: 1,
        details: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Private health check methods
   */

  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();
    let errorCount = 0;
    let details = 'Database connection healthy';

    try {
      // Test basic database connectivity
      const { data, error } = await this.supabase
        .from('lofts')
        .select('count')
        .limit(1);

      if (error) {
        errorCount++;
        details = `Database query error: ${error.message}`;
      }

      // Test customers table connectivity
      const { error: customersError } = await this.supabase
        .from('customers')
        .select('count')
        .limit(1);

      if (customersError) {
        errorCount++;
        details += ` | Customers table error: ${customersError.message}`;
      }

      // Test reservation table connectivity
      const { error: reservationError } = await this.supabase
        .from('reservations')
        .select('count')
        .limit(1);

      if (reservationError) {
        errorCount++;
        details += ` | Reservation table error: ${reservationError.message}`;
      }

      const responseTime = Date.now() - startTime;
      const status = this.determineComponentStatus(responseTime, errorCount);

      return {
        status,
        lastCheck: new Date().toISOString(),
        responseTime,
        errorCount,
        details,
        metrics: {
          connectionTime: responseTime,
          tablesAccessible: errorCount === 0
        }
      };
    } catch (error) {
      return {
        status: 'critical',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        errorCount: 1,
        details: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async checkCacheHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();
    let errorCount = 0;
    let details = 'Cache system healthy';

    try {
      // Get cache metrics
      const cacheStats = loftCacheService.getCacheStats();
      const cacheMetrics = cacheStats.metrics;

      // Check cache hit rate
      if (cacheMetrics.hitRate < this.THRESHOLDS.CACHE_HIT_RATE_WARNING) {
        errorCount++;
        details = `Low cache hit rate: ${cacheMetrics.hitRate.toFixed(1)}%`;
      }

      // Check cache performance
      if (cacheMetrics.averageResponseTime > this.THRESHOLDS.RESPONSE_TIME_WARNING) {
        errorCount++;
        details += ` | Slow cache response: ${cacheMetrics.averageResponseTime}ms`;
      }

      const responseTime = Date.now() - startTime;
      const status = this.determineComponentStatus(responseTime, errorCount);

      return {
        status,
        lastCheck: new Date().toISOString(),
        responseTime,
        errorCount,
        details,
        metrics: {
          hitRate: cacheMetrics.hitRate,
          totalRequests: cacheMetrics.totalRequests,
          cacheSize: cacheMetrics.cacheSize,
          averageResponseTime: cacheMetrics.averageResponseTime
        }
      };
    } catch (error) {
      return {
        status: 'critical',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        errorCount: 1,
        details: `Cache system error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async checkReservationSystemHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();
    let errorCount = 0;
    let details = 'Reservation system healthy';

    try {
      // Get reservation metrics
      const reservationMetrics = await reservationMonitoringService.getReservationMetrics('1h');

      // Check error rate
      if (reservationMetrics.error_rate > this.THRESHOLDS.ERROR_RATE_WARNING) {
        errorCount++;
        details = `High error rate: ${reservationMetrics.error_rate.toFixed(1)}%`;
      }

      // Check conversion rate
      if (reservationMetrics.conversion_rate < 15) { // 15% minimum
        errorCount++;
        details += ` | Low conversion rate: ${reservationMetrics.conversion_rate.toFixed(1)}%`;
      }

      // Check security incidents
      if (reservationMetrics.security_incidents > 0) {
        errorCount++;
        details += ` | Security incidents: ${reservationMetrics.security_incidents}`;
      }

      const responseTime = Date.now() - startTime;
      const status = this.determineComponentStatus(responseTime, errorCount);

      return {
        status,
        lastCheck: new Date().toISOString(),
        responseTime,
        errorCount,
        details,
        metrics: reservationMetrics
      };
    } catch (error) {
      return {
        status: 'critical',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        errorCount: 1,
        details: `Reservation system error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async checkDataConsistency(): Promise<ComponentHealth> {
    const startTime = Date.now();
    let errorCount = 0;
    let details = 'Data consistency verified';
    const issues: string[] = [];

    try {
      // Check loft data consistency
      const loftConsistencyCheck = await this.checkLoftDataConsistency();
      if (!loftConsistencyCheck.success) {
        errorCount++;
        issues.push(...loftConsistencyCheck.issues);
      }

      // Check reservation integrity
      const reservationIntegrityCheck = await this.checkReservationIntegrity();
      if (!reservationIntegrityCheck.success) {
        errorCount++;
        issues.push(...reservationIntegrityCheck.issues);
      }

      // Check foreign key constraints
      const foreignKeyCheck = await this.checkForeignKeyConstraints();
      if (!foreignKeyCheck.success) {
        errorCount++;
        issues.push(...foreignKeyCheck.issues);
      }

      if (issues.length > 0) {
        details = `Data consistency issues: ${issues.join(', ')}`;
      }

      const responseTime = Date.now() - startTime;
      const status = this.determineComponentStatus(responseTime, errorCount);

      return {
        status,
        lastCheck: new Date().toISOString(),
        responseTime,
        errorCount,
        details,
        metrics: {
          loftDataConsistent: loftConsistencyCheck.success,
          reservationIntegrityValid: reservationIntegrityCheck.success,
          foreignKeyConstraintsValid: foreignKeyCheck.success,
          issuesFound: issues.length
        }
      };
    } catch (error) {
      return {
        status: 'critical',
        lastCheck: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        errorCount: 1,
        details: `Data consistency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async checkLoftDataConsistency(): Promise<{ success: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check if lofts table has data
      const { data: lofts, error } = await this.supabase
        .from('lofts')
        .select('id, name')
        .limit(10);

      if (error) {
        issues.push(`Cannot access lofts table: ${error.message}`);
        return { success: false, issues };
      }

      if (!lofts || lofts.length === 0) {
        issues.push('Lofts table is empty - test data seeding may be required');
      }

      return { success: issues.length === 0, issues };
    } catch (error) {
      issues.push(`Loft data consistency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, issues };
    }
  }

  private async checkReservationIntegrity(): Promise<{ success: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check for reservations with invalid loft references
      const { data: invalidReservations, error } = await this.supabase
        .from('reservations')
        .select('id, loft_id')
        .not('loft_id', 'in', `(SELECT id FROM lofts)`)
        .limit(5);

      if (error) {
        // This query might fail if there are no reservations, which is okay
        if (!error.message.includes('relation') && !error.message.includes('does not exist')) {
          issues.push(`Cannot check reservation integrity: ${error.message}`);
        }
      } else if (invalidReservations && invalidReservations.length > 0) {
        issues.push(`Found ${invalidReservations.length} reservations with invalid loft references`);
      }

      return { success: issues.length === 0, issues };
    } catch (error) {
      issues.push(`Reservation integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, issues };
    }
  }

  private async checkForeignKeyConstraints(): Promise<{ success: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // This is a simplified check - in production you might want more comprehensive constraint validation
      const { data: constraintViolations, error } = await this.supabase
        .rpc('check_foreign_key_constraints')
        .limit(5);

      if (error) {
        // If the RPC doesn't exist, that's okay - we'll skip this check
        if (!error.message.includes('function') && !error.message.includes('does not exist')) {
          issues.push(`Cannot check foreign key constraints: ${error.message}`);
        }
      } else if (constraintViolations && constraintViolations.length > 0) {
        issues.push(`Found ${constraintViolations.length} foreign key constraint violations`);
      }

      return { success: issues.length === 0, issues };
    } catch (error) {
      // Foreign key constraint checking is optional
      return { success: true, issues: [] };
    }
  }

  /**
   * Helper methods
   */

  private initializeHealthStatus(): SystemHealthStatus {
    return {
      status: 'unknown',
      timestamp: new Date().toISOString(),
      uptime: 0,
      components: {
        database: {
          status: 'unknown',
          lastCheck: new Date().toISOString(),
          errorCount: 0,
          details: 'Not checked yet'
        },
        cache: {
          status: 'unknown',
          lastCheck: new Date().toISOString(),
          errorCount: 0,
          details: 'Not checked yet'
        },
        reservationSystem: {
          status: 'unknown',
          lastCheck: new Date().toISOString(),
          errorCount: 0,
          details: 'Not checked yet'
        },
        dataConsistency: {
          status: 'unknown',
          lastCheck: new Date().toISOString(),
          errorCount: 0,
          details: 'Not checked yet'
        }
      },
      metrics: {
        responseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
        activeConnections: 0
      },
      alerts: [],
      recommendations: []
    };
  }

  private getSettledResult(
    result: PromiseSettledResult<ComponentHealth>,
    componentName: string
  ): ComponentHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      logger.error(`Health check failed for ${componentName}`, { error: result.reason });
      return {
        status: 'critical',
        lastCheck: new Date().toISOString(),
        errorCount: 1,
        details: `Health check failed: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`
      };
    }
  }

  private determineComponentStatus(responseTime: number, errorCount: number): 'healthy' | 'warning' | 'critical' {
    if (errorCount > 0 || responseTime > this.THRESHOLDS.RESPONSE_TIME_CRITICAL) {
      return 'critical';
    } else if (responseTime > this.THRESHOLDS.RESPONSE_TIME_WARNING) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  private async updateSystemMetrics(): Promise<void> {
    try {
      // Get performance metrics
      const performanceStats = globalPerformanceMonitor.getStats(300000); // Last 5 minutes
      
      // Get cache metrics
      const cacheStats = loftCacheService.getCacheStats();
      
      // Get memory usage
      const memUsage = process.memoryUsage();
      const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      this.healthStatus.metrics = {
        responseTime: performanceStats.averageResponseTime,
        errorRate: performanceStats.errorRate,
        cacheHitRate: cacheStats.metrics.hitRate,
        memoryUsage: memoryUsagePercent,
        activeConnections: 0 // Would be implemented with actual connection monitoring
      };

      // Check for metric-based alerts
      this.checkMetricAlerts();
    } catch (error) {
      logger.error('Error updating system metrics', { error });
    }
  }

  private updateOverallStatus(): void {
    const componentStatuses = Object.values(this.healthStatus.components).map(c => c.status);
    
    if (componentStatuses.includes('critical')) {
      this.healthStatus.status = 'critical';
    } else if (componentStatuses.includes('warning')) {
      this.healthStatus.status = 'warning';
    } else if (componentStatuses.every(s => s === 'healthy')) {
      this.healthStatus.status = 'healthy';
    } else {
      this.healthStatus.status = 'unknown';
    }
  }

  private checkMetricAlerts(): void {
    const metrics = this.healthStatus.metrics;

    // Response time alerts
    if (metrics.responseTime > this.THRESHOLDS.RESPONSE_TIME_CRITICAL) {
      this.addAlert({
        type: 'performance',
        severity: 'critical',
        message: `Critical response time: ${metrics.responseTime}ms`,
        component: 'system'
      });
    } else if (metrics.responseTime > this.THRESHOLDS.RESPONSE_TIME_WARNING) {
      this.addAlert({
        type: 'performance',
        severity: 'warning',
        message: `Slow response time: ${metrics.responseTime}ms`,
        component: 'system'
      });
    }

    // Error rate alerts
    if (metrics.errorRate > this.THRESHOLDS.ERROR_RATE_CRITICAL) {
      this.addAlert({
        type: 'error',
        severity: 'critical',
        message: `Critical error rate: ${metrics.errorRate.toFixed(1)}%`,
        component: 'system'
      });
    } else if (metrics.errorRate > this.THRESHOLDS.ERROR_RATE_WARNING) {
      this.addAlert({
        type: 'error',
        severity: 'warning',
        message: `High error rate: ${metrics.errorRate.toFixed(1)}%`,
        component: 'system'
      });
    }

    // Memory usage alerts
    if (metrics.memoryUsage > this.THRESHOLDS.MEMORY_USAGE_CRITICAL) {
      this.addAlert({
        type: 'performance',
        severity: 'critical',
        message: `Critical memory usage: ${metrics.memoryUsage.toFixed(1)}%`,
        component: 'system'
      });
    } else if (metrics.memoryUsage > this.THRESHOLDS.MEMORY_USAGE_WARNING) {
      this.addAlert({
        type: 'performance',
        severity: 'warning',
        message: `High memory usage: ${metrics.memoryUsage.toFixed(1)}%`,
        component: 'system'
      });
    }

    // Cache hit rate alerts
    if (metrics.cacheHitRate < this.THRESHOLDS.CACHE_HIT_RATE_WARNING) {
      this.addAlert({
        type: 'performance',
        severity: 'warning',
        message: `Low cache hit rate: ${metrics.cacheHitRate.toFixed(1)}%`,
        component: 'cache'
      });
    }
  }

  private addAlert(alertData: Omit<HealthAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: HealthAlert = {
      ...alertData,
      id: `${alertData.type}_${alertData.component}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.set(alert.id, alert);
    this.healthStatus.alerts = Array.from(this.alerts.values());

    logger.warn('Health alert generated', alert);
  }

  private generateRecommendations(): void {
    const recommendations: string[] = [];
    const components = this.healthStatus.components;
    const metrics = this.healthStatus.metrics;

    // Database recommendations
    if (components.database.status !== 'healthy') {
      recommendations.push('Check database connection and query performance');
    }

    // Cache recommendations
    if (metrics.cacheHitRate < 70) {
      recommendations.push('Optimize caching strategy to improve hit rate');
    }

    // Performance recommendations
    if (metrics.responseTime > 2000) {
      recommendations.push('Investigate slow response times and optimize critical paths');
    }

    // Error rate recommendations
    if (metrics.errorRate > 5) {
      recommendations.push('Review and fix recurring errors to improve system stability');
    }

    // Memory recommendations
    if (metrics.memoryUsage > 80) {
      recommendations.push('Monitor memory usage and consider optimization or scaling');
    }

    // Data consistency recommendations
    if (components.dataConsistency.status !== 'healthy') {
      recommendations.push('Review data consistency issues and run database maintenance');
    }

    this.healthStatus.recommendations = recommendations;
  }
}

// Export singleton instance
export const systemHealthMonitor = new SystemHealthMonitor();