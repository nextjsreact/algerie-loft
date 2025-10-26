import { UserRole } from '@/lib/types';
import { PermissionValidator } from '@/lib/permissions/types';

/**
 * Extended user role type including client and partner
 */
export type ExtendedUserRole = UserRole;

/**
 * Role hierarchy for access control
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  client: 1,
  partner: 1,
  member: 2,
  executive: 3,
  manager: 4,
  admin: 5
};

/**
 * Role-based route access configuration
 */
export const ROLE_ROUTES: Record<string, UserRole[]> = {
  // Public routes (accessible to all)
  '/public': ['guest', 'client', 'partner', 'member', 'executive', 'manager', 'admin'],
  '/login': ['guest'],
  '/register': ['guest'],
  '/forgot-password': ['guest'],
  
  // Client routes
  '/client': ['client'],
  '/client/dashboard': ['client'],
  '/client/search': ['client'],
  '/client/booking': ['client'],
  '/client/reservations': ['client'],
  '/client/profile': ['client'],
  
  // Partner routes
  '/partner': ['partner'],
  '/partner/dashboard': ['partner'],
  '/partner/properties': ['partner'],
  '/partner/bookings': ['partner'],
  '/partner/earnings': ['partner'],
  '/partner/profile': ['partner'],
  
  // Employee routes (existing)
  '/app': ['member', 'executive', 'manager', 'admin'],
  '/app/dashboard': ['member', 'executive', 'manager', 'admin'],
  '/app/lofts': ['member', 'executive', 'manager', 'admin'],
  '/app/tasks': ['member', 'manager', 'admin'],
  '/app/transactions': ['executive', 'manager', 'admin'],
  '/app/reports': ['executive', 'manager', 'admin'],
  '/app/admin': ['admin'],
  
  // Shared routes
  '/notifications': ['client', 'partner', 'member', 'executive', 'manager', 'admin'],
  '/profile': ['client', 'partner', 'member', 'executive', 'manager', 'admin']
};

/**
 * Default redirect URLs for each role after login
 */
export const DEFAULT_REDIRECTS: Record<UserRole, string> = {
  guest: '/public',
  client: '/client/dashboard',
  partner: '/partner/dashboard',
  member: '/app/dashboard',
  executive: '/app/dashboard',
  manager: '/app/dashboard',
  admin: '/app/dashboard'
};

/**
 * Check if a user role can access a specific route
 */
export function canAccessRoute(route: string, userRole: UserRole): boolean {
  // Remove locale prefix if present (only if it's exactly a 2-letter locale at the start)
  const cleanRoute = route.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  
  // First, apply role-based section restrictions
  if (cleanRoute.startsWith('/client') && userRole !== 'client') {
    return false;
  }
  if (cleanRoute.startsWith('/partner') && userRole !== 'partner') {
    return false;
  }
  if (cleanRoute.startsWith('/app') && !['member', 'executive', 'manager', 'admin'].includes(userRole)) {
    return false;
  }
  
  // Check exact match
  if (ROLE_ROUTES[cleanRoute]) {
    return ROLE_ROUTES[cleanRoute].includes(userRole);
  }
  
  // Check for parent route matches (from most specific to least specific)
  const routeParts = cleanRoute.split('/').filter(Boolean);
  for (let i = routeParts.length; i > 0; i--) {
    const parentRoute = '/' + routeParts.slice(0, i).join('/');
    if (ROLE_ROUTES[parentRoute]) {
      return ROLE_ROUTES[parentRoute].includes(userRole);
    }
  }
  
  // For authenticated users, allow access to general routes not explicitly restricted
  if (userRole !== 'guest') {
    return true;
  }
  
  // Default: deny access for guests to unspecified routes
  return false;
}

/**
 * Get the appropriate redirect URL for a user role
 */
export function getRoleRedirectUrl(userRole: UserRole, locale: string = 'fr'): string {
  const defaultRoute = DEFAULT_REDIRECTS[userRole];
  return `/${locale}${defaultRoute}`;
}

/**
 * Check if a user role has higher or equal hierarchy level than required
 */
export function hasRoleHierarchy(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  
  // If same level, only allow if it's the exact same role
  if (userLevel === requiredLevel) {
    return userRole === requiredRole;
  }
  
  return userLevel > requiredLevel;
}

/**
 * Get all accessible routes for a user role
 */
export function getAccessibleRoutes(userRole: UserRole): string[] {
  return Object.keys(ROLE_ROUTES).filter(route => 
    ROLE_ROUTES[route].includes(userRole)
  );
}

/**
 * Check if a user can perform a specific action on a resource
 */
export function canPerformAction(
  userRole: UserRole,
  resource: string,
  action: string,
  scope?: string
): boolean {
  return PermissionValidator.hasPermission(userRole, resource, action, scope);
}

/**
 * Check if a user can access a specific component
 */
export function canAccessComponent(userRole: UserRole, component: string): boolean {
  return PermissionValidator.canAccessComponent(userRole, component);
}

/**
 * Validate role-based access for API routes
 */
