/**
 * GDPR Compliance utilities
 * Provides data protection, privacy rights, and compliance measures
 */

import { logger } from '@/lib/logger';
import { encryptSensitiveData, decryptSensitiveData } from './encryption';

// GDPR data categories
export enum DataCategory {
  PERSONAL_IDENTITY = 'personal_identity',
  CONTACT_INFORMATION = 'contact_information',
  FINANCIAL_DATA = 'financial_data',
  BEHAVIORAL_DATA = 'behavioral_data',
  TECHNICAL_DATA = 'technical_data',
  SPECIAL_CATEGORY = 'special_category' // Health, biometric, etc.
}

// Legal basis for processing
export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

// Data retention periods (in days)
export const RETENTION_PERIODS = {
  [DataCategory.PERSONAL_IDENTITY]: 2555, // 7 years
  [DataCategory.CONTACT_INFORMATION]: 1095, // 3 years
  [DataCategory.FINANCIAL_DATA]: 2555, // 7 years (legal requirement)
  [DataCategory.BEHAVIORAL_DATA]: 365, // 1 year
  [DataCategory.TECHNICAL_DATA]: 90, // 3 months
  [DataCategory.SPECIAL_CATEGORY]: 365 // 1 year (with explicit consent)
} as const;

export interface ConsentRecord {
  userId: string;
  dataCategory: DataCategory;
  legalBasis: LegalBasis;
  purpose: string;
  consentGiven: boolean;
  consentDate: Date;
  withdrawnDate?: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataProcessingRecord {
  id: string;
  userId: string;
  dataCategory: DataCategory;
  legalBasis: LegalBasis;
  purpose: string;
  dataFields: string[];
  processingDate: Date;
  retentionUntil: Date;
  encrypted: boolean;
  source: string;
}

export interface PrivacyRequest {
  id: string;
  userId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: Date;
  completionDate?: Date;
  reason?: string;
  details?: any;
}

/**
 * GDPR Consent Management
 */
export class ConsentManager {
  /**
   * Record user consent
   */
  static async recordConsent(consent: Omit<ConsentRecord, 'consentDate'>): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      await supabase
        .from('gdpr_consent_records')
        .insert({
          user_id: consent.userId,
          data_category: consent.dataCategory,
          legal_basis: consent.legalBasis,
          purpose: consent.purpose,
          consent_given: consent.consentGiven,
          consent_date: new Date().toISOString(),
          version: consent.version,
          ip_address: consent.ipAddress,
          user_agent: consent.userAgent
        });

      logger.info('GDPR consent recorded', { userId: consent.userId, category: consent.dataCategory });
    } catch (error) {
      logger.error('Failed to record GDPR consent', error);
      throw new Error('Failed to record consent');
    }
  }

  /**
   * Withdraw consent
   */
  static async withdrawConsent(userId: string, dataCategory: DataCategory): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      await supabase
        .from('gdpr_consent_records')
        .update({
          consent_given: false,
          withdrawn_date: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('data_category', dataCategory)
        .eq('consent_given', true);

      logger.info('GDPR consent withdrawn', { userId, category: dataCategory });
    } catch (error) {
      logger.error('Failed to withdraw GDPR consent', error);
      throw new Error('Failed to withdraw consent');
    }
  }

  /**
   * Check if user has given consent for specific data category
   */
  static async hasConsent(userId: string, dataCategory: DataCategory): Promise<boolean> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data } = await supabase
        .from('gdpr_consent_records')
        .select('consent_given')
        .eq('user_id', userId)
        .eq('data_category', dataCategory)
        .eq('consent_given', true)
        .is('withdrawn_date', null)
        .order('consent_date', { ascending: false })
        .limit(1)
        .single();

      return data?.consent_given || false;
    } catch (error) {
      logger.error('Failed to check GDPR consent', error);
      return false;
    }
  }

  /**
   * Get all consent records for a user
   */
  static async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data } = await supabase
        .from('gdpr_consent_records')
        .select('*')
        .eq('user_id', userId)
        .order('consent_date', { ascending: false });

      return data?.map(record => ({
        userId: record.user_id,
        dataCategory: record.data_category,
        legalBasis: record.legal_basis,
        purpose: record.purpose,
        consentGiven: record.consent_given,
        consentDate: new Date(record.consent_date),
        withdrawnDate: record.withdrawn_date ? new Date(record.withdrawn_date) : undefined,
        version: record.version,
        ipAddress: record.ip_address,
        userAgent: record.user_agent
      })) || [];
    } catch (error) {
      logger.error('Failed to get user consents', error);
      return [];
    }
  }
}

