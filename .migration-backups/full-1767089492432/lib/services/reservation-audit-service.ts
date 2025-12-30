import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import { trackError, ErrorContext } from '@/lib/monitoring/error-tracking'

/**
 * Comprehensive audit logging service for client reservation flow
 * Requirements: 10.1, 10.2, 10.4
 */

export interface ReservationAuditEvent {
  id?: string
  reservation_id: string
  action: ReservationAuditAction
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  changed_fields?: string[]
  user_id?: string
  user_type: 'customer' | 'admin' | 'system'
  session_id?: string
  ip_address?: string
  user_agent?: string
  request_id?: string
  notes?: string
  created_at?: string
}

export type ReservationAuditAction = 
  | 'reservation_created'
  | 'reservation_updated' 
  | 'reservation_cancelled'
  | 'reservation_confirmed'
  | 'reservation_completed'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'email_sent'
  | 'lock_created'
  | 'lock_released'
  | 'availability_checked'
  | 'pricing_calculated'
  | 'terms_accepted'
  | 'guest_info_updated'
  | 'special_request_added'
  | 'communication_sent'
  | 'security_event'
  | 'suspicious_activity'

export interface SecurityEvent {
  event_type: 'failed_login' | 'multiple_attempts' | 'suspicious_ip' | 'data_breach_attempt' | 'unauthorized_access'
  severity: 'low' | 'medium' | 'high' | 'critical'
  user_id?: string
  ip_address?: string
  user_agent?: string
  details: Record<string, any>
  timestamp: string
}

export interface AuditMetrics {
  total_events: number
  events_by_action: Record<ReservationAuditAction, number>
  events_by_user: Array<{ user_id: string; count: number }>
  events_by_hour: Array<{ hour: string; count: number }>
  security_events: number
  error_events: number
}

export class ReservationAuditService {
  private supabase = createClient()

  /**
   * Log a reservation audit event
   * Requirements: 10.1, 10.2
   */
  async logAuditEvent(event: ReservationAuditEvent): Promise<string> {
    try {
      const auditEvent = {
        ...event,
        created_at: new Date().toISOString(),
        request_id: event.request_id || this.generateRequestId()
      }

      // Insert into reservation audit log
      const { data, error } = await (await this.supabase)
        .from('reservation_audit_log')
        .insert(auditEvent)
        .select('id')
        .single()

      if (error) {
        logger.error('Failed to log audit event', error, { event: auditEvent })
        // Track this as an error but don't throw to avoid breaking main flow
        trackError('Audit logging failed', {
          action: 'audit_log_failure',
          additionalData: { event: auditEvent, error: error.message }
        })
        return 'failed'
      }

      // Log to application logger for immediate visibility
      logger.info(`[AUDIT] ${event.action}`, {
        reservation_id: event.reservation_id,
        user_id: event.user_id,
        user_type: event.user_type,
        ip_address: event.ip_address,
        session_id: event.session_id,
        changed_fields: event.changed_fields,
        notes: event.notes
      })

      return data.id

    } catch (error) {
      logger.error('Error in logAuditEvent', error, { event })
      trackError('Audit service error', {
        action: 'audit_service_error',
        additionalData: { event, error: error instanceof Error ? error.message : 'Unknown error' }
      })
      return 'error'
    }
  }

  /**
   * Log reservation creation with comprehensive details
   * Requirements: 10.1, 10.2
   */
  async logReservationCreated(
    reservationId: string,
    reservationData: Record<string, any>,
    userContext: {
      user_id: string
      session_id?: string
      ip_address?: string
      user_agent?: string
    }
  ): Promise<void> {
    await this.logAuditEvent({
      reservation_id: reservationId,
      action: 'reservation_created',
      new_values: reservationData,
      user_id: userContext.user_id,
      user_type: 'customer',
      session_id: userContext.session_id,
      ip_address: userContext.ip_address,
      user_agent: userContext.user_agent,
      notes: 'New reservation created successfully'
    })
  }

  /**
   * Log reservation updates with field-level tracking
   * Requirements: 10.1, 10.2
   */
  async logReservationUpdated(
    reservationId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    userContext: {
      user_id?: string
      user_type?: 'customer' | 'admin' | 'system'
      session_id?: string
      ip_address?: string
      user_agent?: string
    }
  ): Promise<void> {
    const changedFields = this.getChangedFields(oldValues, newValues)
    
    await this.logAuditEvent({
      reservation_id: reservationId,
      action: 'reservation_updated',
      old_values: oldValues,
      new_values: newValues,
      changed_fields: changedFields,
      user_id: userContext.user_id,
      user_type: userContext.user_type || 'system',
      session_id: userContext.session_id,
      ip_address: userContext.ip_address,
      user_agent: userContext.user_agent,
      notes: `Updated fields: ${changedFields.join(', ')}`
    })
  }

