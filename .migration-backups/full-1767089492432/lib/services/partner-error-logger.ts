/**
 * Partner Error Logger and Monitoring Service
 * 
 * Provides comprehensive error logging, monitoring, and alerting
 * specifically for partner dashboard operations.
 */

import { PartnerErrorCodes, PartnerError } from '@/types/partner';
import { PartnerErrorSeverity, PartnerErrorContext } from './partner-error-handler';

export interface PartnerErrorLog {
  id: string;
  timestamp: string;
  severity: PartnerErrorSeverity;
  code: PartnerErrorCodes;
  message: string;
  stack?: string;
  context: PartnerErrorContext;
  user_agent?: string;
  ip_address?: string;
  resolved: boolean;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface PartnerErrorMetrics {
  total_errors: number;
  errors_by_severity: Record<PartnerErrorSeverity, number>;
  errors_by_code: Record<PartnerErrorCodes, number>;
  errors_by_partner: Record<string, number>;
  error_rate_per_hour: number;
  most_common_errors: Array<{
    code: PartnerErrorCodes;
    count: number;
    percentage: number;
  }>;
  resolution_time_avg: number;
  unresolved_count: number;
}

export class PartnerErrorLogger {
  private static logs: PartnerErrorLog[] = [];
  private static readonly MAX_LOGS = 10000; // Keep last 10k logs in memory
  private static readonly ALERT_THRESHOLDS = {
    [PartnerErrorSeverity.CRITICAL]: 1, // Alert immediately
    [PartnerErrorSeverity.HIGH]: 5, // Alert after 5 errors in 1 hour
    [PartnerErrorSeverity.MEDIUM]: 20, // Alert after 20 errors in 1 hour
    [PartnerErrorSeverity.LOW]: 100 // Alert after 100 errors in 1 hour
  };

  /**
   * Log a partner error with full context
   */
  static logError(
    error: Error | PartnerError | string,
    code: PartnerErrorCodes,
    context: PartnerErrorContext,
    severity: PartnerErrorSeverity = PartnerErrorSeverity.MEDIUM
  ): string {
    const errorId = this.generateErrorId();
    const errorMessage = error instanceof Error ? error.message : error.toString();
    const stack = error instanceof Error ? error.stack : undefined;

    const logEntry: PartnerErrorLog = {
      id: errorId,
      timestamp: new Date().toISOString(),
      severity,
      code,
      message: errorMessage,
      stack,
      context,
      resolved: false
    };

    // Add to in-memory logs
    this.logs.unshift(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    // Console logging based on severity
    this.consoleLog(logEntry);

    // Check if we need to send alerts
    this.checkAlertThresholds(severity, code);

    // In production, persist to database or external service
    if (process.env.NODE_ENV === 'production') {
      this.persistError(logEntry);
    }

    return errorId;
  }

  /**
   * Log partner authentication errors
   */
  static logAuthError(
    partnerId: string,
    operation: string,
    error: string,
    context?: Partial<PartnerErrorContext>
  ): string {
    return this.logError(
      new Error(error),
      PartnerErrorCodes.PARTNER_NOT_APPROVED,
      {
        operation: `auth_${operation}`,
        partner_id: partnerId,
        ...context
      },
      PartnerErrorSeverity.MEDIUM
    );
  }

  /**
   * Log partner registration errors
   */
  static logRegistrationError(
    email: string,
    validationErrors: string[],
    context?: Partial<PartnerErrorContext>
  ): string {
    return this.logError(
      new Error(`Registration failed: ${validationErrors.join(', ')}`),
      PartnerErrorCodes.INVALID_REGISTRATION_DATA,
      {
        operation: 'partner_registration',
        user_id: email,
        ...context
      },
      PartnerErrorSeverity.LOW
    );
  }

  /**
   * Log partner dashboard access errors
   */
  static logDashboardError(
    partnerId: string,
    operation: string,
    error: Error,
    context?: Partial<PartnerErrorContext>
  ): string {
    let code = PartnerErrorCodes.PARTNER_NOT_FOUND;
    let severity = PartnerErrorSeverity.MEDIUM;

    // Determine error code based on error message
    if (error.message.includes('not approved')) {
      code = PartnerErrorCodes.PARTNER_NOT_APPROVED;
      severity = PartnerErrorSeverity.LOW;
    } else if (error.message.includes('rejected')) {
      code = PartnerErrorCodes.PARTNER_REJECTED;
      severity = PartnerErrorSeverity.MEDIUM;
    } else if (error.message.includes('suspended')) {
      code = PartnerErrorCodes.PARTNER_SUSPENDED;
      severity = PartnerErrorSeverity.HIGH;
    } else if (error.message.includes('property') || error.message.includes('loft')) {
      code = PartnerErrorCodes.PROPERTY_NOT_OWNED;
      severity = PartnerErrorSeverity.MEDIUM;
    }

    return this.logError(
      error,
      code,
      {
        operation: `dashboard_${operation}`,
        partner_id: partnerId,
        ...context
      },
      severity
    );
  }

  /**
   * Log property access errors
   */
  static logPropertyAccessError(
    partnerId: string,
    loftId: string,
    operation: string,
    context?: Partial<PartnerErrorContext>
  ): string {
    return this.logError(
      new Error(`Property access denied: ${loftId}`),
      PartnerErrorCodes.PROPERTY_NOT_OWNED,
      {
        operation: `property_${operation}`,
        partner_id: partnerId,
        loft_id: loftId,
        ...context
      },
      PartnerErrorSeverity.MEDIUM
    );
  }

  /**
   * Get error logs with filtering options
   */
  static getErrorLogs(options: {
    severity?: PartnerErrorSeverity;
    code?: PartnerErrorCodes;
    partner_id?: string;
    resolved?: boolean;
    limit?: number;
    since?: Date;
  } = {}): PartnerErrorLog[] {
    let filteredLogs = [...this.logs];

    if (options.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === options.severity);
    }

    if (options.code) {
      filteredLogs = filteredLogs.filter(log => log.code === options.code);
    }

    if (options.partner_id) {
      filteredLogs = filteredLogs.filter(log => log.context.partner_id === options.partner_id);
    }

    if (options.resolved !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.resolved === options.resolved);
    }

