import * as Sentry from '@sentry/nextjs';

export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  page?: string;
  action?: string;
  component?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorAlert {
  id: string;
  message: string;
  level: 'error' | 'warning' | 'info';
  timestamp: number;
  context: ErrorContext;
  fingerprint?: string;
  count: number;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errorCounts: Map<string, number> = new Map();
  private recentErrors: ErrorAlert[] = [];
  private maxRecentErrors = 100;

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  // Track application errors
  trackError(
    error: Error | string,
    context: ErrorContext = {},
    level: 'error' | 'warning' | 'info' = 'error'
  ): string {
    const message = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;
    
    // Filter out Next.js redirects and other expected "errors"
    const ignoredErrors = [
      'NEXT_REDIRECT',
      'NEXT_NOT_FOUND',
      'AbortError',
      'Navigation cancelled'
    ];
    
    if (ignoredErrors.some(ignored => message.includes(ignored))) {
      // These are not real errors, just Next.js internal behavior
      return 'ignored';
    }
    
    // Create fingerprint for error deduplication
    const fingerprint = this.createFingerprint(message, context);
    
    // Update error count
    const currentCount = this.errorCounts.get(fingerprint) || 0;
    this.errorCounts.set(fingerprint, currentCount + 1);
    
    // Create error alert
    const alert: ErrorAlert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      level,
      timestamp: Date.now(),
      context,
      fingerprint,
      count: currentCount + 1,
    };
    
    // Store recent error
    this.storeRecentError(alert);
    
    // Send to Sentry with enhanced context
    this.sendToSentry(error, context, level, alert);
    
    // Check if we need to send alerts
    this.checkAlertThresholds(fingerprint, currentCount + 1, alert);
    
    // Log locally with error handling
    try {
      console.error(`[Error Tracker] ${level.toUpperCase()}: ${message}`, JSON.stringify({
        context,
        count: currentCount + 1,
        fingerprint,
      }));
    } catch (logError) {
      console.warn('Error logging failed:', logError);
    }
    
    return alert.id;
  }

  // Track API errors specifically
  trackAPIError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: Error | string,
    context: ErrorContext = {}
  ): string {
    const enhancedContext: ErrorContext = {
      ...context,
      action: 'api_call',
      additionalData: {
        ...context.additionalData,
        endpoint,
        method,
        statusCode,
      },
    };

    return this.trackError(error, enhancedContext, statusCode >= 500 ? 'error' : 'warning');
  }

  // Track form errors
  trackFormError(
    formName: string,
    fieldName: string,
    error: string,
    context: ErrorContext = {}
  ): string {
    const enhancedContext: ErrorContext = {
      ...context,
      action: 'form_error',
      component: formName,
      additionalData: {
        ...context.additionalData,
        fieldName,
        formName,
      },
    };

    return this.trackError(error, enhancedContext, 'warning');
  }

  // Track performance issues
  trackPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    context: ErrorContext = {}
  ): string {
    const message = `Performance issue: ${metric} (${value}) exceeded threshold (${threshold})`;
    const enhancedContext: ErrorContext = {
      ...context,
      action: 'performance_issue',
      additionalData: {
        ...context.additionalData,
        metric,
        value,
        threshold,
      },
    };

    return this.trackError(message, enhancedContext, 'warning');
  }

  // Create fingerprint for error deduplication
  private createFingerprint(message: string, context: ErrorContext): string {
    const key = `${message}-${context.page || ''}-${context.component || ''}-${context.action || ''}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  // Store recent error for dashboard
  private storeRecentError(alert: ErrorAlert) {
    this.recentErrors.unshift(alert);
    
    // Keep only recent errors
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors = this.recentErrors.slice(0, this.maxRecentErrors);
    }
  }

  // Send to Sentry with enhanced context
  private sendToSentry(
    error: Error | string,
    context: ErrorContext,
    level: 'error' | 'warning' | 'info',
    alert: ErrorAlert
  ) {
    // Set user context if available
    if (context.userId || context.userEmail) {
      Sentry.setUser({
        id: context.userId,
        email: context.userEmail,
      });
    }

    // Set additional context
    Sentry.setContext('error_context', {
      page: context.page,
      action: context.action,
      component: context.component,
      errorId: alert.id,
      count: alert.count,
    });

    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: 'error-tracking',
      message: `Error tracked: ${alert.message}`,
      level: level as any,
      data: context.additionalData,
    });

    // Send to Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, {
        level: level as any,
        tags: {
          component: context.component,
          action: context.action,
          page: context.page,
        },
        extra: {
          ...context.additionalData,
          errorId: alert.id,
          count: alert.count,
        },
        fingerprint: [alert.fingerprint!],
      });
    } else {
      Sentry.captureMessage(error, {
        level: level as any,
        tags: {
          component: context.component,
          action: context.action,
          page: context.page,
        },
        extra: {
          ...context.additionalData,
          errorId: alert.id,
          count: alert.count,
        },
        fingerprint: [alert.fingerprint!],
      });
    }
  }

  // Check if error count exceeds alert thresholds
  private checkAlertThresholds(fingerprint: string, count: number, alert: ErrorAlert) {
    const thresholds = {
      error: [5, 10, 25, 50], // Alert at 5, 10, 25, 50 occurrences
      warning: [10, 25, 50], // Alert at 10, 25, 50 occurrences
      info: [25, 50], // Alert at 25, 50 occurrences
    };

    const levelThresholds = thresholds[alert.level] || [];
    
    if (levelThresholds.includes(count)) {
      this.sendAlert(alert, count);
    }
  }

  // Send alert for high error counts
  private sendAlert(alert: ErrorAlert, count: number) {
    console.warn(`[Error Alert] High error count: ${alert.message} (${count} occurrences)`);
    
    // Send critical alert to Sentry
    Sentry.captureMessage(`High Error Count Alert: ${alert.message}`, {
      level: 'error',
      tags: {
        alert_type: 'high_error_count',
        error_level: alert.level,
      },
      extra: {
        originalMessage: alert.message,
        count,
        fingerprint: alert.fingerprint,
        context: alert.context,
      },
    });

    // Here you could send to other alerting systems:
    // - Email notifications
    // - Slack webhooks
    // - PagerDuty
    // - Discord webhooks
  }

  // Get error statistics
  getErrorStats(hours: number = 24): {
    totalErrors: number;
    errorsByLevel: Record<string, number>;
    topErrors: Array<{ fingerprint: string; count: number; lastSeen: number }>;
    recentErrors: ErrorAlert[];
  } {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    const recentErrors = this.recentErrors.filter(e => e.timestamp > cutoff);
    
    const errorsByLevel = recentErrors.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get top errors by count
    const errorCounts = new Map<string, { count: number; lastSeen: number }>();
    recentErrors.forEach(error => {
      if (error.fingerprint) {
        const existing = errorCounts.get(error.fingerprint);
        if (existing) {
          existing.count++;
          existing.lastSeen = Math.max(existing.lastSeen, error.timestamp);
        } else {
          errorCounts.set(error.fingerprint, {
            count: 1,
            lastSeen: error.timestamp,
          });
        }
      }
    });

    const topErrors = Array.from(errorCounts.entries())
      .map(([fingerprint, data]) => ({
        fingerprint,
        count: data.count,
        lastSeen: data.lastSeen,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: recentErrors.length,
      errorsByLevel,
      topErrors,
      recentErrors: recentErrors.slice(0, 20), // Return last 20 errors
    };
  }

  // Clear old error counts (cleanup)
  clearOldErrors(hours: number = 168) { // Default: 1 week
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    this.recentErrors = this.recentErrors.filter(e => e.timestamp > cutoff);
  }

  // Get recent errors for dashboard
  getRecentErrors(limit: number = 20): ErrorAlert[] {
    return this.recentErrors.slice(0, limit);
  }
}

// Global error handler setup
export function setupGlobalErrorHandling() {
  const errorTracker = ErrorTracker.getInstance();

  // Handle unhandled errors
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      try {
        // Filter out known non-critical errors
        const errorMessage = event.error?.message || event.message || '';
        const filename = event.filename || '';
        
        // Skip Supabase Realtime callback errors (non-critical)
        if (errorMessage.includes('callback is not a function') && 
            filename.includes('RealtimeChannel')) {
          console.warn('Skipping non-critical Supabase Realtime error:', errorMessage);
          return;
        }
        
        // Skip other known non-critical errors
        if (errorMessage.includes('ResizeObserver loop limit exceeded') ||
            errorMessage.includes('Non-Error promise rejection captured')) {
          return;
        }
        
        errorTracker.trackError(event.error || event.message, {
          page: window.location.pathname,
          action: 'unhandled_error',
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      } catch (trackingError) {
        console.warn('Error tracking failed:', trackingError);
      }
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      try {
        errorTracker.trackError(event.reason, {
          page: window.location.pathname,
          action: 'unhandled_promise_rejection',
        });
      } catch (trackingError) {
        console.warn('Promise rejection tracking failed:', trackingError);
      }
    });
  }

  return errorTracker;
}

// Convenience functions
export const trackError = (error: Error | string, context?: ErrorContext, level?: 'error' | 'warning' | 'info') => {
  try {
    return ErrorTracker.getInstance().trackError(error, context, level);
  } catch (trackingError) {
    console.warn('Error tracking failed:', trackingError);
    return null;
  }
};

export const trackAPIError = (endpoint: string, method: string, statusCode: number, error: Error | string, context?: ErrorContext) => {
  return ErrorTracker.getInstance().trackAPIError(endpoint, method, statusCode, error, context);
};

export const trackFormError = (formName: string, fieldName: string, error: string, context?: ErrorContext) => {
  return ErrorTracker.getInstance().trackFormError(formName, fieldName, error, context);
};

export const trackPerformanceIssue = (metric: string, value: number, threshold: number, context?: ErrorContext) => {
  return ErrorTracker.getInstance().trackPerformanceIssue(metric, value, threshold, context);
};