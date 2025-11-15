/**
 * Partner Data Isolation Security Module
 * 
 * Ensures that partners can only access their own data and provides
 * audit logging for all data access attempts.
 */

import { createClient } from '@/utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface DataAccessLog {
  partner_id: string;
  user_id: string;
  resource_type: 'property' | 'reservation' | 'revenue' | 'analytics' | 'profile';
  resource_id?: string;
  action: 'read' | 'write' | 'delete';
  success: boolean;
  ip_address?: string;
  user_agent?: string;
  error_message?: string;
  timestamp: Date;
}

export interface DataIsolationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  accessDenied?: boolean;
}

/**
 * Partner Data Isolation Service
 * Provides methods to verify and enforce data isolation between partners
 */
export class PartnerDataIsolation {
  
  /**
   * Verify that a property belongs to the specified partner
   */
  static async verifyPropertyOwnership(
    propertyId: string,
    partnerId: string,
    supabase?: SupabaseClient
  ): Promise<DataIsolationResult<boolean>> {
    const client = supabase || await createClient();
    
    try {
      const { data, error } = await client
        .from('lofts')
        .select('id, partner_id')
        .eq('id', propertyId)
        .single();

      if (error) {
        await this.logDataAccess({
          partner_id: partnerId,
          user_id: partnerId,
          resource_type: 'property',
          resource_id: propertyId,
          action: 'read',
          success: false,
          error_message: error.message,
          timestamp: new Date()
        });

        return {
          success: false,
          error: 'Property not found'
        };
      }

      const isOwner = data.partner_id === partnerId;

      await this.logDataAccess({
        partner_id: partnerId,
        user_id: partnerId,
        resource_type: 'property',
        resource_id: propertyId,
        action: 'read',
        success: isOwner,
        error_message: isOwner ? undefined : 'Access denied: not property owner',
        timestamp: new Date()
      });

      if (!isOwner) {
        return {
          success: false,
          accessDenied: true,
          error: 'Access denied: You do not own this property'
        };
      }

      return {
        success: true,
        data: true
      };

    } catch (error) {
      console.error('[PartnerDataIsolation] Error verifying property ownership:', error);
      return {
        success: false,
        error: 'Internal error verifying ownership'
      };
    }
  }

