"use server"

import { redirect } from 'next/navigation';
import { getSession, requireAuth, requireRole } from '@/lib/auth';
import { getSuperuserProfile, verifySuperuserPermissions } from '@/lib/superuser/auth';
import { validateSuperuserSession, requireActiveSuperuserSession } from './superuser-session';
import type { AuthSession, UserRole } from '@/lib/types';
import type { SuperuserProfile, SuperuserPermission, SuperuserSession } from '@/types/superuser';
import type { EnhancedAuthSession, AuthorizationResult } from './types';

/**
 * Enhanced authentication system that extends base auth with superuser capabilities
 */

/**
 * Get enhanced session with superuser information
 */
export async function getEnhancedSession(): Promise<EnhancedAuthSession | null> {
  try {
    const baseSession = await getSession();
    if (!baseSession) {
      return null;
    }

    // Check if user has superuser privileges
    let isSuperuser = false;
    let superuserProfile: SuperuserProfile | undefined;
    let superuserSession: SuperuserSession | undefined;
    let permissions: SuperuserPermission[] = [];

    if (baseSession.user.role === 'admin' || baseSession.user.role === 'superuser') {
      superuserProfile = await getSuperuserProfile();
      
      if (superuserProfile) {
        isSuperuser = true;
        permissions = superuserProfile.permissions;
        
        // Get superuser session if exists
        const sessionValidation = await validateSuperuserSession();
        if (sessionValidation.isValid && sessionValidation.session) {
          superuserSession = sessionValidation.session;
        }
      }
    }

    return {
      ...baseSession,
      isSuperuser,
      superuserProfile,
      superuserSession,
      permissions
    };
  } catch (error) {
    console.error('Error getting enhanced session:', error);
    return null;
  }
}

/**
 * Require enhanced authentication with optional role and permission checks
 */
export async function requireEnhancedAuth(options: {
  allowedRoles?: UserRole[];
  requiredPermissions?: SuperuserPermission[];
  requireSuperuserSession?: boolean;
} = {}): Promise<EnhancedAuthSession> {
  const session = await getEnhancedSession();
  
  if (!session) {
    redirect('/fr/login');
  }

  // Check role requirements
  if (options.allowedRoles && !options.allowedRoles.includes(session.user.role)) {
    redirect('/fr/unauthorized');
  }

  // Check superuser permission requirements
  if (options.requiredPermissions && options.requiredPermissions.length > 0) {
    if (!session.isSuperuser) {
      redirect('/fr/unauthorized');
    }

    const hasPermissions = options.requiredPermissions.every(perm => 
      session.permissions.includes(perm)
    );

    if (!hasPermissions) {
      redirect('/fr/admin/superuser/insufficient-permissions');
    }
  }

  // Check superuser session requirement
  if (options.requireSuperuserSession) {
    if (!session.isSuperuser || !session.superuserSession) {
      redirect('/fr/admin/superuser/session-required');
    }
  }

  return session;
}

/**
 * API version of enhanced auth (returns null instead of redirecting)
 */
export async function requireEnhancedAuthAPI(options: {
  allowedRoles?: UserRole[];
  requiredPermissions?: SuperuserPermission[];
  requireSuperuserSession?: boolean;
} = {}): Promise<AuthorizationResult> {
  try {
    const session = await getEnhancedSession();
    
    if (!session) {
      return { 
        authorized: false, 
        error: 'Not authenticated',
        redirectUrl: '/fr/login'
      };
    }

    // Check role requirements
    if (options.allowedRoles && !options.allowedRoles.includes(session.user.role)) {
      return { 
        authorized: false, 
        error: 'Insufficient role privileges',
        redirectUrl: '/fr/unauthorized'
      };
    }

    // Check superuser permission requirements
    if (options.requiredPermissions && options.requiredPermissions.length > 0) {
      if (!session.isSuperuser) {
        return { 
          authorized: false, 
          error: 'Superuser access required',
          redirectUrl: '/fr/unauthorized'
        };
      }

      const hasPermissions = options.requiredPermissions.every(perm => 
        session.permissions.includes(perm)
      );

      if (!hasPermissions) {
        return { 
          authorized: false, 
          error: `Missing required permissions: ${options.requiredPermissions.join(', ')}`,
          redirectUrl: '/fr/admin/superuser/insufficient-permissions'
        };
      }
    }

    // Check superuser session requirement
    if (options.requireSuperuserSession) {
      if (!session.isSuperuser || !session.superuserSession) {
        return { 
          authorized: false, 
          error: 'Active superuser session required',
          redirectUrl: '/fr/admin/superuser/session-required'
        };
      }
    }

    return { authorized: true, session };
  } catch (error) {
    console.error('Error in enhanced auth API:', error);
    return { 
      authorized: false, 
      error: 'Authentication error',
      redirectUrl: '/fr/login'
    };
  }
}

/**
 * Require superuser access with specific permissions
 */
export async function requireSuperuser(
  requiredPermissions: SuperuserPermission[] = []
): Promise<EnhancedAuthSession> {
  return await requireEnhancedAuth({
    allowedRoles: ['admin', 'superuser'],
    requiredPermissions,
    requireSuperuserSession: true
  });
}

