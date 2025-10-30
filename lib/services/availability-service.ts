// =====================================================
// AVAILABILITY SERVICE
// =====================================================
// Enhanced availability service for client reservation system
// Handles availability checking, pricing calculations, and reservation locking

import { createClient } from '@/utils/supabase/client';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface DateRange {
  checkIn: string;
  checkOut: string;
}

export interface PricingBreakdown {
  nightlyRate: number;
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  currency: string;
  priceOverrides?: PriceOverride[];
}

export interface PriceOverride {
  date: string;
  originalPrice: number;
  overridePrice: number;
  reason?: string;
}

export interface AvailabilityResult {
  isAvailable: boolean;
  unavailableDates: string[];
  minimumStay: number;
  maximumStay?: number;
  restrictions?: AvailabilityRestriction[];
}

export interface AvailabilityRestriction {
  type: 'minimum_stay' | 'maximum_stay' | 'blocked_dates' | 'maintenance';
  message: string;
  affectedDates?: string[];
}

export interface ReservationLock {
  lockId: string;
  loftId: string;
  checkIn: string;
  checkOut: string;
  expiresAt: Date;
  userId?: string;
}

export interface AvailabilityUpdate {
  loftId: string;
  date: string;
  isAvailable: boolean;
  priceOverride?: number;
  minimumStay?: number;
  maximumStay?: number;
  notes?: string;
  blockedReason?: string;
}

// =====================================================
// AVAILABILITY SERVICE CLASS
// =====================================================

export class AvailabilityService {
  private supabase = createClient();
  private readonly LOCK_TIMEOUT_MINUTES = 15;
  private readonly SERVICE_FEE_RATE = 0.12; // 12% service fee
  private readonly DEFAULT_TAX_RATE = 0.19; // 19% VAT

