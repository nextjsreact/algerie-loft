/**
 * Enhanced Reservation Repository
 * 
 * Provides robust reservation creation and management with comprehensive validation.
 * Ensures loft existence checking and proper pricing calculation using unified loft data.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { LoftRepository } from './loft-repository';
import { ValidationService, combineValidationResults } from '@/lib/services/validation-service';
import { TestLoft } from '@/lib/data/test-lofts';
import { ReservationGuestInfo, ReservationPricing } from '@/lib/types';

export interface ReservationData {
  loft_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_info: ReservationGuestInfo;
  guests: number;
  special_requests?: string;
  dietary_requirements?: string;
  accessibility_needs?: string;
  terms_accepted: boolean;
  terms_version?: string;
  communication_preferences?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  booking_source?: string;
  user_agent?: string;
  ip_address?: string;
}

export interface ReservationValidationResult {
  valid: boolean;
  errors: string[];
  loft?: TestLoft;
  pricing?: PricingBreakdown;
  nights?: number;
}

export interface PricingBreakdown {
  nights: number;
  nightly_rate: number;
  base_price: number;
  cleaning_fee: number;
  service_fee: number;
  service_fee_rate: number;
  taxes: number;
  tax_rate: number;
  total_amount: number;
  currency: string;
  breakdown: Array<{
    date: string;
    rate: number;
    type: string;
  }>;
}

export interface ReservationCreationResult {
  success: boolean;
  reservation?: ReservationRecord;
  errors: string[];
  confirmation_code?: string;
  booking_reference?: string;
}

export interface ReservationRecord {
  id: string;
  loft_id: string;
  customer_id?: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  guest_info: ReservationGuestInfo;
  pricing: ReservationPricing;
  special_requests?: string;
  dietary_requirements?: string;
  accessibility_needs?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded' | 'failed';
  confirmation_code: string;
  booking_reference: string;
  communication_preferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  terms_accepted: boolean;
  terms_accepted_at: string;
  terms_version: string;
  booking_source: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * Enhanced Reservation Repository Class
 * 
 * Handles reservation creation with comprehensive validation, loft existence checking,
 * and proper pricing calculation. Ensures data consistency between lofts and reservations.
 */
export class ReservationRepository {
  private supabase: SupabaseClient;
  private loftRepository: LoftRepository;

  // Configuration constants
  private readonly SERVICE_FEE_RATE = 0.12; // 12% service fee
  private readonly DEFAULT_CURRENCY = 'DZD';
  private readonly DEFAULT_TERMS_VERSION = '1.0';

  constructor(supabase: SupabaseClient, loftRepository: LoftRepository) {
    this.supabase = supabase;
    this.loftRepository = loftRepository;
  }

  /**
   * Validate reservation data comprehensively
   * @param data Reservation data to validate
   * @returns Promise<ReservationValidationResult> with validation details
   */
  async validateReservationData(data: ReservationData): Promise<ReservationValidationResult> {
    try {
      const errors: string[] = [];

      // 1. Validate basic data structure
      if (!data) {
        return {
          valid: false,
          errors: ['Reservation data is required']
        };
      }

      // 2. Validate loft ID format
      if (!ValidationService.validateLoftId(data.loft_id)) {
        errors.push('Invalid loft ID format');
      }

      // 3. Validate date range
      const dateValidation = ValidationService.validateDateRange(data.check_in_date, data.check_out_date);
      if (!dateValidation.valid) {
        errors.push(dateValidation.error || 'Invalid date range');
      }

      // 4. Validate guest information
      const guestValidation = ValidationService.validateGuestInfo(data.guest_info);
      if (!guestValidation.valid) {
        errors.push(...guestValidation.errors);
      }

      // 5. Validate guest count consistency
      if (data.guests !== data.guest_info?.total_guests) {
        errors.push('Guest count must match guest information total');
      }

      // 6. Validate special requests
      if (!ValidationService.validateSpecialRequests(data.special_requests)) {
        errors.push('Special requests contain invalid content');
      }

      // 7. Validate terms acceptance
      if (!data.terms_accepted) {
        errors.push('Terms and conditions must be accepted');
      }

      // If basic validation fails, return early
      if (errors.length > 0) {
        return {
          valid: false,
          errors
        };
      }

      // 8. Validate loft existence and consistency
      const loftValidation = await ValidationService.validateReservationConsistency(
        data.loft_id,
        this.loftRepository
      );

      if (!loftValidation.valid) {
        errors.push(loftValidation.error || 'Loft validation failed');
        return {
          valid: false,
          errors
        };
      }

      const loft = loftValidation.loft!;
      const nights = dateValidation.nights!;

      // 9. Validate business rules
      const businessRuleErrors = ValidationService.validateBusinessRules(data, loft);
      if (businessRuleErrors.length > 0) {
        errors.push(...businessRuleErrors);
      }

      // 10. Calculate and validate pricing
      const pricing = await this.calculatePricing(loft, data.check_in_date, data.check_out_date);
      
      if (!pricing) {
        errors.push('Unable to calculate pricing for this reservation');
        return {
          valid: false,
          errors
        };
      }

      // 11. Check availability (basic check - can be enhanced with actual availability service)
      const isAvailable = await this.checkBasicAvailability(data.loft_id, data.check_in_date, data.check_out_date);
      if (!isAvailable) {
        errors.push('The selected dates are not available for this loft');
      }

      return {
        valid: errors.length === 0,
        errors,
        loft,
        pricing,
        nights
      };

    } catch (error) {
      console.error('Error validating reservation data:', error);
      return {
        valid: false,
        errors: ['Error validating reservation data. Please try again.']
      };
    }
  }