    if (options.since) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= options.since!);
    }

    if (options.limit) {
      filteredLogs = filteredLogs.slice(0, options.limit);
    }

    return filteredLogs;
  }

  /**
   * Get error metrics and statistics
   */
  static getErrorMetrics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): PartnerErrorMetrics {
    const now = new Date();
    const since = new Date();
    
    switch (timeRange) {
      case 'hour':
        since.setHours(now.getHours() - 1);
        break;
      case 'day':
        since.setDate(now.getDate() - 1);
        break;
      case 'week':
        since.setDate(now.getDate() - 7);
        break;
      case 'month':
        since.setMonth(now.getMonth() - 1);
        break;
    }

    const recentLogs = this.getErrorLogs({ since });
    
    const errorsBySeverity = recentLogs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<PartnerErrorSeverity, number>);

    const errorsByCode = recentLogs.reduce((acc, log) => {
      acc[log.code] = (acc[log.code] || 0) + 1;
      return acc;
    }, {} as Record<PartnerErrorCodes, number>);

    const errorsByPartner = recentLogs.reduce((acc, log) => {
      if (log.context.partner_id) {
        acc[log.context.partner_id] = (acc[log.context.partner_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const mostCommonErrors = Object.entries(errorsByCode)
      .map(([code, count]) => ({
        code: code as PartnerErrorCodes,
        count,
        percentage: (count / recentLogs.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const resolvedLogs = recentLogs.filter(log => log.resolved && log.resolved_at);
    const avgResolutionTime = resolvedLogs.length > 0
      ? resolvedLogs.reduce((acc, log) => {
          const created = new Date(log.timestamp).getTime();
          const resolved = new Date(log.resolved_at!).getTime();
          return acc + (resolved - created);
        }, 0) / resolvedLogs.length
      : 0;

    const hoursInRange = timeRange === 'hour' ? 1 : 
                        timeRange === 'day' ? 24 : 
                        timeRange === 'week' ? 168 : 720;

    return {
      total_errors: recentLogs.length,
      errors_by_severity: errorsBySeverity,
      errors_by_code: errorsByCode,
      errors_by_partner: errorsByPartner,
      error_rate_per_hour: recentLogs.length / hoursInRange,
      most_common_errors: mostCommonErrors,
      resolution_time_avg: avgResolutionTime,
      unresolved_count: recentLogs.filter(log => !log.resolved).length
    };
  }

  /**
   * Mark an error as resolved
   */
  static resolveError(errorId: string, resolvedBy: string, notes?: string): boolean {
    const logIndex = this.logs.findIndex(log => log.id === errorId);
    
    if (logIndex === -1) {
      return false;
    }

    this.logs[logIndex] = {
      ...this.logs[logIndex],
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
      resolution_notes: notes
    };

    return true;
  }

  /**
   * Get partner-specific error summary
   */
  static getPartnerErrorSummary(partnerId: string, days: number = 7): {
    total_errors: number;
    recent_errors: PartnerErrorLog[];
    error_trend: 'increasing' | 'decreasing' | 'stable';
    most_common_error: PartnerErrorCodes | null;
  } {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const partnerLogs = this.getErrorLogs({ partner_id: partnerId, since });
    
    // Calculate trend (compare first half vs second half of period)
    const midpoint = new Date(since.getTime() + (Date.now() - since.getTime()) / 2);
    const firstHalf = partnerLogs.filter(log => new Date(log.timestamp) < midpoint).length;
    const secondHalf = partnerLogs.filter(log => new Date(log.timestamp) >= midpoint).length;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (secondHalf > firstHalf * 1.2) {
      trend = 'increasing';
    } else if (secondHalf < firstHalf * 0.8) {
      trend = 'decreasing';
    }

    // Find most common error
    const errorCounts = partnerLogs.reduce((acc, log) => {
      acc[log.code] = (acc[log.code] || 0) + 1;
      return acc;
    }, {} as Record<PartnerErrorCodes, number>);

    const mostCommonError = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as PartnerErrorCodes || null;

    return {
      total_errors: partnerLogs.length,
      recent_errors: partnerLogs.slice(0, 10),
      error_trend: trend,
      most_common_error: mostCommonError
    };
  }

  /**
   * Export error logs for analysis
   */
  static exportErrorLogs(format: 'json' | 'csv' = 'json', options: {
    since?: Date;
    severity?: PartnerErrorSeverity;
    partner_id?: string;
  } = {}): string {
    const logs = this.getErrorLogs(options);

    if (format === 'csv') {
      const headers = [
        'ID', 'Timestamp', 'Severity', 'Code', 'Message', 'Partner ID', 
        'Operation', 'Resolved', 'Resolution Notes'
      ];
      
      const rows = logs.map(log => [
        log.id,
        log.timestamp,
        log.severity,
        log.code,
        log.message.replace(/"/g, '""'),
        log.context.partner_id || '',
        log.context.operation,
        log.resolved ? 'Yes' : 'No',
        log.resolution_notes?.replace(/"/g, '""') || ''
      ]);

      return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Private helper methods
   */
  private static generateErrorId(): string {
    return `partner_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static consoleLog(logEntry: PartnerErrorLog): void {
    const logMessage = {
      id: logEntry.id,
      timestamp: logEntry.timestamp,
      severity: logEntry.severity,
      code: logEntry.code,
      message: logEntry.message,
      context: logEntry.context
    };

    switch (logEntry.severity) {
      case PartnerErrorSeverity.CRITICAL:
        console.error('[PARTNER CRITICAL]', logMessage);
        break;
      case PartnerErrorSeverity.HIGH:
        console.error('[PARTNER HIGH]', logMessage);
        break;
      case PartnerErrorSeverity.MEDIUM:
        console.warn('[PARTNER MEDIUM]', logMessage);
        break;
      case PartnerErrorSeverity.LOW:
        console.info('[PARTNER LOW]', logMessage);
        break;
    }
  }

  private static checkAlertThresholds(severity: PartnerErrorSeverity, code: PartnerErrorCodes): void {
    const threshold = this.ALERT_THRESHOLDS[severity];
    const recentErrors = this.getErrorLogs({ 
      severity, 
      since: new Date(Date.now() - 60 * 60 * 1000) // Last hour
    });

    if (recentErrors.length >= threshold) {
      this.sendAlert(severity, code, recentErrors.length);
    }
  }

  private static sendAlert(severity: PartnerErrorSeverity, code: PartnerErrorCodes, count: number): void {
    // In production, send to alerting system (Slack, email, etc.)
    console.warn(`[PARTNER ALERT] ${severity.toUpperCase()} - ${code}: ${count} errors in the last hour`);
    
    // TODO: Implement actual alerting
    // Example: Send to Slack webhook, email, or monitoring service
  }

  private static async persistError(logEntry: PartnerErrorLog): Promise<void> {
    try {
      // TODO: Persist to database or external logging service
      // Example: Send to Supabase, MongoDB, or external logging service
      
      // For now, just log that we would persist
      console.log('[PARTNER ERROR PERSIST]', logEntry.id);
    } catch (error) {
      console.error('[PARTNER ERROR PERSIST FAILED]', error);
    }
  }
}

// Utility functions for common error logging scenarios

export function logPartnerError(
  error: Error | string,
  context: Partial<PartnerErrorContext> = {}
): string {
  return PartnerErrorLogger.logError(
    error,
    PartnerErrorCodes.PARTNER_NOT_FOUND,
    {
      operation: 'unknown',
      ...context
    }
  );
}

export function logPartnerAuthFailure(
  partnerId: string,
  reason: string,
  context: Partial<PartnerErrorContext> = {}
): string {
  return PartnerErrorLogger.logAuthError(partnerId, 'login_failure', reason, context);
}

export function logPartnerRegistrationFailure(
  email: string,
  errors: string[],
  context: Partial<PartnerErrorContext> = {}
): string {
  return PartnerErrorLogger.logRegistrationError(email, errors, context);
}

export function logPartnerPropertyAccess(
  partnerId: string,
  loftId: string,
  context: Partial<PartnerErrorContext> = {}
): string {
  return PartnerErrorLogger.logPropertyAccessError(partnerId, loftId, 'access_denied', context);
}