import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { initializeTestData } from '@/lib/utils/test-data';

export interface Reservation {
  id: string;
  customer_id: string | null;
  loft_id: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  guest_info: {
    primary_guest: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      nationality?: string;
    };
    additional_guests?: Array<{
      first_name: string;
      last_name: string;
      age_group: 'adult' | 'child' | 'infant';
    }>;
    total_guests: number;
    adults: number;
    children: number;
    infants: number;
  };
  pricing: {
    base_price: number;
    nights: number;
    nightly_rate: number;
    cleaning_fee: number;
    service_fee: number;
    taxes: number;
    total_amount: number;
    currency: string;
    breakdown?: Array<{
      date: string;
      rate: number;
      type: string;
    }>;
  };
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
  terms_accepted_at?: string;
  terms_version: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  booking_source: string;
  user_agent?: string;
  ip_address?: string;
}

export interface ReservationRequest {
  loft_id: string;
  check_in_date: string;
  check_out_date: string;
  guest_info: Reservation['guest_info'];
  pricing: Reservation['pricing'];
  special_requests?: string;
  dietary_requirements?: string;
  accessibility_needs?: string;
  communication_preferences?: Reservation['communication_preferences'];
  terms_accepted: boolean;
  terms_version?: string;
  booking_source?: string;
  user_agent?: string;
  ip_address?: string;
}

