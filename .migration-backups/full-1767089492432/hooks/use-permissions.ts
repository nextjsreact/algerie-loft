import { useMemo } from 'react';
import { UserRole } from '@/lib/types';
import { PermissionValidator } from '@/lib/permissions/types';

/**
 * Return type for the usePermissions hook
 */
export interface UsePermissionsReturn {
  /**
   * Check if the user has permission for a specific resource and action
   */
  hasPermission: (resource: string, action: string, scope?: string) => boolean;
  
  /**
   * Check if the user can access a specific component
   */
  canAccess: (component: string) => boolean;
  
  /**
   * Filter data array based on user permissions and a filter function
   */
  filterData: <T>(data: T[], filterFn: (item: T, userRole: UserRole) => boolean) => T[];
  
  /**
   * Check if user can access a resource at all
   */
  canAccessResource: (resource: string) => boolean;
  
  /**
   * Get allowed scopes for a resource
   */
  getAllowedScopes: (resource: string) => string[];
  
  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole: (roles: UserRole[]) => boolean;
  
  /**
   * Check if user has specific role
   */
  hasRole: (role: UserRole) => boolean;
}

/**
 * Custom hook for managing user permissions based on their role
 * 
 * @param userRole - The current user's role
 * @returns Object with permission checking methods
 */
export function usePermissions(userRole: UserRole): UsePermissionsReturn {
  const permissionMethods = useMemo(() => {
    return {
      hasPermission: (resource: string, action: string, scope?: string): boolean => {
        return PermissionValidator.hasPermission(userRole, resource, action, scope);
      },

      canAccess: (component: string): boolean => {
        return PermissionValidator.canAccessComponent(userRole, component);
      },

      filterData: <T>(data: T[], filterFn: (item: T, userRole: UserRole) => boolean): T[] => {
        if (!Array.isArray(data)) {
          return [];
        }
        
        return data.filter(item => filterFn(item, userRole));
      },

      canAccessResource: (resource: string): boolean => {
        return PermissionValidator.canAccessResource(userRole, resource);
      },

      getAllowedScopes: (resource: string): string[] => {
        return PermissionValidator.getAllowedScope(userRole, resource);
      },

      hasAnyRole: (roles: UserRole[]): boolean => {
        return roles.includes(userRole);
      },

      hasRole: (role: UserRole): boolean => {
        return userRole === role;
      }
    };
  }, [userRole]);

  return permissionMethods;
}

/**
 * Predefined filter functions for common data filtering scenarios
 */
export const DataFilters = {
  /**
   * Filter tasks based on user role and assignment
   */
  tasks: (task: any, userRole: UserRole, userId?: string) => {
    switch (userRole) {
      case 'admin':
      case 'manager':
        return true; // Can see all tasks
      
      case 'executive':
        return false; // Executives don't need task details
      
      case 'member':
        // Members can only see tasks assigned to them
        return task.assigned_to === userId || task.user_id === userId;
      
      case 'guest':
      default:
        return false;
    }
  },

  /**
   * Filter notifications based on user role and relevance
   */
  notifications: (notification: any, userRole: UserRole, userId?: string) => {
    switch (userRole) {
      case 'admin':
      case 'manager':
        return true; // Can see all notifications
      
      case 'executive':
      case 'member':
        // Can only see their own notifications
        return notification.user_id === userId;
      
      case 'guest':
      default:
        return false;
    }
  },

  /**
   * Filter lofts based on user role and assignment
   */
  lofts: (loft: any, userRole: UserRole, userId?: string, assignedLoftIds?: string[]) => {
    switch (userRole) {
      case 'admin':
      case 'manager':
      case 'executive':
        return true; // Can see all lofts
      
      case 'partner':
        // Partners can see their own lofts
        return loft.owner_id === userId;
      
      case 'client':
        // Clients can see available lofts
        return loft.status === 'available';
      
      case 'member':
        // Members can only see lofts where they have assigned tasks
        return assignedLoftIds ? assignedLoftIds.includes(loft.id) : false;
      
      case 'guest':
      default:
        return false;
    }
  },

  /**
   * Filter financial data based on user role
   */
  financialData: (data: any, userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
      case 'manager':
      case 'executive':
        return true; // Can see financial data
      
      case 'partner':
        // Partners can see their own earnings data
        return data.partner_id === data.userId;
      
      case 'member':
      case 'client':
      case 'guest':
      default:
        return false; // Cannot see financial data
    }
  },

  /**
   * Filter bookings based on user role and involvement
   */
  bookings: (booking: any, userRole: UserRole, userId?: string) => {
    switch (userRole) {
      case 'admin':
      case 'manager':
        return true; // Can see all bookings
      
      case 'client':
        // Clients can only see their own bookings
        return booking.client_id === userId;
      
      case 'partner':
        // Partners can see bookings for their properties
        return booking.partner_id === userId;
      
      case 'executive':
        // Executives can see booking summaries but not personal details
        return true;
      
      case 'member':
      case 'guest':
      default:
        return false;
    }
  },

  /**
   * Filter booking messages based on user involvement
   */
  bookingMessages: (message: any, userRole: UserRole, userId?: string, bookingData?: any) => {
    switch (userRole) {
      case 'admin':
      case 'manager':
        return true; // Can see all messages
      
      case 'client':
      case 'partner':
        // Can see messages for bookings they're involved in
        return bookingData && (
          bookingData.client_id === userId || 
          bookingData.partner_id === userId
        );
      
      default:
        return false;
    }
  },

  /**
   * Filter partner profiles based on user role
   */
  partnerProfiles: (profile: any, userRole: UserRole, userId?: string) => {
    switch (userRole) {
      case 'admin':
      case 'manager':
        return true; // Can see all partner profiles
      
      case 'partner':
        // Partners can only see their own profile
        return profile.user_id === userId;
      
      default:
        return false;
    }
  }
};

/**
 * Higher-order component helper for role-based data filtering
 */
export function withRoleBasedFiltering<T>(
  data: T[],
  userRole: UserRole,
  filterType: keyof typeof DataFilters,
  additionalParams?: any
): T[] {
  const filterFn = DataFilters[filterType];
  if (!filterFn) {
    return data;
  }

  return data.filter(item => filterFn(item, userRole, additionalParams?.userId, additionalParams?.assignedLoftIds));
}