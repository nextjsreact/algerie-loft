import { ErrorTracker, ErrorContext } from '@/lib/monitoring/error-tracking'
import { reservationAuditService } from './reservation-audit-service'
import { logger } from '@/lib/logger'

/**
 * Specialized error tracking service for reservation flow
 * Requirements: 10.2, 10.4
 */

export interface ReservationError {
  id: string
  reservation_id?: string
  error_type: ReservationErrorType
  error_code: string
  message: string
  stack?: string
  user_id?: string
  session_id?: string
  ip_address?: string
  user_agent?: string
  step: ReservationStep
  context: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  resolved: boolean
  resolution_notes?: string
}

export type ReservationErrorType = 
  | 'validation_error'
  | 'availability_error'
  | 'pricing_error'
  | 'payment_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'database_error'
  | 'network_error'
  | 'system_error'
  | 'business_logic_error'
  | 'integration_error'

export type ReservationStep = 
  | 'authentication'
  | 'loft_search'
  | 'availability_check'
  | 'pricing_calculation'
  | 'guest_info_entry'
  | 'terms_acceptance'
  | 'payment_processing'
  | 'reservation_creation'
  | 'confirmation_email'
  | 'post_booking'

export interface ErrorPattern {
  pattern_id: string
  error_type: ReservationErrorType
  step: ReservationStep
  frequency: number
  first_occurrence: string
  last_occurrence: string
  affected_users: number
  resolution_priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface ErrorAnalytics {
  total_errors: number
  errors_by_type: Record<ReservationErrorType, number>
  errors_by_step: Record<ReservationStep, number>
  error_rate_trend: Array<{ date: string; count: number }>
  top_error_patterns: ErrorPattern[]
  user_impact: {
    affected_users: number
    conversion_impact: number
    revenue_impact: number
  }
}

export class ReservationErrorTrackingService {
  private errorTracker: ErrorTracker
  private errorStore: Map<string, ReservationError> = new Map()

  constructor() {
    this.errorTracker = ErrorTracker.getInstance()
  }

  /**
   * Track a reservation-specific error with detailed context
   * Requirements: 10.2, 10.4
   */
  async trackReservationError(
    error: Error | string,
    errorType: ReservationErrorType,
    step: ReservationStep,
    context: {
      reservation_id?: string
      user_id?: string
      session_id?: string
      ip_address?: string
      user_agent?: string
      loft_id?: string
      check_in_date?: string
      check_out_date?: string
      guest_count?: number
      pricing_data?: any
      additional_data?: Record<string, any>
    }
  ): Promise<string> {
    try {
      const errorMessage = error instanceof Error ? error.message : error
      const errorStack = error instanceof Error ? error.stack : undefined
      
      // Generate unique error ID
      const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Determine error severity
      const severity = this.determineErrorSeverity(errorType, step, errorMessage)
      
      // Generate error code
      const errorCode = this.generateErrorCode(errorType, step)

      // Create reservation error record
      const reservationError: ReservationError = {
        id: errorId,
        reservation_id: context.reservation_id,
        error_type: errorType,
        error_code: errorCode,
        message: errorMessage,
        stack: errorStack,
        user_id: context.user_id,
        session_id: context.session_id,
        ip_address: context.ip_address,
        user_agent: context.user_agent,
        step,
        context: {
          loft_id: context.loft_id,
          check_in_date: context.check_in_date,
          check_out_date: context.check_out_date,
          guest_count: context.guest_count,
          pricing_data: context.pricing_data,
          ...context.additional_data
        },
        severity,
        timestamp: new Date().toISOString(),
        resolved: false
      }

      // Store error locally for analytics
      this.errorStore.set(errorId, reservationError)

      // Log to audit service if reservation ID is available
      if (context.reservation_id) {
        await reservationAuditService.logAuditEvent({
          reservation_id: context.reservation_id,
          action: 'security_event',
          user_id: context.user_id,
          user_type: 'system',
          session_id: context.session_id,
          ip_address: context.ip_address,
          user_agent: context.user_agent,
          new_values: {
            error_id: errorId,
            error_type: errorType,
            error_code: errorCode,
            step,
            severity,
            message: errorMessage
          },
          notes: `Error in ${step}: ${errorMessage}`
        })
      }

      // Track in general error tracking system
      const generalErrorContext: ErrorContext = {
        userId: context.user_id,
        page: `/reservations/${step}`,
        action: step,
        component: 'reservation_flow',
        additionalData: {
          error_id: errorId,
          error_type: errorType,
          error_code: errorCode,
          reservation_id: context.reservation_id,
          step,
          severity,
          ...context
        }
      }

      this.errorTracker.trackError(error, generalErrorContext, severity === 'critical' ? 'error' : 'warning')

      // Log with appropriate level
      const logLevel = severity === 'critical' || severity === 'high' ? 'error' : 'warn'
      logger[logLevel](`[RESERVATION ERROR] ${errorType} in ${step}`, {
        error_id: errorId,
        error_code: errorCode,
        message: errorMessage,
        severity,
        user_id: context.user_id,
        reservation_id: context.reservation_id,
        context
      })

      // Send immediate alerts for critical errors
      if (severity === 'critical') {
        await this.sendCriticalErrorAlert(reservationError)
      }

      // Check for error patterns
      await this.analyzeErrorPatterns(reservationError)

      return errorId

    } catch (trackingError) {
      logger.error('Failed to track reservation error', trackingError, { 
        original_error: error, 
        error_type: errorType, 
        step, 
        context 
      })
      return 'tracking_failed'
    }
  }

