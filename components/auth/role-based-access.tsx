"use client";

import React from 'react';
import { UserRole } from '@/lib/types';
import { usePermissions } from '@/hooks/use-permissions';

export interface RoleBasedAccessProps {
  /** The user's current role */
  userRole: UserRole;
  /** Array of roles that are allowed to access this content */
  allowedRoles?: UserRole[];
  /** Specific resource permission to check */
  resource?: string;
  /** Specific action permission to check */
  action?: string;
  /** Scope for the permission check */
  scope?: string;
  /** Component name for component-specific access checking */
  component?: string;
  /** Content to render when access is granted */
  children: React.ReactNode;
  /** Custom fallback component when access is denied */
  fallback?: React.ReactNode;
  /** Whether to show default fallback or render nothing when access denied */
  showFallback?: boolean;
  /** Custom className for the wrapper */
  className?: string;
}

/**
 * RoleBasedAccess component provides conditional rendering based on user permissions
 * 
 * Usage examples:
 * 
 * // Role-based access
 * <RoleBasedAccess userRole={user.role} allowedRoles={['admin', 'manager']}>
 *   <AdminPanel />
 * </RoleBasedAccess>
 * 
 * // Permission-based access
 * <RoleBasedAccess userRole={user.role} resource="financial" action="read">
 *   <FinancialData />
 * </RoleBasedAccess>
 * 
 * // Component-based access
 * <RoleBasedAccess userRole={user.role} component="financial-dashboard">
 *   <FinancialDashboard />
 * </RoleBasedAccess>
 */
export function RoleBasedAccess({
  userRole,
  allowedRoles,
  resource,
  action,
  scope,
  component,
  children,
  fallback,
  showFallback = true,
  className
}: RoleBasedAccessProps) {
  const permissions = usePermissions(userRole);

  // Determine if user has access
  const hasAccess = React.useMemo(() => {
    // Check by allowed roles
    if (allowedRoles && allowedRoles.length > 0) {
      return permissions.hasAnyRole(allowedRoles);
    }

    // Check by component access
    if (component) {
      return permissions.canAccess(component);
    }

    // Check by specific permission
    if (resource && action) {
      return permissions.hasPermission(resource, action, scope);
    }

    // Check by resource access only
    if (resource) {
      return permissions.canAccessResource(resource);
    }

    // If no specific criteria provided, default to allowing access
    return true;
  }, [userRole, allowedRoles, resource, action, scope, component, permissions]);

  // Render content based on access
  if (hasAccess) {
    return className ? (
      <div className={className}>{children}</div>
    ) : (
      <>{children}</>
    );
  }

  // Handle access denied
  if (!showFallback) {
    return null;
  }

  if (fallback) {
    return className ? (
      <div className={className}>{fallback}</div>
    ) : (
      <>{fallback}</>
    );
  }

  // Default fallback - import the UnauthorizedAccess component
  return (
    <div className={className}>
      <DefaultAccessDenied 
        userRole={userRole}
        attemptedResource={resource}
        attemptedAction={action}
        attemptedComponent={component}
      />
    </div>
  );
}

/**
 * Default fallback component for access denied scenarios
 */
interface DefaultAccessDeniedProps {
  userRole: UserRole;
  attemptedResource?: string;
  attemptedAction?: string;
  attemptedComponent?: string;
}

function DefaultAccessDenied({ 
  userRole, 
  attemptedResource, 
  attemptedAction, 
  attemptedComponent 
}: DefaultAccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
      <div className="w-16 h-16 mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg 
          className="w-8 h-8 text-red-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-7a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Access Denied
      </h3>
      
      <p className="text-gray-600 mb-4 max-w-md">
        Your current role ({userRole}) does not have permission to access this content.
      </p>
      
      {(attemptedResource || attemptedComponent) && (
        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded">
          <strong>Attempted access:</strong>{' '}
          {attemptedComponent || `${attemptedResource}${attemptedAction ? `:${attemptedAction}` : ''}`}
        </div>
      )}
    </div>
  );
}

/**
 * Higher-order component for role-based access control
 */
export function withRoleBasedAccess<P extends object>(
  Component: React.ComponentType<P>,
  accessConfig: Omit<RoleBasedAccessProps, 'children' | 'userRole'>
) {
  return function WrappedComponent(props: P & { userRole: UserRole }) {
    const { userRole, ...componentProps } = props;
    
    return (
      <RoleBasedAccess userRole={userRole} {...accessConfig}>
        <Component {...(componentProps as P)} />
      </RoleBasedAccess>
    );
  };
}

/**
 * Hook for conditional rendering based on permissions
 */
export function useRoleBasedAccess(userRole: UserRole) {
  const permissions = usePermissions(userRole);

  const canRender = React.useCallback((config: {
    allowedRoles?: UserRole[];
    resource?: string;
    action?: string;
    scope?: string;
    component?: string;
  }) => {
    if (config.allowedRoles) {
      return permissions.hasAnyRole(config.allowedRoles);
    }
    
    if (config.component) {
      return permissions.canAccess(config.component);
    }
    
    if (config.resource && config.action) {
      return permissions.hasPermission(config.resource, config.action, config.scope);
    }
    
    if (config.resource) {
      return permissions.canAccessResource(config.resource);
    }
    
    return true;
  }, [permissions]);

  const filterRenderableItems = React.useCallback(<T extends { id: string }>(
    items: T[],
    getConfig: (item: T) => Parameters<typeof canRender>[0]
  ) => {
    return items.filter(item => {
      const config = getConfig(item);
      return canRender(config);
    });
  }, [canRender]);

  return {
    canRender,
    filterRenderableItems
  };
}