/**
 * Data Processing Registry
 */
export class DataProcessingRegistry {
  /**
   * Record data processing activity
   */
  static async recordProcessing(processing: Omit<DataProcessingRecord, 'id' | 'processingDate' | 'retentionUntil'>): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const processingDate = new Date();
      const retentionPeriod = RETENTION_PERIODS[processing.dataCategory];
      const retentionUntil = new Date(processingDate.getTime() + retentionPeriod * 24 * 60 * 60 * 1000);

      await supabase
        .from('gdpr_processing_records')
        .insert({
          user_id: processing.userId,
          data_category: processing.dataCategory,
          legal_basis: processing.legalBasis,
          purpose: processing.purpose,
          data_fields: processing.dataFields,
          processing_date: processingDate.toISOString(),
          retention_until: retentionUntil.toISOString(),
          encrypted: processing.encrypted,
          source: processing.source
        });

      logger.info('Data processing recorded', { userId: processing.userId, category: processing.dataCategory });
    } catch (error) {
      logger.error('Failed to record data processing', error);
      throw new Error('Failed to record data processing');
    }
  }

  /**
   * Get processing records for a user
   */
  static async getUserProcessingRecords(userId: string): Promise<DataProcessingRecord[]> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data } = await supabase
        .from('gdpr_processing_records')
        .select('*')
        .eq('user_id', userId)
        .order('processing_date', { ascending: false });

      return data?.map(record => ({
        id: record.id,
        userId: record.user_id,
        dataCategory: record.data_category,
        legalBasis: record.legal_basis,
        purpose: record.purpose,
        dataFields: record.data_fields,
        processingDate: new Date(record.processing_date),
        retentionUntil: new Date(record.retention_until),
        encrypted: record.encrypted,
        source: record.source
      })) || [];
    } catch (error) {
      logger.error('Failed to get processing records', error);
      return [];
    }
  }
}

/**
 * Privacy Rights Management
 */