  /**
   * Track validation errors with field-level details
   * Requirements: 10.2
   */
  async trackValidationError(
    validationErrors: Record<string, string[]>,
    step: ReservationStep,
    context: {
      reservation_id?: string
      user_id?: string
      session_id?: string
      ip_address?: string
      user_agent?: string
      form_data?: Record<string, any>
    }
  ): Promise<string> {
    const errorMessage = `Validation failed: ${Object.keys(validationErrors).join(', ')}`
    
    return this.trackReservationError(
      errorMessage,
      'validation_error',
      step,
      {
        ...context,
        additional_data: {
          validation_errors: validationErrors,
          failed_fields: Object.keys(validationErrors),
          error_count: Object.values(validationErrors).flat().length
        }
      }
    )
  }

  /**
   * Track payment errors with transaction details
   * Requirements: 10.2
   */
  async trackPaymentError(
    error: Error | string,
    paymentContext: {
      reservation_id?: string
      user_id?: string
      session_id?: string
      ip_address?: string
      user_agent?: string
      payment_method?: string
      amount?: number
      currency?: string
      transaction_id?: string
      processor_response?: any
    }
  ): Promise<string> {
    return this.trackReservationError(
      error,
      'payment_error',
      'payment_processing',
      {
        ...paymentContext,
        additional_data: {
          payment_method: paymentContext.payment_method,
          amount: paymentContext.amount,
          currency: paymentContext.currency,
          transaction_id: paymentContext.transaction_id,
          processor_response: paymentContext.processor_response
        }
      }
    )
  }

  /**
   * Track availability errors
   * Requirements: 10.2
   */
  async trackAvailabilityError(
    error: Error | string,
    availabilityContext: {
      user_id?: string
      session_id?: string
      ip_address?: string
      user_agent?: string
      loft_id?: string
      check_in_date?: string
      check_out_date?: string
      requested_guests?: number
    }
  ): Promise<string> {
    return this.trackReservationError(
      error,
      'availability_error',
      'availability_check',
      {
        ...availabilityContext,
        additional_data: {
          loft_id: availabilityContext.loft_id,
          check_in_date: availabilityContext.check_in_date,
          check_out_date: availabilityContext.check_out_date,
          requested_guests: availabilityContext.requested_guests
        }
      }
    )
  }

  /**
   * Get error analytics for monitoring dashboard
   * Requirements: 10.4
   */
  getErrorAnalytics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): ErrorAnalytics {
    const hours = this.getHoursFromTimeRange(timeRange)
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000)
    
    // Filter errors by time range
    const recentErrors = Array.from(this.errorStore.values())
      .filter(error => new Date(error.timestamp).getTime() > cutoffTime)

    // Calculate metrics
    const totalErrors = recentErrors.length
    
    const errorsByType: Record<string, number> = {}
    const errorsByStep: Record<string, number> = {}
    const affectedUsers = new Set<string>()
    
    recentErrors.forEach(error => {
      errorsByType[error.error_type] = (errorsByType[error.error_type] || 0) + 1
      errorsByStep[error.step] = (errorsByStep[error.step] || 0) + 1
      
      if (error.user_id) {
        affectedUsers.add(error.user_id)
      }
    })

    // Calculate error rate trend (by hour)
    const errorTrend = this.calculateErrorTrend(recentErrors, hours)
    
    // Identify top error patterns
    const topPatterns = this.identifyErrorPatterns(recentErrors)