  /**
   * Create a new reservation with comprehensive validation
   * @param data Reservation data
   * @param customerId Optional customer ID
   * @returns Promise<ReservationCreationResult> with creation result
   */
  async createReservation(data: ReservationData, customerId?: string): Promise<ReservationCreationResult> {
    try {
      // 1. Validate reservation data
      const validation = await this.validateReservationData(data);
      
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      const { loft, pricing } = validation;

      // 2. Generate unique identifiers
      const reservationId = this.generateReservationId();
      const confirmationCode = this.generateConfirmationCode();
      const bookingReference = this.generateBookingReference();

      // 3. Format reservation for database
      const reservationRecord = this.formatReservationForDatabase(
        data,
        loft!,
        pricing!,
        reservationId,
        confirmationCode,
        bookingReference,
        customerId
      );

      // 4. Attempt to insert into database
      const { data: insertedReservation, error } = await this.supabase
        .from('reservations')
        .insert([reservationRecord])
        .select()
        .single();

      if (error) {
        console.error('Database insertion error:', error);
        
        // Handle specific database errors
        if (error.code === '23503') { // Foreign key violation
          return {
            success: false,
            errors: ['The selected loft is no longer available. Please refresh and try again.']
          };
        }

        if (error.code === '23505') { // Unique constraint violation
          return {
            success: false,
            errors: ['A reservation with these details already exists. Please check your booking history.']
          };
        }

        return {
          success: false,
          errors: ['Unable to create reservation. Please try again.']
        };
      }

      // 5. Return successful result
      return {
        success: true,
        reservation: this.formatDatabaseReservationToRecord(insertedReservation),
        errors: [],
        confirmation_code: confirmationCode,
        booking_reference: bookingReference
      };

    } catch (error) {
      console.error('Error creating reservation:', error);
      return {
        success: false,
        errors: ['An unexpected error occurred. Please try again.']
      };
    }
  }

  /**
   * Calculate pricing for a reservation
   * @param loft Loft data
   * @param checkIn Check-in date
   * @param checkOut Check-out date
   * @returns Promise<PricingBreakdown | null> with pricing details
   */
  private async calculatePricing(loft: TestLoft, checkIn: string, checkOut: string): Promise<PricingBreakdown | null> {
    try {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (nights <= 0) {
        return null;
      }

      // Base calculations
      const nightly_rate = loft.price_per_night;
      const base_price = nightly_rate * nights;
      const cleaning_fee = loft.cleaning_fee || 0;
      const service_fee = Math.round(base_price * this.SERVICE_FEE_RATE);
      const tax_rate = loft.tax_rate || 19;
      const taxes = Math.round((base_price + service_fee) * (tax_rate / 100));
      const total_amount = base_price + cleaning_fee + service_fee + taxes;

      // Create breakdown for each night
      const breakdown: Array<{ date: string; rate: number; type: string }> = [];
      
      for (let i = 0; i < nights; i++) {
        const currentDate = new Date(checkInDate);
        currentDate.setDate(currentDate.getDate() + i);
        
        breakdown.push({
          date: currentDate.toISOString().split('T')[0],
          rate: nightly_rate,
          type: 'nightly_rate'
        });
      }

      return {
        nights,
        nightly_rate,
        base_price,
        cleaning_fee,
        service_fee,
        service_fee_rate: this.SERVICE_FEE_RATE,
        taxes,
        tax_rate,
        total_amount,
        currency: this.DEFAULT_CURRENCY,
        breakdown
      };

    } catch (error) {
      console.error('Error calculating pricing:', error);
      return null;
    }
  }

