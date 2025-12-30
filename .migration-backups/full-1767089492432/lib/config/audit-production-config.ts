/**
 * Production Configuration for Audit System
 * 
 * This file contains production-specific configuration for the audit system,
 * including performance settings, retention policies, and security configurations.
 */

export interface AuditProductionConfig {
  // Database Configuration
  database: {
    // Maximum number of audit logs to fetch in a single query
    maxQueryLimit: number;
    // Default page size for audit log pagination
    defaultPageSize: number;
    // Batch size for bulk operations (export, archiving)
    batchSize: number;
    // Query timeout in milliseconds
    queryTimeout: number;
  };

  // Performance Configuration
  performance: {
    // Enable query result caching
    enableCaching: boolean;
    // Cache TTL in seconds
    cacheTTL: number;
    // Maximum export size before requiring streaming
    maxExportSize: number;
    // Enable query optimization
    enableQueryOptimization: boolean;
  };

  // Retention Policies
  retention: {
    // Default retention period in days
    defaultRetentionDays: number;
    // Retention by table (overrides default)
    tableRetention: Record<string, number>;
    // Archive threshold in days
    archiveAfterDays: number;
    // Permanent deletion threshold in days
    deleteAfterDays: number;
    // Enable automatic archiving
    enableAutoArchiving: boolean;
    // Enable automatic cleanup
    enableAutoCleanup: boolean;
  };

  // Security Configuration
  security: {
    // Enable audit access logging
    enableAccessLogging: boolean;
    // Enable integrity checking
    enableIntegrityChecks: boolean;
    // Integrity check frequency in hours
    integrityCheckFrequency: number;
    // Enable suspicious activity detection
    enableSuspiciousActivityDetection: boolean;
    // Maximum failed access attempts before alerting
    maxFailedAccessAttempts: number;
    // Enable IP-based access restrictions
    enableIPRestrictions: boolean;
    // Allowed IP ranges for audit access (CIDR notation)
    allowedIPRanges: string[];
  };

  // Export Configuration
  export: {
    // Maximum records per export for different roles
    maxExportLimits: Record<string, number>;
    // Allowed export formats
    allowedFormats: string[];
    // Enable export compression
    enableCompression: boolean;
    // Export timeout in milliseconds
    exportTimeout: number;
  };

  // Monitoring Configuration
  monitoring: {
    // Enable performance monitoring
    enablePerformanceMonitoring: boolean;
    // Performance metrics collection interval in minutes
    metricsInterval: number;
    // Enable alerting
    enableAlerting: boolean;
    // Alert thresholds
    alertThresholds: {
      // Alert when audit table size exceeds this (in GB)
      tableSizeGB: number;
      // Alert when query response time exceeds this (in ms)
      queryResponseTimeMs: number;
      // Alert when failed operations exceed this percentage
      failureRatePercent: number;
    };
  };

  // Feature Flags
  features: {
    // Enable real-time audit notifications
    enableRealTimeNotifications: boolean;
    // Enable audit dashboard
    enableAuditDashboard: boolean;
    // Enable advanced filtering
    enableAdvancedFiltering: boolean;
    // Enable audit analytics
    enableAuditAnalytics: boolean;
  };
}

/**
 * Production configuration instance
 */
export const AUDIT_PRODUCTION_CONFIG: AuditProductionConfig = {
  database: {
    maxQueryLimit: 1000,
    defaultPageSize: 50,
    batchSize: 500,
    queryTimeout: 30000, // 30 seconds
  },

  performance: {
    enableCaching: true,
    cacheTTL: 300, // 5 minutes
    maxExportSize: 10000,
    enableQueryOptimization: true,
  },

  retention: {
    defaultRetentionDays: 2555, // 7 years (regulatory compliance)
    tableRetention: {
      transactions: 2555, // 7 years for financial records
      tasks: 1095,        // 3 years for task records
      reservations: 2190, // 6 years for reservation records
      lofts: 2555,        // 7 years for property records
    },
    archiveAfterDays: 365,  // Archive after 1 year
    deleteAfterDays: 2555,  // Delete after 7 years
    enableAutoArchiving: true,
    enableAutoCleanup: false, // Manual cleanup for safety
  },

  security: {
    enableAccessLogging: true,
    enableIntegrityChecks: true,
    integrityCheckFrequency: 24, // Every 24 hours
    enableSuspiciousActivityDetection: true,
    maxFailedAccessAttempts: 5,
    enableIPRestrictions: false, // Disabled by default, enable if needed
    allowedIPRanges: [], // Configure if IP restrictions are enabled
  },

  export: {
    maxExportLimits: {
      admin: 100000,
      manager: 50000,
      executive: 10000,
      member: 1000,
      guest: 0,
    },
    allowedFormats: ['csv', 'json'],
    enableCompression: true,
    exportTimeout: 300000, // 5 minutes
  },

  monitoring: {
    enablePerformanceMonitoring: true,
    metricsInterval: 15, // Every 15 minutes
    enableAlerting: true,
    alertThresholds: {
      tableSizeGB: 10,
      queryResponseTimeMs: 5000,
      failureRatePercent: 5,
    },
  },

  features: {
    enableRealTimeNotifications: false, // Disabled for performance
    enableAuditDashboard: true,
    enableAdvancedFiltering: true,
    enableAuditAnalytics: true,
  },
};

