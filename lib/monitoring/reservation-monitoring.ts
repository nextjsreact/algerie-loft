import { ErrorTracker } from './error-tracking'
import { logger } from '@/lib/logger'
import { reservationAuditService, ReservationAuditAction } from '@/lib/services/reservation-audit-service'

/**
 * Comprehensive monitoring service for reservation flow
 * Requirements: 10.1, 10.2, 10.4
 */

export interface ReservationMetrics {
  total_reservations: number
  successful_reservations: number
  failed_reservations: number
  cancelled_reservations: number
  conversion_rate: number
  average_booking_time: number
  payment_success_rate: number
  error_rate: number
  security_incidents: number
}

export interface PerformanceMetrics {
  availability_check_time: number
  pricing_calculation_time: number
  reservation_creation_time: number
  email_delivery_time: number
  database_query_time: number
}

export interface UserBehaviorMetrics {
  unique_users: number
  returning_users: number
  bounce_rate: number
  pages_per_session: number
  session_duration: number
  conversion_funnel: {
    step: string
    users: number
    conversion_rate: number
  }[]
}

export interface AlertThresholds {
  error_rate_threshold: number
  response_time_threshold: number
  failed_payment_threshold: number
  security_incident_threshold: number
  conversion_rate_threshold: number
}

export class ReservationMonitoringService {
  private errorTracker: ErrorTracker
  private metrics: Map<string, any> = new Map()
  private performanceTimers: Map<string, number> = new Map()
  
  private defaultThresholds: AlertThresholds = {
    error_rate_threshold: 5, // 5% error rate
    response_time_threshold: 3000, // 3 seconds
    failed_payment_threshold: 10, // 10 failed payments per hour
    security_incident_threshold: 3, // 3 security incidents per hour
    conversion_rate_threshold: 15 // 15% minimum conversion rate
  }

  constructor() {
    this.errorTracker = ErrorTracker.getInstance()
  }

  /**
   * Track reservation flow performance metrics
   * Requirements: 10.4
   */
  startPerformanceTimer(operation: string, context?: Record<string, any>): string {
    const timerId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.performanceTimers.set(timerId, Date.now())
    
    logger.debug(`[PERF] Started timer for ${operation}`, { timerId, context })
    return timerId
  }

  endPerformanceTimer(timerId: string, operation: string, context?: Record<string, any>): number {
    const startTime = this.performanceTimers.get(timerId)
    if (!startTime) {
      logger.warn(`[PERF] Timer not found: ${timerId}`)
      return 0
    }

    const duration = Date.now() - startTime
    this.performanceTimers.delete(timerId)

    // Log performance metric
    logger.info(`[PERF] ${operation} completed`, { 
      duration, 
      operation, 
      context,
      timerId 
    })

    // Store metric for aggregation
    this.storePerformanceMetric(operation, duration, context)

    // Check for performance issues
    if (duration > this.defaultThresholds.response_time_threshold) {
      this.trackPerformanceIssue(operation, duration, context)
    }

    return duration
  }

  /**
   * Track reservation flow events with context
   * Requirements: 10.1, 10.2
   */
  async trackReservationEvent(
    event: ReservationAuditAction,
    reservationId: string,
    context: {
      user_id?: string
      session_id?: string
      ip_address?: string
      user_agent?: string
      additional_data?: Record<string, any>
    }
  ): Promise<void> {
    try {
      // Log to audit service
      await reservationAuditService.logAuditEvent({
        reservation_id: reservationId,
        action: event,
        user_id: context.user_id,
        user_type: context.user_id ? 'customer' : 'system',
        session_id: context.session_id,
        ip_address: context.ip_address,
        user_agent: context.user_agent,
        new_values: context.additional_data,
        notes: `Event tracked: ${event}`
      })

      // Update real-time metrics
      this.updateEventMetrics(event, context)

      // Check for anomalies
      await this.checkForAnomalies(event, reservationId, context)

    } catch (error) {
      logger.error('Error tracking reservation event', error, { event, reservationId, context })
      this.errorTracker.trackError('Failed to track reservation event', {
        action: 'event_tracking_failure',
        additionalData: { event, reservationId, context }
      })
    }
  }