export function validateApiAccess(
  userRole: UserRole,
  endpoint: string,
  method: string
): boolean {
  // API endpoint access rules
  const apiRules: Record<string, { methods: string[], roles: UserRole[] }> = {
    '/api/client': {
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      roles: ['client']
    },
    '/api/partner': {
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      roles: ['partner']
    },
    '/api/bookings': {
      methods: ['GET', 'POST', 'PUT'],
      roles: ['client', 'partner', 'admin', 'manager']
    },
    '/api/lofts/search': {
      methods: ['GET'],
      roles: ['client', 'partner', 'member', 'executive', 'manager', 'admin']
    },
    '/api/admin': {
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      roles: ['admin']
    },
    '/api/reports': {
      methods: ['GET'],
      roles: ['executive', 'manager', 'admin']
    }
  };

  // Find matching API rule
  const matchingRule = Object.keys(apiRules).find(pattern => 
    endpoint.startsWith(pattern)
  );

  if (!matchingRule) {
    // Default: allow access for authenticated users
    return userRole !== 'guest';
  }

  const rule = apiRules[matchingRule];
  return rule.methods.includes(method) && rule.roles.includes(userRole);
}

/**
 * Get user-specific navigation items based on role
 */
export function getNavigationItems(userRole: UserRole): Array<{
  label: string;
  href: string;
  icon?: string;
  children?: Array<{ label: string; href: string; }>;
}> {
  const baseItems = [
    { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
    { label: 'Profile', href: '/profile', icon: 'user' },
    { label: 'Notifications', href: '/notifications', icon: 'bell' }
  ];

  switch (userRole) {
    case 'client':
      return [
        { label: 'Dashboard', href: '/client/dashboard', icon: 'dashboard' },
        { label: 'Search Lofts', href: '/client/search', icon: 'search' },
        { label: 'My Reservations', href: '/client/reservations', icon: 'calendar' },
        { label: 'Profile', href: '/client/profile', icon: 'user' },
        { label: 'Notifications', href: '/notifications', icon: 'bell' }
      ];

    case 'partner':
      return [
        { label: 'Dashboard', href: '/partner/dashboard', icon: 'dashboard' },
        { label: 'My Properties', href: '/partner/properties', icon: 'building' },
        { label: 'Bookings', href: '/partner/bookings', icon: 'calendar' },
        { label: 'Earnings', href: '/partner/earnings', icon: 'chart' },
        { label: 'Profile', href: '/partner/profile', icon: 'user' },
        { label: 'Notifications', href: '/notifications', icon: 'bell' }
      ];

    case 'admin':
      return [
        { label: 'Dashboard', href: '/app/dashboard', icon: 'dashboard' },
        { label: 'Lofts', href: '/app/lofts', icon: 'building' },
        { label: 'Tasks', href: '/app/tasks', icon: 'tasks' },
        { label: 'Transactions', href: '/app/transactions', icon: 'money' },
        { label: 'Reports', href: '/app/reports', icon: 'chart' },
        { label: 'Admin', href: '/app/admin', icon: 'settings' },
        { label: 'Profile', href: '/profile', icon: 'user' },
        { label: 'Notifications', href: '/notifications', icon: 'bell' }
      ];

    case 'manager':
      return [
        { label: 'Dashboard', href: '/app/dashboard', icon: 'dashboard' },
        { label: 'Lofts', href: '/app/lofts', icon: 'building' },
        { label: 'Tasks', href: '/app/tasks', icon: 'tasks' },
        { label: 'Transactions', href: '/app/transactions', icon: 'money' },
        { label: 'Reports', href: '/app/reports', icon: 'chart' },
        { label: 'Profile', href: '/profile', icon: 'user' },
        { label: 'Notifications', href: '/notifications', icon: 'bell' }
      ];

    case 'executive':
      return [
        { label: 'Dashboard', href: '/app/dashboard', icon: 'dashboard' },
        { label: 'Lofts', href: '/app/lofts', icon: 'building' },
        { label: 'Reports', href: '/app/reports', icon: 'chart' },
        { label: 'Profile', href: '/profile', icon: 'user' },
        { label: 'Notifications', href: '/notifications', icon: 'bell' }
      ];

    case 'member':
      return [
        { label: 'Dashboard', href: '/app/dashboard', icon: 'dashboard' },
        { label: 'My Tasks', href: '/app/tasks', icon: 'tasks' },
        { label: 'Profile', href: '/profile', icon: 'user' },
        { label: 'Notifications', href: '/notifications', icon: 'bell' }
      ];

    default:
      return baseItems;
  }
}

/**
 * Check if user needs verification (for partners)
 */
export function requiresVerification(userRole: UserRole): boolean {
  return userRole === 'partner';
}

/**
 * Get role display name for UI
 */
export function getRoleDisplayName(userRole: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    guest: 'Guest',
    client: 'Client',
    partner: 'Partner',
    member: 'Team Member',
    executive: 'Executive',
    manager: 'Manager',
    admin: 'Administrator'
  };

  return displayNames[userRole] || userRole;
}