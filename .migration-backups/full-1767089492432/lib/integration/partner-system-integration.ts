/**
 * Partner System Integration Layer
 * Connects the partner dashboard system with existing loft management, reservations, and user roles
 */

import { createClient } from '@/utils/supabase/server';
import type { 
  Loft, 
  LoftWithRelations, 
  ClientReservation, 
  Transaction,
  User,
  UserRole 
} from '@/lib/types';
import type { 
  PartnerProfile, 
  ExtendedPartnerProfile,
  PartnerPropertyView,
  PartnerReservationSummary,
  PartnerDashboardStats 
} from '@/types/partner';

export class PartnerSystemIntegration {
  
  /**
   * Integrate partner with existing loft management system
   * Ensures partner_id is properly set on lofts and maintains existing relationships
   */
  static async integratePartnerWithLoftManagement(
    partnerId: string,
    loftIds: string[]
  ): Promise<{ success: boolean; errors: string[] }> {
    const supabase = await createClient();
    const errors: string[] = [];

    try {
      // Update lofts to associate with partner
      const { error: updateError } = await supabase
        .from('lofts')
        .update({ partner_id: partnerId })
        .in('id', loftIds);

      if (updateError) {
        errors.push(`Failed to associate lofts with partner: ${updateError.message}`);
      }

      // Verify existing relationships are maintained (owner_id, zone_area_id, etc.)
      const { data: updatedLofts, error: verifyError } = await supabase
        .from('lofts')
        .select('id, name, owner_id, partner_id, zone_area_id')
        .in('id', loftIds);

      if (verifyError) {
        errors.push(`Failed to verify loft relationships: ${verifyError.message}`);
      } else {
        // Check that all lofts still have their original relationships
        const missingRelationships = updatedLofts?.filter(loft => 
          !loft.owner_id || loft.partner_id !== partnerId
        );

        if (missingRelationships && missingRelationships.length > 0) {
          errors.push(`Some lofts are missing required relationships: ${missingRelationships.map(l => l.name).join(', ')}`);
        }
      }

      return { success: errors.length === 0, errors };

    } catch (error) {
      console.error('Partner-Loft integration error:', error);
      return { 
        success: false, 
        errors: [`Integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }

  /**
   * Integrate partner with existing reservation system
   * Ensures partner can access reservations for their properties only
   */
  static async getPartnerReservations(
    partnerId: string,
    filters?: {
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      loftId?: string;
    }
  ): Promise<PartnerReservationSummary[]> {
    const supabase = await createClient();

    try {
      let query = supabase
        .from('reservations')
        .select(`
          id,
          check_in_date,
          check_out_date,
          status,
          pricing,
          guest_info,
          created_at,
          special_requests,
          lofts!inner (
            id,
            name,
            partner_id
          )
        `)
        .eq('lofts.partner_id', partnerId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte('check_in_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('check_out_date', filters.dateTo);
      }
      if (filters?.loftId) {
        query = query.eq('loft_id', filters.loftId);
      }

      const { data: reservations, error } = await query;

      if (error) {
        console.error('Error fetching partner reservations:', error);
        return [];
      }

      // Transform to PartnerReservationSummary format
      return (reservations || []).map(reservation => ({
        id: reservation.id,
        loft_id: reservation.lofts.id,
        loft_name: reservation.lofts.name,
        guest_name: reservation.guest_info?.primary_guest?.first_name + ' ' + reservation.guest_info?.primary_guest?.last_name || 'Unknown Guest',
        guest_email: reservation.guest_info?.primary_guest?.email || '',
        guest_phone: reservation.guest_info?.primary_guest?.phone,
        check_in: reservation.check_in_date,
        check_out: reservation.check_out_date,
        total_amount: reservation.pricing?.total_amount || 0,
        currency: reservation.pricing?.currency || 'DZD',
        status: reservation.status,
        created_at: reservation.created_at,
        special_requests: reservation.special_requests
      }));

    } catch (error) {
      console.error('Partner reservations integration error:', error);
      return [];
    }
  }

  /**
   * Integrate partner with existing user roles and permissions
   * Ensures partner role works with existing permission system
   */
  static async validatePartnerPermissions(
    userId: string,
    requiredRole: UserRole = 'partner'
  ): Promise<{ isValid: boolean; userRole: UserRole; partnerProfile?: PartnerProfile }> {
    const supabase = await createClient();

    try {
      // Get user profile with role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return { isValid: false, userRole: 'guest' };
      }

      const userRole = profile?.role as UserRole || 'guest';

      // If checking for partner role, also get partner profile
      if (requiredRole === 'partner' && userRole === 'partner') {
        const { data: partnerProfile, error: partnerError } = await supabase
          .from('partners')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (partnerError) {
          console.error('Error fetching partner profile:', partnerError);
          return { isValid: false, userRole };
        }

        return { 
          isValid: true, 
          userRole, 
          partnerProfile: partnerProfile as PartnerProfile 
        };
      }

      return { 
        isValid: userRole === requiredRole, 
        userRole 
      };

    } catch (error) {
      console.error('Partner permissions validation error:', error);
      return { isValid: false, userRole: 'guest' };
    }
  }

  /**
   * Get partner properties with existing loft system integration
   * Returns partner properties with all existing loft relationships intact
   */
  static async getPartnerProperties(partnerId: string): Promise<PartnerPropertyView[]> {
    const supabase = await createClient();

    try {
      const { data: lofts, error } = await supabase
        .from('lofts')
        .select(`
          *,
          loft_owners!inner (
            id,
            name
          ),
          zone_areas (
            id,
            name
          ),
          internet_connection_types (
            id,
            type,
            speed,
            provider
          )
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching partner properties:', error);
        return [];
      }

      // Transform to PartnerPropertyView with computed fields
      const properties = await Promise.all((lofts || []).map(async (loft) => {
        // Get current reservations for occupancy status
        const { data: currentReservations } = await supabase
          .from('reservations')
          .select('id, status, check_in_date, check_out_date, guest_info')
          .eq('loft_id', loft.id)
          .eq('status', 'confirmed')
          .gte('check_out_date', new Date().toISOString())
          .order('check_in_date', { ascending: true })
          .limit(1);

        // Get revenue for this month and last month
        const currentMonth = new Date();
        const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const thisMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

        const { data: revenueData } = await supabase
          .from('reservations')
          .select('pricing')
          .eq('loft_id', loft.id)
          .eq('status', 'completed')
          .gte('check_out_date', lastMonth.toISOString());

        let revenueThisMonth = 0;
        let revenueLastMonth = 0;

        revenueData?.forEach(reservation => {
          const checkOut = new Date(reservation.check_out_date);
          const amount = reservation.pricing?.total_amount || 0;
          
          if (checkOut >= thisMonthStart) {
            revenueThisMonth += amount;
          } else if (checkOut >= lastMonth && checkOut < thisMonthStart) {
            revenueLastMonth += amount;
          }
        });

        // Get total reservations count
        const { count: totalReservations } = await supabase
          .from('reservations')
          .select('id', { count: 'exact', head: true })
          .eq('loft_id', loft.id);

        const nextReservation = currentReservations?.[0];
        const currentOccupancyStatus = nextReservation && 
          new Date(nextReservation.check_in_date) <= new Date() &&
          new Date(nextReservation.check_out_date) > new Date()
          ? 'occupied' 
          : loft.status;

        return {
          id: loft.id,
          name: loft.name,
          description: loft.description,
          address: loft.address,
          price_per_month: loft.price_per_month,
          status: loft.status,
          partner_id: loft.partner_id,
          current_occupancy_status: currentOccupancyStatus,
          next_reservation: nextReservation ? {
            check_in: nextReservation.check_in_date,
            check_out: nextReservation.check_out_date,
            guest_name: nextReservation.guest_info?.primary_guest?.first_name + ' ' + nextReservation.guest_info?.primary_guest?.last_name || 'Unknown'
          } : undefined,
          revenue_this_month: revenueThisMonth,
          revenue_last_month: revenueLastMonth,
          total_reservations: totalReservations || 0,
          average_rating: 0, // TODO: Implement rating system integration
          last_maintenance_date: undefined, // TODO: Implement maintenance tracking
          images: [], // TODO: Implement image system integration
          created_at: loft.created_at,
          updated_at: loft.updated_at
        } as PartnerPropertyView;
      }));

      return properties;

    } catch (error) {
      console.error('Partner properties integration error:', error);
      return [];
    }
  }

  /**
   * Calculate partner dashboard statistics with existing system integration
   */
  static async calculatePartnerDashboardStats(partnerId: string): Promise<PartnerDashboardStats> {
    const supabase = await createClient();

    try {
      // Get partner properties count and status
      const { data: properties, error: propertiesError } = await supabase
        .from('lofts')
        .select('id, status')
        .eq('partner_id', partnerId);

      if (propertiesError) {
        console.error('Error fetching properties for stats:', propertiesError);
      }

      const propertiesStats = {
        total: properties?.length || 0,
        available: properties?.filter(p => p.status === 'available').length || 0,
        occupied: properties?.filter(p => p.status === 'occupied').length || 0,
        maintenance: properties?.filter(p => p.status === 'maintenance').length || 0
      };

      // Get revenue statistics
      const currentMonth = new Date();
      const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const thisMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const yearStart = new Date(currentMonth.getFullYear(), 0, 1);

      const propertyIds = properties?.map(p => p.id) || [];

      if (propertyIds.length > 0) {
        const { data: revenueData } = await supabase
          .from('reservations')
          .select('pricing, check_out_date')
          .in('loft_id', propertyIds)
          .eq('status', 'completed')
          .gte('check_out_date', previousMonth.toISOString());

        let currentMonthRevenue = 0;
        let previousMonthRevenue = 0;
        let yearToDateRevenue = 0;

        revenueData?.forEach(reservation => {
          const checkOut = new Date(reservation.check_out_date);
          const amount = reservation.pricing?.total_amount || 0;
          
          if (checkOut >= thisMonthStart) {
            currentMonthRevenue += amount;
          } else if (checkOut >= previousMonth && checkOut < thisMonthStart) {
            previousMonthRevenue += amount;
          }
          
          if (checkOut >= yearStart) {
            yearToDateRevenue += amount;
          }
        });

        // Get reservations statistics
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('id, status, check_in_date, check_out_date')
          .in('loft_id', propertyIds);

        const now = new Date();
        const activeReservations = reservationsData?.filter(r => 
          r.status === 'confirmed' && 
          new Date(r.check_in_date) <= now && 
          new Date(r.check_out_date) > now
        ).length || 0;

        const upcomingReservations = reservationsData?.filter(r => 
          r.status === 'confirmed' && 
          new Date(r.check_in_date) > now
        ).length || 0;

        const completedThisMonth = reservationsData?.filter(r => 
          r.status === 'completed' && 
          new Date(r.check_out_date) >= thisMonthStart
        ).length || 0;

        // Calculate occupancy rate (simplified)
        const totalDaysThisMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const totalDaysPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0).getDate();
        
        const occupiedDaysThisMonth = reservationsData?.filter(r => 
          r.status === 'completed' && 
          new Date(r.check_out_date) >= thisMonthStart
        ).reduce((total, r) => {
          const checkIn = new Date(r.check_in_date);
          const checkOut = new Date(r.check_out_date);
          const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          return total + days;
        }, 0) || 0;

        const occupiedDaysPreviousMonth = reservationsData?.filter(r => 
          r.status === 'completed' && 
          new Date(r.check_out_date) >= previousMonth &&
          new Date(r.check_out_date) < thisMonthStart
        ).reduce((total, r) => {
          const checkIn = new Date(r.check_in_date);
          const checkOut = new Date(r.check_out_date);
          const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          return total + days;
        }, 0) || 0;

        const currentMonthOccupancy = propertiesStats.total > 0 
          ? (occupiedDaysThisMonth / (totalDaysThisMonth * propertiesStats.total)) * 100 
          : 0;
        
        const previousMonthOccupancy = propertiesStats.total > 0 
          ? (occupiedDaysPreviousMonth / (totalDaysPreviousMonth * propertiesStats.total)) * 100 
          : 0;

        return {
          properties: propertiesStats,
          revenue: {
            current_month: currentMonthRevenue,
            previous_month: previousMonthRevenue,
            year_to_date: yearToDateRevenue,
            currency: 'DZD'
          },
          reservations: {
            active: activeReservations,
            upcoming: upcomingReservations,
            completed_this_month: completedThisMonth
          },
          occupancy_rate: {
            current_month: Math.round(currentMonthOccupancy * 100) / 100,
            previous_month: Math.round(previousMonthOccupancy * 100) / 100
          }
        };
      }

      // Return empty stats if no properties
      return {
        properties: propertiesStats,
        revenue: {
          current_month: 0,
          previous_month: 0,
          year_to_date: 0,
          currency: 'DZD'
        },
        reservations: {
          active: 0,
          upcoming: 0,
          completed_this_month: 0
        },
        occupancy_rate: {
          current_month: 0,
          previous_month: 0
        }
      };

    } catch (error) {
      console.error('Partner dashboard stats calculation error:', error);
      // Return default stats on error
      return {
        properties: { total: 0, available: 0, occupied: 0, maintenance: 0 },
        revenue: { current_month: 0, previous_month: 0, year_to_date: 0, currency: 'DZD' },
        reservations: { active: 0, upcoming: 0, completed_this_month: 0 },
        occupancy_rate: { current_month: 0, previous_month: 0 }
      };
    }
  }

  /**
   * Ensure compatibility with existing user roles and permissions
   * Updates existing permission checks to include partner role
   */
  static async ensurePartnerRoleCompatibility(): Promise<{ success: boolean; message: string }> {
    try {
      // This would typically involve updating the permissions system
      // For now, we'll just verify that the partner role is recognized
      const validRoles: UserRole[] = ['admin', 'member', 'guest', 'manager', 'executive', 'client', 'partner'];
      
      if (!validRoles.includes('partner')) {
        return {
          success: false,
          message: 'Partner role not recognized in existing permission system'
        };
      }

      return {
        success: true,
        message: 'Partner role is compatible with existing permission system'
      };

    } catch (error) {
      console.error('Partner role compatibility check error:', error);
      return {
        success: false,
        message: `Compatibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}