  /**
   * Track reservation errors with detailed context
   * Requirements: 10.2, 10.4
   */
  trackReservationError(
    error: Error | string,
    operation: string,
    reservationId?: string,
    context?: {
      user_id?: string
      session_id?: string
      ip_address?: string
      user_agent?: string
      step?: string
      additional_data?: Record<string, any>
    }
  ): string {
    const errorId = this.errorTracker.trackError(error, {
      action: 'reservation_error',
      component: 'reservation_flow',
      page: '/reservations',
      additionalData: {
        operation,
        reservation_id: reservationId,
        step: context?.step,
        session_id: context?.session_id,
        ...context?.additional_data
      },
      userId: context?.user_id
    })

    // Log to audit trail if reservation ID is available
    if (reservationId) {
      reservationAuditService.logAuditEvent({
        reservation_id: reservationId,
        action: 'security_event',
        user_id: context?.user_id,
        user_type: 'system',
        session_id: context?.session_id,
        ip_address: context?.ip_address,
        user_agent: context?.user_agent,
        new_values: {
          error_type: 'reservation_error',
          operation,
          error_message: error instanceof Error ? error.message : error,
          error_id: errorId
        },
        notes: `Error in ${operation}: ${error instanceof Error ? error.message : error}`
      }).catch(auditError => {
        logger.error('Failed to log error to audit trail', auditError)
      })
    }

    // Update error metrics
    this.updateErrorMetrics(operation, error, context)

    return errorId
  }

  /**
   * Track user behavior and conversion metrics
   * Requirements: 10.4
   */
  trackUserBehavior(
    action: string,
    userId?: string,
    sessionId?: string,
    context?: Record<string, any>
  ): void {
    try {
      const behaviorEvent = {
        action,
        user_id: userId,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        context
      }

      // Store for analytics
      this.storeBehaviorMetric(behaviorEvent)

      // Log for debugging
      logger.debug(`[BEHAVIOR] ${action}`, behaviorEvent)

      // Track conversion funnel
      this.updateConversionFunnel(action, userId, sessionId)

    } catch (error) {
      logger.error('Error tracking user behavior', error, { action, userId, sessionId, context })
    }
  }

  /**
   * Get real-time reservation metrics
   * Requirements: 10.4
   */
  async getReservationMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<ReservationMetrics> {
    try {
      const hours = this.getHoursFromTimeRange(timeRange)
      const fromDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

      // Get audit metrics from audit service
      const auditMetrics = await reservationAuditService.getAuditMetrics(fromDate)

      // Calculate reservation-specific metrics
      const totalReservations = auditMetrics.events_by_action.reservation_created || 0
      const successfulReservations = auditMetrics.events_by_action.reservation_confirmed || 0
      const failedReservations = auditMetrics.events_by_action.payment_failed || 0
      const cancelledReservations = auditMetrics.events_by_action.reservation_cancelled || 0

      const conversionRate = totalReservations > 0 ? (successfulReservations / totalReservations) * 100 : 0
      const paymentSuccessRate = (auditMetrics.events_by_action.payment_completed || 0) / 
                                Math.max(1, (auditMetrics.events_by_action.payment_initiated || 0)) * 100

      return {
        total_reservations: totalReservations,
        successful_reservations: successfulReservations,
        failed_reservations: failedReservations,
        cancelled_reservations: cancelledReservations,
        conversion_rate: conversionRate,
        average_booking_time: this.calculateAverageBookingTime(),
        payment_success_rate: paymentSuccessRate,
        error_rate: this.calculateErrorRate(timeRange),
        security_incidents: auditMetrics.security_events
      }

    } catch (error) {
      logger.error('Error getting reservation metrics', error)
      throw error
    }
  }

  /**
   * Get performance metrics
   * Requirements: 10.4
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      availability_check_time: this.getAverageMetric('availability_check'),
      pricing_calculation_time: this.getAverageMetric('pricing_calculation'),
      reservation_creation_time: this.getAverageMetric('reservation_creation'),
      email_delivery_time: this.getAverageMetric('email_delivery'),
      database_query_time: this.getAverageMetric('database_query')
    }
  }

  /**
   * Get user behavior metrics
   * Requirements: 10.4
   */
  getUserBehaviorMetrics(): UserBehaviorMetrics {
    const behaviorData = this.metrics.get('user_behavior') || {}
    
    return {
      unique_users: behaviorData.unique_users || 0,
      returning_users: behaviorData.returning_users || 0,
      bounce_rate: behaviorData.bounce_rate || 0,
      pages_per_session: behaviorData.pages_per_session || 0,
      session_duration: behaviorData.session_duration || 0,
      conversion_funnel: behaviorData.conversion_funnel || []
    }
  }

