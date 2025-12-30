/**
 * GDPR Compliance Service
 * Handles data export, deletion, and consent management for GDPR compliance
 */

import { createClient } from '@/utils/supabase/client'
import { Database } from '@/lib/types'

export interface GDPRDataExport {
  user_profile: any
  bookings: any[]
  partner_profile?: any
  audit_logs: any[]
  messages: any[]
  reviews: any[]
  transactions: any[]
  notifications: any[]
  export_date: string
  export_id: string
}

export interface GDPRDeletionRequest {
  user_id: string
  requested_by: string
  reason: string
  deletion_type: 'soft' | 'hard'
  retain_financial_records: boolean
  retain_audit_logs: boolean
  requested_at: string
}

export interface ConsentRecord {
  user_id: string
  consent_type: 'data_processing' | 'marketing' | 'analytics' | 'cookies'
  consent_given: boolean
  consent_date: string
  consent_version: string
  ip_address?: string
  user_agent?: string
}

export class GDPRComplianceService {
  private supabase = createClient()

  /**
   * Export all user data for GDPR compliance
   */
  async exportUserData(userId: string, requestedBy: string): Promise<GDPRDataExport> {
    try {
      const exportId = `gdpr_export_${userId}_${Date.now()}`
      
      // Get user profile
      const { data: userProfile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        throw new Error(`Failed to fetch user profile: ${profileError.message}`)
      }

      // Get bookings (both as client and partner)
      const { data: clientBookings } = await this.supabase
        .from('bookings')
        .select(`
          *,
          loft:lofts(name, address),
          partner:profiles!bookings_partner_id_fkey(full_name, email)
        `)
        .eq('client_id', userId)

      const { data: partnerBookings } = await this.supabase
        .from('bookings')
        .select(`
          *,
          loft:lofts(name, address),
          client:profiles!bookings_client_id_fkey(full_name, email)
        `)
        .eq('partner_id', userId)

      const allBookings = [...(clientBookings || []), ...(partnerBookings || [])]

      // Get partner profile if exists
      const { data: partnerProfile } = await this.supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get audit logs
      const { data: auditLogs } = await this.supabase
        .rpc('get_audit_logs_filtered', {
          p_user_id: userId,
          p_limit: 10000
        })

      // Get messages
      const bookingIds = allBookings.map(b => b.id)
      const { data: messages } = await this.supabase
        .from('booking_messages')
        .select('*')
        .in('booking_id', bookingIds)
        .eq('sender_id', userId)

      // Get reviews
      const { data: reviews } = await this.supabase
        .from('loft_reviews')
        .select('*')
        .eq('client_id', userId)

      // Get transactions
      const { data: transactions } = await this.supabase
        .from('transactions')
        .select('*')
        .or(`loft_id.in.(${allBookings.map(b => b.loft_id).join(',')})`)

      // Get notifications
      const { data: notifications } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)

      // Log the export request
      await this.logGDPRActivity({
        user_id: userId,
        activity_type: 'data_export',
        requested_by: requestedBy,
        details: {
          export_id: exportId,
          records_exported: {
            bookings: allBookings.length,
            audit_logs: auditLogs?.length || 0,
            messages: messages?.length || 0,
            reviews: reviews?.length || 0,
            transactions: transactions?.length || 0,
            notifications: notifications?.length || 0
          }
        }
      })

      return {
        user_profile: userProfile,
        bookings: allBookings,
        partner_profile: partnerProfile,
        audit_logs: auditLogs || [],
        messages: messages || [],
        reviews: reviews || [],
        transactions: transactions || [],
        notifications: notifications || [],
        export_date: new Date().toISOString(),
        export_id: exportId
      }

    } catch (error) {
      console.error('GDPR data export failed:', error)
      throw new Error(`Data export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Request user data deletion (GDPR Right to be Forgotten)
   */
  async requestDataDeletion(request: GDPRDeletionRequest): Promise<{ success: boolean; deletion_id: string }> {
    try {
      const deletionId = `gdpr_deletion_${request.user_id}_${Date.now()}`

      // Create deletion request record
      const { error: insertError } = await this.supabase
        .from('gdpr_deletion_requests')
        .insert({
          id: deletionId,
          user_id: request.user_id,
          requested_by: request.requested_by,
          reason: request.reason,
          deletion_type: request.deletion_type,
          retain_financial_records: request.retain_financial_records,
          retain_audit_logs: request.retain_audit_logs,
          status: 'pending',
          requested_at: request.requested_at
        })

      if (insertError) {
        throw new Error(`Failed to create deletion request: ${insertError.message}`)
      }

      // Log the deletion request
      await this.logGDPRActivity({
        user_id: request.user_id,
        activity_type: 'deletion_request',
        requested_by: request.requested_by,
        details: {
          deletion_id: deletionId,
          deletion_type: request.deletion_type,
          reason: request.reason
        }
      })

      return {
        success: true,
        deletion_id: deletionId
      }

    } catch (error) {
      console.error('GDPR deletion request failed:', error)
      throw new Error(`Deletion request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Execute user data deletion (admin function)
   */
  async executeDataDeletion(deletionId: string, executedBy: string): Promise<{ success: boolean; deleted_records: Record<string, number> }> {
    try {
      // Get deletion request
      const { data: deletionRequest, error: requestError } = await this.supabase
        .from('gdpr_deletion_requests')
        .select('*')
        .eq('id', deletionId)
        .single()

      if (requestError || !deletionRequest) {
        throw new Error('Deletion request not found')
      }

      if (deletionRequest.status !== 'pending') {
        throw new Error('Deletion request is not in pending status')
      }

      const userId = deletionRequest.user_id
      const deletedRecords: Record<string, number> = {}

      // Start transaction-like operations
      if (deletionRequest.deletion_type === 'hard') {
        // Hard deletion - permanently remove data
        
        // Delete notifications (unless they contain financial information)
        const { error: notifError, count: notifCount } = await this.supabase
          .from('notifications')
          .delete()
          .eq('user_id', userId)
          .neq('type', 'payment')
        
        deletedRecords.notifications = notifCount || 0

        // Delete booking messages
        const { error: msgError, count: msgCount } = await this.supabase
          .from('booking_messages')
          .delete()
          .eq('sender_id', userId)
        
        deletedRecords.booking_messages = msgCount || 0

        // Delete reviews
        const { error: reviewError, count: reviewCount } = await this.supabase
          .from('loft_reviews')
          .delete()
          .eq('client_id', userId)
        
        deletedRecords.reviews = reviewCount || 0

        // Handle bookings based on financial record retention
        if (!deletionRequest.retain_financial_records) {
          // Delete completed bookings older than legal retention period
          const retentionDate = new Date()
          retentionDate.setFullYear(retentionDate.getFullYear() - 7) // 7 years retention

          const { error: bookingError, count: bookingCount } = await this.supabase
            .from('bookings')
            .delete()
            .or(`client_id.eq.${userId},partner_id.eq.${userId}`)
            .lt('created_at', retentionDate.toISOString())
          
          deletedRecords.old_bookings = bookingCount || 0
        }

        // Anonymize recent bookings instead of deleting
        const { error: anonError, count: anonCount } = await this.supabase
          .from('bookings')
          .update({
            special_requests: null,
            cancellation_reason: null
          })
          .or(`client_id.eq.${userId},partner_id.eq.${userId}`)

        deletedRecords.anonymized_bookings = anonCount || 0

      } else {
        // Soft deletion - anonymize data
        
        // Anonymize user profile
        const { error: profileError } = await this.supabase
          .from('profiles')
          .update({
            full_name: 'Deleted User',
            email: `deleted_${userId}@example.com`,
            avatar_url: null,
            phone: null,
            address: null,
            deleted_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (profileError) {
          throw new Error(`Failed to anonymize profile: ${profileError.message}`)
        }

        deletedRecords.anonymized_profile = 1

        // Anonymize partner profile if exists
        const { error: partnerError, count: partnerCount } = await this.supabase
          .from('partner_profiles')
          .update({
            business_name: 'Deleted Business',
            tax_id: null,
            address: 'Deleted Address',
            phone: 'Deleted Phone',
            bank_details: {},
            verification_documents: []
          })
          .eq('user_id', userId)

        deletedRecords.anonymized_partner_profiles = partnerCount || 0
      }

      // Handle audit logs based on retention setting
      if (!deletionRequest.retain_audit_logs) {
        // Delete audit logs older than legal requirement
        const auditRetentionDate = new Date()
        auditRetentionDate.setFullYear(auditRetentionDate.getFullYear() - 7)

        const { error: auditError, count: auditCount } = await this.supabase
          .from('audit_logs')
          .delete()
          .eq('user_id', userId)
          .lt('timestamp', auditRetentionDate.toISOString())

        deletedRecords.old_audit_logs = auditCount || 0
      }

      // Update deletion request status
      await this.supabase
        .from('gdpr_deletion_requests')
        .update({
          status: 'completed',
          executed_by: executedBy,
          executed_at: new Date().toISOString(),
          deletion_summary: deletedRecords
        })
        .eq('id', deletionId)

      // Log the deletion execution
      await this.logGDPRActivity({
        user_id: userId,
        activity_type: 'deletion_executed',
        requested_by: executedBy,
        details: {
          deletion_id: deletionId,
          deleted_records: deletedRecords
        }
      })

      return {
        success: true,
        deleted_records: deletedRecords
      }

    } catch (error) {
      console.error('GDPR deletion execution failed:', error)
      throw new Error(`Deletion execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(consent: ConsentRecord): Promise<{ success: boolean }> {
    try {
      const { error } = await this.supabase
        .from('user_consents')
        .upsert({
          user_id: consent.user_id,
          consent_type: consent.consent_type,
          consent_given: consent.consent_given,
          consent_date: consent.consent_date,
          consent_version: consent.consent_version,
          ip_address: consent.ip_address,
          user_agent: consent.user_agent
        }, {
          onConflict: 'user_id,consent_type'
        })

      if (error) {
        throw new Error(`Failed to record consent: ${error.message}`)
      }

      // Log consent activity
      await this.logGDPRActivity({
        user_id: consent.user_id,
        activity_type: 'consent_recorded',
        requested_by: consent.user_id,
        details: {
          consent_type: consent.consent_type,
          consent_given: consent.consent_given,
          consent_version: consent.consent_version
        }
      })

      return { success: true }

    } catch (error) {
      console.error('Consent recording failed:', error)
      throw new Error(`Consent recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get user consent status
   */
  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_consents')
        .select('*')
        .eq('user_id', userId)
        .order('consent_date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch consents: ${error.message}`)
      }

      return data || []

    } catch (error) {
      console.error('Failed to get user consents:', error)
      throw new Error(`Failed to get consents: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(dateFrom: string, dateTo: string): Promise<any> {
    try {
      // Get deletion requests
      const { data: deletionRequests } = await this.supabase
        .from('gdpr_deletion_requests')
        .select('*')
        .gte('requested_at', dateFrom)
        .lte('requested_at', dateTo)

      // Get data export requests
      const { data: exportRequests } = await this.supabase
        .from('gdpr_activities')
        .select('*')
        .eq('activity_type', 'data_export')
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo)

      // Get consent statistics
      const { data: consentStats } = await this.supabase
        .from('user_consents')
        .select('consent_type, consent_given, count(*)')
        .gte('consent_date', dateFrom)
        .lte('consent_date', dateTo)

      return {
        period: { from: dateFrom, to: dateTo },
        deletion_requests: {
          total: deletionRequests?.length || 0,
          pending: deletionRequests?.filter(r => r.status === 'pending').length || 0,
          completed: deletionRequests?.filter(r => r.status === 'completed').length || 0,
          rejected: deletionRequests?.filter(r => r.status === 'rejected').length || 0
        },
        data_exports: {
          total: exportRequests?.length || 0
        },
        consent_statistics: consentStats || [],
        generated_at: new Date().toISOString()
      }

    } catch (error) {
      console.error('Failed to generate compliance report:', error)
      throw new Error(`Compliance report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Log GDPR activity for audit purposes
   */
  private async logGDPRActivity(activity: {
    user_id: string
    activity_type: string
    requested_by: string
    details: any
  }): Promise<void> {
    try {
      await this.supabase
        .from('gdpr_activities')
        .insert({
          user_id: activity.user_id,
          activity_type: activity.activity_type,
          requested_by: activity.requested_by,
          details: activity.details,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log GDPR activity:', error)
      // Don't throw error here to avoid breaking main operations
    }
  }
}

export const gdprService = new GDPRComplianceService()