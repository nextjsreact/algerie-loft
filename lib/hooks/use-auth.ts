'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { UserRole, AuthSession } from '@/lib/types';
import { canAccessRoute, getRoleRedirectUrl } from '@/lib/auth/role-utils';

interface UseAuthOptions {
  requiredRoles?: UserRole[];
  redirectOnUnauthorized?: boolean;
  redirectTo?: string;
}

interface UseAuthReturn {
  session: AuthSession | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  hasRequiredRole: boolean;
  canAccess: (route: string) => boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    requiredRoles,
    redirectOnUnauthorized = false,
    redirectTo
  } = options;

  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setSession(null);
        return;
      }

      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setError('Failed to fetch user profile');
        return;
      }

      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      
      if (!supabaseSession) {
        setSession(null);
        return;
      }

      const userRole: UserRole = profile?.role || user.user_metadata?.role || 'guest';
      const fullName = profile?.full_name || user.user_metadata?.full_name || null;

      const authSession: AuthSession = {
        user: {
          id: user.id,
          email: user.email ?? null,
          full_name: fullName,
          role: userRole,
          created_at: user.created_at,
          updated_at: user.updated_at ?? null
        },
        token: supabaseSession.access_token
      };

      setSession(authSession);

      // Handle role-based redirects
      if (redirectOnUnauthorized && requiredRoles && !requiredRoles.includes(userRole)) {
        const locale = pathname.split('/')[1] || 'fr';
        const redirectUrl = redirectTo || getRoleRedirectUrl(userRole, locale);
        router.push(redirectUrl);
      }

    } catch (err) {
      console.error('Auth error:', err);
      setError('Authentication failed');
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchSession();
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      router.push('/fr/public');
    } catch (err) {
      console.error('Sign out error:', err);
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchSession();
  };

  const isAuthenticated = !!session && session.user.role !== 'guest';
  const hasRequiredRole = !requiredRoles || (session && requiredRoles.includes(session.user.role));
  
  const canAccess = (route: string): boolean => {
    if (!session) return false;
    return canAccessRoute(route, session.user.role);
  };

  return {
    session,
    loading,
    error,
    isAuthenticated,
    hasRequiredRole,
    canAccess,
    signOut,
    refresh
  };
}

/**
 * Hook for protecting routes with role-based access control
 */
export function useRoleGuard(requiredRoles: UserRole[], redirectTo?: string) {
  const { session, loading, hasRequiredRole } = useAuth({
    requiredRoles,
    redirectOnUnauthorized: true,
    redirectTo
  });

  return {
    session,
    loading,
    authorized: hasRequiredRole
  };
}

/**
 * Hook for checking specific permissions
 */
export function usePermissions() {
  const { session } = useAuth();

  const hasPermission = (resource: string, action: string, scope?: string): boolean => {
    if (!session) return false;
    
    // Import PermissionValidator dynamically to avoid circular dependencies
    const { PermissionValidator } = require('@/lib/permissions/types');
    return PermissionValidator.hasPermission(session.user.role, resource, action, scope);
  };

  const canAccessComponent = (component: string): boolean => {
    if (!session) return false;
    
    const { PermissionValidator } = require('@/lib/permissions/types');
    return PermissionValidator.canAccessComponent(session.user.role, component);
  };

  return {
    hasPermission,
    canAccessComponent,
    userRole: session?.user.role
  };
}

/**
 * Hook for partner-specific functionality
 */
export function usePartnerAuth() {
  const { session, loading } = useAuth({ requiredRoles: ['partner'] });
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchPartnerProfile = async () => {
      if (!session) {
        setProfileLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('partner_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Partner profile fetch error:', error);
        } else {
          setPartnerProfile(data);
        }
      } catch (err) {
        console.error('Partner profile error:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchPartnerProfile();
  }, [session]);

  return {
    session,
    loading: loading || profileLoading,
    partnerProfile,
    isVerified: partnerProfile?.verification_status === 'verified',
    isPending: partnerProfile?.verification_status === 'pending',
    isRejected: partnerProfile?.verification_status === 'rejected'
  };
}

/**
 * Hook for client-specific functionality
 */
export function useClientAuth() {
  const { session, loading } = useAuth({ requiredRoles: ['client'] });

  return {
    session,
    loading,
    isClient: session?.user.role === 'client'
  };
}