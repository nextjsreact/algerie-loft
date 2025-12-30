/**
 * Encrypted User Data Service
 * Handles user data operations with encryption for sensitive information
 */

import { logger } from '@/lib/logger';
import { 
  encryptPersonalData, 
  decryptPersonalData, 
  encryptGuestInfo, 
  decryptGuestInfo 
} from '@/lib/security/encryption';
import { 
  ConsentManager, 
  DataProcessingRegistry, 
  DataCategory, 
  LegalBasis 
} from '@/lib/security/gdpr-compliance';
import { DataLifecycleTracker } from '@/lib/security/data-retention';

export interface EncryptedUserProfile {
  id: string;
  email: string;
  encryptedFirstName?: string;
  encryptedLastName?: string;
  encryptedPhone?: string;
  encryptedAddress?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DecryptedUserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EncryptedReservationData {
  id: string;
  customerId: string;
  loftId: string;
  checkInDate: Date;
  checkOutDate: Date;
  encryptedGuestInfo: any;
  pricing: any;
  status: string;
  createdAt: Date;
}

export interface DecryptedReservationData {
  id: string;
  customerId: string;
  loftId: string;
  checkInDate: Date;
  checkOutDate: Date;
  guestInfo: any;
  pricing: any;
  status: string;
  createdAt: Date;
}

/**
 * Encrypted User Profile Service
 */
export class EncryptedUserService {
  /**
   * Create user profile with encrypted sensitive data
   */
  static async createUserProfile(userData: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    role: string;
  }): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      // Encrypt sensitive personal data
      const encryptedData = await encryptPersonalData({
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: userData.address
      });

