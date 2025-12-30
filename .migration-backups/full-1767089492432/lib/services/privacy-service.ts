import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import type { 
  CookieConsentData, 
  GDPRDataRequestData, 
  PrivacySettingsData,
  DataBreachData 
} from '@/lib/schemas/privacy';

export class PrivacyService {
  /**
   * Record cookie consent for a user
   */
  static async recordCookieConsent(
    userId: string | null, 
    consentData: CookieConsentData,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      const supabase = await createClient();
      
      const consentRecord = {
        user_id: userId,
        consent_data: consentData,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
        version: consentData.version || '1.0'
      };

      const { data, error } = await supabase
        .from('cookie_consents')
        .insert(consentRecord)
        .select()
        .single();

      if (error) {
        logger.error('Failed to record cookie consent', { error, userId, consentData });
        throw new Error('Failed to record cookie consent');
      }

      logger.info('Cookie consent recorded', { 
        userId, 
        consentId: data.id,
        categories: Object.keys(consentData).filter(key => consentData[key as keyof CookieConsentData] === true)
      });

      return data;
    } catch (error) {
      logger.error('Error recording cookie consent', error);
      throw error;
    }
  }

  /**
   * Get latest cookie consent for a user
   */
  static async getCookieConsent(userId: string | null, sessionId?: string) {
    try {
      const supabase = await createClient();
      
      let query = supabase
        .from('cookie_consents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        return null;
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        logger.error('Failed to get cookie consent', { error, userId, sessionId });
        throw new Error('Failed to get cookie consent');
      }

      return data;
    } catch (error) {
      logger.error('Error getting cookie consent', error);
      return null;
    }
  }

  /**
   * Submit GDPR data request
   */
  static async submitGDPRRequest(requestData: GDPRDataRequestData, ipAddress?: string) {
    try {
      const supabase = await createClient();
      
      // Check for honeypot
      if (requestData.website) {
        logger.warn('GDPR request blocked - honeypot triggered', { email: requestData.email });
        return { success: false, message: 'Invalid request' };
      }

      const gdprRequest = {
        request_type: requestData.requestType,
        email: requestData.email,
        full_name: requestData.fullName,
        reason: requestData.reason,
        data_categories: requestData.dataCategories || [],
        verification_method: requestData.verificationMethod,
        status: 'pending',
        ip_address: ipAddress,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('gdpr_requests')
        .insert(gdprRequest)
        .select()
        .single();

      if (error) {
        logger.error('Failed to submit GDPR request', { error, requestData });
        throw new Error('Failed to submit GDPR request');
      }

      logger.info('GDPR request submitted', { 
        requestId: data.id,
        type: requestData.requestType,
        email: requestData.email
      });

      // Send confirmation email (implement separately)
      await this.sendGDPRConfirmationEmail(data);

      return { 
        success: true, 
        message: 'Request submitted successfully',
        requestId: data.id 
      };
    } catch (error) {
      logger.error('Error submitting GDPR request', error);
      throw error;
    }
  }

  /**
   * Update privacy settings for a user
   */
  static async updatePrivacySettings(userId: string, settings: PrivacySettingsData) {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('privacy_settings')
        .upsert({
          user_id: userId,
          settings: settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to update privacy settings', { error, userId, settings });
        throw new Error('Failed to update privacy settings');
      }

      logger.info('Privacy settings updated', { userId, settingsId: data.id });

      return data;
    } catch (error) {
      logger.error('Error updating privacy settings', error);
      throw error;
    }
  }

  /**
   * Get privacy settings for a user
   */
  static async getPrivacySettings(userId: string) {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        logger.error('Failed to get privacy settings', { error, userId });
        throw new Error('Failed to get privacy settings');
      }

      return data;
    } catch (error) {
      logger.error('Error getting privacy settings', error);
      return null;
    }
  }

  /**
   * Export user data for GDPR compliance
   */
  static async exportUserData(userId: string) {
    try {
      const supabase = await createClient();
      
      // Collect data from various tables
      const [
        profile,
        bookings,
        payments,
        communications,
        preferences,
        auditLogs
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('reservations').select('*').eq('user_id', userId),
        supabase.from('transactions').select('*').eq('user_id', userId),
        supabase.from('conversations').select('*').eq('user_id', userId),
        supabase.from('privacy_settings').select('*').eq('user_id', userId),
        supabase.from('audit_logs').select('*').eq('user_id', userId).limit(100)
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        userId: userId,
        personalInformation: profile.data,
        bookingHistory: bookings.data || [],
        paymentHistory: payments.data?.map(p => ({
          ...p,
          // Remove sensitive payment details
          card_number: undefined,
          cvv: undefined,
          bank_account: undefined
        })) || [],
        communications: communications.data || [],
        preferences: preferences.data,
        auditTrail: auditLogs.data || [],
        dataCategories: {
          personalInfo: !!profile.data,
          bookingHistory: (bookings.data?.length || 0) > 0,
          paymentData: (payments.data?.length || 0) > 0,
          communicationLogs: (communications.data?.length || 0) > 0,
          preferences: !!preferences.data,
          analyticsData: (auditLogs.data?.length || 0) > 0
        }
      };

      logger.info('User data exported', { 
        userId, 
        categories: Object.keys(exportData.dataCategories).filter(
          key => exportData.dataCategories[key as keyof typeof exportData.dataCategories]
        )
      });

      return exportData;
    } catch (error) {
      logger.error('Error exporting user data', error);
      throw error;
    }
  }

  /**
   * Delete user data for GDPR compliance
   */
  static async deleteUserData(userId: string, categories: string[] = []) {
    try {
      const supabase = await createClient();
      const deletionResults: Record<string, boolean> = {};

      // If no specific categories, delete all
      const categoriesToDelete = categories.length > 0 ? categories : [
        'personal_info',
        'booking_history',
        'payment_data',
        'communication_logs',
        'preferences',
        'analytics_data'
      ];

      for (const category of categoriesToDelete) {
        try {
          switch (category) {
            case 'personal_info':
              await supabase.from('profiles').delete().eq('id', userId);
              deletionResults.personal_info = true;
              break;
              
            case 'booking_history':
              await supabase.from('reservations').delete().eq('user_id', userId);
              deletionResults.booking_history = true;
              break;
              
            case 'payment_data':
              await supabase.from('transactions').delete().eq('user_id', userId);
              deletionResults.payment_data = true;
              break;
              
            case 'communication_logs':
              await supabase.from('conversations').delete().eq('user_id', userId);
              deletionResults.communication_logs = true;
              break;
              
            case 'preferences':
              await supabase.from('privacy_settings').delete().eq('user_id', userId);
              deletionResults.preferences = true;
              break;
              
            case 'analytics_data':
              await supabase.from('audit_logs').delete().eq('user_id', userId);
              deletionResults.analytics_data = true;
              break;
          }
        } catch (error) {
          logger.error(`Failed to delete ${category} for user ${userId}`, error);
          deletionResults[category] = false;
        }
      }

      logger.info('User data deletion completed', { userId, deletionResults });

      return deletionResults;
    } catch (error) {
      logger.error('Error deleting user data', error);
      throw error;
    }
  }

  /**
   * Record data breach incident
   */
  static async recordDataBreach(breachData: DataBreachData) {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('data_breaches')
        .insert({
          incident_id: breachData.incidentId,
          severity: breachData.severity,
          affected_data_types: breachData.affectedDataTypes,
          affected_users: breachData.affectedUsers,
          discovered_at: breachData.discoveredAt,
          contained_at: breachData.containedAt,
          resolved_at: breachData.resolvedAt,
          description: breachData.description,
          mitigation_steps: breachData.mitigationSteps,
          notification_required: breachData.notificationRequired,
          regulatory_reported: breachData.regulatoryReported,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to record data breach', { error, breachData });
        throw new Error('Failed to record data breach');
      }

      logger.critical('Data breach recorded', { 
        incidentId: breachData.incidentId,
        severity: breachData.severity,
        affectedUsers: breachData.affectedUsers
      });

      // Trigger notifications if required
      if (breachData.notificationRequired) {
        await this.triggerBreachNotifications(data);
      }

      return data;
    } catch (error) {
      logger.error('Error recording data breach', error);
      throw error;
    }
  }

  /**
   * Send GDPR confirmation email
   */
  private static async sendGDPRConfirmationEmail(request: any) {
    // Implementation would depend on your email service
    logger.info('GDPR confirmation email queued', { 
      requestId: request.id,
      email: request.email 
    });
  }

  /**
   * Trigger breach notifications
   */
  private static async triggerBreachNotifications(breach: any) {
    // Implementation would depend on your notification system
    logger.info('Breach notifications triggered', { 
      incidentId: breach.incident_id,
      severity: breach.severity 
    });
  }

  /**
   * Check if user has valid consent for data processing
   */
  static async hasValidConsent(userId: string, purpose: string): Promise<boolean> {
    try {
      const consent = await this.getCookieConsent(userId);
      if (!consent) return false;

      const consentData = consent.consent_data as CookieConsentData;
      
      switch (purpose) {
        case 'analytics':
          return consentData.analytics || false;
        case 'marketing':
          return consentData.marketing || false;
        case 'preferences':
          return consentData.preferences || false;
        case 'functional':
          return consentData.functional || false;
        default:
          return consentData.necessary || false;
      }
    } catch (error) {
      logger.error('Error checking consent', error);
      return false;
    }
  }

  /**
   * Anonymize user data (for retention compliance)
   */
  static async anonymizeUserData(userId: string) {
    try {
      const supabase = await createClient();
      
      // Replace personal identifiers with anonymized versions
      const anonymizedData = {
        email: `anonymized_${Date.now()}@example.com`,
        name: 'Anonymized User',
        phone: null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(anonymizedData)
        .eq('id', userId);

      if (error) {
        logger.error('Failed to anonymize user data', { error, userId });
        throw new Error('Failed to anonymize user data');
      }

      logger.info('User data anonymized', { userId });

      return true;
    } catch (error) {
      logger.error('Error anonymizing user data', error);
      throw error;
    }
  }
}