export class ReservationService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient();
    // Initialize test data for development
    initializeTestData();
  }

  /**
   * Create a new reservation
   */
  async createReservation(request: ReservationRequest, customerId?: string): Promise<Reservation> {
    try {
      // For now, we'll create a mock reservation since the database schema isn't fully set up
      const mockReservation: Reservation = {
        id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customer_id: customerId || null,
        loft_id: request.loft_id,
        check_in_date: request.check_in_date,
        check_out_date: request.check_out_date,
        nights: this.calculateNights(request.check_in_date, request.check_out_date),
        guest_info: request.guest_info,
        pricing: request.pricing,
        special_requests: request.special_requests,
        dietary_requirements: request.dietary_requirements,
        accessibility_needs: request.accessibility_needs,
        status: 'pending',
        payment_status: 'pending',
        confirmation_code: this.generateConfirmationCode(),
        booking_reference: this.generateBookingReference(),
        communication_preferences: request.communication_preferences || { email: true, sms: false, whatsapp: false },
        terms_accepted: request.terms_accepted,
        terms_accepted_at: new Date().toISOString(),
        terms_version: request.terms_version || '1.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: customerId,
        updated_by: customerId,
        booking_source: request.booking_source || 'website',
        user_agent: request.user_agent,
        ip_address: request.ip_address
      };

      // Store in localStorage for now (in a real app, this would go to the database)
      const existingReservations = this.getStoredReservations();
      existingReservations.push(mockReservation);
      localStorage.setItem('reservations', JSON.stringify(existingReservations));

      return mockReservation;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw new Error('Failed to create reservation');
    }
  }

  /**
   * Get reservation by ID
   */
  async getReservationById(id: string): Promise<Reservation | null> {
    try {
      // For now, get from localStorage (in a real app, this would query the database)
      const existingReservations = this.getStoredReservations();
      const reservation = existingReservations.find(r => 
        r.id === id || r.confirmation_code === id || r.booking_reference === id
      );

      if (!reservation) {
        return null;
      }

      // Add mock loft information
      return {
        ...reservation,
        loft_name: 'Loft Test Centre-ville',
        loft_location: { address: '15 Rue Didouche Mourad, Alger Centre' }
      };
    } catch (error) {
      console.error('Error fetching reservation:', error);
      throw new Error('Failed to fetch reservation');
    }
  }

  /**
   * Get reservations for a customer
   */
  async getUserReservations(customerId: string): Promise<Reservation[]> {
    try {
      const existingReservations = this.getStoredReservations();
      return existingReservations
        .filter(r => r.customer_id === customerId || r.created_by === customerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      throw new Error('Failed to fetch user reservations');
    }
  }

  /**
   * Update reservation
   */
  async updateReservation(id: string, updates: Partial<Reservation>): Promise<Reservation | null> {
    try {
      const existingReservations = this.getStoredReservations();
      const reservationIndex = existingReservations.findIndex(r => 
        r.id === id || r.confirmation_code === id || r.booking_reference === id
      );

      if (reservationIndex === -1) {
        return null;
      }

      const allowedFields = [
        'guest_info', 'special_requests', 'dietary_requirements',
        'accessibility_needs', 'communication_preferences', 'status',
        'payment_status', 'cancellation_reason', 'cancelled_by'
      ];

      const updatedReservation = { ...existingReservations[reservationIndex] };
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          (updatedReservation as any)[key] = value;
        }
      }

      updatedReservation.updated_at = new Date().toISOString();
      existingReservations[reservationIndex] = updatedReservation;
      
      localStorage.setItem('reservations', JSON.stringify(existingReservations));
      return updatedReservation;
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw new Error('Failed to update reservation');
    }
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(id: string, reason?: string, cancelledBy?: string): Promise<Reservation | null> {
    try {
      return await this.updateReservation(id, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        cancelled_by: cancelledBy
      });
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw new Error('Failed to cancel reservation');
    }
  }

  /**
   * Check if dates are available for a loft
   */
  async checkAvailability(loftId: string, checkIn: string, checkOut: string): Promise<boolean> {
    try {
      const existingReservations = this.getStoredReservations();
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      const conflicts = existingReservations.filter(r => 
        r.loft_id === loftId &&
        ['confirmed', 'pending'].includes(r.status) &&
        new Date(r.check_in_date) < checkOutDate &&
        new Date(r.check_out_date) > checkInDate
      );

      return conflicts.length === 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error('Failed to check availability');
    }
  }

  /**
   * Create reservation lock to prevent double bookings
   */
  async createReservationLock(
    loftId: string, 
    checkIn: string, 
    checkOut: string, 
    customerId?: string, 
    sessionId?: string
  ): Promise<string> {
    try {
      // For now, just return a mock lock ID
      // In a real implementation, this would create a temporary lock in the database
      return `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch (error) {
      console.error('Error creating reservation lock:', error);
      throw new Error('Failed to create reservation lock');
    }
  }

  /**
   * Release reservation lock
   */
  async releaseReservationLock(sessionId: string): Promise<void> {
    try {
      // For now, this is a no-op since we're not actually storing locks
      // In a real implementation, this would remove the lock from the database
    } catch (error) {
      console.error('Error releasing reservation lock:', error);
      // Don't throw error for lock release failures
    }
  }

  /**
   * Get stored reservations from localStorage
   */
  private getStoredReservations(): Reservation[] {
    if (typeof window === 'undefined') {
      return [];
    }
    
    try {
      const stored = localStorage.getItem('reservations');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading stored reservations:', error);
      return [];
    }
  }

  /**
   * Calculate number of nights between dates
   */
  private calculateNights(checkIn: string, checkOut: string): number {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Generate unique confirmation code
   */
  private generateConfirmationCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  /**
   * Generate booking reference
   */
  private generateBookingReference(): string {
    const year = new Date().getFullYear().toString().substr(-2);
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
    return `LA${year}${random}`;
  }

  /**
   * Format reservation data from database
   */
  private formatReservation(row: any): Reservation {
    return {
      id: row.id,
      customer_id: row.customer_id,
      loft_id: row.loft_id,
      check_in_date: row.check_in_date,
      check_out_date: row.check_out_date,
      nights: row.nights,
      guest_info: typeof row.guest_info === 'string' ? JSON.parse(row.guest_info) : row.guest_info,
      pricing: typeof row.pricing === 'string' ? JSON.parse(row.pricing) : row.pricing,
      special_requests: row.special_requests,
      dietary_requirements: row.dietary_requirements,
      accessibility_needs: row.accessibility_needs,
      status: row.status,
      payment_status: row.payment_status,
      confirmation_code: row.confirmation_code,
      booking_reference: row.booking_reference,
      communication_preferences: typeof row.communication_preferences === 'string' 
        ? JSON.parse(row.communication_preferences) 
        : row.communication_preferences,
      terms_accepted: row.terms_accepted,
      terms_accepted_at: row.terms_accepted_at,
      terms_version: row.terms_version,
      cancelled_at: row.cancelled_at,
      cancellation_reason: row.cancellation_reason,
      cancelled_by: row.cancelled_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      updated_by: row.updated_by,
      booking_source: row.booking_source,
      user_agent: row.user_agent,
      ip_address: row.ip_address,
      // Additional fields from JOIN
      loft_name: row.loft_name,
      loft_location: row.loft_location
    };
  }
}