      // Store encrypted profile data
      await supabase
        .from('encrypted_profiles')
        .insert({
          id: userData.id,
          email: userData.email,
          encrypted_first_name: encryptedData.encryptedFirstName,
          encrypted_last_name: encryptedData.encryptedLastName,
          encrypted_phone: encryptedData.encryptedPhone,
          encrypted_address: encryptedData.encryptedAddress,
          role: userData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      // Record GDPR compliance
      await this.recordGDPRCompliance(userData.id, 'profile_creation');

      logger.info('Encrypted user profile created', { userId: userData.id });
    } catch (error) {
      logger.error('Failed to create encrypted user profile', error);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Get user profile with decrypted data
   */
  static async getUserProfile(userId: string): Promise<DecryptedUserProfile | null> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data: profile } = await supabase
        .from('encrypted_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) {
        return null;
      }

      // Decrypt sensitive data
      const decryptedData = await decryptPersonalData({
        encryptedFirstName: profile.encrypted_first_name,
        encryptedLastName: profile.encrypted_last_name,
        encryptedPhone: profile.encrypted_phone,
        encryptedAddress: profile.encrypted_address
      });

      // Record data access
      await DataLifecycleTracker.recordEvent({
        userId,
        dataType: 'user_profile',
        action: 'accessed'
      });

      return {
        id: profile.id,
        email: profile.email,
        firstName: decryptedData.firstName,
        lastName: decryptedData.lastName,
        phone: decryptedData.phone,
        address: decryptedData.address,
        role: profile.role,
        createdAt: new Date(profile.created_at),
        updatedAt: new Date(profile.updated_at)
      };
    } catch (error) {
      logger.error('Failed to get user profile', error);
      return null;
    }
  }

  /**
   * Update user profile with encryption
   */
  static async updateUserProfile(
    userId: string, 
    updates: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      address: string;
    }>
  ): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      // Encrypt updated data
      const encryptedUpdates = await encryptPersonalData(updates);

      // Prepare update object
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (encryptedUpdates.encryptedFirstName) {
        updateData.encrypted_first_name = encryptedUpdates.encryptedFirstName;
      }
      if (encryptedUpdates.encryptedLastName) {
        updateData.encrypted_last_name = encryptedUpdates.encryptedLastName;
      }
      if (encryptedUpdates.encryptedPhone) {
        updateData.encrypted_phone = encryptedUpdates.encryptedPhone;
      }
      if (encryptedUpdates.encryptedAddress) {
        updateData.encrypted_address = encryptedUpdates.encryptedAddress;
      }

      await supabase
        .from('encrypted_profiles')
        .update(updateData)
        .eq('id', userId);

      // Record data update
      await DataLifecycleTracker.recordEvent({
        userId,
        dataType: 'user_profile',
        action: 'updated',
        metadata: { updatedFields: Object.keys(updates) }
      });

      logger.info('User profile updated', { userId, fields: Object.keys(updates) });
    } catch (error) {
      logger.error('Failed to update user profile', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Delete user profile (GDPR compliance)
   */
  static async deleteUserProfile(userId: string, reason: string = 'User request'): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      // Check for active reservations
      const { data: activeReservations } = await supabase
        .from('reservations')
        .select('id')
        .eq('customer_id', userId)
        .in('status', ['confirmed', 'pending'])
        .gte('check_in_date', new Date().toISOString().split('T')[0]);

      if (activeReservations && activeReservations.length > 0) {
        throw new Error('Cannot delete profile with active reservations');
      }

      // Anonymize instead of hard delete to maintain referential integrity
      await supabase
        .from('encrypted_profiles')
        .update({
          email: `anonymized_${userId}@deleted.local`,
          encrypted_first_name: await encryptPersonalData({ firstName: 'ANONYMIZED' }).then(d => d.encryptedFirstName),
          encrypted_last_name: await encryptPersonalData({ lastName: 'USER' }).then(d => d.encryptedLastName),
          encrypted_phone: null,
          encrypted_address: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      // Record erasure
      await supabase
        .from('gdpr_erasure_log')
        .insert({
          user_id: userId,
          erasure_date: new Date().toISOString(),
          reason,
          method: 'anonymization',
          tables_affected: ['encrypted_profiles'],
          records_affected: 1
        });

      // Record lifecycle event
      await DataLifecycleTracker.recordEvent({
        userId,
        dataType: 'user_profile',
        action: 'anonymized',
        metadata: { reason }
      });

      logger.info('User profile anonymized', { userId, reason });
    } catch (error) {
      logger.error('Failed to delete user profile', error);
      throw error;
    }
  }

  /**
   * Record GDPR compliance for user operations
   */
  private static async recordGDPRCompliance(userId: string, operation: string): Promise<void> {
    try {
      // Record consent (assuming user agreed to terms during registration)
      await ConsentManager.recordConsent({
        userId,
        dataCategory: DataCategory.PERSONAL_IDENTITY,
        legalBasis: LegalBasis.CONTRACT,
        purpose: 'User account management and service provision',
        consentGiven: true,
        version: '1.0'
      });

      // Record data processing
      await DataProcessingRegistry.recordProcessing({
        userId,
        dataCategory: DataCategory.PERSONAL_IDENTITY,
        legalBasis: LegalBasis.CONTRACT,
        purpose: `User ${operation}`,
        dataFields: ['firstName', 'lastName', 'phone', 'address'],
        encrypted: true,
        source: 'user_service'
      });
    } catch (error) {
      logger.error('Failed to record GDPR compliance', error);
      // Don't throw error to avoid breaking main operation
    }
  }
}

/**
 * Encrypted Reservation Service
 */
export class EncryptedReservationService {
  /**
   * Create reservation with encrypted guest information
   */
  static async createReservation(reservationData: {
    customerId: string;
    loftId: string;
    checkInDate: Date;
    checkOutDate: Date;
    guestInfo: any;
    pricing: any;
    specialRequests?: string;
  }): Promise<string> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      // Encrypt guest information
      const encryptedGuestInfo = await encryptGuestInfo(reservationData.guestInfo);

      // Create reservation with encrypted data
      const { data } = await supabase
        .from('reservations')
        .insert({
          customer_id: reservationData.customerId,
          loft_id: reservationData.loftId,
          check_in_date: reservationData.checkInDate.toISOString().split('T')[0],
          check_out_date: reservationData.checkOutDate.toISOString().split('T')[0],
          guest_info: encryptedGuestInfo,
          pricing: reservationData.pricing,
          special_requests: reservationData.specialRequests,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      // Record GDPR compliance
      await this.recordReservationGDPRCompliance(reservationData.customerId, data.id);

      logger.info('Encrypted reservation created', { reservationId: data.id });
      return data.id;
    } catch (error) {
      logger.error('Failed to create encrypted reservation', error);
      throw new Error('Failed to create reservation');
    }
  }

  /**
   * Get reservation with decrypted guest information
   */
  static async getReservation(reservationId: string): Promise<DecryptedReservationData | null> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data: reservation } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
        .single();

      if (!reservation) {
        return null;
      }

      // Decrypt guest information
      const decryptedGuestInfo = await decryptGuestInfo(reservation.guest_info);

      // Record data access
      await DataLifecycleTracker.recordEvent({
        userId: reservation.customer_id,
        dataType: 'reservation',
        action: 'accessed',
        metadata: { reservationId }
      });

      return {
        id: reservation.id,
        customerId: reservation.customer_id,
        loftId: reservation.loft_id,
        checkInDate: new Date(reservation.check_in_date),
        checkOutDate: new Date(reservation.check_out_date),
        guestInfo: decryptedGuestInfo,
        pricing: reservation.pricing,
        status: reservation.status,
        createdAt: new Date(reservation.created_at)
      };
    } catch (error) {
      logger.error('Failed to get reservation', error);
      return null;
    }
  }

  /**
   * Update reservation with encryption
   */
  static async updateReservation(
    reservationId: string,
    updates: {
      guestInfo?: any;
      specialRequests?: string;
      status?: string;
    }
  ): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Encrypt guest info if provided
      if (updates.guestInfo) {
        updateData.guest_info = await encryptGuestInfo(updates.guestInfo);
      }

      if (updates.specialRequests !== undefined) {
        updateData.special_requests = updates.specialRequests;
      }

      if (updates.status) {
        updateData.status = updates.status;
      }

      await supabase
        .from('reservations')
        .update(updateData)
        .eq('id', reservationId);

      // Get customer ID for lifecycle tracking
      const { data: reservation } = await supabase
        .from('reservations')
        .select('customer_id')
        .eq('id', reservationId)
        .single();

      if (reservation) {
        await DataLifecycleTracker.recordEvent({
          userId: reservation.customer_id,
          dataType: 'reservation',
          action: 'updated',
          metadata: { reservationId, updatedFields: Object.keys(updates) }
        });
      }

      logger.info('Reservation updated', { reservationId, fields: Object.keys(updates) });
    } catch (error) {
      logger.error('Failed to update reservation', error);
      throw new Error('Failed to update reservation');
    }
  }

  /**
   * Record GDPR compliance for reservation operations
   */
  private static async recordReservationGDPRCompliance(customerId: string, reservationId: string): Promise<void> {
    try {
      // Record data processing for reservation
      await DataProcessingRegistry.recordProcessing({
        userId: customerId,
        dataCategory: DataCategory.PERSONAL_IDENTITY,
        legalBasis: LegalBasis.CONTRACT,
        purpose: 'Reservation management and service provision',
        dataFields: ['guest_names', 'guest_contact', 'special_requests'],
        encrypted: true,
        source: 'reservation_service'
      });

      // Record lifecycle event
      await DataLifecycleTracker.recordEvent({
        userId: customerId,
        dataType: 'reservation',
        action: 'created',
        metadata: { reservationId }
      });
    } catch (error) {
      logger.error('Failed to record reservation GDPR compliance', error);
    }
  }
}

