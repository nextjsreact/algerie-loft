"use client"

import { useEffect, useState } from 'react';
import { useSuperuserAuth, useSuperuserAuthOptional } from '@/contexts/SuperuserAuthContext';
import { useClientAuth, useClientAuthOptional } from '@/contexts/ClientAuthContext';
import type { SuperuserPermission } from '@/types/superuser';
import type { UserRole } from '@/lib/types';

/**
 * Enhanced authentication hook that combines client and superuser auth
 */
export function useEnhancedAuth() {
  const clientAuth = useClientAuthOptional();
  const superuserAuth = useSuperuserAuthOptional();
  
  // Determine which auth system is active
  const isClientAuth = !!clientAuth?.isAuthenticated;
  const isSuperuserAuth = !!superuserAuth?.isAuthenticated;
  
  return {
    // Combined authentication state
    isAuthenticated: isClientAuth || isSuperuserAuth,
    isLoading: (clientAuth?.isLoading || superuserAuth?.isLoading) ?? true,
    
    // Client auth specific
    clientAuth: clientAuth || null,
    isClientAuthenticated: isClientAuth,
    
    // Superuser auth specific  
    superuserAuth: superuserAuth || null,
    isSuperuserAuthenticated: isSuperuserAuth,
    isSuperuser: superuserAuth?.isSuperuser ?? false,
    
    // User information (prioritize superuser if available)
    user: superuserAuth?.session?.user || clientAuth?.user || null,
    session: superuserAuth?.session || null,
    
    // Permissions and roles
    permissions: superuserAuth?.permissions || [],
    userRole: (superuserAuth?.session?.user?.role || clientAuth?.user?.role) as UserRole | undefined,
    
    // Permission checking utilities
    hasPermission: (permission: SuperuserPermission) => 
      superuserAuth?.checkPermission(permission) ?? false,
    hasPermissions: (permissions: SuperuserPermission[]) => 
      superuserAuth?.checkPermissions(permissions) ?? false,
    hasRole: (role: UserRole) => 
      (superuserAuth?.session?.user?.role === role) || (clientAuth?.user?.role === role),
    hasAnyRole: (roles: UserRole[]) => {
      const currentRole = superuserAuth?.session?.user?.role || clientAuth?.user?.role;
      return currentRole ? roles.includes(currentRole) : false;
    },
    
    // Action methods
    logout: async () => {
      if (isSuperuserAuth && superuserAuth) {
        // Handle superuser logout if needed
        await superuserAuth.refreshSession();
      }
      if (isClientAuth && clientAuth) {
        await clientAuth.logout();
      }
    },
    
    refreshSession: async () => {
      if (superuserAuth) {
        await superuserAuth.refreshSession();
      }
      if (clientAuth) {
        await clientAuth.refreshSession();
      }
    },
    
    // Utility methods
    canAccessAdmin: () => {
      const role = superuserAuth?.session?.user?.role || clientAuth?.user?.role;
      return role === 'admin' || role === 'superuser';
    },
    
    canAccessSuperuser: () => superuserAuth?.isSuperuser ?? false,
    
    logActivity: async (actionType: string, details: Record<string, any>) => {
      if (superuserAuth?.logActivity) {
        await superuserAuth.logActivity(actionType, details);
      }
    }
  };
}

/**
 * Hook for components that require authentication
 */
export function useRequireAuth() {
  const auth = useEnhancedAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      // Redirect to login or throw error
      throw new Error('Authentication required');
    }
  }, [auth.isLoading, auth.isAuthenticated]);
  
  if (auth.isLoading) {
    return null; // or loading state
  }
  
  if (!auth.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  return auth;
}

/**
 * Hook for components that require specific roles
 */
export function useRequireRole(allowedRoles: UserRole[]) {
  const auth = useRequireAuth();
  
  if (!auth) {
    return null;
  }
  
  const hasRequiredRole = auth.userRole && allowedRoles.includes(auth.userRole);
  
  if (!hasRequiredRole) {
    throw new Error(`Required role not met. Allowed: ${allowedRoles.join(', ')}`);
  }
  
  return auth;
}

/**
 * Hook for components that require superuser access
 */
export function useRequireSuperuser(requiredPermissions: SuperuserPermission[] = []) {
  const auth = useRequireAuth();
  
  if (!auth) {
    return null;
  }
  
  if (!auth.isSuperuser) {
    throw new Error('Superuser access required');
  }
  
  if (requiredPermissions.length > 0 && !auth.hasPermissions(requiredPermissions)) {
    throw new Error(`Required permissions not met: ${requiredPermissions.join(', ')}`);
  }
  
  return auth;
}

/**
 * Hook for conditional rendering based on permissions
 */
export function usePermissionCheck() {
  const auth = useEnhancedAuth();
  
  return {
    canRender: (options: {
      roles?: UserRole[];
      permissions?: SuperuserPermission[];
      requireSuperuser?: boolean;
      requireAuth?: boolean;
    }) => {
      const { roles, permissions, requireSuperuser, requireAuth } = options;
      
      // Check authentication requirement
      if (requireAuth && !auth.isAuthenticated) {
        return false;
      }
      
      // Check superuser requirement
      if (requireSuperuser && !auth.isSuperuser) {
        return false;
      }
      
      // Check role requirements
      if (roles && roles.length > 0) {
        if (!auth.userRole || !roles.includes(auth.userRole)) {
          return false;
        }
      }
      
      // Check permission requirements
      if (permissions && permissions.length > 0) {
        if (!auth.hasPermissions(permissions)) {
          return false;
        }
      }
      
      return true;
    },
    
    // Convenience methods
    canAccessAdmin: () => auth.canAccessAdmin(),
    canAccessSuperuser: () => auth.canAccessSuperuser(),
    hasRole: (role: UserRole) => auth.hasRole(role),
    hasPermission: (permission: SuperuserPermission) => auth.hasPermission(permission),
    isAuthenticated: auth.isAuthenticated,
    isSuperuser: auth.isSuperuser
  };
}

/**
 * Hook for getting user display information
 */
export function useUserInfo() {
  const auth = useEnhancedAuth();
  
  return {
    user: auth.user,
    displayName: auth.user?.full_name || auth.user?.email?.split('@')[0] || 'User',
    email: auth.user?.email,
    role: auth.userRole,
    isSuperuser: auth.isSuperuser,
    permissions: auth.permissions,
    isAuthenticated: auth.isAuthenticated,
    avatar: auth.user?.avatar_url || null
  };
}

/**
 * Hook for session management
 */
export function useSessionManagement() {
  const auth = useEnhancedAuth();
  const [sessionStatus, setSessionStatus] = useState<'active' | 'expiring' | 'expired'>('active');
  
  useEffect(() => {
    if (!auth.isAuthenticated) {
      setSessionStatus('expired');
      return;
    }
    
    // Check session expiration for superuser sessions
    if (auth.isSuperuser && auth.superuserAuth?.superuserSession) {
      const session = auth.superuserAuth.superuserSession;
      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      
      if (timeUntilExpiry <= 0) {
        setSessionStatus('expired');
      } else if (timeUntilExpiry <= 5 * 60 * 1000) { // 5 minutes
        setSessionStatus('expiring');
      } else {
        setSessionStatus('active');
      }
    } else {
      setSessionStatus('active');
    }
  }, [auth.isAuthenticated, auth.isSuperuser, auth.superuserAuth?.superuserSession]);
  
  return {
    sessionStatus,
    refreshSession: auth.refreshSession,
    logout: auth.logout,
    isSessionExpiring: sessionStatus === 'expiring',
    isSessionExpired: sessionStatus === 'expired'
  };
}