  /**
   * Verify that a reservation belongs to one of the partner's properties
   */
  static async verifyReservationAccess(
    reservationId: string,
    partnerId: string,
    supabase?: SupabaseClient
  ): Promise<DataIsolationResult<boolean>> {
    const client = supabase || await createClient();
    
    try {
      const { data, error } = await client
        .from('reservations')
        .select(`
          id,
          loft_id,
          lofts!inner(partner_id)
        `)
        .eq('id', reservationId)
        .single();

      if (error) {
        await this.logDataAccess({
          partner_id: partnerId,
          user_id: partnerId,
          resource_type: 'reservation',
          resource_id: reservationId,
          action: 'read',
          success: false,
          error_message: error.message,
          timestamp: new Date()
        });

        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      const hasAccess = (data.lofts as any)?.partner_id === partnerId;

      await this.logDataAccess({
        partner_id: partnerId,
        user_id: partnerId,
        resource_type: 'reservation',
        resource_id: reservationId,
        action: 'read',
        success: hasAccess,
        error_message: hasAccess ? undefined : 'Access denied: reservation not for partner property',
        timestamp: new Date()
      });

      if (!hasAccess) {
        return {
          success: false,
          accessDenied: true,
          error: 'Access denied: This reservation is not for your property'
        };
      }

      return {
        success: true,
        data: true
      };

    } catch (error) {
      console.error('[PartnerDataIsolation] Error verifying reservation access:', error);
      return {
        success: false,
        error: 'Internal error verifying access'
      };
    }
  }

  /**
   * Get all properties for a partner with data isolation enforced
   */
  static async getPartnerProperties(
    partnerId: string,
    filters?: {
      status?: string;
      limit?: number;
      offset?: number;
    },
    supabase?: SupabaseClient
  ): Promise<DataIsolationResult<any[]>> {
    const client = supabase || await createClient();
    
    try {
      let query = client
        .from('lofts')
        .select('*')
        .eq('partner_id', partnerId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      await this.logDataAccess({
        partner_id: partnerId,
        user_id: partnerId,
        resource_type: 'property',
        action: 'read',
        success: !error,
        error_message: error?.message,
        timestamp: new Date()
      });

      if (error) {
        return {
          success: false,
          error: 'Failed to fetch properties'
        };
      }

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('[PartnerDataIsolation] Error fetching partner properties:', error);
      return {
        success: false,
        error: 'Internal error fetching properties'
      };
    }
  }

  /**
   * Get all reservations for a partner's properties with data isolation enforced
   */
  static async getPartnerReservations(
    partnerId: string,
    filters?: {
      status?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
    supabase?: SupabaseClient
  ): Promise<DataIsolationResult<any[]>> {
    const client = supabase || await createClient();
    
    try {
      let query = client
        .from('reservations')
        .select(`
          *,
          lofts!inner(id, name, partner_id)
        `)
        .eq('lofts.partner_id', partnerId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.startDate) {
        query = query.gte('check_in', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('check_out', filters.endDate);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      await this.logDataAccess({
        partner_id: partnerId,
        user_id: partnerId,
        resource_type: 'reservation',
        action: 'read',
        success: !error,
        error_message: error?.message,
        timestamp: new Date()
      });

      if (error) {
        return {
          success: false,
          error: 'Failed to fetch reservations'
        };
      }

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('[PartnerDataIsolation] Error fetching partner reservations:', error);
      return {
        success: false,
        error: 'Internal error fetching reservations'
      };
    }
  }

  /**
   * Verify RLS policies are correctly applied
   * This method tests that partners cannot access other partners' data
   */
  static async verifyRLSPolicies(
    partnerId: string,
    supabase?: SupabaseClient
  ): Promise<DataIsolationResult<{
    propertiesIsolated: boolean;
    reservationsIsolated: boolean;
    errors: string[];
  }>> {
    const client = supabase || await createClient();
    const errors: string[] = [];
    let propertiesIsolated = true;
    let reservationsIsolated = true;

    try {
      // Test 1: Try to access properties without partner_id filter
      // RLS should automatically filter to only this partner's properties
      const { data: allProperties, error: propertiesError } = await client
        .from('lofts')
        .select('id, partner_id')
        .limit(100);

      if (propertiesError) {
        errors.push(`Properties RLS test failed: ${propertiesError.message}`);
        propertiesIsolated = false;
      } else if (allProperties) {
        // Verify all returned properties belong to this partner
        const otherPartnerProperties = allProperties.filter(p => p.partner_id !== partnerId && p.partner_id !== null);
        if (otherPartnerProperties.length > 0) {
          errors.push(`RLS VIOLATION: Found ${otherPartnerProperties.length} properties belonging to other partners`);
          propertiesIsolated = false;
        }
      }

      // Test 2: Try to access reservations without explicit filtering
      // RLS should automatically filter to only reservations for this partner's properties
      const { data: allReservations, error: reservationsError } = await client
        .from('reservations')
        .select(`
          id,
          loft_id,
          lofts!inner(partner_id)
        `)
        .limit(100);

      if (reservationsError) {
        errors.push(`Reservations RLS test failed: ${reservationsError.message}`);
        reservationsIsolated = false;
      } else if (allReservations) {
        // Verify all returned reservations belong to this partner's properties
        const otherPartnerReservations = allReservations.filter(
          r => (r.lofts as any)?.partner_id !== partnerId
        );
        if (otherPartnerReservations.length > 0) {
          errors.push(`RLS VIOLATION: Found ${otherPartnerReservations.length} reservations for other partners' properties`);
          reservationsIsolated = false;
        }
      }

      await this.logDataAccess({
        partner_id: partnerId,
        user_id: partnerId,
        resource_type: 'analytics',
        action: 'read',
        success: propertiesIsolated && reservationsIsolated,
        error_message: errors.length > 0 ? errors.join('; ') : undefined,
        timestamp: new Date()
      });

      return {
        success: propertiesIsolated && reservationsIsolated,
        data: {
          propertiesIsolated,
          reservationsIsolated,
          errors
        }
      };

    } catch (error) {
      console.error('[PartnerDataIsolation] Error verifying RLS policies:', error);
      return {
        success: false,
        error: 'Internal error verifying RLS policies',
        data: {
          propertiesIsolated: false,
          reservationsIsolated: false,
          errors: ['Internal error during RLS verification']
        }
      };
    }
  }

  /**
   * Log data access attempts for audit purposes
   */
  private static async logDataAccess(log: DataAccessLog): Promise<void> {
    try {
      const client = await createClient(true); // Use service role for logging

      await client.from('partner_data_access_logs').insert({
        partner_id: log.partner_id,
        user_id: log.user_id,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        action: log.action,
        success: log.success,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        error_message: log.error_message,
        created_at: log.timestamp.toISOString()
      });

      // Also log to console for immediate visibility
      const logLevel = log.success ? 'info' : 'warn';
      console[logLevel]('[PartnerDataAccess]', {
        partner_id: log.partner_id,
        resource_type: log.resource_type,
        resource_id: log.resource_id,
        action: log.action,
        success: log.success,
        error: log.error_message
      });

    } catch (error) {
      // Don't throw - logging failures shouldn't break the application
      console.error('[PartnerDataIsolation] Failed to log data access:', error);
    }
  }

  /**
   * Get data access logs for a partner (for audit purposes)
   */
  static async getAccessLogs(
    partnerId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      resourceType?: string;
      action?: string;
      limit?: number;
    },
    supabase?: SupabaseClient
  ): Promise<DataIsolationResult<DataAccessLog[]>> {
    const client = supabase || await createClient(true); // Use service role for audit logs
    
    try {
      let query = client
        .from('partner_data_access_logs')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: 'Failed to fetch access logs'
        };
      }

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      console.error('[PartnerDataIsolation] Error fetching access logs:', error);
      return {
        success: false,
        error: 'Internal error fetching access logs'
      };
    }
  }
}
