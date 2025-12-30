import { UserRole } from '../types';

/**
 * Represents a specific permission for a resource and action
 */
export interface Permission {
  /** The resource being accessed (e.g., 'dashboard', 'tasks', 'lofts') */
  resource: string;
  /** The action being performed (e.g., 'read', 'write', 'delete', 'create') */
  action: 'read' | 'write' | 'delete' | 'create' | '*';
  /** The scope of access (e.g., 'own', 'team', 'all') */
  scope?: 'own' | 'team' | 'all' | 'assigned';
}

/**
 * Maps user roles to their allowed permissions
 */
export interface RolePermissions {
  [role: string]: Permission[];
}

/**
 * Configuration object for role-based access control
 */
export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    // Admin has full access to everything
    { resource: '*', action: '*', scope: 'all' },
    // Explicit audit permissions
    { resource: 'audit', action: '*', scope: 'all' },
    { resource: 'audit-export', action: '*', scope: 'all' }
  ],
  manager: [
    // Dashboard access
    { resource: 'dashboard', action: 'read', scope: 'all' },
    { resource: 'dashboard-financial', action: 'read', scope: 'all' },
    { resource: 'dashboard-stats', action: 'read', scope: 'all' },
    
    // Task management
    { resource: 'tasks', action: '*', scope: 'all' },
    
    // Loft management
    { resource: 'lofts', action: 'read', scope: 'all' },
    { resource: 'lofts', action: 'write', scope: 'all' },
    { resource: 'lofts-financial', action: 'read', scope: 'all' },
    
    // Financial data
    { resource: 'financial', action: 'read', scope: 'all' },
    { resource: 'transactions', action: '*', scope: 'all' },
    { resource: 'reports', action: 'read', scope: 'all' },
    
    // Notifications
    { resource: 'notifications', action: 'read', scope: 'all' },
    { resource: 'notifications', action: 'write', scope: 'all' },
    
    // User management
    { resource: 'users', action: 'read', scope: 'all' },
    { resource: 'users', action: 'write', scope: 'team' },
    
    // Audit access
    { resource: 'audit', action: 'read', scope: 'all' }
  ],
  executive: [
    // Executive dashboard access
    { resource: 'dashboard', action: 'read', scope: 'all' },
    { resource: 'dashboard-financial', action: 'read', scope: 'all' },
    { resource: 'dashboard-stats', action: 'read', scope: 'all' },
    
    // Financial reports and data
    { resource: 'reports', action: 'read', scope: 'all' },
    { resource: 'financial', action: 'read', scope: 'all' },
    { resource: 'transactions', action: 'read', scope: 'all' },
    
    // Limited loft access (no operational details)
    { resource: 'lofts', action: 'read', scope: 'all' },
    { resource: 'lofts-financial', action: 'read', scope: 'all' },
    
    // Personal notifications
    { resource: 'notifications', action: 'read', scope: 'own' }
  ],
  member: [
    // Limited dashboard access (no financial data)
    { resource: 'dashboard', action: 'read', scope: 'own' },
    
    // Task management (only assigned tasks)
    { resource: 'tasks', action: 'read', scope: 'own' },
    { resource: 'tasks', action: 'write', scope: 'own' },
    
    // Limited loft access (only operational info for assigned lofts)
    { resource: 'lofts', action: 'read', scope: 'assigned' },
    
    // Personal notifications (task-related only)
    { resource: 'notifications', action: 'read', scope: 'own' }
  ],
  guest: [
    // Very limited access
    { resource: 'public', action: 'read', scope: 'all' }
  ],
  client: [
    // Client dashboard and profile
    { resource: 'dashboard', action: 'read', scope: 'own' },
    { resource: 'profile', action: '*', scope: 'own' },
    
    // Loft search and viewing
    { resource: 'lofts', action: 'read', scope: 'public' },
    { resource: 'loft-search', action: 'read', scope: 'all' },
    { resource: 'loft-availability', action: 'read', scope: 'all' },
    { resource: 'loft-reviews', action: 'read', scope: 'all' },
    
    // Booking management
    { resource: 'bookings', action: '*', scope: 'own' },
    { resource: 'booking-messages', action: '*', scope: 'own' },
    { resource: 'booking-reviews', action: '*', scope: 'own' },
    
    // Notifications
    { resource: 'notifications', action: 'read', scope: 'own' }
  ],
  partner: [
    // Partner dashboard and profile
    { resource: 'dashboard', action: 'read', scope: 'own' },
    { resource: 'profile', action: '*', scope: 'own' },
    { resource: 'partner-profile', action: '*', scope: 'own' },
    
    // Property management
    { resource: 'lofts', action: '*', scope: 'own' },
    { resource: 'loft-images', action: '*', scope: 'own' },
    { resource: 'loft-amenities', action: '*', scope: 'own' },
    { resource: 'loft-availability', action: '*', scope: 'own' },
    { resource: 'loft-pricing', action: '*', scope: 'own' },
    
    // Booking management for own properties
    { resource: 'bookings', action: 'read', scope: 'own' },
    { resource: 'bookings', action: 'write', scope: 'own' },
    { resource: 'booking-messages', action: '*', scope: 'own' },
    
    // Reviews and ratings
    { resource: 'loft-reviews', action: 'read', scope: 'own' },
    { resource: 'loft-reviews', action: 'write', scope: 'own' },
    
    // Financial data for own properties
    { resource: 'partner-earnings', action: 'read', scope: 'own' },
    { resource: 'partner-analytics', action: 'read', scope: 'own' },
    
    // Notifications
    { resource: 'notifications', action: 'read', scope: 'own' }
  ]
};