/**
 * API version of superuser requirement
 */
export async function requireSuperuserAPI(
  requiredPermissions: SuperuserPermission[] = []
): Promise<AuthorizationResult> {
  return await requireEnhancedAuthAPI({
    allowedRoles: ['admin', 'superuser'],
    requiredPermissions,
    requireSuperuserSession: true
  });
}

/**
 * Check if current user can perform superuser action
 */
export async function canPerformSuperuserAction(
  requiredPermissions: SuperuserPermission[]
): Promise<boolean> {
  try {
    const session = await getEnhancedSession();
    
    if (!session || !session.isSuperuser) {
      return false;
    }

    return requiredPermissions.every(perm => session.permissions.includes(perm));
  } catch (error) {
    console.error('Error checking superuser action capability:', error);
    return false;
  }
}

/**
 * Get user's superuser permissions
 */
export async function getUserSuperuserPermissions(): Promise<SuperuserPermission[]> {
  try {
    const session = await getEnhancedSession();
    return session?.permissions || [];
  } catch (error) {
    console.error('Error getting user superuser permissions:', error);
    return [];
  }
}

/**
 * Check if user has specific superuser permission
 */
export async function hasSuperuserPermission(permission: SuperuserPermission): Promise<boolean> {
  try {
    const permissions = await getUserSuperuserPermissions();
    return permissions.includes(permission);
  } catch (error) {
    console.error('Error checking superuser permission:', error);
    return false;
  }
}

/**
 * Middleware helper for route protection
 */
export async function protectSuperuserRoute(
  requiredPermissions: SuperuserPermission[] = []
): Promise<{ authorized: boolean; redirectUrl?: string }> {
  try {
    const result = await requireSuperuserAPI(requiredPermissions);
    
    if (!result.authorized) {
      return { 
        authorized: false, 
        redirectUrl: result.redirectUrl || '/fr/unauthorized' 
      };
    }

    return { authorized: true };
  } catch (error) {
    console.error('Error protecting superuser route:', error);
    return { 
      authorized: false, 
      redirectUrl: '/fr/login' 
    };
  }
}

/**
 * Enhanced role checking that includes superuser permissions
 */
export async function requireRoleWithPermissions(
  allowedRoles: UserRole[],
  requiredPermissions: SuperuserPermission[] = []
): Promise<EnhancedAuthSession> {
  return await requireEnhancedAuth({
    allowedRoles,
    requiredPermissions
  });
}

/**
 * Check if user can access admin features
 */
export async function canAccessAdmin(): Promise<boolean> {
  try {
    const session = await getEnhancedSession();
    return session?.user.role === 'admin' || session?.user.role === 'superuser' || false;
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

/**
 * Check if user can access superuser features
 */
export async function canAccessSuperuser(): Promise<boolean> {
  try {
    const session = await getEnhancedSession();
    return session?.isSuperuser || false;
  } catch (error) {
    console.error('Error checking superuser access:', error);
    return false;
  }
}

/**
 * Get appropriate redirect URL based on user role and permissions
 */
export async function getAppropriateRedirectUrl(locale: string = 'fr'): Promise<string> {
  try {
    const session = await getEnhancedSession();
    
    if (!session) {
      return `/${locale}/login`;
    }

    // Superuser gets priority redirect
    if (session.isSuperuser) {
      return `/${locale}/admin/superuser/dashboard`;
    }

    // Standard role-based redirects
    switch (session.user.role) {
      case 'admin':
        return `/${locale}/admin`;
      case 'manager':
      case 'executive':
      case 'member':
        return `/${locale}/home`;
      case 'client':
        return `/${locale}/client/dashboard`;
      case 'partner':
        return `/${locale}/partner/dashboard`;
      default:
        return `/${locale}/public`;
    }
  } catch (error) {
    console.error('Error getting appropriate redirect URL:', error);
    return `/${locale}/login`;
  }
}

/**
 * Utility for checking multiple permission scenarios
 */
export async function checkPermissionScenarios(scenarios: {
  [key: string]: SuperuserPermission[];
}): Promise<{ [key: string]: boolean }> {
  try {
    const session = await getEnhancedSession();
    const results: { [key: string]: boolean } = {};
    
    if (!session || !session.isSuperuser) {
      // Return false for all scenarios if not superuser
      Object.keys(scenarios).forEach(key => {
        results[key] = false;
      });
      return results;
    }

    // Check each scenario
    Object.entries(scenarios).forEach(([key, requiredPermissions]) => {
      results[key] = requiredPermissions.every(perm => 
        session.permissions.includes(perm)
      );
    });

    return results;
  } catch (error) {
    console.error('Error checking permission scenarios:', error);
    const results: { [key: string]: boolean } = {};
    Object.keys(scenarios).forEach(key => {
      results[key] = false;
    });
    return results;
  }
}

// Note: For backward compatibility, import getSession, requireAuth, requireRole directly from '@/lib/auth'