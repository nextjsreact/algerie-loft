/**
 * Comprehensive Logging Service for Reservation System
 * 
 * Provides structured logging with different levels, context tracking,
 * and integration with monitoring systems for debugging reservation issues.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum LogCategory {
  RESERVATION = 'reservation',
  LOFT = 'loft',
  VALIDATION = 'validation',
  DATABASE = 'database',
  API = 'api',
  AUTHENTICATION = 'authentication',
  PAYMENT = 'payment',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  SYSTEM = 'system'
}

export interface LogContext {
  request_id?: string;
  user_id?: string;
  session_id?: string;
  loft_id?: string;
  reservation_id?: string;
  operation?: string;
  ip_address?: string;
  user_agent?: string;
  correlation_id?: string;
  trace_id?: string;
  span_id?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: LogContext;
  data?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration_ms: number;
    memory_usage?: number;
    cpu_usage?: number;
  };
  tags?: string[];
}

export interface LogFilter {
  level?: LogLevel;
  category?: LogCategory;
  start_time?: string;
  end_time?: string;
  request_id?: string;
  user_id?: string;
  loft_id?: string;
  reservation_id?: string;
  search_term?: string;
}

/**
 * Comprehensive Logging Service Class
 * 
 * Provides structured logging with context tracking, performance monitoring,
 * and integration capabilities for external monitoring systems.
 */
