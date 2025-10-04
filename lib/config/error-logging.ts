/**
 * Error logging configuration for the transaction routing system
 * Centralizes error logging settings and provides configuration
 * for different error types and severity levels.
 */

/**
 * Error logging configuration interface
 */
export interface ErrorLoggingConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  categories: {
    validation: boolean;
    routing: boolean;
    authentication: boolean;
    database: boolean;
    performance: boolean;
  };
  aggregation: {
    enabled: boolean;
    intervalMinutes: number;
    maxErrorsPerInterval: number;
  };
  alerting: {
    enabled: boolean;
    thresholds: {
      errorRate: number; // errors per minute
      responseTime: number; // milliseconds
      failureRate: number; // percentage
    };
  };
}

/**
 * Default error logging configuration
 */
export const defaultErrorLoggingConfig: ErrorLoggingConfig = {
  enabled: true,
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  categories: {
    validation: true,
    routing: true,
    authentication: true,
    database: true,
    performance: true
  },
  aggregation: {
    enabled: true,
    intervalMinutes: 60,
    maxErrorsPerInterval: 1000
  },
  alerting: {
    enabled: process.env.NODE_ENV === 'production',
    thresholds: {
      errorRate: 10, // 10 errors per minute
      responseTime: 5000, // 5 seconds
      failureRate: 5 // 5% failure rate
    }
  }
};

/**
 * Error severity levels for different error types
 */
export const errorSeverityMap = {
  // Validation errors
  'invalid_uuid_format': 'medium',
  'invalid_input_type': 'low',
  'empty_id': 'medium',
  'invalid_format': 'medium',
  
  // Routing errors
  'route_conflict': 'high',
  'parameter_missing': 'medium',
  'invalid_route': 'medium',
  
  // Authentication errors
  'authentication_failed': 'high',
  'insufficient_permissions': 'high',
  'session_expired': 'medium',
  
  // Database errors
  'connection_failed': 'critical',
  'query_timeout': 'high',
  'data_not_found': 'low',
  'constraint_violation': 'medium',
  
  // Performance errors
  'slow_response': 'medium',
  'timeout': 'high',
  'memory_limit': 'critical'
} as const;

/**
 * Error categories for filtering and organization
 */
export const errorCategories = {
  VALIDATION: 'validation',
  ROUTING: 'routing',
  AUTHENTICATION: 'authentication',
  DATABASE: 'database',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  INTEGRATION: 'integration'
} as const;

/**
 * Error codes for transaction routing system
 */
export const errorCodes = {
  // Validation error codes
  VALIDATION_INVALID_UUID: 'VAL_001',
  VALIDATION_EMPTY_ID: 'VAL_002',
  VALIDATION_INVALID_TYPE: 'VAL_003',
  VALIDATION_INVALID_FORMAT: 'VAL_004',
  
  // Routing error codes
  ROUTING_CONFLICT: 'RTE_001',
  ROUTING_NOT_FOUND: 'RTE_002',
  ROUTING_PARAMETER_MISSING: 'RTE_003',
  ROUTING_INVALID_LOCALE: 'RTE_004',
  
  // Authentication error codes
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_001',
  AUTH_SESSION_EXPIRED: 'AUTH_002',
  AUTH_INVALID_TOKEN: 'AUTH_003',
  AUTH_USER_NOT_FOUND: 'AUTH_004',
  
  // Database error codes
  DB_CONNECTION_FAILED: 'DB_001',
  DB_QUERY_TIMEOUT: 'DB_002',
  DB_TRANSACTION_NOT_FOUND: 'DB_003',
  DB_CONSTRAINT_VIOLATION: 'DB_004',
  
  // Performance error codes
  PERF_SLOW_RESPONSE: 'PERF_001',
  PERF_TIMEOUT: 'PERF_002',
  PERF_MEMORY_LIMIT: 'PERF_003'
} as const;

/**
 * Get error logging configuration from environment variables
 */