  /**
   * Format reservation data for database insertion
   * @param data Original reservation data
   * @param loft Loft information
   * @param pricing Calculated pricing
   * @param id Generated reservation ID
   * @param confirmationCode Generated confirmation code
   * @param bookingReference Generated booking reference
   * @param customerId Optional customer ID
   * @returns Formatted reservation object for database
   */
  private formatReservationForDatabase(
    data: ReservationData,
    loft: TestLoft,
    pricing: PricingBreakdown,
    id: string,
    confirmationCode: string,
    bookingReference: string,
    customerId?: string
  ): any {
    const now = new Date().toISOString();

    return {
      id,
      customer_id: customerId || null,
      loft_id: data.loft_id,
      check_in_date: data.check_in_date,
      check_out_date: data.check_out_date,
      nights: pricing.nights,
      guest_info: data.guest_info,
      pricing: {
        base_price: pricing.base_price,
        nights: pricing.nights,
        nightly_rate: pricing.nightly_rate,
        cleaning_fee: pricing.cleaning_fee,
        service_fee: pricing.service_fee,
        taxes: pricing.taxes,
        total_amount: pricing.total_amount,
        currency: pricing.currency,
        breakdown: pricing.breakdown
      },
      special_requests: data.special_requests || null,
      dietary_requirements: data.dietary_requirements || null,
      accessibility_needs: data.accessibility_needs || null,
      status: 'pending',
      payment_status: 'pending',
      confirmation_code: confirmationCode,
      booking_reference: bookingReference,
      communication_preferences: data.communication_preferences || {
        email: true,
        sms: false,
        whatsapp: false
      },
      terms_accepted: data.terms_accepted,
      terms_accepted_at: now,
      terms_version: data.terms_version || this.DEFAULT_TERMS_VERSION,
      booking_source: data.booking_source || 'website',
      user_agent: data.user_agent || null,
      ip_address: data.ip_address || null,
      created_at: now,
      updated_at: now,
      created_by: customerId || null,
      updated_by: customerId || null
    };
  }

  /**
   * Format database reservation to ReservationRecord
   * @param dbReservation Database reservation object
   * @returns ReservationRecord object
   */
  private formatDatabaseReservationToRecord(dbReservation: any): ReservationRecord {
    return {
      id: dbReservation.id,
      loft_id: dbReservation.loft_id,
      customer_id: dbReservation.customer_id,
      check_in_date: dbReservation.check_in_date,
      check_out_date: dbReservation.check_out_date,
      nights: dbReservation.nights,
      guest_info: typeof dbReservation.guest_info === 'string' 
        ? JSON.parse(dbReservation.guest_info) 
        : dbReservation.guest_info,
      pricing: typeof dbReservation.pricing === 'string'
        ? JSON.parse(dbReservation.pricing)
        : dbReservation.pricing,
      special_requests: dbReservation.special_requests,
      dietary_requirements: dbReservation.dietary_requirements,
      accessibility_needs: dbReservation.accessibility_needs,
      status: dbReservation.status,
      payment_status: dbReservation.payment_status,
      confirmation_code: dbReservation.confirmation_code,
      booking_reference: dbReservation.booking_reference,
      communication_preferences: typeof dbReservation.communication_preferences === 'string'
        ? JSON.parse(dbReservation.communication_preferences)
        : dbReservation.communication_preferences,
      terms_accepted: dbReservation.terms_accepted,
      terms_accepted_at: dbReservation.terms_accepted_at,
      terms_version: dbReservation.terms_version,
      booking_source: dbReservation.booking_source,
      user_agent: dbReservation.user_agent,
      ip_address: dbReservation.ip_address,
      created_at: dbReservation.created_at,
      updated_at: dbReservation.updated_at,
      created_by: dbReservation.created_by,
      updated_by: dbReservation.updated_by
    };
  }