  /**
   * Log payment-related events
   * Requirements: 10.1, 10.2
   */
  async logPaymentEvent(
    reservationId: string,
    action: 'payment_initiated' | 'payment_completed' | 'payment_failed',
    paymentData: Record<string, any>,
    userContext: {
      user_id: string
      session_id?: string
      ip_address?: string
      user_agent?: string
    }
  ): Promise<void> {
    await this.logAuditEvent({
      reservation_id: reservationId,
      action,
      new_values: paymentData,
      user_id: userContext.user_id,
      user_type: 'customer',
      session_id: userContext.session_id,
      ip_address: userContext.ip_address,
      user_agent: userContext.user_agent,
      notes: `Payment ${action.replace('payment_', '')}: ${paymentData.amount} ${paymentData.currency}`
    })
  }

  /**
   * Log communication events (emails, SMS, etc.)
   * Requirements: 10.1, 10.2
   */
  async logCommunicationEvent(
    reservationId: string,
    communicationType: string,
    recipient: string,
    status: 'sent' | 'delivered' | 'failed',
    details?: Record<string, any>
  ): Promise<void> {
    await this.logAuditEvent({
      reservation_id: reservationId,
      action: 'communication_sent',
      new_values: {
        type: communicationType,
        recipient,
        status,
        ...details
      },
      user_type: 'system',
      notes: `${communicationType} ${status} to ${recipient}`
    })
  }

  /**
   * Log security events and suspicious activities
   * Requirements: 10.4
   */
  async logSecurityEvent(
    reservationId: string,
    securityEvent: SecurityEvent,
    userContext?: {
      user_id?: string
      session_id?: string
      ip_address?: string
      user_agent?: string
    }
  ): Promise<void> {
    // Log to audit trail
    await this.logAuditEvent({
      reservation_id: reservationId,
      action: 'security_event',
      new_values: {
        event_type: securityEvent.event_type,
        severity: securityEvent.severity,
        details: securityEvent.details
      },
      user_id: userContext?.user_id || securityEvent.details.user_id,
      user_type: 'system',
      session_id: userContext?.session_id,
      ip_address: userContext?.ip_address || securityEvent.ip_address,
      user_agent: userContext?.user_agent || securityEvent.user_agent,
      notes: `Security event: ${securityEvent.event_type} (${securityEvent.severity})`
    })

    // Log to application logger with appropriate level
    const logLevel = securityEvent.severity === 'critical' || securityEvent.severity === 'high' ? 'error' : 'warn'
    logger[logLevel](`[SECURITY] ${securityEvent.event_type}`, {
      reservation_id: reservationId,
      severity: securityEvent.severity,
      user_id: securityEvent.details.user_id,
      ip_address: securityEvent.ip_address,
      details: securityEvent.details
    })

    // Track in error monitoring system for alerting
    if (securityEvent.severity === 'critical' || securityEvent.severity === 'high') {
      trackError(`Security event: ${securityEvent.event_type}`, {
        action: 'security_event',
        additionalData: {
          reservation_id: reservationId,
          severity: securityEvent.severity,
          event_type: securityEvent.event_type,
          details: securityEvent.details
        }
      }, 'error')
    }

    // Send immediate alert for critical events
    if (securityEvent.severity === 'critical') {
      await this.sendSecurityAlert(reservationId, securityEvent)
    }
  }

  /**
   * Log availability and pricing checks
   * Requirements: 10.1, 10.2
   */
  async logAvailabilityCheck(
    loftId: string,
    checkInDate: string,
    checkOutDate: string,
    result: boolean,
    userContext: {
      user_id?: string
      session_id?: string
      ip_address?: string
      user_agent?: string
    }
  ): Promise<void> {
    // Create a temporary reservation ID for availability checks
    const tempReservationId = `availability_${loftId}_${Date.now()}`
    
    await this.logAuditEvent({
      reservation_id: tempReservationId,
      action: 'availability_checked',
      new_values: {
        loft_id: loftId,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        available: result
      },
      user_id: userContext.user_id,
      user_type: userContext.user_id ? 'customer' : 'system',
      session_id: userContext.session_id,
      ip_address: userContext.ip_address,
      user_agent: userContext.user_agent,
      notes: `Availability check for loft ${loftId}: ${result ? 'available' : 'not available'}`
    })
  }