/**
 * Utility functions for permission validation
 */
export class PermissionValidator {
  /**
   * Check if a user role has permission for a specific resource and action
   */
  static hasPermission(
    userRole: UserRole,
    resource: string,
    action: string,
    scope?: string
  ): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    
    if (!rolePermissions) {
      return false;
    }

    return rolePermissions.some(permission => {
      // Check for wildcard permissions (admin)
      if (permission.resource === '*' && permission.action === '*') {
        return true;
      }

      // Check resource match
      const resourceMatch = permission.resource === resource || permission.resource === '*';
      
      // Check action match
      const actionMatch = permission.action === action || permission.action === '*';
      
      // Check scope match (if scope is specified)
      const scopeMatch = !scope || !permission.scope || permission.scope === scope;

      return resourceMatch && actionMatch && scopeMatch;
    });
  }

  /**
   * Check if a user can access a specific component or page
   */
  static canAccessComponent(userRole: UserRole, component: string): boolean {
    switch (component) {
      case 'financial-dashboard':
        return this.hasPermission(userRole, 'dashboard-financial', 'read');
      
      case 'admin-panel':
        return this.hasPermission(userRole, 'users', 'write');
      
      case 'all-tasks':
        return this.hasPermission(userRole, 'tasks', 'read', 'all');
      
      case 'financial-reports':
        return this.hasPermission(userRole, 'reports', 'read');
      
      case 'loft-financial-data':
        return this.hasPermission(userRole, 'lofts-financial', 'read');
      
      case 'transaction-management':
        return this.hasPermission(userRole, 'transactions', 'write');
      
      // Client-specific components
      case 'loft-search':
        return this.hasPermission(userRole, 'loft-search', 'read');
      
      case 'booking-management':
        return this.hasPermission(userRole, 'bookings', 'read', 'own');
      
      case 'client-dashboard':
        return userRole === 'client' && this.hasPermission(userRole, 'dashboard', 'read', 'own');
      
      // Partner-specific components
      case 'partner-dashboard':
        return userRole === 'partner' && this.hasPermission(userRole, 'dashboard', 'read', 'own');
      
      case 'property-management':
        return this.hasPermission(userRole, 'lofts', 'write', 'own');
      
      case 'partner-bookings':
        return userRole === 'partner' && this.hasPermission(userRole, 'bookings', 'read', 'own');
      
      case 'partner-earnings':
        return this.hasPermission(userRole, 'earnings', 'read', 'own');
      
      case 'partner-verification':
        return userRole === 'partner' && this.hasPermission(userRole, 'partner-profile', 'read', 'own');
      
      // Multi-role components
      case 'booking-messages':
        return this.hasPermission(userRole, 'booking-messages', 'read', 'own');
      
      case 'loft-reviews':
        return this.hasPermission(userRole, 'loft-reviews', 'read');
      
      default:
        return false;
    }
  }

  /**
   * Get all permissions for a specific role
   */
  static getRolePermissions(userRole: UserRole): Permission[] {
    return ROLE_PERMISSIONS[userRole] || [];
  }

  /**
   * Check if a role can perform any action on a resource
   */
  static canAccessResource(userRole: UserRole, resource: string): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    
    if (!rolePermissions) {
      return false;
    }

    return rolePermissions.some(permission => 
      permission.resource === resource || 
      permission.resource === '*'
    );
  }

  /**
   * Get the allowed scope for a user role on a specific resource
   */
  static getAllowedScope(userRole: UserRole, resource: string): string[] {
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    
    if (!rolePermissions) {
      return [];
    }

    const scopes: string[] = [];
    
    rolePermissions.forEach(permission => {
      if (permission.resource === resource || permission.resource === '*') {
        if (permission.scope) {
          scopes.push(permission.scope);
        }
      }
    });

    return [...new Set(scopes)]; // Remove duplicates
  }
}