    return {
      total_errors: totalErrors,
      errors_by_type: errorsByType as Record<ReservationErrorType, number>,
      errors_by_step: errorsByStep as Record<ReservationStep, number>,
      error_rate_trend: errorTrend,
      top_error_patterns: topPatterns,
      user_impact: {
        affected_users: affectedUsers.size,
        conversion_impact: this.calculateConversionImpact(recentErrors),
        revenue_impact: this.calculateRevenueImpact(recentErrors)
      }
    }
  }

  /**
   * Get errors for a specific reservation
   * Requirements: 10.2
   */
  getReservationErrors(reservationId: string): ReservationError[] {
    return Array.from(this.errorStore.values())
      .filter(error => error.reservation_id === reservationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  /**
   * Mark error as resolved
   * Requirements: 10.2
   */
  async resolveError(
    errorId: string,
    resolutionNotes: string,
    resolvedBy?: string
  ): Promise<boolean> {
    try {
      const error = this.errorStore.get(errorId)
      if (!error) {
        logger.warn('Error not found for resolution', { errorId })
        return false
      }

      error.resolved = true
      error.resolution_notes = resolutionNotes
      this.errorStore.set(errorId, error)

      // Log resolution
      logger.info('Error resolved', {
        error_id: errorId,
        error_type: error.error_type,
        step: error.step,
        resolved_by: resolvedBy,
        resolution_notes: resolutionNotes
      })

      // Log to audit trail if reservation ID is available
      if (error.reservation_id) {
        await reservationAuditService.logAuditEvent({
          reservation_id: error.reservation_id,
          action: 'security_event',
          user_id: resolvedBy,
          user_type: 'admin',
          new_values: {
            error_id: errorId,
            action: 'error_resolved',
            resolution_notes: resolutionNotes
          },
          notes: `Error ${errorId} resolved: ${resolutionNotes}`
        })
      }

      return true

    } catch (error) {
      logger.error('Failed to resolve error', error, { errorId, resolutionNotes })
      return false
    }
  }

  /**
   * Get error resolution recommendations
   * Requirements: 10.4
   */
  getErrorResolutionRecommendations(errorType: ReservationErrorType, step: ReservationStep): string[] {
    const recommendations: Record<string, Record<string, string[]>> = {
      validation_error: {
        guest_info_entry: [
          'Review form validation rules for accuracy',
          'Improve error messages for better user guidance',
          'Add client-side validation to catch errors early'
        ],
        terms_acceptance: [
          'Ensure terms and conditions are clearly displayed',
          'Check for UI/UX issues preventing acceptance',
          'Verify terms acceptance tracking is working'
        ]
      },
      payment_error: {
        payment_processing: [
          'Check payment processor configuration',
          'Verify payment method compatibility',
          'Review transaction limits and restrictions',
          'Implement retry logic for temporary failures'
        ]
      },
      availability_error: {
        availability_check: [
          'Optimize availability query performance',
          'Check for data consistency issues',
          'Implement better caching for availability data',
          'Review reservation locking mechanism'
        ]
      },
      database_error: {
        reservation_creation: [
          'Check database connection pool settings',
          'Review query performance and optimization',
          'Implement database retry logic',
          'Monitor database resource usage'
        ]
      }
    }

    return recommendations[errorType]?.[step] || [
      'Review error logs for specific details',
      'Check system resources and performance',
      'Verify configuration settings',
      'Consider implementing retry mechanisms'
    ]
  }

  /**
   * Private helper methods
   */

  private determineErrorSeverity(
    errorType: ReservationErrorType,
    step: ReservationStep,
    message: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors that prevent reservations
    if (errorType === 'payment_error' && step === 'payment_processing') {
      return 'critical'
    }
    
    if (errorType === 'database_error') {
      return 'critical'
    }

    // High severity errors that impact user experience
    if (errorType === 'availability_error' || errorType === 'pricing_error') {
      return 'high'
    }

    // Medium severity for validation and business logic errors
    if (errorType === 'validation_error' || errorType === 'business_logic_error') {
      return 'medium'
    }

    // Low severity for minor issues
    return 'low'
  }

  private generateErrorCode(errorType: ReservationErrorType, step: ReservationStep): string {
    const typeCode = errorType.substring(0, 3).toUpperCase()
    const stepCode = step.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    
    return `${typeCode}_${stepCode}_${timestamp}`
  }

  private async sendCriticalErrorAlert(error: ReservationError): Promise<void> {
    try {
      logger.error('[CRITICAL ERROR ALERT] Reservation system critical error', {
        error_id: error.id,
        error_code: error.error_code,
        error_type: error.error_type,
        step: error.step,
        message: error.message,
        user_id: error.user_id,
        reservation_id: error.reservation_id
      })

      // Track in error monitoring for immediate notification
      this.errorTracker.trackError(`Critical reservation error: ${error.error_type}`, {
        action: 'critical_error_alert',
        additionalData: {
          error_id: error.id,
          error_code: error.error_code,
          error_type: error.error_type,
          step: error.step,
          severity: error.severity
        }
      }, 'error')

    } catch (alertError) {
      logger.error('Failed to send critical error alert', alertError)
    }
  }

  private async analyzeErrorPatterns(error: ReservationError): Promise<void> {
    try {
      // Look for similar errors in the last hour
      const oneHourAgo = Date.now() - (60 * 60 * 1000)
      const similarErrors = Array.from(this.errorStore.values())
        .filter(e => 
          e.error_type === error.error_type &&
          e.step === error.step &&
          new Date(e.timestamp).getTime() > oneHourAgo
        )

      // If we have multiple similar errors, it might be a pattern
      if (similarErrors.length >= 3) {
        logger.warn('Error pattern detected', {
          error_type: error.error_type,
          step: error.step,
          count: similarErrors.length,
          time_window: '1_hour'
        })

        // Log as security event for pattern detection
        if (error.reservation_id) {
          await reservationAuditService.logSecurityEvent(
            error.reservation_id,
            {
              event_type: 'suspicious_activity',
              severity: 'medium',
              details: {
                pattern_type: 'error_pattern',
                error_type: error.error_type,
                step: error.step,
                occurrence_count: similarErrors.length,
                time_window: '1_hour'
              },
              timestamp: new Date().toISOString()
            }
          )
        }
      }

    } catch (patternError) {
      logger.error('Failed to analyze error patterns', patternError)
    }
  }

  private calculateErrorTrend(errors: ReservationError[], hours: number): Array<{ date: string; count: number }> {
    const trend: Record<string, number> = {}
    const now = new Date()
    
    // Initialize all hours with 0
    for (let i = 0; i < hours; i++) {
      const date = new Date(now.getTime() - (i * 60 * 60 * 1000))
      const hourKey = date.toISOString().substring(0, 13)
      trend[hourKey] = 0
    }
    
    // Count errors by hour
    errors.forEach(error => {
      const hourKey = new Date(error.timestamp).toISOString().substring(0, 13)
      if (trend.hasOwnProperty(hourKey)) {
        trend[hourKey]++
      }
    })
    
    return Object.entries(trend)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private identifyErrorPatterns(errors: ReservationError[]): ErrorPattern[] {
    const patterns: Record<string, ErrorPattern> = {}
    
    errors.forEach(error => {
      const patternKey = `${error.error_type}_${error.step}`
      
      if (!patterns[patternKey]) {
        patterns[patternKey] = {
          pattern_id: patternKey,
          error_type: error.error_type,
          step: error.step,
          frequency: 0,
          first_occurrence: error.timestamp,
          last_occurrence: error.timestamp,
          affected_users: 0,
          resolution_priority: 'low'
        }
      }
      
      const pattern = patterns[patternKey]
      pattern.frequency++
      
      if (error.timestamp < pattern.first_occurrence) {
        pattern.first_occurrence = error.timestamp
      }
      if (error.timestamp > pattern.last_occurrence) {
        pattern.last_occurrence = error.timestamp
      }
    })
    
    // Calculate priority and affected users
    Object.values(patterns).forEach(pattern => {
      const patternErrors = errors.filter(e => 
        e.error_type === pattern.error_type && e.step === pattern.step
      )
      
      pattern.affected_users = new Set(patternErrors.map(e => e.user_id).filter(Boolean)).size
      
      // Determine priority based on frequency and severity
      if (pattern.frequency > 10) {
        pattern.resolution_priority = 'critical'
      } else if (pattern.frequency > 5) {
        pattern.resolution_priority = 'high'
      } else if (pattern.frequency > 2) {
        pattern.resolution_priority = 'medium'
      }
    })
    
    return Object.values(patterns)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
  }

  private calculateConversionImpact(errors: ReservationError[]): number {
    // Calculate how many potential conversions were lost due to errors
    const criticalErrors = errors.filter(e => 
      e.severity === 'critical' || 
      (e.error_type === 'payment_error' && e.step === 'payment_processing')
    )
    
    return criticalErrors.length
  }

  private calculateRevenueImpact(errors: ReservationError[]): number {
    // Estimate revenue impact based on average booking value
    const averageBookingValue = 150 // This would come from actual data
    const lostConversions = this.calculateConversionImpact(errors)
    
    return lostConversions * averageBookingValue
  }

  private getHoursFromTimeRange(timeRange: string): number {
    switch (timeRange) {
      case '1h': return 1
      case '24h': return 24
      case '7d': return 168
      case '30d': return 720
      default: return 24
    }
  }
}

// Export singleton instance
export const reservationErrorTrackingService = new ReservationErrorTrackingService()