  /**
   * Check system health and trigger alerts
   * Requirements: 10.4
   */
  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical'
    issues: string[]
    metrics: ReservationMetrics
  }> {
    try {
      const metrics = await this.getReservationMetrics('1h')
      const issues: string[] = []
      let status: 'healthy' | 'warning' | 'critical' = 'healthy'

      // Check error rate
      if (metrics.error_rate > this.defaultThresholds.error_rate_threshold) {
        issues.push(`High error rate: ${metrics.error_rate.toFixed(2)}%`)
        status = 'warning'
      }

      // Check conversion rate
      if (metrics.conversion_rate < this.defaultThresholds.conversion_rate_threshold) {
        issues.push(`Low conversion rate: ${metrics.conversion_rate.toFixed(2)}%`)
        status = 'warning'
      }

      // Check security incidents
      if (metrics.security_incidents > this.defaultThresholds.security_incident_threshold) {
        issues.push(`High security incidents: ${metrics.security_incidents}`)
        status = 'critical'
      }

      // Check payment failures
      if (metrics.failed_reservations > this.defaultThresholds.failed_payment_threshold) {
        issues.push(`High payment failures: ${metrics.failed_reservations}`)
        status = 'warning'
      }

      // Log health check results
      logger.info(`[HEALTH] System health check completed`, {
        status,
        issues_count: issues.length,
        metrics
      })

      // Send alerts if issues detected
      if (issues.length > 0) {
        await this.sendHealthAlert(status, issues, metrics)
      }

      return { status, issues, metrics }

    } catch (error) {
      logger.error('Error checking system health', error)
      return {
        status: 'critical',
        issues: ['Health check failed'],
        metrics: {} as ReservationMetrics
      }
    }
  }

  /**
   * Generate monitoring report
   * Requirements: 10.1, 10.4
   */
  async generateMonitoringReport(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<{
    summary: ReservationMetrics
    performance: PerformanceMetrics
    behavior: UserBehaviorMetrics
    top_errors: Array<{ error: string; count: number }>
    security_events: Array<{ event: string; count: number; severity: string }>
    recommendations: string[]
  }> {
    try {
      const summary = await this.getReservationMetrics(timeRange)
      const performance = this.getPerformanceMetrics()
      const behavior = this.getUserBehaviorMetrics()
      
      // Get error statistics
      const errorStats = this.errorTracker.getErrorStats(this.getHoursFromTimeRange(timeRange))
      const topErrors = errorStats.topErrors.slice(0, 10).map(error => ({
        error: error.fingerprint,
        count: error.count
      }))

      // Get security events (mock data for now - would come from audit service)
      const securityEvents = [
        { event: 'suspicious_activity', count: summary.security_incidents, severity: 'medium' }
      ]

      // Generate recommendations
      const recommendations = this.generateRecommendations(summary, performance, behavior)

      return {
        summary,
        performance,
        behavior,
        top_errors: topErrors,
        security_events: securityEvents,
        recommendations
      }

    } catch (error) {
      logger.error('Error generating monitoring report', error)
      throw error
    }
  }

  /**
   * Private helper methods
   */

  private storePerformanceMetric(operation: string, duration: number, context?: Record<string, any>): void {
    const key = `performance_${operation}`
    const existing = this.metrics.get(key) || []
    existing.push({ duration, timestamp: Date.now(), context })
    
    // Keep only last 1000 measurements
    if (existing.length > 1000) {
      existing.splice(0, existing.length - 1000)
    }
    
    this.metrics.set(key, existing)
  }

  private updateEventMetrics(event: ReservationAuditAction, context: Record<string, any>): void {
    const key = `events_${event}`
    const count = this.metrics.get(key) || 0
    this.metrics.set(key, count + 1)
  }

  private updateErrorMetrics(operation: string, error: Error | string, context?: Record<string, any>): void {
    const key = `errors_${operation}`
    const existing = this.metrics.get(key) || []
    existing.push({
      error: error instanceof Error ? error.message : error,
      timestamp: Date.now(),
      context
    })
    this.metrics.set(key, existing)
  }

  private storeBehaviorMetric(event: Record<string, any>): void {
    const key = 'user_behavior_events'
    const existing = this.metrics.get(key) || []
    existing.push(event)
    
    // Keep only last 10000 events
    if (existing.length > 10000) {
      existing.splice(0, existing.length - 10000)
    }
    
    this.metrics.set(key, existing)
  }

  private updateConversionFunnel(action: string, userId?: string, sessionId?: string): void {
    // Implementation for conversion funnel tracking
    const funnelSteps = [
      'page_view',
      'search_started',
      'loft_selected',
      'booking_form_opened',
      'guest_info_entered',
      'payment_initiated',
      'reservation_completed'
    ]

    if (funnelSteps.includes(action)) {
      const key = 'conversion_funnel'
      const funnel = this.metrics.get(key) || {}
      funnel[action] = (funnel[action] || 0) + 1
      this.metrics.set(key, funnel)
    }
  }

  private async checkForAnomalies(
    event: ReservationAuditAction,
    reservationId: string,
    context: Record<string, any>
  ): Promise<void> {
    // Check for suspicious patterns
    if (context.user_id) {
      const recentEvents = this.getRecentUserEvents(context.user_id)
      
      // Check for rapid-fire events
      if (recentEvents.length > 10) {
        await reservationAuditService.logSecurityEvent(reservationId, {
          event_type: 'suspicious_activity',
          severity: 'medium',
          user_id: context.user_id,
          ip_address: context.ip_address,
          details: {
            pattern: 'rapid_events',
            event_count: recentEvents.length,
            time_window: '5_minutes'
          },
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  private trackPerformanceIssue(operation: string, duration: number, context?: Record<string, any>): void {
    this.errorTracker.trackPerformanceIssue(
      operation,
      duration,
      this.defaultThresholds.response_time_threshold,
      {
        action: 'performance_issue',
        additionalData: { operation, duration, context }
      }
    )
  }

  private getAverageMetric(operation: string): number {
    const key = `performance_${operation}`
    const measurements = this.metrics.get(key) || []
    
    if (measurements.length === 0) return 0
    
    const sum = measurements.reduce((acc: number, m: any) => acc + m.duration, 0)
    return sum / measurements.length
  }

  private calculateAverageBookingTime(): number {
    // Calculate average time from search to reservation completion
    return this.getAverageMetric('reservation_creation')
  }

  private calculateErrorRate(timeRange: string): number {
    const hours = this.getHoursFromTimeRange(timeRange)
    const errorStats = this.errorTracker.getErrorStats(hours)
    
    const totalEvents = this.metrics.get('total_events') || 1
    return (errorStats.totalErrors / totalEvents) * 100
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

  private getRecentUserEvents(userId: string): any[] {
    const allEvents = this.metrics.get('user_behavior_events') || []
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    
    return allEvents.filter((event: any) => 
      event.user_id === userId && event.timestamp > fiveMinutesAgo
    )
  }

  private async sendHealthAlert(
    status: 'warning' | 'critical',
    issues: string[],
    metrics: ReservationMetrics
  ): Promise<void> {
    logger[status === 'critical' ? 'error' : 'warn'](`[HEALTH ALERT] System status: ${status}`, {
      issues,
      metrics
    })

    // Track as error for alerting
    this.errorTracker.trackError(`System health alert: ${status}`, {
      action: 'health_alert',
      additionalData: { status, issues, metrics }
    }, status === 'critical' ? 'error' : 'warning')
  }

  private generateRecommendations(
    summary: ReservationMetrics,
    performance: PerformanceMetrics,
    behavior: UserBehaviorMetrics
  ): string[] {
    const recommendations: string[] = []

    if (summary.conversion_rate < 20) {
      recommendations.push('Consider optimizing the booking flow to improve conversion rate')
    }

    if (performance.availability_check_time > 2000) {
      recommendations.push('Optimize availability check queries for better performance')
    }

    if (summary.error_rate > 3) {
      recommendations.push('Investigate and fix recurring errors to improve user experience')
    }

    if (behavior.bounce_rate > 60) {
      recommendations.push('Improve page loading speed and user experience to reduce bounce rate')
    }

    if (summary.security_incidents > 0) {
      recommendations.push('Review security incidents and strengthen protection measures')
    }

    return recommendations
  }
}

// Export singleton instance
export const reservationMonitoringService = new ReservationMonitoringService()