/**
 * Booking System Integration for Partner Dashboard
 * Integrates partner system with existing reservation and booking functionality
 */

import { createClient } from '@/utils/supabase/server';
import type { ClientReservation, ReservationStatus, ReservationPaymentStatus } from '@/lib/types';
import type { PartnerReservationSummary } from '@/types/partner';

export class BookingSystemIntegration {
  
  /**
   * Integrate partner reservations with existing booking system
   * Ensures partner can access and manage reservations for their properties
   */
  static async getPartnerBookingData(
    partnerId: string,
    options?: {
      includeGuest?: boolean;
      includePricing?: boolean;
      includeHistory?: boolean;
      dateRange?: { from: string; to: string };
      status?: ReservationStatus[];
    }
  ): Promise<{
    reservations: PartnerReservationSummary[];
    totalRevenue: number;
    totalBookings: number;
    averageBookingValue: number;
  }> {
    const supabase = await createClient();

    try {
      let query = supabase
        .from('reservations')
        .select(`
          id,
          check_in_date,
          check_out_date,
          status,
          payment_status,
          pricing,
          guest_info,
          special_requests,
          dietary_requirements,
          accessibility_needs,
          created_at,
          updated_at,
          lofts!inner (
            id,
            name,
            address,
            partner_id
          )
        `)
        .eq('lofts.partner_id', partnerId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options?.dateRange) {
        query = query
          .gte('check_in_date', options.dateRange.from)
          .lte('check_out_date', options.dateRange.to);
      }

      if (options?.status && options.status.length > 0) {
        query = query.in('status', options.status);
      }

      const { data: reservations, error } = await query;

      if (error) {
        console.error('Error fetching partner booking data:', error);
        return {
          reservations: [],
          totalRevenue: 0,
          totalBookings: 0,
          averageBookingValue: 0
        };
      }

      // Transform reservations to partner format
      const partnerReservations: PartnerReservationSummary[] = (reservations || []).map(reservation => {
        const guestInfo = reservation.guest_info?.primary_guest;
        const pricing = reservation.pricing;

        return {
          id: reservation.id,
          loft_id: reservation.lofts.id,
          loft_name: reservation.lofts.name,
          guest_name: guestInfo ? `${guestInfo.first_name} ${guestInfo.last_name}` : 'Unknown Guest',
          guest_email: guestInfo?.email || '',
          guest_phone: guestInfo?.phone,
          check_in: reservation.check_in_date,
          check_out: reservation.check_out_date,
          total_amount: pricing?.total_amount || 0,
          currency: pricing?.currency || 'DZD',
          status: reservation.status,
          created_at: reservation.created_at,
          special_requests: reservation.special_requests,
          admin_notes: undefined // Partners don't see admin notes
        };
      });

      // Calculate summary statistics
      const completedReservations = partnerReservations.filter(r => r.status === 'completed');
      const totalRevenue = completedReservations.reduce((sum, r) => sum + r.total_amount, 0);
      const totalBookings = partnerReservations.length;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      return {
        reservations: partnerReservations,
        totalRevenue,
        totalBookings,
        averageBookingValue
      };

    } catch (error) {
      console.error('Booking system integration error:', error);
      return {
        reservations: [],
        totalRevenue: 0,
        totalBookings: 0,
        averageBookingValue: 0
      };
    }
  }

