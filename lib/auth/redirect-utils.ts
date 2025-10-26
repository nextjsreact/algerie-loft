import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { DEFAULT_REDIRECTS, canAccessRoute } from './role-utils';

/**
 * Redirect user to appropriate dashboard based on their role
 */
export function redirectToRoleDashboard(userRole: UserRole, locale: string = 'fr'): never {
  const dashboardUrl = DEFAULT_REDIRECTS[userRole];
  redirect(`/${locale}${dashboardUrl}`);
}

/**
 * Redirect user if they don't have access to the current route
 */
export function redirectIfNoAccess(
  currentRoute: string,
  userRole: UserRole,
  locale: string = 'fr'
): void {
  if (!canAccessRoute(currentRoute, userRole)) {
    redirectToRoleDashboard(userRole, locale);
  }
}

/**
 * Get the appropriate login redirect URL after successful authentication
 */
export function getPostLoginRedirect(
  userRole: UserRole,
  intendedDestination?: string,
  locale: string = 'fr'
): string {
  // If there's an intended destination and user can access it, redirect there
  if (intendedDestination && canAccessRoute(intendedDestination, userRole)) {
    return `/${locale}${intendedDestination}`;
  }

  // Otherwise, redirect to role-appropriate dashboard
  const dashboardUrl = DEFAULT_REDIRECTS[userRole];
  return `/${locale}${dashboardUrl}`;
}

/**
 * Handle role-based routing after registration
 */
export function handlePostRegistrationRedirect(
  userRole: UserRole,
  requiresApproval: boolean = false,
  locale: string = 'fr'
): never {
  if (requiresApproval) {
    // For partners awaiting approval, redirect to a pending approval page
    redirect(`/${locale}/partner/pending-approval`);
  }

  // For other roles, redirect to their dashboard
  redirectToRoleDashboard(userRole, locale);
}

/**
 * Create a role-based page guard that redirects unauthorized users
 */
export function createRoleGuard(allowedRoles: UserRole[]) {
  return function guardPage(userRole: UserRole, locale: string = 'fr'): void {
    if (!allowedRoles.includes(userRole)) {
      redirectToRoleDashboard(userRole, locale);
    }
  };
}

/**
 * Redirect to unauthorized page if user doesn't have required role
 */
export function requireRole(
  userRole: UserRole,
  requiredRoles: UserRole[],
  locale: string = 'fr'
): void {
  if (!requiredRoles.includes(userRole)) {
    redirect(`/${locale}/unauthorized`);
  }
}

/**
 * Get breadcrumb navigation based on current route and user role
 */
export function getRoleBreadcrumbs(
  currentRoute: string,
  userRole: UserRole,
  locale: string = 'fr'
): Array<{ label: string; href: string; }> {
  const breadcrumbs: Array<{ label: string; href: string; }> = [];
  
  // Add home/dashboard as first breadcrumb
  const dashboardUrl = DEFAULT_REDIRECTS[userRole];
  breadcrumbs.push({
    label: 'Dashboard',
    href: `/${locale}${dashboardUrl}`
  });

  // Parse current route to build breadcrumbs
  const routeParts = currentRoute.replace(`/${locale}`, '').split('/').filter(Boolean);
  
  let currentPath = `/${locale}`;
  for (let i = 0; i < routeParts.length; i++) {
    currentPath += `/${routeParts[i]}`;
    
    // Skip if this is the dashboard (already added)
    if (currentPath === `/${locale}${dashboardUrl}`) {
      continue;
    }

    // Add breadcrumb if user can access this route
    if (canAccessRoute(currentPath.replace(`/${locale}`, ''), userRole)) {
      breadcrumbs.push({
        label: formatBreadcrumbLabel(routeParts[i]),
        href: currentPath
      });
    }
  }

  return breadcrumbs;
}

/**
 * Format route segment into readable breadcrumb label
 */
function formatBreadcrumbLabel(segment: string): string {
  const labelMap: Record<string, string> = {
    'client': 'Client',
    'partner': 'Partner',
    'app': 'Admin',
    'dashboard': 'Dashboard',
    'search': 'Search',
    'booking': 'Booking',
    'reservations': 'Reservations',
    'properties': 'Properties',
    'bookings': 'Bookings',
    'earnings': 'Earnings',
    'profile': 'Profile',
    'lofts': 'Lofts',
    'tasks': 'Tasks',
    'transactions': 'Transactions',
    'reports': 'Reports',
    'admin': 'Admin',
    'notifications': 'Notifications'
  };

  return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

/**
 * Check if user should be redirected from current route
 */
export function shouldRedirectFromRoute(
  currentRoute: string,
  userRole: UserRole
): { shouldRedirect: boolean; redirectUrl?: string; } {
  const cleanRoute = currentRoute.replace(/^\/[a-z]{2}/, '');
  
  // If user can access the route, no redirect needed
  if (canAccessRoute(cleanRoute, userRole)) {
    return { shouldRedirect: false };
  }

  // If user cannot access route, redirect to their dashboard
  const dashboardUrl = DEFAULT_REDIRECTS[userRole];
  return {
    shouldRedirect: true,
    redirectUrl: dashboardUrl
  };
}

/**
 * Get role-specific welcome message after login
 */
export function getRoleWelcomeMessage(userRole: UserRole): string {
  const messages: Record<UserRole, string> = {
    guest: 'Welcome to our platform!',
    client: 'Welcome back! Ready to find your perfect loft?',
    partner: 'Welcome back! Manage your properties and bookings.',
    member: 'Welcome back! Check your assigned tasks.',
    executive: 'Welcome back! Review the latest reports and analytics.',
    manager: 'Welcome back! Oversee operations and team performance.',
    admin: 'Welcome back! Full system access available.'
  };

  return messages[userRole] || 'Welcome back!';
}

/**
 * Get role-specific onboarding steps for new users
 */
export function getRoleOnboardingSteps(userRole: UserRole): Array<{
  title: string;
  description: string;
  href: string;
  completed?: boolean;
}> {
  switch (userRole) {
    case 'client':
      return [
        {
          title: 'Complete Your Profile',
          description: 'Add your personal information and preferences',
          href: '/client/profile'
        },
        {
          title: 'Search for Lofts',
          description: 'Explore available lofts in your desired location',
          href: '/client/search'
        },
        {
          title: 'Make Your First Booking',
          description: 'Book your first loft and experience our service',
          href: '/client/search'
        }
      ];

    case 'partner':
      return [
        {
          title: 'Complete Verification',
          description: 'Submit required documents for account verification',
          href: '/partner/profile'
        },
        {
          title: 'Add Your First Property',
          description: 'List your loft with photos and details',
          href: '/partner/properties'
        },
        {
          title: 'Set Availability & Pricing',
          description: 'Configure your calendar and pricing strategy',
          href: '/partner/properties'
        }
      ];

    case 'member':
      return [
        {
          title: 'Review Your Tasks',
          description: 'Check tasks assigned to you',
          href: '/app/tasks'
        },
        {
          title: 'Update Your Profile',
          description: 'Complete your team member profile',
          href: '/profile'
        }
      ];

    default:
      return [];
  }
}