export class LoggingService {
  private static instance: LoggingService;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 1000;
  private readonly flushInterval = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    // Start periodic flush
    this.startPeriodicFlush();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Log debug information
   */
  debug(message: string, context?: LogContext, data?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, LogCategory.SYSTEM, message, context, data);
  }

  /**
   * Log informational messages
   */
  info(message: string, category: LogCategory = LogCategory.SYSTEM, context?: LogContext, data?: Record<string, any>): void {
    this.log(LogLevel.INFO, category, message, context, data);
  }

  /**
   * Log warning messages
   */
  warn(message: string, category: LogCategory = LogCategory.SYSTEM, context?: LogContext, data?: Record<string, any>): void {
    this.log(LogLevel.WARN, category, message, context, data);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error, category: LogCategory = LogCategory.SYSTEM, context?: LogContext, data?: Record<string, any>): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: (error as any).code
    } : undefined;

    this.log(LogLevel.ERROR, category, message, context, data, errorData);
  }

  /**
   * Log critical errors
   */
  critical(message: string, error?: Error, category: LogCategory = LogCategory.SYSTEM, context?: LogContext, data?: Record<string, any>): void {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    } : undefined;

    this.log(LogLevel.CRITICAL, category, message, context, data, errorData);
    
    // Immediately flush critical errors
    this.flush();
  }

  /**
   * Log reservation-specific events
   */
  logReservation(
    level: LogLevel,
    message: string,
    reservationId?: string,
    loftId?: string,
    context?: LogContext,
    data?: Record<string, any>
  ): void {
    const reservationContext: LogContext = {
      ...context,
      reservation_id: reservationId,
      loft_id: loftId,
      operation: context?.operation || 'reservation_operation'
    };

    this.log(level, LogCategory.RESERVATION, message, reservationContext, data);
  }

  /**
   * Log validation events
   */
  logValidation(
    level: LogLevel,
    message: string,
    validationErrors?: string[],
    context?: LogContext
  ): void {
    const data = validationErrors ? { validation_errors: validationErrors } : undefined;
    this.log(level, LogCategory.VALIDATION, message, context, data);
  }

  /**
   * Log database operations
   */
  logDatabase(
    level: LogLevel,
    message: string,
    operation: string,
    table?: string,
    context?: LogContext,
    data?: Record<string, any>
  ): void {
    const dbContext: LogContext = {
      ...context,
      operation
    };

    const dbData = {
      ...data,
      table,
      operation
    };

    this.log(level, LogCategory.DATABASE, message, dbContext, dbData);
  }

  /**
   * Log API requests and responses
   */
  logAPI(
    level: LogLevel,
    message: string,
    method: string,
    endpoint: string,
    statusCode?: number,
    responseTime?: number,
    context?: LogContext,
    data?: Record<string, any>
  ): void {
    const apiContext: LogContext = {
      ...context,
      operation: `${method} ${endpoint}`
    };

    const apiData = {
      ...data,
      method,
      endpoint,
      status_code: statusCode,
      response_time_ms: responseTime
    };

    const performance = responseTime ? {
      duration_ms: responseTime,
      memory_usage: process.memoryUsage().heapUsed,
    } : undefined;

    this.log(level, LogCategory.API, message, apiContext, apiData, undefined, performance);
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    message: string,
    operation: string,
    durationMs: number,
    context?: LogContext,
    additionalMetrics?: Record<string, number>
  ): void {
    const performanceData = {
      operation,
      ...additionalMetrics
    };

    const performance = {
      duration_ms: durationMs,
      memory_usage: process.memoryUsage().heapUsed,
    };

    this.log(LogLevel.INFO, LogCategory.PERFORMANCE, message, context, performanceData, undefined, performance);
  }

  /**
   * Log security events
   */
  logSecurity(
    level: LogLevel,
    message: string,
    securityEvent: string,
    context?: LogContext,
    data?: Record<string, any>
  ): void {
    const securityContext: LogContext = {
      ...context,
      operation: securityEvent
    };

    const securityData = {
      ...data,
      security_event: securityEvent,
      timestamp: new Date().toISOString()
    };

    this.log(level, LogCategory.SECURITY, message, securityContext, securityData, undefined, undefined, ['security']);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext,
    data?: Record<string, any>,
    error?: { name: string; message: string; stack?: string; code?: string },
    performance?: { duration_ms: number; memory_usage?: number; cpu_usage?: number },
    tags?: string[]
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
      data,
      error,
      performance,
      tags
    };

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Console output based on level and environment
    this.outputToConsole(logEntry);

    // Flush if buffer is full
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }

    // Send critical errors immediately to external services
    if (level === LogLevel.CRITICAL) {
      this.sendToExternalServices(logEntry);
    }
  }

  /**
   * Output log entry to console with appropriate formatting
   */
  private outputToConsole(entry: LogEntry): void {
    const { timestamp, level, category, message, context, data, error } = entry;
    
    // Create formatted message
    const contextStr = context?.request_id ? `[${context.request_id}]` : '';
    const categoryStr = `[${category.toUpperCase()}]`;
    const formattedMessage = `${timestamp} ${categoryStr} ${contextStr} ${message}`;

    // Output based on level
    switch (level) {
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(formattedMessage, data);
        }
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, error || data);
        break;
      case LogLevel.CRITICAL:
        console.error(`🚨 CRITICAL: ${formattedMessage}`, error || data);
        break;
    }
  }

  /**
   * Flush log buffer to external services
   */
  private flush(): void {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // Send to external logging services in production
    if (process.env.NODE_ENV === 'production') {
      this.sendBatchToExternalServices(logsToFlush);
    }

    // Store in local storage for development
    if (process.env.NODE_ENV === 'development') {
      this.storeLogsLocally(logsToFlush);
    }
  }

  /**
   * Send logs to external monitoring services
   */
  private sendToExternalServices(entry: LogEntry): void {
    // TODO: Implement integration with external services
    // Examples:
    // - Sentry for error tracking
    // - DataDog for monitoring
    // - CloudWatch for AWS
    // - Custom logging endpoint

    if (process.env.NODE_ENV === 'production') {
      // Example Sentry integration
      // Sentry.captureException(new Error(entry.message), {
      //   level: entry.level as any,
      //   tags: entry.tags,
      //   extra: {
      //     category: entry.category,
      //     context: entry.context,
      //     data: entry.data
      //   }
      // });

      // Example custom logging endpoint
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // }).catch(console.error);
    }
  }

  /**
   * Send batch of logs to external services
   */
  private sendBatchToExternalServices(entries: LogEntry[]): void {
    // TODO: Implement batch sending to external services
    if (process.env.NODE_ENV === 'production') {
      // Example batch endpoint
      // fetch('/api/logs/batch', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ logs: entries })
      // }).catch(console.error);
    }
  }

  /**
   * Store logs locally for development
   */
  private storeLogsLocally(entries: LogEntry[]): void {
    // In development, we can store logs in a local file or database
    // This is useful for debugging and testing
    
    if (process.env.NODE_ENV === 'development') {
      // Could write to a local file or development database
      console.debug(`Flushed ${entries.length} log entries`);
    }
  }

  /**
   * Start periodic flush timer
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop periodic flush timer
   */
  stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Get logs based on filters (for debugging/monitoring dashboard)
   */
  getLogs(filter: LogFilter, limit: number = 100): LogEntry[] {
    // This would typically query a database or external service
    // For now, return from buffer (limited functionality)
    
    let filteredLogs = [...this.logBuffer];

    if (filter.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filter.category);
    }

    if (filter.request_id) {
      filteredLogs = filteredLogs.filter(log => log.context?.request_id === filter.request_id);
    }

    if (filter.user_id) {
      filteredLogs = filteredLogs.filter(log => log.context?.user_id === filter.user_id);
    }

    if (filter.loft_id) {
      filteredLogs = filteredLogs.filter(log => log.context?.loft_id === filter.loft_id);
    }

    if (filter.reservation_id) {
      filteredLogs = filteredLogs.filter(log => log.context?.reservation_id === filter.reservation_id);
    }

    if (filter.search_term) {
      const searchTerm = filter.search_term.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        JSON.stringify(log.data || {}).toLowerCase().includes(searchTerm)
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filteredLogs.slice(0, limit);
  }

  /**
   * Get log statistics
   */
  getLogStats(): {
    total: number;
    by_level: Record<LogLevel, number>;
    by_category: Record<LogCategory, number>;
    recent_errors: number;
  } {
    const stats = {
      total: this.logBuffer.length,
      by_level: {} as Record<LogLevel, number>,
      by_category: {} as Record<LogCategory, number>,
      recent_errors: 0
    };

    // Initialize counters
    Object.values(LogLevel).forEach(level => {
      stats.by_level[level] = 0;
    });

    Object.values(LogCategory).forEach(category => {
      stats.by_category[category] = 0;
    });

    // Count logs
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    this.logBuffer.forEach(log => {
      stats.by_level[log.level]++;
      stats.by_category[log.category]++;
      
      if ((log.level === LogLevel.ERROR || log.level === LogLevel.CRITICAL) &&
          new Date(log.timestamp) > oneHourAgo) {
        stats.recent_errors++;
      }
    });

    return stats;
  }

  /**
   * Clear log buffer (for testing or maintenance)
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Shutdown logging service gracefully
   */
  shutdown(): void {
    this.stopPeriodicFlush();
    this.flush(); // Final flush
  }
}

