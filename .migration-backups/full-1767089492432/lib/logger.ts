type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }
    return levels[level] >= levels[this.logLevel]
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: context?.userId,
      sessionId: context?.sessionId
    }
  }

  private output(entry: LogEntry) {
    if (this.isDevelopment) {
      // Console output for development
      const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : ''
      const logMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}`
      
      switch (entry.level) {
        case 'debug':
          console.debug(logMessage)
          break
        case 'info':
          console.info(logMessage)
          break
        case 'warn':
          console.warn(logMessage)
          break
        case 'error':
          console.error(logMessage)
          break
      }
    } else {
      // In production, you might want to send logs to a service like Sentry, LogRocket, etc.
      // For now, we'll just use console
      console.log(JSON.stringify(entry))
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.shouldLog('debug')) {
      this.output(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: Record<string, any>) {
    if (this.shouldLog('info')) {
      this.output(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: Record<string, any>) {
    if (this.shouldLog('warn')) {
      this.output(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      }
      this.output(this.formatMessage('error', message, errorContext))
    }
  }

  // Specific logging methods for common use cases
  auth(message: string, userId?: string, context?: Record<string, any>) {
    this.info(`[AUTH] ${message}`, { ...context, userId, category: 'authentication' })
  }

  database(message: string, context?: Record<string, any>) {
    this.debug(`[DB] ${message}`, { ...context, category: 'database' })
  }

  api(message: string, method?: string, path?: string, context?: Record<string, any>) {
    this.info(`[API] ${message}`, { ...context, method, path, category: 'api' })
  }

  performance(message: string, duration?: number, context?: Record<string, any>) {
    this.info(`[PERF] ${message}`, { ...context, duration, category: 'performance' })
  }
}

// Create singleton instance
export const logger = new Logger()

// Performance measurement utility
export function measurePerformance<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>
): Promise<T> {
  const start = Date.now()
  
  return operation()
    .then(result => {
      const duration = Date.now() - start
      logger.performance(`${operationName} completed`, duration, context)
      return result
    })
    .catch(error => {
      const duration = Date.now() - start
      logger.error(`${operationName} failed after ${duration}ms`, error, context)
      throw error
    })
}

// Error boundary logging
export function logError(error: Error, context?: Record<string, any>) {
  logger.error('Unhandled error occurred', error, context)
}