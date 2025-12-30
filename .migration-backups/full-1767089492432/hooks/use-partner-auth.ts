/**
 * Client-side partner authentication hook
 * Provides authentication state and session management for partner pages
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthSession } from '@/lib/types';

export interface PartnerAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: AuthSession | null;
  partnerId: string | null;
  partnerStatus: 'active' | 'pending' | 'rejected' | 'suspended' | null;
  error: string | null;
}

export interface UsePartnerAuthOptions {
  locale?: string;
  requireActive?: boolean;
  onSessionExpired?: () => void;
  onUnauthorized?: () => void;
}

export function usePartnerAuth(options: UsePartnerAuthOptions = {}) {
  const {
    locale = 'fr',
    requireActive = true,
    onSessionExpired,
    onUnauthorized
  } = options;

  const router = useRouter();
  const [authState, setAuthState] = useState<PartnerAuthState>({
    isAuthenticated: false,
    isLoading: true,
    session: null,
    partnerId: null,
    partnerStatus: null,
    error: null
  });

  const checkAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Call API to verify authentication
      const response = await fetch('/api/partner/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            session: null,
            partnerId: null,
            partnerStatus: null,
            error: 'Session expired'
          });

          if (onSessionExpired) {
            onSessionExpired();
          } else {
            router.push(`/${locale}/partner/login?expired=true`);
          }
          return;
        }

        if (response.status === 403) {
          // Not authorized
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            session: null,
            partnerId: null,
            partnerStatus: null,
            error: 'Not authorized'
          });

          if (onUnauthorized) {
            onUnauthorized();
          } else {
            router.push(`/${locale}/unauthorized`);
          }
          return;
        }

        throw new Error('Authentication check failed');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Check if partner status is allowed
      if (requireActive && data.partnerStatus !== 'active') {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          session: data.session,
          partnerId: data.partnerId,
          partnerStatus: data.partnerStatus,
          error: `Partner status '${data.partnerStatus}' not allowed`
        });

        // Redirect based on status
        if (data.partnerStatus === 'pending') {
          router.push(`/${locale}/partner/pending`);
        } else if (data.partnerStatus === 'rejected') {
          router.push(`/${locale}/partner/rejected`);
        } else if (data.partnerStatus === 'suspended') {
          router.push(`/${locale}/partner/suspended`);
        }
        return;
      }

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        session: data.session,
        partnerId: data.partnerId,
        partnerStatus: data.partnerStatus,
        error: null
      });

    } catch (error) {
      console.error('[usePartnerAuth] Error checking authentication:', error);
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        session: null,
        partnerId: null,
        partnerStatus: null,
        error: error instanceof Error ? error.message : 'Authentication check failed'
      });

      // Redirect to login on error
      router.push(`/${locale}/partner/login`);
    }
  }, [locale, requireActive, router, onSessionExpired, onUnauthorized]);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/partner/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        await checkAuth();
        return true;
      }

      return false;
    } catch (error) {
      console.error('[usePartnerAuth] Error refreshing authentication:', error);
      return false;
    }
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/partner/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        session: null,
        partnerId: null,
        partnerStatus: null,
        error: null
      });

      router.push(`/${locale}/partner/login`);
    } catch (error) {
      console.error('[usePartnerAuth] Error logging out:', error);
    }
  }, [locale, router]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Set up periodic session refresh (every 15 minutes)
  useEffect(() => {
    if (!authState.isAuthenticated) {
      return;
    }

    const refreshInterval = setInterval(() => {
      refreshAuth();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(refreshInterval);
  }, [authState.isAuthenticated, refreshAuth]);

  // Check for session expiration warning (1 hour before expiration)
  useEffect(() => {
    if (!authState.session) {
      return;
    }

    const checkExpiration = () => {
      const sessionExpiresAt = new Date(authState.session!.user.updated_at || authState.session!.user.created_at);
      sessionExpiresAt.setHours(sessionExpiresAt.getHours() + 24);

      const oneHourFromNow = new Date();
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

      if (sessionExpiresAt < oneHourFromNow) {
        // Session expiring soon, refresh it
        refreshAuth();
      }
    };

    // Check immediately
    checkExpiration();

    // Check every 5 minutes
    const expirationCheckInterval = setInterval(checkExpiration, 5 * 60 * 1000);

    return () => clearInterval(expirationCheckInterval);
  }, [authState.session, refreshAuth]);

  return {
    ...authState,
    checkAuth,
    refreshAuth,
    logout
  };
}