  /**
   * Basic availability check (can be enhanced with dedicated availability service)
   * @param loftId Loft ID to check
   * @param checkIn Check-in date
   * @param checkOut Check-out date
   * @returns Promise<boolean> - true if available
   */
  private async checkBasicAvailability(loftId: string, checkIn: string, checkOut: string): Promise<boolean> {
    try {
      const { data: conflictingReservations, error } = await this.supabase
        .from('reservations')
        .select('id')
        .eq('loft_id', loftId)
        .in('status', ['pending', 'confirmed'])
        .or(`and(check_in_date.lt.${checkOut},check_out_date.gt.${checkIn})`);

      if (error) {
        console.error('Error checking availability:', error);
        return false; // Err on the side of caution
      }

      return !conflictingReservations || conflictingReservations.length === 0;

    } catch (error) {
      console.error('Error in availability check:', error);
      return false;
    }
  }

  /**
   * Generate unique reservation ID
   * @returns string - unique reservation ID
   */
  private generateReservationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `res_${timestamp}_${random}`;
  }

  /**
   * Generate confirmation code
   * @returns string - 8-character confirmation code
   */
  private generateConfirmationCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  /**
   * Generate booking reference
   * @returns string - formatted booking reference
   */
  private generateBookingReference(): string {
    const year = new Date().getFullYear().toString().substr(-2);
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `LA${year}${random}`;
  }

  /**
   * Get reservation by ID
   * @param id Reservation ID, confirmation code, or booking reference
   * @returns Promise<ReservationRecord | null>
   */
  async getReservationById(id: string): Promise<ReservationRecord | null> {
    try {
      const { data: reservation, error } = await this.supabase
        .from('reservations')
        .select('*')
        .or(`id.eq.${id},confirmation_code.eq.${id},booking_reference.eq.${id}`)
        .single();

      if (error || !reservation) {
        return null;
      }

      return this.formatDatabaseReservationToRecord(reservation);

    } catch (error) {
      console.error('Error getting reservation by ID:', error);
      return null;
    }
  }

  /**
   * Update reservation status
   * @param id Reservation ID
   * @param status New status
   * @param updatedBy User ID who made the update
   * @returns Promise<boolean> - true if successful
   */
  async updateReservationStatus(
    id: string, 
    status: ReservationRecord['status'], 
    updatedBy?: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('reservations')
        .update({
          status,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy || null
        })
        .eq('id', id);

      return !error;

    } catch (error) {
      console.error('Error updating reservation status:', error);
      return false;
    }
  }

  /**
   * Cancel reservation
   * @param id Reservation ID
   * @param reason Cancellation reason
   * @param cancelledBy User who cancelled
   * @returns Promise<boolean> - true if successful
   */
  async cancelReservation(id: string, reason?: string, cancelledBy?: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          cancellation_reason: reason || null,
          cancelled_by: cancelledBy || null,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          updated_by: cancelledBy || null
        })
        .eq('id', id);

      return !error;

    } catch (error) {
      console.error('Error cancelling reservation:', error);
      return false;
    }
  }
}

/**
 * Factory function to create a ReservationRepository instance
 * @param supabase Supabase client instance
 * @param loftRepository LoftRepository instance
 * @returns ReservationRepository instance
 */
export function createReservationRepository(
  supabase: SupabaseClient, 
  loftRepository: LoftRepository
): ReservationRepository {
  return new ReservationRepository(supabase, loftRepository);
}

/**
 * Error codes for reservation operations
 */
export enum ReservationErrorCodes {
  LOFT_NOT_FOUND = 'LOFT_NOT_FOUND',
  LOFT_UNAVAILABLE = 'LOFT_UNAVAILABLE',
  INVALID_DATES = 'INVALID_DATES',
  GUEST_COUNT_EXCEEDED = 'GUEST_COUNT_EXCEEDED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  AVAILABILITY_CONFLICT = 'AVAILABILITY_CONFLICT',
  PRICING_ERROR = 'PRICING_ERROR',
  TERMS_NOT_ACCEPTED = 'TERMS_NOT_ACCEPTED'
}