/**
 * Convenience functions for common logging scenarios
 */

// Get singleton instance
export const logger = LoggingService.getInstance();

// Reservation-specific logging helpers
export const reservationLogger = {
  created: (reservationId: string, loftId: string, context?: LogContext, data?: Record<string, any>) => {
    logger.logReservation(LogLevel.INFO, 'Reservation created successfully', reservationId, loftId, context, data);
  },
  
  failed: (error: string, loftId?: string, context?: LogContext, data?: Record<string, any>) => {
    logger.logReservation(LogLevel.ERROR, `Reservation creation failed: ${error}`, undefined, loftId, context, data);
  },
  
  validated: (reservationId: string, loftId: string, context?: LogContext) => {
    logger.logReservation(LogLevel.DEBUG, 'Reservation data validated', reservationId, loftId, context);
  },
  
  validationFailed: (errors: string[], loftId?: string, context?: LogContext) => {
    logger.logValidation(LogLevel.WARN, 'Reservation validation failed', errors, context);
  }
};

// API logging helpers
export const apiLogger = {
  request: (method: string, endpoint: string, context?: LogContext, data?: Record<string, any>) => {
    logger.logAPI(LogLevel.INFO, `API request received`, method, endpoint, undefined, undefined, context, data);
  },
  
  response: (method: string, endpoint: string, statusCode: number, responseTime: number, context?: LogContext) => {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    logger.logAPI(level, `API response sent`, method, endpoint, statusCode, responseTime, context);
  },
  
  error: (method: string, endpoint: string, error: Error, context?: LogContext) => {
    logger.logAPI(LogLevel.ERROR, `API error occurred: ${error.message}`, method, endpoint, 500, undefined, context);
  }
};

// Database logging helpers
export const dbLogger = {
  query: (operation: string, table: string, context?: LogContext, data?: Record<string, any>) => {
    logger.logDatabase(LogLevel.DEBUG, `Database query executed`, operation, table, context, data);
  },
  
  error: (operation: string, table: string, error: Error, context?: LogContext) => {
    logger.logDatabase(LogLevel.ERROR, `Database error: ${error.message}`, operation, table, context, { error_code: (error as any).code });
  },
  
  slowQuery: (operation: string, table: string, duration: number, context?: LogContext) => {
    logger.logDatabase(LogLevel.WARN, `Slow database query detected`, operation, table, context, { duration_ms: duration });
  }
};

/**
 * Middleware for automatic request logging
 */
export function createLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add request ID to request object
    req.requestId = requestId;
    
    const context: LogContext = {
      request_id: requestId,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    };

    // Log request
    apiLogger.request(req.method, req.path, context, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const responseTime = Date.now() - startTime;
      apiLogger.response(req.method, req.path, res.statusCode, responseTime, context);
      originalEnd.apply(res, args);
    };

    next();
  };
}

/**
 * Error boundary for logging unhandled errors
 */
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.critical('Unhandled Promise Rejection', reason instanceof Error ? reason : new Error(String(reason)), LogCategory.SYSTEM);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.critical('Uncaught Exception', error, LogCategory.SYSTEM);
    
    // Graceful shutdown
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle process termination
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully', LogCategory.SYSTEM);
    logger.shutdown();
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully', LogCategory.SYSTEM);
    logger.shutdown();
  });
}