export class PrivacyRightsManager {
  /**
   * Submit privacy request
   */
  static async submitRequest(request: Omit<PrivacyRequest, 'id' | 'requestDate' | 'status'>): Promise<string> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data } = await supabase
        .from('gdpr_privacy_requests')
        .insert({
          user_id: request.userId,
          type: request.type,
          status: 'pending',
          request_date: new Date().toISOString(),
          reason: request.reason,
          details: request.details
        })
        .select('id')
        .single();

      logger.info('Privacy request submitted', { userId: request.userId, type: request.type });
      return data.id;
    } catch (error) {
      logger.error('Failed to submit privacy request', error);
      throw new Error('Failed to submit privacy request');
    }
  }

  /**
   * Process data access request (Right to Access)
   */
  static async processAccessRequest(userId: string): Promise<any> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      // Collect all user data from various tables
      const userData: any = {};

      // User profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        userData.profile = profile;
      }

      // Reservation data
      const { data: reservations } = await supabase
        .from('reservations')
        .select('*')
        .eq('customer_id', userId);

      if (reservations) {
        userData.reservations = reservations;
      }

      // Consent records
      userData.consents = await ConsentManager.getUserConsents(userId);

      // Processing records
      userData.processingRecords = await DataProcessingRegistry.getUserProcessingRecords(userId);

      logger.info('Data access request processed', { userId });
      return userData;
    } catch (error) {
      logger.error('Failed to process access request', error);
      throw new Error('Failed to process access request');
    }
  }

  /**
   * Process data erasure request (Right to be Forgotten)
   */
  static async processErasureRequest(userId: string, reason?: string): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      // Check if user has active reservations
      const { data: activeReservations } = await supabase
        .from('reservations')
        .select('id')
        .eq('customer_id', userId)
        .in('status', ['confirmed', 'pending'])
        .gte('check_in_date', new Date().toISOString().split('T')[0]);

      if (activeReservations && activeReservations.length > 0) {
        throw new Error('Cannot delete data while user has active reservations');
      }

      // Anonymize or delete user data
      await this.anonymizeUserData(userId);

      // Record the erasure
      await supabase
        .from('gdpr_erasure_log')
        .insert({
          user_id: userId,
          erasure_date: new Date().toISOString(),
          reason: reason || 'User request',
          method: 'anonymization'
        });

      logger.info('Data erasure request processed', { userId });
    } catch (error) {
      logger.error('Failed to process erasure request', error);
      throw error;
    }
  }

  /**
   * Anonymize user data
   */
  private static async anonymizeUserData(userId: string): Promise<void> {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    // Anonymize profile data
    await supabase
      .from('profiles')
      .update({
        full_name: 'ANONYMIZED_USER',
        email: `anonymized_${userId}@deleted.local`,
        phone: null,
        avatar_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    // Anonymize reservation guest information
    const { data: reservations } = await supabase
      .from('reservations')
      .select('id, guest_info')
      .eq('customer_id', userId);

    if (reservations) {
      for (const reservation of reservations) {
        const anonymizedGuestInfo = {
          ...reservation.guest_info,
          primary_guest: {
            first_name: 'ANONYMIZED',
            last_name: 'USER',
            email: `anonymized_${reservation.id}@deleted.local`,
            phone: null,
            nationality: null
          },
          additional_guests: reservation.guest_info.additional_guests?.map(() => ({
            first_name: 'ANONYMIZED',
            last_name: 'GUEST',
            age_group: 'adult'
          })) || []
        };

        await supabase
          .from('reservations')
          .update({
            guest_info: anonymizedGuestInfo,
            special_requests: null,
            dietary_requirements: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', reservation.id);
      }
    }
  }

  /**
   * Process data portability request
   */
  static async processPortabilityRequest(userId: string): Promise<string> {
    try {
      const userData = await this.processAccessRequest(userId);
      
      // Convert to portable format (JSON)
      const portableData = {
        exportDate: new Date().toISOString(),
        userId,
        data: userData,
        format: 'JSON',
        version: '1.0'
      };

      // In a real implementation, you might want to:
      // 1. Generate a secure download link
      // 2. Encrypt the data
      // 3. Set expiration time
      
      const exportData = JSON.stringify(portableData, null, 2);
      
      logger.info('Data portability request processed', { userId });
      return exportData;
    } catch (error) {
      logger.error('Failed to process portability request', error);
      throw new Error('Failed to process portability request');
    }
  }
}

/**
 * Data Retention Management
 */
export class DataRetentionManager {
  /**
   * Check and clean up expired data
   */
  static async cleanupExpiredData(): Promise<{ deletedRecords: number; categories: string[] }> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      let totalDeleted = 0;
      const cleanedCategories: string[] = [];

      // Clean up expired processing records
      const { data: expiredRecords } = await supabase
        .from('gdpr_processing_records')
        .select('id, data_category, user_id')
        .lt('retention_until', new Date().toISOString());

      if (expiredRecords && expiredRecords.length > 0) {
        // Group by category for logging
        const categoryCounts: Record<string, number> = {};
        
        for (const record of expiredRecords) {
          categoryCounts[record.data_category] = (categoryCounts[record.data_category] || 0) + 1;
        }

        // Delete expired records
        const recordIds = expiredRecords.map(r => r.id);
        await supabase
          .from('gdpr_processing_records')
          .delete()
          .in('id', recordIds);

        totalDeleted += expiredRecords.length;
        cleanedCategories.push(...Object.keys(categoryCounts));

        logger.info('Expired data cleaned up', { 
          totalDeleted: expiredRecords.length, 
          categories: categoryCounts 
        });
      }

      // Clean up old audit logs (keep for 2 years)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const { count: auditDeleted } = await supabase
        .from('reservation_audit_log')
        .delete()
        .lt('created_at', twoYearsAgo.toISOString());

      if (auditDeleted) {
        totalDeleted += auditDeleted;
        cleanedCategories.push('audit_logs');
      }

      return { deletedRecords: totalDeleted, categories: [...new Set(cleanedCategories)] };
    } catch (error) {
      logger.error('Failed to cleanup expired data', error);
      throw new Error('Failed to cleanup expired data');
    }
  }

  /**
   * Get data retention status for a user
   */
  static async getUserRetentionStatus(userId: string): Promise<{
    category: DataCategory;
    recordCount: number;
    oldestRecord: Date;
    retentionUntil: Date;
    daysUntilExpiry: number;
  }[]> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data: records } = await supabase
        .from('gdpr_processing_records')
        .select('data_category, processing_date, retention_until')
        .eq('user_id', userId);

      if (!records) return [];

      // Group by category
      const categoryStats: Record<string, any> = {};

      for (const record of records) {
        const category = record.data_category;
        if (!categoryStats[category]) {
          categoryStats[category] = {
            category,
            recordCount: 0,
            oldestRecord: new Date(record.processing_date),
            retentionUntil: new Date(record.retention_until)
          };
        }

        categoryStats[category].recordCount++;
        
        const recordDate = new Date(record.processing_date);
        if (recordDate < categoryStats[category].oldestRecord) {
          categoryStats[category].oldestRecord = recordDate;
        }

        const retentionDate = new Date(record.retention_until);
        if (retentionDate > categoryStats[category].retentionUntil) {
          categoryStats[category].retentionUntil = retentionDate;
        }
      }

      // Calculate days until expiry
      const now = new Date();
      return Object.values(categoryStats).map((stats: any) => ({
        ...stats,
        daysUntilExpiry: Math.ceil((stats.retentionUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }));
    } catch (error) {
      logger.error('Failed to get retention status', error);
      return [];
    }
  }
}