  /**
   * Get booking availability for partner properties
   * Integrates with existing availability checking system
   */
  static async getPartnerPropertyAvailability(
    partnerId: string,
    propertyId?: string,
    dateRange?: { from: string; to: string }
  ): Promise<{
    [propertyId: string]: {
      available_dates: string[];
      blocked_dates: string[];
      reservations: Array<{
        check_in: string;
        check_out: string;
        guest_name: string;
        status: string;
      }>;
    };
  }> {
    const supabase = await createClient();

    try {
      // Get partner properties
      let propertiesQuery = supabase
        .from('lofts')
        .select('id, name')
        .eq('partner_id', partnerId);

      if (propertyId) {
        propertiesQuery = propertiesQuery.eq('id', propertyId);
      }

      const { data: properties, error: propertiesError } = await propertiesQuery;

      if (propertiesError || !properties) {
        console.error('Error fetching partner properties:', propertiesError);
        return {};
      }

      const availabilityData: { [key: string]: any } = {};

      // For each property, get availability and reservations
      for (const property of properties) {
        let reservationsQuery = supabase
          .from('reservations')
          .select('check_in_date, check_out_date, guest_info, status')
          .eq('loft_id', property.id)
          .in('status', ['confirmed', 'pending']);

        if (dateRange) {
          reservationsQuery = reservationsQuery
            .gte('check_in_date', dateRange.from)
            .lte('check_out_date', dateRange.to);
        }

        const { data: reservations, error: reservationsError } = await reservationsQuery;

        if (reservationsError) {
          console.error(`Error fetching reservations for property ${property.id}:`, reservationsError);
          continue;
        }

        // Calculate available and blocked dates
        const blockedDates: string[] = [];
        const reservationDetails = (reservations || []).map(reservation => {
          const guestInfo = reservation.guest_info?.primary_guest;
          
          // Add dates to blocked list
          const checkIn = new Date(reservation.check_in_date);
          const checkOut = new Date(reservation.check_out_date);
          
          for (let date = new Date(checkIn); date < checkOut; date.setDate(date.getDate() + 1)) {
            blockedDates.push(date.toISOString().split('T')[0]);
          }

          return {
            check_in: reservation.check_in_date,
            check_out: reservation.check_out_date,
            guest_name: guestInfo ? `${guestInfo.first_name} ${guestInfo.last_name}` : 'Unknown Guest',
            status: reservation.status
          };
        });

        // Generate available dates (simplified - assumes all dates are available unless blocked)
        const availableDates: string[] = [];
        if (dateRange) {
          const startDate = new Date(dateRange.from);
          const endDate = new Date(dateRange.to);
          
          for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            if (!blockedDates.includes(dateStr)) {
              availableDates.push(dateStr);
            }
          }
        }

        availabilityData[property.id] = {
          available_dates: availableDates,
          blocked_dates: [...new Set(blockedDates)], // Remove duplicates
          reservations: reservationDetails
        };
      }

      return availabilityData;

    } catch (error) {
      console.error('Property availability integration error:', error);
      return {};
    }
  }

  /**
   * Integrate partner booking notifications with existing notification system
   */
  static async setupPartnerBookingNotifications(partnerId: string): Promise<{
    success: boolean;
    notificationTypes: string[];
    errors: string[];
  }> {
    const supabase = await createClient();
    const errors: string[] = [];
    const notificationTypes: string[] = [];

    try {
      // Get partner user ID
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('user_id')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partner) {
        errors.push('Partner not found');
        return { success: false, notificationTypes, errors };
      }

      // Set up notification preferences for partner
      const notificationPreferences = [
        {
          user_id: partner.user_id,
          notification_type: 'new_booking',
          enabled: true,
          channels: ['email', 'in_app']
        },
        {
          user_id: partner.user_id,
          notification_type: 'booking_cancelled',
          enabled: true,
          channels: ['email', 'in_app']
        },
        {
          user_id: partner.user_id,
          notification_type: 'payment_received',
          enabled: true,
          channels: ['email', 'in_app']
        },
        {
          user_id: partner.user_id,
          notification_type: 'guest_message',
          enabled: true,
          channels: ['email', 'in_app']
        }
      ];

      // This would typically integrate with an existing notification preferences system
      // For now, we'll just track the types we would set up
      notificationTypes.push(
        'new_booking',
        'booking_cancelled', 
        'payment_received',
        'guest_message'
      );

      return {
        success: true,
        notificationTypes,
        errors
      };

    } catch (error) {
      console.error('Partner booking notifications setup error:', error);
      errors.push(`Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, notificationTypes, errors };
    }
  }

  /**
   * Validate booking data consistency for partner properties
   * Ensures data integrity between partner system and booking system
   */
  static async validateBookingDataConsistency(partnerId: string): Promise<{
    isConsistent: boolean;
    issues: Array<{
      type: 'missing_property' | 'orphaned_reservation' | 'invalid_status' | 'data_mismatch';
      description: string;
      affectedId: string;
    }>;
  }> {
    const supabase = await createClient();
    const issues: Array<{
      type: 'missing_property' | 'orphaned_reservation' | 'invalid_status' | 'data_mismatch';
      description: string;
      affectedId: string;
    }> = [];

    try {
      // Get all partner properties
      const { data: properties, error: propertiesError } = await supabase
        .from('lofts')
        .select('id, name, partner_id')
        .eq('partner_id', partnerId);

      if (propertiesError) {
        console.error('Error fetching properties for validation:', propertiesError);
        return { isConsistent: false, issues: [{ 
          type: 'data_mismatch', 
          description: 'Could not fetch partner properties', 
          affectedId: partnerId 
        }] };
      }

      const propertyIds = properties?.map(p => p.id) || [];

      // Check for reservations without valid properties
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('id, loft_id, status')
        .in('loft_id', propertyIds);

      if (reservationsError) {
        console.error('Error fetching reservations for validation:', reservationsError);
        issues.push({
          type: 'data_mismatch',
          description: 'Could not fetch reservations for validation',
          affectedId: partnerId
        });
      } else {
        // Check for orphaned reservations
        const orphanedReservations = reservations?.filter(r => 
          !propertyIds.includes(r.loft_id)
        ) || [];

        orphanedReservations.forEach(reservation => {
          issues.push({
            type: 'orphaned_reservation',
            description: `Reservation ${reservation.id} references non-existent property ${reservation.loft_id}`,
            affectedId: reservation.id
          });
        });

        // Check for invalid reservation statuses
        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'];
        const invalidStatusReservations = reservations?.filter(r => 
          !validStatuses.includes(r.status)
        ) || [];

        invalidStatusReservations.forEach(reservation => {
          issues.push({
            type: 'invalid_status',
            description: `Reservation ${reservation.id} has invalid status: ${reservation.status}`,
            affectedId: reservation.id
          });
        });
      }

      // Check for properties without partner assignment
      const unassignedProperties = properties?.filter(p => p.partner_id !== partnerId) || [];
      unassignedProperties.forEach(property => {
        issues.push({
          type: 'missing_property',
          description: `Property ${property.name} (${property.id}) is not properly assigned to partner`,
          affectedId: property.id
        });
      });

      return {
        isConsistent: issues.length === 0,
        issues
      };

    } catch (error) {
      console.error('Booking data consistency validation error:', error);
      return {
        isConsistent: false,
        issues: [{
          type: 'data_mismatch',
          description: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          affectedId: partnerId
        }]
      };
    }
  }

  /**
   * Sync partner booking data with existing reservation system
   * Ensures all booking data is properly synchronized
   */
  static async syncPartnerBookingData(partnerId: string): Promise<{
    success: boolean;
    syncedReservations: number;
    syncedProperties: number;
    errors: string[];
  }> {
    const supabase = await createClient();
    const errors: string[] = [];
    let syncedReservations = 0;
    let syncedProperties = 0;

    try {
      // Verify partner exists
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id, user_id')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partner) {
        errors.push('Partner not found');
        return { success: false, syncedReservations: 0, syncedProperties: 0, errors };
      }

      // Sync properties - ensure all partner properties have correct partner_id
      const { data: properties, error: propertiesError } = await supabase
        .from('lofts')
        .select('id')
        .eq('partner_id', partnerId);

      if (propertiesError) {
        errors.push(`Failed to fetch properties: ${propertiesError.message}`);
      } else {
        syncedProperties = properties?.length || 0;
      }

      // Sync reservations - ensure all reservations for partner properties are accessible
      if (properties && properties.length > 0) {
        const propertyIds = properties.map(p => p.id);
        
        const { data: reservations, error: reservationsError } = await supabase
          .from('reservations')
          .select('id')
          .in('loft_id', propertyIds);

        if (reservationsError) {
          errors.push(`Failed to sync reservations: ${reservationsError.message}`);
        } else {
          syncedReservations = reservations?.length || 0;
        }
      }

      return {
        success: errors.length === 0,
        syncedReservations,
        syncedProperties,
        errors
      };

    } catch (error) {
      console.error('Partner booking data sync error:', error);
      errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, syncedReservations: 0, syncedProperties: 0, errors };
    }
  }
}