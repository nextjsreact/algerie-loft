import { createClient, createReadOnlyClient } from '@/utils/supabase/server';
import type { PartnerAuthSession, PartnerProfile, PartnerStatus, PartnerAuthError } from '@/lib/types/partner-auth';
import type { UserRole } from '@/lib/types';
import jwt from 'jsonwebtoken';

export class PartnerAuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
  private static JWT_EXPIRES_IN = '24h';

  /**
   * Get partner session with profile information
   */
  static async getPartnerSession(): Promise<PartnerAuthSession | null> {
    const supabase = await createReadOnlyClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Check if user has partner role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    const userRole: UserRole = profile?.role || user.user_metadata?.role || 'member';
    
    if (userRole !== 'partner') {
      return null;
    }

    // Get partner profile
    const { data: partnerProfile, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (partnerError || !partnerProfile) {
      return null;
    }

    const { data: { session: supabaseSessionData }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !supabaseSessionData) {
      return null;
    }

    const partnerUser = {
      id: user.id,
      email: user.email ?? null,
      full_name: profile?.full_name || user.user_metadata?.full_name || null,
      role: userRole,
      created_at: user.created_at,
      updated_at: user.updated_at ?? null,
      partner_profile: partnerProfile
    };

    return {
      user: partnerUser,
      partner_profile: partnerProfile,
      partner_status: partnerProfile.verification_status as PartnerStatus,
      token: supabaseSessionData.access_token
    };
  }

  /**
   * Validate partner status and return appropriate error if not active
   */
  static validatePartnerStatus(status: PartnerStatus): PartnerAuthError | null {
    switch (status) {
      case 'pending':
        return {
          name: 'PartnerAuthError',
          message: 'Partner account is pending approval',
          code: 'PARTNER_NOT_APPROVED',
          partner_status: status,
          redirect_url: '/partner/pending'
        };
      case 'rejected':
        return {
          name: 'PartnerAuthError',
          message: 'Partner account has been rejected',
          code: 'PARTNER_REJECTED',
          partner_status: status,
          redirect_url: '/partner/rejected'
        };
      case 'suspended':
        return {
          name: 'PartnerAuthError',
          message: 'Partner account is suspended',
          code: 'PARTNER_SUSPENDED',
          partner_status: status,
          redirect_url: '/partner/suspended'
        };
      case 'active':
        return null;
      default:
        return {
          name: 'PartnerAuthError',
          message: 'Invalid partner status',
          code: 'PARTNER_NOT_FOUND',
          partner_status: status
        };
    }
  }

  /**
   * Generate JWT token with partner-specific claims
   */
  static generatePartnerToken(session: PartnerAuthSession): string {
    const claims = {
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
      partner_id: session.partner_profile.id,
      partner_status: session.partner_status,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(claims, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
  }

  /**
   * Verify and decode partner JWT token
   */
  static verifyPartnerToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw {
        name: 'PartnerAuthError',
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      } as PartnerAuthError;
    }
  }

  /**
   * Update partner last login timestamp
   */
  static async updateLastLogin(partnerId: string): Promise<void> {
    const supabase = await createClient();
    
    await supabase
      .from('partners')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', partnerId);
  }

  /**
   * Check if partner owns a specific property
   */
  static async validatePropertyOwnership(partnerId: string, loftId: string): Promise<boolean> {
    const supabase = await createReadOnlyClient();
    
    const { data, error } = await supabase
      .from('lofts')
      .select('id')
      .eq('id', loftId)
      .eq('partner_id', partnerId)
      .single();

    return !error && !!data;
  }

  /**
   * Get partner properties count
   */
  static async getPartnerPropertiesCount(partnerId: string): Promise<number> {
    const supabase = await createReadOnlyClient();
    
    const { count, error } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerId);

    return error ? 0 : (count || 0);
  }
}