/**
 * Environment-specific configuration overrides
 */
export function getAuditConfig(environment: string = 'production'): AuditProductionConfig {
  const baseConfig = { ...AUDIT_PRODUCTION_CONFIG };

  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        database: {
          ...baseConfig.database,
          maxQueryLimit: 100,
          defaultPageSize: 20,
        },
        retention: {
          ...baseConfig.retention,
          defaultRetentionDays: 30,
          archiveAfterDays: 7,
          deleteAfterDays: 30,
        },
        security: {
          ...baseConfig.security,
          enableIPRestrictions: false,
        },
        features: {
          ...baseConfig.features,
          enableRealTimeNotifications: true,
        },
      };

    case 'staging':
      return {
        ...baseConfig,
        database: {
          ...baseConfig.database,
          maxQueryLimit: 500,
        },
        retention: {
          ...baseConfig.retention,
          defaultRetentionDays: 90,
          archiveAfterDays: 30,
          deleteAfterDays: 90,
        },
      };

    case 'production':
    default:
      return baseConfig;
  }
}

/**
 * Validate configuration
 */
export function validateAuditConfig(config: AuditProductionConfig): string[] {
  const errors: string[] = [];

  // Validate database configuration
  if (config.database.maxQueryLimit <= 0) {
    errors.push('Database maxQueryLimit must be greater than 0');
  }

  if (config.database.defaultPageSize <= 0) {
    errors.push('Database defaultPageSize must be greater than 0');
  }

  // Validate retention configuration
  if (config.retention.defaultRetentionDays <= 0) {
    errors.push('Retention defaultRetentionDays must be greater than 0');
  }

  if (config.retention.archiveAfterDays >= config.retention.deleteAfterDays) {
    errors.push('Archive threshold must be less than deletion threshold');
  }

  // Validate export limits
  Object.entries(config.export.maxExportLimits).forEach(([role, limit]) => {
    if (limit < 0) {
      errors.push(`Export limit for role ${role} cannot be negative`);
    }
  });

  // Validate monitoring thresholds
  if (config.monitoring.alertThresholds.tableSizeGB <= 0) {
    errors.push('Table size alert threshold must be greater than 0');
  }

  if (config.monitoring.alertThresholds.queryResponseTimeMs <= 0) {
    errors.push('Query response time alert threshold must be greater than 0');
  }

  if (config.monitoring.alertThresholds.failureRatePercent < 0 || 
      config.monitoring.alertThresholds.failureRatePercent > 100) {
    errors.push('Failure rate alert threshold must be between 0 and 100');
  }

  return errors;
}

/**
 * Get configuration value with fallback
 */
export function getConfigValue<T>(
  config: AuditProductionConfig,
  path: string,
  defaultValue: T
): T {
  const keys = path.split('.');
  let current: any = config;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }

  return current !== undefined ? current : defaultValue;
}

/**
 * Production-specific audit utilities
 */
export class AuditProductionUtils {
  private static config = getAuditConfig();

  /**
   * Check if operation is allowed based on configuration
   */
  static isOperationAllowed(operation: string, userRole: string): boolean {
    switch (operation) {
      case 'export':
        const limit = this.config.export.maxExportLimits[userRole] || 0;
        return limit > 0;
      
      case 'view_dashboard':
        return this.config.features.enableAuditDashboard;
      
      case 'advanced_filtering':
        return this.config.features.enableAdvancedFiltering;
      
      default:
        return true;
    }
  }

  /**
   * Get retention period for a specific table
   */
  static getRetentionPeriod(tableName: string): number {
    return this.config.retention.tableRetention[tableName] || 
           this.config.retention.defaultRetentionDays;
  }

  /**
   * Check if archiving is due for a table
   */
  static isArchivingDue(tableName: string, lastArchiveDate: Date): boolean {
    if (!this.config.retention.enableAutoArchiving) {
      return false;
    }

    const daysSinceArchive = Math.floor(
      (Date.now() - lastArchiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceArchive >= this.config.retention.archiveAfterDays;
  }

  /**
   * Get appropriate batch size for operation
   */
  static getBatchSize(operation: 'query' | 'export' | 'archive'): number {
    switch (operation) {
      case 'query':
        return this.config.database.defaultPageSize;
      case 'export':
      case 'archive':
        return this.config.database.batchSize;
      default:
        return this.config.database.defaultPageSize;
    }
  }

  /**
   * Check if performance monitoring should be enabled
   */
  static shouldMonitorPerformance(): boolean {
    return this.config.monitoring.enablePerformanceMonitoring;
  }

  /**
   * Get alert threshold for a specific metric
   */
  static getAlertThreshold(metric: keyof AuditProductionConfig['monitoring']['alertThresholds']): number {
    return this.config.monitoring.alertThresholds[metric];
  }
}

export default AUDIT_PRODUCTION_CONFIG;