export function getErrorLoggingConfig(): ErrorLoggingConfig {
  return {
    enabled: process.env.ERROR_LOGGING_ENABLED !== 'false',
    logLevel: (process.env.ERROR_LOG_LEVEL as any) || defaultErrorLoggingConfig.logLevel,
    categories: {
      validation: process.env.LOG_VALIDATION_ERRORS !== 'false',
      routing: process.env.LOG_ROUTING_ERRORS !== 'false',
      authentication: process.env.LOG_AUTH_ERRORS !== 'false',
      database: process.env.LOG_DATABASE_ERRORS !== 'false',
      performance: process.env.LOG_PERFORMANCE_ERRORS !== 'false'
    },
    aggregation: {
      enabled: process.env.ERROR_AGGREGATION_ENABLED !== 'false',
      intervalMinutes: parseInt(process.env.ERROR_AGGREGATION_INTERVAL || '60'),
      maxErrorsPerInterval: parseInt(process.env.MAX_ERRORS_PER_INTERVAL || '1000')
    },
    alerting: {
      enabled: process.env.ERROR_ALERTING_ENABLED === 'true',
      thresholds: {
        errorRate: parseInt(process.env.ERROR_RATE_THRESHOLD || '10'),
        responseTime: parseInt(process.env.RESPONSE_TIME_THRESHOLD || '5000'),
        failureRate: parseInt(process.env.FAILURE_RATE_THRESHOLD || '5')
      }
    }
  };
}

/**
 * Check if error logging is enabled for a specific category
 */
export function isErrorLoggingEnabled(category: keyof ErrorLoggingConfig['categories']): boolean {
  const config = getErrorLoggingConfig();
  return config.enabled && config.categories[category];
}

/**
 * Get error severity for a specific error type
 */
export function getErrorSeverity(errorType: string): string {
  return errorSeverityMap[errorType as keyof typeof errorSeverityMap] || 'medium';
}

/**
 * Format error code with prefix
 */
export function formatErrorCode(code: string): string {
  return `TXN_${code}`;
}

/**
 * Error logging middleware configuration
 */
export const errorLoggingMiddleware = {
  // Skip logging for these paths
  skipPaths: [
    '/api/health',
    '/favicon.ico',
    '/_next/static',
    '/_next/image'
  ],
  
  // Skip logging for these user agents
  skipUserAgents: [
    'bot',
    'crawler',
    'spider',
    'monitor'
  ],
  
  // Maximum request body size to log (in bytes)
  maxBodySize: 1024 * 10, // 10KB
  
  // Sensitive headers to exclude from logs
  excludeHeaders: [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token'
  ]
};

/**
 * Performance monitoring thresholds
 */
export const performanceThresholds = {
  // Route-specific thresholds (in milliseconds)
  routes: {
    '/transactions/[id]': 2000,
    '/transactions/reference-amounts': 1500,
    '/transactions': 3000
  },
  
  // Database operation thresholds
  database: {
    query: 1000,
    transaction: 2000,
    connection: 500
  },
  
  // API response thresholds
  api: {
    fast: 500,
    acceptable: 2000,
    slow: 5000
  }
};

/**
 * Error message templates for consistent messaging
 */
export const errorMessageTemplates = {
  validation: {
    invalidUuid: 'Invalid transaction ID format. Please check the URL and try again.',
    emptyId: 'Transaction ID is required. Please provide a valid transaction ID.',
    invalidType: 'Invalid transaction ID type. Expected a valid UUID string.'
  },
  routing: {
    notFound: 'The requested page could not be found. Please check the URL.',
    accessDenied: 'You do not have permission to access this page.',
    serverError: 'An unexpected error occurred. Please try again later.'
  },
  database: {
    connectionFailed: 'Unable to connect to the database. Please try again later.',
    transactionNotFound: 'The requested transaction could not be found.',
    queryTimeout: 'The request took too long to process. Please try again.'
  }
};