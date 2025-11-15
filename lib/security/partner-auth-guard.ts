/**
 * Partner Authentication Guard
 * 
 * Provides comprehensive authentication and authorization checks for partner pages
 * Handles session validation, role verification, and graceful error handling
 */

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { createClient } from '@/utils/supabase/server';
import type { AuthSession } from '@/lib/types';

export interface PartnerAuthResult {
  success: boolean;
  session?: AuthSession;
  partnerId?: string;
  partnerStatus?: 'active' | 'pending' | 'rejected' | 'suspended';
  error?: string;
  shouldRedirect?: boolean;
  redirectUrl?: string;
}

export interface PartnerAuthOptions {
  requireActive?: boolean;
  allowedStatuses?: Array<'active' | 'pending' | 'rejected' | 'suspended'>;
  locale?: string;
}

/**
 * Partner Authentication Guard Service
 */
export class PartnerAuthGuard {
  
  /**
   * Verify partner authentication and authorization
   * This is the main method to use in partner pages
   */
  static async verifyPartnerAuth(
    options: PartnerAuthOptions = {}
  ): Promise<PartnerAuthResult> {
    const {
      requireActive = true,
      allowedStatuses = ['active'],
      locale = 'fr'
    } = options;

    try {
      // Step 1: Check if user has a valid session
      const session = await getSession();
      
      if (!session) {
        return {
          success: false,
          error: 'No active session',
          shouldRedirect: true,
          redirectUrl: `/${locale}/partner/login`
        };
      }

      // Step 2: Verify user has partner role
      if (session.user.role !== 'partner') {
        console.warn('[PartnerAuthGuard] User is not a partner:', {
          userId: session.user.id,
          role: session.user.role
        });

        return {
          success: false,
          error: 'User is not a partner',
          shouldRedirect: true,
          redirectUrl: `/${locale}/unauthorized`
        };
      }

      // Step 3: Get partner profile and status
      const supabase = await createClient();
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partners')
        .select('id, verification_status, suspended_at, suspended_reason')
        .eq('user_id', session.user.id)
        .single();

      if (profileError || !partnerProfile) {
        console.error('[PartnerAuthGuard] Partner profile not found:', {
          userId: session.user.id,
          error: profileError
        });

        return {
          success: false,
          error: 'Partner profile not found',
          shouldRedirect: true,
          redirectUrl: `/${locale}/partner/register`
        };
      }

      const partnerStatus = partnerProfile.verification_status as 'active' | 'pending' | 'rejected' | 'suspended';

      // Step 4: Check if partner status is allowed for this page
      if (!allowedStatuses.includes(partnerStatus)) {
        console.warn('[PartnerAuthGuard] Partner status not allowed:', {
          partnerId: partnerProfile.id,
          status: partnerStatus,
          allowedStatuses
        });

        // Determine redirect based on status
        let redirectUrl = `/${locale}/partner/dashboard`;
        if (partnerStatus === 'pending') {
          redirectUrl = `/${locale}/partner/pending`;
        } else if (partnerStatus === 'rejected') {
          redirectUrl = `/${locale}/partner/rejected`;
        } else if (partnerStatus === 'suspended') {
          redirectUrl = `/${locale}/partner/suspended`;
        }

        return {
          success: false,
          session,
          partnerId: partnerProfile.id,
          partnerStatus,
          error: `Partner status '${partnerStatus}' not allowed`,
          shouldRedirect: true,
          redirectUrl
        };
      }

      // Step 5: Check session expiration
      const sessionExpiresAt = new Date(session.user.updated_at || session.user.created_at);
      sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24); // 24 hour session

      if (new Date() > sessionExpiresAt) {
        console.warn('[PartnerAuthGuard] Session expired:', {
          userId: session.user.id,
          expiresAt: sessionExpiresAt
        });

        return {
          success: false,
          error: 'Session expired',
          shouldRedirect: true,
          redirectUrl: `/${locale}/partner/login?expired=true`
        };
      }

      // All checks passed
      return {
        success: true,
        session,
        partnerId: partnerProfile.id,
        partnerStatus
      };

    } catch (error) {
      console.error('[PartnerAuthGuard] Unexpected error:', error);
      
      return {
        success: false,
        error: 'Authentication check failed',
        shouldRedirect: true,
        redirectUrl: `/${locale}/partner/login`
      };
    }
  }

  /**
   * Require partner authentication (throws redirect if not authenticated)
   * Use this in server components that need partner authentication
   */
  static async requirePartnerAuth(
    options: PartnerAuthOptions = {}
  ): Promise<{ session: AuthSession; partnerId: string; partnerStatus: string }> {
    const result = await this.verifyPartnerAuth(options);

    if (!result.success || result.shouldRedirect) {
      const redirectUrl = result.redirectUrl || `/${options.locale || 'fr'}/partner/login`;
      redirect(redirectUrl);
    }

    return {
      session: result.session!,
      partnerId: result.partnerId!,
      partnerStatus: result.partnerStatus!
    };
  }

  /**
   * Check if session is about to expire (within 1 hour)
   */
  static async isSessionExpiringSoon(session: AuthSession): Promise<boolean> {
    const sessionExpiresAt = new Date(session.user.updated_at || session.user.created_at);
    sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24);

    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    return sessionExpiresAt < oneHourFromNow;
  }

  /**
   * Refresh session if it's about to expire
   */
  static async refreshSessionIfNeeded(session: AuthSession): Promise<boolean> {
    const isExpiringSoon = await this.isSessionExpiringSoon(session);

    if (isExpiringSoon) {
      try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          console.error('[PartnerAuthGuard] Failed to refresh session:', error);
          return false;
        }

        console.log('[PartnerAuthGuard] Session refreshed successfully');
        return true;
      } catch (error) {
        console.error('[PartnerAuthGuard] Error refreshing session:', error);
        return false;
      }
    }

    return true; // Session doesn't need refresh
  }

  /**
   * Clear sensitive data on logout
   */
  static async clearSensitiveData(): Promise<void> {
    try {
      const supabase = await createClient();
      
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear any cached data (if using a cache)
      // This would be implemented based on your caching strategy
      
      console.log('[PartnerAuthGuard] Sensitive data cleared on logout');
    } catch (error) {
      console.error('[PartnerAuthGuard] Error clearing sensitive data:', error);
    }
  }

  /**
   * Verify partner role on every page load
   * This should be called in layouts or middleware
   */
  static async verifyPartnerRoleOnPageLoad(
    userId: string,
    locale: string = 'fr'
  ): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('[PartnerAuthGuard] Failed to verify role:', error);
        return false;
      }

      if (profile.role !== 'partner') {
        console.warn('[PartnerAuthGuard] User role changed, no longer a partner:', {
          userId,
          currentRole: profile.role
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('[PartnerAuthGuard] Error verifying role:', error);
      return false;
    }
  }

  /**
   * Handle session expiration gracefully
   * Returns appropriate error message and redirect URL
   */
  static handleSessionExpiration(locale: string = 'fr'): {
    message: string;
    redirectUrl: string;
  } {
    return {
      message: 'Your session has expired. Please log in again.',
      redirectUrl: `/${locale}/partner/login?expired=true`
    };
  }

  /**
   * Handle unauthorized access
   * Returns appropriate error message and redirect URL
   */
  static handleUnauthorizedAccess(
    reason: 'not_partner' | 'wrong_status' | 'no_profile',
    locale: string = 'fr'
  ): {
    message: string;
    redirectUrl: string;
  } {
    switch (reason) {
      case 'not_partner':
        return {
          message: 'You do not have partner access.',
          redirectUrl: `/${locale}/unauthorized`
        };
      case 'wrong_status':
        return {
          message: 'Your partner account status does not allow access to this page.',
          redirectUrl: `/${locale}/partner/dashboard`
        };
      case 'no_profile':
        return {
          message: 'Partner profile not found. Please complete registration.',
          redirectUrl: `/${locale}/partner/register`
        };
      default:
        return {
          message: 'Access denied.',
          redirectUrl: `/${locale}/login`
        };
    }
  }
}

/**
 * Convenience function for partner pages
 * Use this at the top of your partner page components
 */
export async function requirePartner(
  locale: string = 'fr',
  options: Omit<PartnerAuthOptions, 'locale'> = {}
) {
  return PartnerAuthGuard.requirePartnerAuth({ ...options, locale });
}

/**
 * Convenience function to check partner auth without redirecting
 * Useful for API routes
 */
export async function checkPartnerAuth(
  locale: string = 'fr',
  options: Omit<PartnerAuthOptions, 'locale'> = {}
) {
  return PartnerAuthGuard.verifyPartnerAuth({ ...options, locale });
}