/**
 * GDPR Compliance Validator
 */
export class GDPRValidator {
  /**
   * Validate GDPR compliance for data processing
   */
  static async validateProcessing(
    userId: string,
    dataCategory: DataCategory,
    legalBasis: LegalBasis,
    purpose: string
  ): Promise<{ isCompliant: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check if consent is required and obtained
      if (legalBasis === LegalBasis.CONSENT) {
        const hasConsent = await ConsentManager.hasConsent(userId, dataCategory);
        if (!hasConsent) {
          issues.push(`User consent required for ${dataCategory} but not obtained`);
        }
      }

      // Check for special category data
      if (dataCategory === DataCategory.SPECIAL_CATEGORY && legalBasis !== LegalBasis.CONSENT) {
        issues.push('Special category data requires explicit consent');
      }

      // Validate purpose limitation
      if (!purpose || purpose.length < 10) {
        issues.push('Processing purpose must be specific and clearly defined');
      }

      // Check data minimization
      // This would need to be implemented based on specific business logic

      return {
        isCompliant: issues.length === 0,
        issues
      };
    } catch (error) {
      logger.error('Failed to validate GDPR compliance', error);
      return {
        isCompliant: false,
        issues: ['Failed to validate compliance']
      };
    }
  }

  /**
   * Generate GDPR compliance report
   */
  static async generateComplianceReport(): Promise<{
    totalUsers: number;
    consentRecords: number;
    processingRecords: number;
    privacyRequests: number;
    dataRetentionStatus: any;
    complianceScore: number;
  }> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      // Count total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Count consent records
      const { count: consentRecords } = await supabase
        .from('gdpr_consent_records')
        .select('*', { count: 'exact', head: true });

      // Count processing records
      const { count: processingRecords } = await supabase
        .from('gdpr_processing_records')
        .select('*', { count: 'exact', head: true });

      // Count privacy requests
      const { count: privacyRequests } = await supabase
        .from('gdpr_privacy_requests')
        .select('*', { count: 'exact', head: true });

      // Calculate compliance score (simplified)
      let complianceScore = 100;
      
      if ((consentRecords || 0) < (totalUsers || 0) * 0.8) {
        complianceScore -= 20; // Deduct for low consent coverage
      }

      if ((privacyRequests || 0) > (totalUsers || 0) * 0.1) {
        complianceScore -= 10; // Deduct for high privacy request rate
      }

      return {
        totalUsers: totalUsers || 0,
        consentRecords: consentRecords || 0,
        processingRecords: processingRecords || 0,
        privacyRequests: privacyRequests || 0,
        dataRetentionStatus: await DataRetentionManager.cleanupExpiredData(),
        complianceScore: Math.max(0, complianceScore)
      };
    } catch (error) {
      logger.error('Failed to generate compliance report', error);
      throw new Error('Failed to generate compliance report');
    }
  }
}