/**
 * Data Export Service for GDPR compliance
 */
export class DataExportService {
  /**
   * Export all user data for GDPR compliance
   */
  static async exportUserData(userId: string): Promise<{
    profile: DecryptedUserProfile | null;
    reservations: DecryptedReservationData[];
    consents: any[];
    processingRecords: any[];
    lifecycleEvents: any[];
  }> {
    try {
      // Get user profile
      const profile = await EncryptedUserService.getUserProfile(userId);

      // Get user reservations
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data: reservationData } = await supabase
        .from('reservations')
        .select('*')
        .eq('customer_id', userId);

      const reservations: DecryptedReservationData[] = [];
      if (reservationData) {
        for (const reservation of reservationData) {
          const decryptedReservation = await EncryptedReservationService.getReservation(reservation.id);
          if (decryptedReservation) {
            reservations.push(decryptedReservation);
          }
        }
      }

      // Get GDPR records
      const { ConsentManager, DataProcessingRegistry } = await import('@/lib/security/gdpr-compliance');
      const { DataLifecycleTracker } = await import('@/lib/security/data-retention');

      const consents = await ConsentManager.getUserConsents(userId);
      const processingRecords = await DataProcessingRegistry.getUserProcessingRecords(userId);
      const lifecycleEvents = await DataLifecycleTracker.getUserLifecycleEvents(userId);

      // Record data export
      await DataLifecycleTracker.recordEvent({
        userId,
        dataType: 'user_profile',
        action: 'accessed',
        metadata: { action: 'data_export', timestamp: new Date().toISOString() }
      });

      logger.info('User data exported', { userId });

      return {
        profile,
        reservations,
        consents,
        processingRecords,
        lifecycleEvents
      };
    } catch (error) {
      logger.error('Failed to export user data', error);
      throw new Error('Failed to export user data');
    }
  }
}