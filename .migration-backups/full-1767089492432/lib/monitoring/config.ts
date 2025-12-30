// Monitoring configuration for the public website

export const monitoringConfig = {
  // Uptime monitoring settings
  uptime: {
    enabled: process.env.NODE_ENV === 'production',
    interval: 60000, // Check every minute
    timeout: 10000, // 10 second timeout
    retries: 3,
    endpoints: [
      '/',
      '/api/health',
      '/api/contact',
      '/api/analytics/web-vitals',
      '/services',
      '/portfolio',
      '/about',
    ],
    alertThresholds: {
      responseTime: 2000, // Alert if response time > 2s
      uptime: 99.0, // Alert if uptime < 99%
      consecutiveFailures: 3, // Alert after 3 consecutive failures
    },
  },

  // Error tracking settings
  errorTracking: {
    enabled: true,
    alertThresholds: {
      error: [5, 10, 25, 50], // Alert at these error counts
      warning: [10, 25, 50],
      info: [25, 50],
    },
    retentionHours: 168, // Keep errors for 1 week
    maxRecentErrors: 100,
    ignoredErrors: [
      'NetworkError',
      'ResizeObserver',
      'Non-Error promise rejection captured',
    ],
  },

  // Performance monitoring settings
  performance: {
    enabled: true,
    webVitals: {
      enabled: true,
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      thresholds: {
        LCP: { good: 2500, poor: 4000 },
        FID: { good: 100, poor: 300 },
        CLS: { good: 0.1, poor: 0.25 },
        FCP: { good: 1800, poor: 3000 },
        TTFB: { good: 800, poor: 1800 },
      },
    },
    longTasks: {
      enabled: true,
      threshold: 50, // Alert on tasks > 50ms
      criticalThreshold: 100, // Critical alert on tasks > 100ms
    },
    resourceTiming: {
      enabled: true,
      slowResourceThreshold: 2000, // Alert on resources > 2s
    },
  },

  // Analytics settings
  analytics: {
    enabled: true,
    userBehavior: {
      enabled: true,
      trackScrollDepth: true,
      trackInteractions: true,
      trackFormEvents: true,
      inactivityTimeout: 30000, // 30 seconds
    },
    sessionTracking: {
      enabled: true,
      maxSessionDuration: 30 * 60 * 1000, // 30 minutes
      extendOnActivity: true,
    },
  },

  // Alerting settings
  alerting: {
    enabled: process.env.NODE_ENV === 'production',
    channels: {
      sentry: {
        enabled: true,
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      },
      email: {
        enabled: false, // Configure if needed
        recipients: [],
      },
      slack: {
        enabled: false, // Configure if needed
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
      },
      discord: {
        enabled: false, // Configure if needed
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
      },
    },
    rateLimiting: {
      enabled: true,
      maxAlertsPerHour: 10,
      cooldownMinutes: 15,
    },
  },

  // Dashboard settings
  dashboard: {
    enabled: true,
    refreshInterval: 30000, // 30 seconds
    dataRetentionHours: 24,
    realTimeUpdates: true,
  },

  // Environment-specific overrides
  environments: {
    development: {
      uptime: { enabled: false },
      alerting: { enabled: false },
      performance: { webVitals: { sampleRate: 1.0 } },
    },
    staging: {
      uptime: { interval: 120000 }, // Check every 2 minutes
      alerting: { enabled: true },
    },
    production: {
      uptime: { interval: 60000 }, // Check every minute
      alerting: { enabled: true },
      performance: { webVitals: { sampleRate: 0.1 } },
    },
  },
};

// Get environment-specific config
export function getMonitoringConfig() {
  const env = process.env.NODE_ENV || 'development';
  const baseConfig = { ...monitoringConfig };
  const envOverrides = monitoringConfig.environments[env as keyof typeof monitoringConfig.environments] || {};

  // Deep merge environment overrides
  return mergeDeep(baseConfig, envOverrides);
}

// Deep merge utility
function mergeDeep(target: any, source: any): any {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Export specific configs for easy access
export const uptimeConfig = getMonitoringConfig().uptime;
export const errorTrackingConfig = getMonitoringConfig().errorTracking;
export const performanceConfig = getMonitoringConfig().performance;
export const analyticsConfig = getMonitoringConfig().analytics;
export const alertingConfig = getMonitoringConfig().alerting;
export const dashboardConfig = getMonitoringConfig().dashboard;