  /**
   * Get audit trail for a specific reservation
   * Requirements: 10.1, 10.2
   */
  async getReservationAuditTrail(
    reservationId: string,
    limit: number = 100
  ): Promise<ReservationAuditEvent[]> {
    try {
      const { data, error } = await (await this.supabase)
        .from('reservation_audit_log')
        .select('*')
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        logger.error('Failed to fetch audit trail', error, { reservationId })
        throw new Error(`Failed to fetch audit trail: ${error.message}`)
      }

      return data || []

    } catch (error) {
      logger.error('Error in getReservationAuditTrail', error, { reservationId })
      throw error
    }
  }

  /**
   * Get audit metrics for monitoring dashboard
   * Requirements: 10.4
   */
  async getAuditMetrics(
    dateFrom?: string,
    dateTo?: string
  ): Promise<AuditMetrics> {
    try {
      const fromDate = dateFrom || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const toDate = dateTo || new Date().toISOString()

      const { data, error } = await (await this.supabase)
        .from('reservation_audit_log')
        .select('action, user_id, created_at')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)

      if (error) {
        logger.error('Failed to fetch audit metrics', error)
        throw new Error(`Failed to fetch audit metrics: ${error.message}`)
      }

      const events = data || []
      
      // Calculate metrics
      const eventsByAction: Record<string, number> = {}
      const eventsByUser: Record<string, number> = {}
      const eventsByHour: Record<string, number> = {}
      let securityEvents = 0
      let errorEvents = 0

      events.forEach(event => {
        // Count by action
        eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1
        
        // Count by user
        if (event.user_id) {
          eventsByUser[event.user_id] = (eventsByUser[event.user_id] || 0) + 1
        }
        
        // Count by hour
        const hour = new Date(event.created_at).toISOString().substring(0, 13)
        eventsByHour[hour] = (eventsByHour[hour] || 0) + 1
        
        // Count security and error events
        if (event.action === 'security_event') securityEvents++
        if (event.action.includes('failed') || event.action.includes('error')) errorEvents++
      })

      return {
        total_events: events.length,
        events_by_action: eventsByAction as Record<ReservationAuditAction, number>,
        events_by_user: Object.entries(eventsByUser).map(([user_id, count]) => ({ user_id, count })),
        events_by_hour: Object.entries(eventsByHour).map(([hour, count]) => ({ hour, count })),
        security_events: securityEvents,
        error_events: errorEvents
      }

    } catch (error) {
      logger.error('Error in getAuditMetrics', error)
      throw error
    }
  }

  /**
   * Detect suspicious reservation patterns
   * Requirements: 10.4
   */
  async detectSuspiciousActivity(
    timeWindowHours: number = 24
  ): Promise<Array<{
    user_id: string
    suspicious_patterns: string[]
    event_count: number
    first_event: string
    last_event: string
    risk_score: number
  }>> {
    try {
      const fromDate = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000).toISOString()

      const { data, error } = await (await this.supabase)
        .from('reservation_audit_log')
        .select('user_id, action, ip_address, created_at, new_values')
        .gte('created_at', fromDate)
        .not('user_id', 'is', null)
        .order('created_at', { ascending: false })

      if (error) {
        logger.error('Failed to fetch data for suspicious activity detection', error)
        throw new Error(`Failed to detect suspicious activity: ${error.message}`)
      }

      const events = data || []
      const userActivity: Record<string, any[]> = {}

      // Group events by user
      events.forEach(event => {
        if (!userActivity[event.user_id]) {
          userActivity[event.user_id] = []
        }
        userActivity[event.user_id].push(event)
      })

      const suspiciousUsers = []

      // Analyze each user's activity
      for (const [userId, userEvents] of Object.entries(userActivity)) {
        const patterns = []
        let riskScore = 0

        // Pattern 1: Too many reservation attempts in short time
        const reservationAttempts = userEvents.filter(e => e.action === 'reservation_created').length
        if (reservationAttempts > 10) {
          patterns.push(`Excessive reservation attempts: ${reservationAttempts}`)
          riskScore += 30
        }

        // Pattern 2: Multiple IP addresses
        const uniqueIPs = new Set(userEvents.map(e => e.ip_address).filter(Boolean))
        if (uniqueIPs.size > 5) {
          patterns.push(`Multiple IP addresses: ${uniqueIPs.size}`)
          riskScore += 20
        }

        // Pattern 3: Rapid-fire actions
        const sortedEvents = userEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        let rapidActions = 0
        for (let i = 1; i < sortedEvents.length; i++) {
          const timeDiff = new Date(sortedEvents[i].created_at).getTime() - new Date(sortedEvents[i-1].created_at).getTime()
          if (timeDiff < 1000) { // Less than 1 second between actions
            rapidActions++
          }
        }
        if (rapidActions > 5) {
          patterns.push(`Rapid-fire actions: ${rapidActions}`)
          riskScore += 25
        }

        // Pattern 4: Failed payment attempts
        const failedPayments = userEvents.filter(e => e.action === 'payment_failed').length
        if (failedPayments > 3) {
          patterns.push(`Multiple failed payments: ${failedPayments}`)
          riskScore += 35
        }

        // Pattern 5: Unusual pricing manipulation attempts
        const pricingEvents = userEvents.filter(e => e.action === 'pricing_calculated')
        if (pricingEvents.length > 20) {
          patterns.push(`Excessive pricing calculations: ${pricingEvents.length}`)
          riskScore += 15
        }

        // Only report users with suspicious patterns
        if (patterns.length > 0 && riskScore > 30) {
          suspiciousUsers.push({
            user_id: userId,
            suspicious_patterns: patterns,
            event_count: userEvents.length,
            first_event: sortedEvents[0]?.created_at || '',
            last_event: sortedEvents[sortedEvents.length - 1]?.created_at || '',
            risk_score: riskScore
          })

          // Log security event for high-risk users
          if (riskScore > 60) {
            await this.logSecurityEvent('suspicious_activity_detected', {
              event_type: 'suspicious_activity',
              severity: riskScore > 80 ? 'critical' : 'high',
              user_id: userId,
              details: {
                patterns,
                event_count: userEvents.length,
                risk_score: riskScore,
                time_window_hours: timeWindowHours
              },
              timestamp: new Date().toISOString()
            })
          }
        }
      }

      return suspiciousUsers.sort((a, b) => b.risk_score - a.risk_score)

    } catch (error) {
      logger.error('Error in detectSuspiciousActivity', error)
      throw error
    }
  }

  /**
   * Export audit logs for compliance
   * Requirements: 10.1, 10.2
   */
  async exportAuditLogs(
    reservationId?: string,
    dateFrom?: string,
    dateTo?: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<{ data: string; filename: string }> {
    try {
      let query = (await this.supabase)
        .from('reservation_audit_log')
        .select('*')
        .order('created_at', { ascending: false })

      if (reservationId) {
        query = query.eq('reservation_id', reservationId)
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to export audit logs: ${error.message}`)
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `reservation_audit_${reservationId || 'all'}_${timestamp}.${format}`

      if (format === 'csv') {
        const csvData = this.convertToCSV(data || [])
        return { data: csvData, filename }
      }

      return { 
        data: JSON.stringify(data, null, 2), 
        filename 
      }

    } catch (error) {
      logger.error('Error in exportAuditLogs', error)
      throw error
    }
  }

  /**
   * Private helper methods
   */

  private getChangedFields(oldValues: Record<string, any>, newValues: Record<string, any>): string[] {
    const changedFields: string[] = []
    
    for (const key in newValues) {
      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changedFields.push(key)
      }
    }
    
    return changedFields
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async sendSecurityAlert(
    reservationId: string,
    securityEvent: SecurityEvent
  ): Promise<void> {
    try {
      // Log critical security alert
      logger.error(`[CRITICAL SECURITY ALERT] ${securityEvent.event_type}`, {
        reservation_id: reservationId,
        severity: securityEvent.severity,
        details: securityEvent.details,
        timestamp: securityEvent.timestamp
      })

      // Track in error monitoring for immediate notification
      trackError(`Critical security event: ${securityEvent.event_type}`, {
        action: 'critical_security_alert',
        additionalData: {
          reservation_id: reservationId,
          event_type: securityEvent.event_type,
          severity: securityEvent.severity,
          details: securityEvent.details
        }
      }, 'error')

      // Here you could add additional alerting mechanisms:
      // - Send email to security team
      // - Send Slack/Discord notification
      // - Trigger PagerDuty alert
      // - Send SMS to on-call personnel

    } catch (error) {
      logger.error('Failed to send security alert', error)
    }
  }

  private convertToCSV(data: ReservationAuditEvent[]): string {
    if (data.length === 0) return ''

    const headers = [
      'ID', 'Reservation ID', 'Action', 'User ID', 'User Type', 
      'IP Address', 'Session ID', 'Changed Fields', 'Notes', 'Created At'
    ]

    const rows = data.map(event => [
      event.id || '',
      event.reservation_id,
      event.action,
      event.user_id || '',
      event.user_type,
      event.ip_address || '',
      event.session_id || '',
      event.changed_fields?.join(';') || '',
      event.notes || '',
      event.created_at || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    return csvContent
  }
}

// Export singleton instance
export const reservationAuditService = new ReservationAuditService()