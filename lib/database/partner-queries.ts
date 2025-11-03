// =====================================================
// PARTNER DASHBOARD SYSTEM - DATABASE QUERIES
// =====================================================

import { createClient } from '@supabase/supabase-js';
import type { 
  PartnerProfile, 
  ExtendedPartnerProfile, 
  PartnerValidationRequest,
  PartnerDashboardStats,
  PartnerPropertyView,
  PartnerReservationSummary,
  PartnerRegistrationData,
  ValidationRequestStatus,
  VerificationStatus
} from '@/types/partner';

// Initialize Supabase client (this should be imported from your existing config)
// const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Partner Profile Queries
export class PartnerQueries {
  constructor(private supabase: any) {}

  // Get partner by user ID
  async getPartnerByUserId(userId: string): Promise<PartnerProfile | null> {
    const { data, error } = await this.supabase
      .from('partners')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return data;
  }

  // Get partner by ID
  async getPartnerById(partnerId: string): Promise<PartnerProfile | null> {
    const { data, error } = await this.supabase
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // Get extended partner profile with admin user info
  async getExtendedPartnerProfile(partnerId: string): Promise<ExtendedPartnerProfile | null> {
    const { data, error } = await this.supabase
      .from('partners')
      .select(`
        *,
        approved_by_user:profiles!partners_approved_by_fkey(id, full_name, email),
        rejected_by_user:profiles!partners_rejected_by_fkey(id, full_name, email)
      `)
      .eq('id', partnerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Add computed fields
    const propertiesCount = await this.getPartnerPropertiesCount(partnerId);
    
    return {
      ...data,
      properties_count: propertiesCount,
      total_revenue: 0, // Will be calculated when revenue system is implemented
      active_reservations_count: 0 // Will be calculated when reservation system is linked
    };
  }

  // Create new partner
  async createPartner(partnerData: Omit<PartnerProfile, 'id' | 'created_at' | 'updated_at'>): Promise<PartnerProfile> {
    const { data, error } = await this.supabase
      .from('partners')
      .insert(partnerData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update partner
  async updatePartner(partnerId: string, updates: Partial<PartnerProfile>): Promise<PartnerProfile> {
    const { data, error } = await this.supabase
      .from('partners')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', partnerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update partner verification status
  async updatePartnerVerificationStatus(
    partnerId: string, 
    status: VerificationStatus,
    adminUserId?: string,
    notes?: string,
    rejectionReason?: string
  ): Promise<PartnerProfile> {
    const updates: any = {
      verification_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updates.approved_at = new Date().toISOString();
      updates.approved_by = adminUserId;
      if (notes) updates.admin_notes = notes;
    } else if (status === 'rejected') {
      updates.rejected_at = new Date().toISOString();
      updates.rejected_by = adminUserId;
      if (rejectionReason) updates.rejection_reason = rejectionReason;
      if (notes) updates.admin_notes = notes;
    }

    const { data, error } = await this.supabase
      .from('partners')
      .update(updates)
      .eq('id', partnerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get partners by verification status
  async getPartnersByStatus(status: VerificationStatus, limit = 50, offset = 0): Promise<ExtendedPartnerProfile[]> {
    const { data, error } = await this.supabase
      .from('partners')
      .select(`
        *,
        approved_by_user:profiles!partners_approved_by_fkey(id, full_name, email),
        rejected_by_user:profiles!partners_rejected_by_fkey(id, full_name, email)
      `)
      .eq('verification_status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Get partner properties count
  async getPartnerPropertiesCount(partnerId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerId);

    if (error) throw error;
    return count || 0;
  }

  // Get partner properties
  async getPartnerProperties(partnerId: string): Promise<PartnerPropertyView[]> {
    const { data, error } = await this.supabase
      .from('lofts')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to PartnerPropertyView format
    return (data || []).map(loft => ({
      ...loft,
      current_occupancy_status: loft.status,
      revenue_this_month: 0, // Will be calculated when revenue system is implemented
      revenue_last_month: 0,
      total_reservations: 0,
      average_rating: 0,
      images: [] // Will be populated when image system is implemented
    }));
  }

  // Get partner dashboard statistics
  async getPartnerDashboardStats(partnerId: string): Promise<PartnerDashboardStats> {
    // Use the database function we created
    const { data, error } = await this.supabase
      .rpc('get_partner_dashboard_stats', { partner_user_id: partnerId });

    if (error) throw error;
    return data;
  }

  // Update partner last login
  async updatePartnerLastLogin(partnerId: string): Promise<void> {
    const { error } = await this.supabase
      .from('partners')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', partnerId);

    if (error) throw error;
  }
}

// Partner Validation Request Queries
export class PartnerValidationQueries {
  constructor(private supabase: any) {}

  // Create validation request
  async createValidationRequest(
    partnerId: string, 
    submittedData: PartnerRegistrationData
  ): Promise<PartnerValidationRequest> {
    const { data, error } = await this.supabase
      .from('partner_validation_requests')
      .insert({
        partner_id: partnerId,
        submitted_data: submittedData,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get validation requests by status
  async getValidationRequestsByStatus(
    status: ValidationRequestStatus, 
    limit = 50, 
    offset = 0
  ): Promise<PartnerValidationRequest[]> {
    const { data, error } = await this.supabase
      .from('partner_validation_requests')
      .select(`
        *,
        partner:partners(*),
        processed_by_user:profiles!partner_validation_requests_processed_by_fkey(id, full_name, email)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Get validation request by ID
  async getValidationRequestById(requestId: string): Promise<PartnerValidationRequest | null> {
    const { data, error } = await this.supabase
      .from('partner_validation_requests')
      .select(`
        *,
        partner:partners(*),
        processed_by_user:profiles!partner_validation_requests_processed_by_fkey(id, full_name, email)
      `)
      .eq('id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  // Update validation request status
  async updateValidationRequestStatus(
    requestId: string,
    status: ValidationRequestStatus,
    processedBy: string,
    adminNotes?: string
  ): Promise<PartnerValidationRequest> {
    const { data, error } = await this.supabase
      .from('partner_validation_requests')
      .update({
        status,
        processed_by: processedBy,
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get partner's validation requests
  async getPartnerValidationRequests(partnerId: string): Promise<PartnerValidationRequest[]> {
    const { data, error } = await this.supabase
      .from('partner_validation_requests')
      .select(`
        *,
        processed_by_user:profiles!partner_validation_requests_processed_by_fkey(id, full_name, email)
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// Admin Partner Management Queries
export class AdminPartnerQueries {
  constructor(private supabase: any) {}

  // Approve partner using database function
  async approvePartner(partnerId: string, adminUserId: string, adminNotes?: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('approve_partner', {
        partner_id: partnerId,
        admin_user_id: adminUserId,
        admin_notes: adminNotes
      });

    if (error) throw error;
    return data;
  }

  // Reject partner using database function
  async rejectPartner(
    partnerId: string, 
    adminUserId: string, 
    rejectionReason: string, 
    adminNotes?: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('reject_partner', {
        partner_id: partnerId,
        admin_user_id: adminUserId,
        rejection_reason: rejectionReason,
        admin_notes: adminNotes
      });

    if (error) throw error;
    return data;
  }

  // Get all partners for admin management
  async getAllPartners(limit = 50, offset = 0): Promise<ExtendedPartnerProfile[]> {
    const { data, error } = await this.supabase
      .from('partners')
      .select(`
        *,
        approved_by_user:profiles!partners_approved_by_fkey(id, full_name, email),
        rejected_by_user:profiles!partners_rejected_by_fkey(id, full_name, email)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  // Assign property to partner
  async assignPropertyToPartner(loftId: string, partnerId: string): Promise<void> {
    const { error } = await this.supabase
      .from('lofts')
      .update({ partner_id: partnerId })
      .eq('id', loftId);

    if (error) throw error;
  }

  // Remove property from partner
  async removePropertyFromPartner(loftId: string): Promise<void> {
    const { error } = await this.supabase
      .from('lofts')
      .update({ partner_id: null })
      .eq('id', loftId);

    if (error) throw error;
  }

  // Get partner statistics for admin dashboard
  async getPartnerSystemStats(): Promise<{
    total_partners: number;
    pending_partners: number;
    approved_partners: number;
    rejected_partners: number;
    total_properties_managed: number;
  }> {
    const [partnersStats, propertiesCount] = await Promise.all([
      this.supabase
        .from('partners')
        .select('verification_status'),
      this.supabase
        .from('lofts')
        .select('partner_id', { count: 'exact', head: true })
        .not('partner_id', 'is', null)
    ]);

    if (partnersStats.error) throw partnersStats.error;
    if (propertiesCount.error) throw propertiesCount.error;

    const stats = {
      total_partners: partnersStats.data?.length || 0,
      pending_partners: partnersStats.data?.filter(p => p.verification_status === 'pending').length || 0,
      approved_partners: partnersStats.data?.filter(p => p.verification_status === 'approved').length || 0,
      rejected_partners: partnersStats.data?.filter(p => p.verification_status === 'rejected').length || 0,
      total_properties_managed: propertiesCount.count || 0
    };

    return stats;
  }
}

// Export utility function to create query instances
export function createPartnerQueries(supabase: any) {
  return {
    partners: new PartnerQueries(supabase),
    validationRequests: new PartnerValidationQueries(supabase),
    admin: new AdminPartnerQueries(supabase)
  };
}