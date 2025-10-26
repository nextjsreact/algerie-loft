/**
 * Booking Audit Service
 * Extends the existing audit system for booking-specific operations
 */

import { createClient } from '@/utils/supabase/client'
import { AuditLog, Booking, BookingStatus, PaymentStatus } from '@/lib/types'

export interface BookingAuditEntry extends AuditLog {
  booking_reference?: string
  financial_impact?: number
  compliance_flags?: string[]
}

export interface FinancialAuditSummary {
  total_transactions: number
  total_amount: number
  booking_count: number
  payment_failures: number
  refunds: number
  date_range: {
    from: string
    to: string
  }
}

export class BookingAuditService {
  private supabase = createClient()

  /**
   * Set audit context for booking operations
   */
  async setBookingAuditContext(
    userId: string,
    userEmail: string,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      await this.supabase.rpc('set_audit_user_context', {
        p_user_id: userId,
        p_user_email: userEmail,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_session_id: sessionId
      })
    } catch (error) {
      console.error('Failed to set booking audit context:', error)
      // Don't throw error to avoid breaking main operations
    }
  }

  /**
   * Get complete audit trail for a booking
   */
  async getBookingAuditTrail(bookingId: string): Promise<BookingAuditEntry[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_booking_audit_trail', { p_booking_id: bookingId })

      if (error) {
        throw new Error(`Failed to fetch booking audit trail: ${error.message}`)
      }

      return (data || []).map(this.enrichAuditEntry)
    } catch (error) {
      console.error('Failed to get booking audit trail:', error)
      throw error
    }
  }

  /**
   * Get partner audit activity
   */
  async getPartnerAuditActivity(
    partnerId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<BookingAuditEntry[]> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_partner_audit_activity', {
          p_partner_id: partnerId,
          p_date_from: dateFrom,
          p_date_to: dateTo
        })

      if (error) {
        throw new Error(`Failed to fetch partner audit activity: ${error.message}`)
      }

      return (data || []).map(this.enrichAuditEntry)
    } catch (error) {
      console.error('Failed to get partner audit activity:', error)
      throw error
    }
  }

  /**
   * Get financial audit logs for compliance reporting
   */
  async getFinancialAuditLogs(
    dateFrom?: string,
    dateTo?: string,
    userId?: string
  ): Promise<{
    logs: BookingAuditEntry[]
    summary: FinancialAuditSummary
  }> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_financial_audit_logs', {
          p_date_from: dateFrom,
          p_date_to: dateTo,
          p_user_id: userId
        })

      if (error) {
        throw new Error(`Failed to fetch financial audit logs: ${error.message}`)
      }

      const logs = (data || []).map(this.enrichAuditEntry)
      const summary = this.calculateFinancialSummary(logs, dateFrom, dateTo)

      return { logs, summary }
    } catch (error) {
      console.error('Failed to get financial audit logs:', error)
      throw error
    }
  }

  /**
   * Log booking status change with compliance tracking
   */
  async logBookingStatusChange(
    bookingId: string,
    oldStatus: BookingStatus,
    newStatus: BookingStatus,
    userId: string,
    reason?: string
  ): Promise<void> {
    try {
      // Get booking details for context
      const { data: booking } = await this.supabase
        .from('bookings')
        .select('booking_reference, total_price, payment_status')
        .eq('id', bookingId)
        .single()

      const complianceFlags = this.getComplianceFlags(oldStatus, newStatus, booking?.payment_status)

      // Log the status change with additional context
      await this.supabase
        .from('booking_audit_logs')
        .insert({
          booking_id: bookingId,
          user_id: userId,
          action: 'status_change',
          old_status: oldStatus,
          new_status: newStatus,
          booking_reference: booking?.booking_reference,
          financial_impact: this.calculateFinancialImpact(oldStatus, newStatus, booking?.total_price),
          compliance_flags: complianceFlags,
          reason,
          timestamp: new Date().toISOString()
        })

    } catch (error) {
      console.error('Failed to log booking status change:', error)
      // Don't throw error to avoid breaking main operations
    }
  }

  /**
   * Log payment transaction with audit trail
   */
  async logPaymentTransaction(
    bookingId: string,
    transactionType: 'payment' | 'refund' | 'chargeback',
    amount: number,
    status: 'success' | 'failed' | 'pending',
    paymentIntentId?: string,
    userId?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('payment_audit_logs')
        .insert({
          booking_id: bookingId,
          transaction_type: transactionType,
          amount,
          status,
          payment_intent_id: paymentIntentId,
          user_id: userId,
          timestamp: new Date().toISOString(),
          compliance_flags: this.getPaymentComplianceFlags(transactionType, amount, status)
        })

    } catch (error) {
      console.error('Failed to log payment transaction:', error)
      // Don't throw error to avoid breaking main operations
    }
  }

  /**
   * Generate compliance report for audit purposes
   */
  async generateComplianceReport(
    dateFrom: string,
    dateTo: string
  ): Promise<{
    booking_activities: any[]
    financial_transactions: any[]
    compliance_issues: any[]
    summary: any
  }> {
    try {
      // Get compliance statistics
      const { data: stats, error: statsError } = await this.supabase
        .rpc('get_compliance_statistics', {
          p_date_from: dateFrom,
          p_date_to: dateTo
        })

      if (statsError) {
        throw new Error(`Failed to get compliance statistics: ${statsError.message}`)
      }

      // Get booking activities
      const { data: bookingActivities } = await this.supabase
        .from('audit_logs')
        .select('*')
        .in('table_name', ['bookings', 'booking_messages', 'booking_fees'])
        .gte('timestamp', dateFrom)
        .lte('timestamp', dateTo)
        .order('timestamp', { ascending: false })

      // Get financial transactions
      const { data: financialTransactions } = await this.supabase
        .from('payment_audit_logs')
        .select('*')
        .gte('timestamp', dateFrom)
        .lte('timestamp', dateTo)
        .order('timestamp', { ascending: false })

      // Identify compliance issues
      const complianceIssues = this.identifyComplianceIssues(
        bookingActivities || [],
        financialTransactions || []
      )

      return {
        booking_activities: bookingActivities || [],
        financial_transactions: financialTransactions || [],
        compliance_issues: complianceIssues,
        summary: {
          period: { from: dateFrom, to: dateTo },
          statistics: stats || [],
          total_issues: complianceIssues.length,
          generated_at: new Date().toISOString()
        }
      }

    } catch (error) {
      console.error('Failed to generate compliance report:', error)
      throw error
    }
  }

  /**
   * Archive old audit logs for GDPR compliance
   */
  async archiveOldAuditLogs(retentionDays: number = 2555): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('archive_old_audit_logs', { p_retention_days: retentionDays })

      if (error) {
        throw new Error(`Failed to archive audit logs: ${error.message}`)
      }

      return data || 0
    } catch (error) {
      console.error('Failed to archive audit logs:', error)
      throw error
    }
  }

  /**
   * Private helper methods
   */
  private enrichAuditEntry(entry: any): BookingAuditEntry {
    return {
      ...entry,
      booking_reference: entry.booking_reference,
      financial_impact: entry.transaction_amount,
      compliance_flags: this.extractComplianceFlags(entry)
    }
  }

  private calculateFinancialSummary(
    logs: BookingAuditEntry[],
    dateFrom?: string,
    dateTo?: string
  ): FinancialAuditSummary {
    const bookingLogs = logs.filter(log => log.tableName === 'bookings')
    const transactionLogs = logs.filter(log => log.tableName === 'transactions')

    return {
      total_transactions: transactionLogs.length,
      total_amount: transactionLogs.reduce((sum, log) => sum + (log.financial_impact || 0), 0),
      booking_count: bookingLogs.length,
      payment_failures: logs.filter(log => 
        log.newValues?.payment_status === 'failed' || 
        log.newValues?.status === 'failed'
      ).length,
      refunds: logs.filter(log => 
        log.action === 'UPDATE' && 
        log.newValues?.payment_status === 'refunded'
      ).length,
      date_range: {
        from: dateFrom || logs[logs.length - 1]?.timestamp || '',
        to: dateTo || logs[0]?.timestamp || ''
      }
    }
  }

  private getComplianceFlags(
    oldStatus: BookingStatus,
    newStatus: BookingStatus,
    paymentStatus?: PaymentStatus
  ): string[] {
    const flags: string[] = []

    // Flag cancellations after payment
    if (oldStatus === 'confirmed' && newStatus === 'cancelled' && paymentStatus === 'paid') {
      flags.push('CANCELLATION_AFTER_PAYMENT')
    }

    // Flag rapid status changes
    if (oldStatus === 'pending' && newStatus === 'completed') {
      flags.push('RAPID_STATUS_CHANGE')
    }

    // Flag financial impact changes
    if (['cancelled', 'completed'].includes(newStatus)) {
      flags.push('FINANCIAL_IMPACT')
    }

    return flags
  }

  private calculateFinancialImpact(
    oldStatus: BookingStatus,
    newStatus: BookingStatus,
    totalPrice?: number
  ): number {
    if (!totalPrice) return 0

    // Calculate financial impact based on status change
    if (oldStatus === 'pending' && newStatus === 'confirmed') {
      return totalPrice // Revenue recognized
    }
    
    if (oldStatus === 'confirmed' && newStatus === 'cancelled') {
      return -totalPrice // Revenue lost
    }

    return 0
  }

  private getPaymentComplianceFlags(
    transactionType: string,
    amount: number,
    status: string
  ): string[] {
    const flags: string[] = []

    // Flag large transactions
    if (amount > 10000) {
      flags.push('LARGE_TRANSACTION')
    }

    // Flag failed payments
    if (status === 'failed') {
      flags.push('PAYMENT_FAILURE')
    }

    // Flag chargebacks
    if (transactionType === 'chargeback') {
      flags.push('CHARGEBACK')
    }

    return flags
  }

  private extractComplianceFlags(entry: any): string[] {
    const flags: string[] = []

    // Extract flags from audit entry based on patterns
    if (entry.table_name === 'bookings' && entry.action === 'DELETE') {
      flags.push('DATA_DELETION')
    }

    if (entry.changed_fields?.includes('payment_status')) {
      flags.push('PAYMENT_CHANGE')
    }

    return flags
  }

  private identifyComplianceIssues(
    bookingActivities: any[],
    financialTransactions: any[]
  ): any[] {
    const issues: any[] = []

    // Check for suspicious patterns
    const rapidChanges = bookingActivities.filter(activity => 
      activity.compliance_flags?.includes('RAPID_STATUS_CHANGE')
    )

    if (rapidChanges.length > 0) {
      issues.push({
        type: 'RAPID_STATUS_CHANGES',
        count: rapidChanges.length,
        severity: 'medium',
        description: 'Multiple rapid booking status changes detected'
      })
    }

    // Check for payment issues
    const paymentFailures = financialTransactions.filter(tx => 
      tx.status === 'failed'
    )

    if (paymentFailures.length > 10) {
      issues.push({
        type: 'HIGH_PAYMENT_FAILURE_RATE',
        count: paymentFailures.length,
        severity: 'high',
        description: 'High number of payment failures detected'
      })
    }

    return issues
  }
}

export const bookingAuditService = new BookingAuditService()