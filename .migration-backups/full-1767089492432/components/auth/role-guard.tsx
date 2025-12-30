'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { useAuth } from '@/lib/hooks/use-auth';
import { canAccessRoute, getRoleRedirectUrl } from '@/lib/auth/role-utils';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
  showUnauthorized?: boolean;
}

/**
 * Component that protects routes based on user roles
 */
export function RoleGuard({
  children,
  requiredRoles,
  fallback,
  redirectTo,
  showUnauthorized = false
}: RoleGuardProps) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // If no session, redirect to login
    if (!session) {
      const locale = pathname.split('/')[1] || 'fr';
      router.push(`/${locale}/login`);
      return;
    }

    // Check if user has required roles
    if (requiredRoles && !requiredRoles.includes(session.user.role)) {
      if (redirectTo) {
        router.push(redirectTo);
      } else if (!showUnauthorized) {
        const locale = pathname.split('/')[1] || 'fr';
        const roleRedirect = getRoleRedirectUrl(session.user.role, locale);
        router.push(roleRedirect);
      }
      return;
    }

    // Check if user can access current route
    const cleanPath = pathname.replace(/^\/[a-z]{2}/, '');
    if (!canAccessRoute(cleanPath, session.user.role)) {
      const locale = pathname.split('/')[1] || 'fr';
      const roleRedirect = getRoleRedirectUrl(session.user.role, locale);
      router.push(roleRedirect);
    }
  }, [session, loading, pathname, router, requiredRoles, redirectTo, showUnauthorized]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show unauthorized message if configured
  if (!session || (requiredRoles && !requiredRoles.includes(session.user.role))) {
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => {
                const locale = pathname.split('/')[1] || 'fr';
                const roleRedirect = getRoleRedirectUrl(session?.user.role || 'guest', locale);
                router.push(roleRedirect);
              }}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return fallback || null;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting pages
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: UserRole[],
  options?: {
    fallback?: React.ReactNode;
    redirectTo?: string;
    showUnauthorized?: boolean;
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <RoleGuard
        requiredRoles={requiredRoles}
        fallback={options?.fallback}
        redirectTo={options?.redirectTo}
        showUnauthorized={options?.showUnauthorized}
      >
        <Component {...props} />
      </RoleGuard>
    );
  };
}

/**
 * Component for conditionally rendering content based on user role
 */
interface RoleBasedContentProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles, otherwise ANY role
}

export function RoleBasedContent({
  children,
  allowedRoles,
  fallback = null,
  requireAll = false
}: RoleBasedContentProps) {
  const { session } = useAuth();

  if (!session) {
    return <>{fallback}</>;
  }

  const hasAccess = requireAll
    ? allowedRoles.every(role => session.user.role === role)
    : allowedRoles.includes(session.user.role);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component for showing different content based on user role
 */
interface RoleSwitchProps {
  userRole?: UserRole;
  children: React.ReactNode;
}

interface RoleCaseProps {
  roles: UserRole[];
  children: React.ReactNode;
}

export function RoleSwitch({ userRole, children }: RoleSwitchProps) {
  const { session } = useAuth();
  const currentRole = userRole || session?.user.role;

  if (!currentRole) {
    return null;
  }

  // Find matching role case
  const roleCase = React.Children.toArray(children).find((child) => {
    if (React.isValidElement(child) && child.type === RoleCase) {
      const roles = (child.props as RoleCaseProps).roles;
      return roles.includes(currentRole);
    }
    return false;
  });

  return <>{roleCase}</>;
}

export function RoleCase({ roles, children }: RoleCaseProps) {
  return <>{children}</>;
}

/**
 * Hook for role-based navigation items
 */
export function useRoleNavigation() {
  const { session } = useAuth();
  
  if (!session) {
    return [];
  }

  const { getNavigationItems } = require('@/lib/auth/role-utils');
  return getNavigationItems(session.user.role);
}

/**
 * Component for role-based navigation
 */
interface RoleNavigationProps {
  className?: string;
  onItemClick?: (href: string) => void;
}

export function RoleNavigation({ className, onItemClick }: RoleNavigationProps) {
  const navigationItems = useRoleNavigation();
  const router = useRouter();

  const handleItemClick = (href: string) => {
    if (onItemClick) {
      onItemClick(href);
    } else {
      router.push(href);
    }
  };

  return (
    <nav className={className}>
      <ul className="space-y-2">
        {navigationItems.map((item) => (
          <li key={item.href}>
            <button
              onClick={() => handleItemClick(item.href)}
              className="w-full text-left px-4 py-2 rounded hover:bg-gray-100 flex items-center space-x-2"
            >
              {item.icon && <span className="w-5 h-5">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
            {item.children && (
              <ul className="ml-6 mt-2 space-y-1">
                {item.children.map((child) => (
                  <li key={child.href}>
                    <button
                      onClick={() => handleItemClick(child.href)}
                      className="w-full text-left px-3 py-1 text-sm rounded hover:bg-gray-50"
                    >
                      {child.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}