  /**
   * Check availability for a loft within a date range
   */
  async checkAvailability(loftId: string, dates: DateRange): Promise<AvailabilityResult> {
    try {
      // Validate date range
      this.validateDateRange(dates);

      // Get loft details for minimum/maximum stay requirements
      const { data: loftData, error: loftError } = await this.supabase
        .from('lofts')
        .select('minimum_stay, maximum_stay, status')
        .eq('id', loftId)
        .single();

      if (loftError || !loftData) {
        throw new Error('Loft not found or unavailable');
      }

      if (loftData.status !== 'available') {
        return {
          isAvailable: false,
          unavailableDates: [],
          minimumStay: loftData.minimum_stay || 1,
          maximumStay: loftData.maximum_stay,
          restrictions: [{
            type: 'blocked_dates',
            message: 'Loft is currently not available for booking'
          }]
        };
      }

      // Calculate nights and check minimum/maximum stay
      const nights = this.calculateNights(dates.checkIn, dates.checkOut);
      const restrictions: AvailabilityRestriction[] = [];

      if (nights < (loftData.minimum_stay || 1)) {
        restrictions.push({
          type: 'minimum_stay',
          message: `Minimum stay is ${loftData.minimum_stay || 1} night(s)`
        });
      }

      if (loftData.maximum_stay && nights > loftData.maximum_stay) {
        restrictions.push({
          type: 'maximum_stay',
          message: `Maximum stay is ${loftData.maximum_stay} night(s)`
        });
      }

      // Check for unavailable dates in the range
      const { data: unavailableDates, error: availabilityError } = await this.supabase
        .from('loft_availability')
        .select('date, blocked_reason')
        .eq('loft_id', loftId)
        .eq('is_available', false)
        .gte('date', dates.checkIn)
        .lt('date', dates.checkOut);

      if (availabilityError) {
        throw new Error('Failed to check availability');
      }

      // Check for existing reservations that conflict
      const { data: conflictingReservations, error: reservationError } = await this.supabase
        .from('reservations')
        .select('check_in, check_out, status')
        .eq('loft_id', loftId)
        .in('status', ['confirmed', 'pending'])
        .or(`and(check_in.lt.${dates.checkOut},check_out.gt.${dates.checkIn})`);

      if (reservationError) {
        throw new Error('Failed to check existing reservations');
      }

      const unavailableDatesList = (unavailableDates || []).map(item => item.date);
      const hasConflictingReservations = (conflictingReservations || []).length > 0;

      // Check for active reservation locks
      const { data: activeLocks, error: lockError } = await this.supabase
        .from('reservation_locks')
        .select('check_in, check_out, expires_at')
        .eq('loft_id', loftId)
        .gt('expires_at', new Date().toISOString())
        .or(`and(check_in.lt.${dates.checkOut},check_out.gt.${dates.checkIn})`);

      if (lockError) {
        console.warn('Failed to check reservation locks:', lockError);
      }

      const hasActiveLocks = (activeLocks || []).length > 0;

      const isAvailable = unavailableDatesList.length === 0 && 
                         !hasConflictingReservations && 
                         !hasActiveLocks && 
                         restrictions.length === 0;

      return {
        isAvailable,
        unavailableDates: unavailableDatesList,
        minimumStay: loftData.minimum_stay || 1,
        maximumStay: loftData.maximum_stay,
        restrictions: restrictions.length > 0 ? restrictions : undefined
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Calculate pricing breakdown for a reservation
   */
  async calculatePricing(loftId: string, dates: DateRange): Promise<PricingBreakdown> {
    try {
      // Validate date range
      this.validateDateRange(dates);

      // Get loft pricing information
      const { data: loftData, error: loftError } = await this.supabase
        .from('lofts')
        .select('price_per_night, cleaning_fee, tax_rate')
        .eq('id', loftId)
        .single();

      if (loftError || !loftData) {
        throw new Error('Loft not found');
      }

      const nights = this.calculateNights(dates.checkIn, dates.checkOut);
      const baseRate = loftData.price_per_night || 0;
      const cleaningFee = loftData.cleaning_fee || 0;
      const taxRate = loftData.tax_rate || this.DEFAULT_TAX_RATE;

      // Check for price overrides
      const { data: priceOverrides, error: overrideError } = await this.supabase
        .from('loft_availability')
        .select('date, price_override')
        .eq('loft_id', loftId)
        .not('price_override', 'is', null)
        .gte('date', dates.checkIn)
        .lt('date', dates.checkOut);

      if (overrideError) {
        console.warn('Failed to fetch price overrides:', overrideError);
      }

      // Calculate nightly rates with overrides
      let totalNightlyAmount = 0;
      const overrideDetails: PriceOverride[] = [];
      const dateRange = this.generateDateRange(dates.checkIn, dates.checkOut);

      for (const date of dateRange) {
        const override = (priceOverrides || []).find(po => po.date === date);
        const nightlyRate = override?.price_override || baseRate;
        totalNightlyAmount += nightlyRate;

        if (override?.price_override) {
          overrideDetails.push({
            date,
            originalPrice: baseRate,
            overridePrice: override.price_override,
            reason: 'Seasonal pricing'
          });
        }
      }

      const subtotal = totalNightlyAmount;
      const serviceFee = subtotal * this.SERVICE_FEE_RATE;
      const taxableAmount = subtotal + serviceFee + cleaningFee;
      const taxes = taxableAmount * taxRate;
      const total = taxableAmount + taxes;

      return {
        nightlyRate: baseRate,
        nights,
        subtotal,
        cleaningFee,
        serviceFee,
        taxes,
        total,
        currency: 'EUR', // Default currency
        priceOverrides: overrideDetails.length > 0 ? overrideDetails : undefined
      };
    } catch (error) {
      console.error('Error calculating pricing:', error);
      throw error;
    }
  }

  /**
   * Create a reservation lock to prevent double bookings
   */
  async lockReservation(loftId: string, dates: DateRange, userId?: string): Promise<string> {
    try {
      // Validate date range
      this.validateDateRange(dates);

      // Check if dates are still available
      const availability = await this.checkAvailability(loftId, dates);
      if (!availability.isAvailable) {
        throw new Error('Selected dates are no longer available');
      }

      // Create lock expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.LOCK_TIMEOUT_MINUTES);

      // Insert reservation lock
      const { data: lockData, error: lockError } = await this.supabase
        .from('reservation_locks')
        .insert({
          loft_id: loftId,
          check_in: dates.checkIn,
          check_out: dates.checkOut,
          expires_at: expiresAt.toISOString(),
          user_id: userId,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (lockError || !lockData) {
        throw new Error('Failed to create reservation lock');
      }

      return lockData.id;
    } catch (error) {
      console.error('Error creating reservation lock:', error);
      throw error;
    }
  }

  /**
   * Release a reservation lock
   */
  async releaseReservationLock(lockId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('reservation_locks')
        .delete()
        .eq('id', lockId);

      if (error) {
        throw new Error('Failed to release reservation lock');
      }
    } catch (error) {
      console.error('Error releasing reservation lock:', error);
      throw error;
    }
  }

  /**
   * Update availability for specific dates
   */
  async updateAvailability(updates: AvailabilityUpdate[]): Promise<void> {
    try {
      for (const update of updates) {
        const { error } = await this.supabase
          .from('loft_availability')
          .upsert({
            loft_id: update.loftId,
            date: update.date,
            is_available: update.isAvailable,
            price_override: update.priceOverride,
            minimum_stay: update.minimumStay,
            maximum_stay: update.maximumStay,
            notes: update.notes,
            blocked_reason: update.blockedReason,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'loft_id,date'
          });

        if (error) {
          console.error('Failed to update availability for date:', update.date, error);
          throw new Error(`Failed to update availability for ${update.date}`);
        }
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  /**
   * Synchronize availability data with external systems
   */
  async synchronizeAvailability(loftId: string): Promise<void> {
    try {
      // Clean up expired reservation locks
      await this.cleanupExpiredLocks();

      // Update availability based on confirmed reservations
      const { data: reservations, error: reservationError } = await this.supabase
        .from('reservations')
        .select('check_in, check_out')
        .eq('loft_id', loftId)
        .eq('status', 'confirmed');

      if (reservationError) {
        throw new Error('Failed to fetch reservations for synchronization');
      }

      // Mark dates as unavailable for confirmed reservations
      const unavailableDates: string[] = [];
      for (const reservation of reservations || []) {
        const dates = this.generateDateRange(reservation.check_in, reservation.check_out);
        unavailableDates.push(...dates);
      }

      // Update availability for reserved dates
      if (unavailableDates.length > 0) {
        const updates: AvailabilityUpdate[] = unavailableDates.map(date => ({
          loftId,
          date,
          isAvailable: false,
          blockedReason: 'Reserved'
        }));

        await this.updateAvailability(updates);
      }
    } catch (error) {
      console.error('Error synchronizing availability:', error);
      throw error;
    }
  }

  /**
   * Get availability calendar for a loft
   */
  async getAvailabilityCalendar(loftId: string, startDate: string, endDate: string): Promise<Record<string, boolean>> {
    try {
      const { data: availabilityData, error } = await this.supabase
        .from('loft_availability')
        .select('date, is_available')
        .eq('loft_id', loftId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) {
        throw new Error('Failed to fetch availability calendar');
      }

      const calendar: Record<string, boolean> = {};
      const dateRange = this.generateDateRange(startDate, endDate);

      // Initialize all dates as available by default
      for (const date of dateRange) {
        calendar[date] = true;
      }

      // Update with actual availability data
      for (const item of availabilityData || []) {
        calendar[item.date] = item.is_available;
      }

      return calendar;
    } catch (error) {
      console.error('Error getting availability calendar:', error);
      throw error;
    }
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  /**
   * Validate date range input
   */
  private validateDateRange(dates: DateRange): void {
    const checkIn = new Date(dates.checkIn);
    const checkOut = new Date(dates.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new Error('Invalid date format');
    }

    if (checkIn >= checkOut) {
      throw new Error('Check-out date must be after check-in date');
    }

    if (checkIn < today) {
      throw new Error('Check-in date cannot be in the past');
    }

    // Maximum booking window of 2 years
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    if (checkOut > maxDate) {
      throw new Error('Booking date is too far in the future');
    }
  }

  /**
   * Calculate number of nights between two dates
   */
  private calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate array of dates between start and end (exclusive of end date)
   */
  private generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current < end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * Clean up expired reservation locks
   */
  private async cleanupExpiredLocks(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('reservation_locks')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.warn('Failed to cleanup expired locks:', error);
      }
    } catch (error) {
      console.warn('Error during lock cleanup:', error);
    }
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const availabilityService = new AvailabilityService();