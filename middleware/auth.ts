import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { UserRole } from '@/lib/types';

export interface AuthMiddlewareConfig {
  publicRoutes: string[];
  roleBasedRoutes: {
    [key: string]: UserRole[];
  };
  defaultRedirects: {
    [key in UserRole]: string;
  };
}

const AUTH_CONFIG: AuthMiddlewareConfig = {
  publicRoutes: [
    '/',
    '/public',
    '/login',
    '/register',
    '/forgot-password',
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/logo.png',
    '/static',
    '/multi-role-test',
    '/booking-demo',
    '/partner-demo',
    '/client/search',
    '/client/lofts',
    '/client/bookings',
    '/client/dashboard',
    '/client/profile',
    '/client/favorites',
    '/partner/dashboard',
    '/partner/properties'
  ],
  roleBasedRoutes: {
    '/app': ['admin', 'manager', 'executive', 'member'],
    '/client': ['client'],
    '/partner': ['partner'],
    '/admin': ['admin'],
    '/dashboard': ['admin', 'manager', 'executive', 'member'],
    '/lofts': ['admin', 'manager', 'executive', 'member'],
    '/transactions': ['admin', 'manager', 'executive'],
    '/reports': ['admin', 'manager', 'executive'],
    '/tasks': ['admin', 'manager', 'member'],
    '/notifications': ['admin', 'manager', 'executive', 'member', 'client', 'partner'],
    '/profile': ['admin', 'manager', 'executive', 'member', 'client', 'partner']
  },
  defaultRedirects: {
    admin: '/app/dashboard',
    manager: '/app/dashboard',
    executive: '/app/dashboard',
    member: '/app/dashboard',
    client: '/client/dashboard',
    partner: '/partner/dashboard',
    guest: '/public'
  }
};

export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split('/')[1]; // Extract locale from path
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
  
  console.log(`[AUTH MIDDLEWARE] Processing: ${pathname} (without locale: ${pathWithoutLocale})`);

  // Skip auth for public routes
  if (isPublicRoute(pathWithoutLocale)) {
    console.log(`[AUTH MIDDLEWARE] Public route, skipping auth: ${pathWithoutLocale}`);
    return NextResponse.next();
  }

  // Create Supabase client for middleware
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  try {
    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log(`[AUTH MIDDLEWARE] No valid session, redirecting to login`);
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // Get user profile to determine role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole: UserRole = profile?.role || user.user_metadata?.role || 'guest';
    console.log(`[AUTH MIDDLEWARE] User role: ${userRole}`);

    // Check if user has access to the requested route
    const hasAccess = checkRouteAccess(pathWithoutLocale, userRole);
    
    if (!hasAccess) {
      console.log(`[AUTH MIDDLEWARE] Access denied for role ${userRole} to ${pathWithoutLocale}`);
      
      // Redirect to appropriate dashboard based on role
      const defaultRoute = AUTH_CONFIG.defaultRedirects[userRole];
      return NextResponse.redirect(new URL(`/${locale}${defaultRoute}`, request.url));
    }

    // Root path is now public, no redirect needed

    console.log(`[AUTH MIDDLEWARE] Access granted for role ${userRole} to ${pathWithoutLocale}`);
    return response;

  } catch (error) {
    console.error('[AUTH MIDDLEWARE] Error:', error);
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
}

function isPublicRoute(pathname: string): boolean {
  return AUTH_CONFIG.publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

function checkRouteAccess(pathname: string, userRole: UserRole): boolean {
  // Find the most specific route match
  const matchingRoutes = Object.keys(AUTH_CONFIG.roleBasedRoutes)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length); // Sort by length descending for most specific match

  if (matchingRoutes.length === 0) {
    // No specific route found, allow access for authenticated users
    return true;
  }

  const mostSpecificRoute = matchingRoutes[0];
  const allowedRoles = AUTH_CONFIG.roleBasedRoutes[mostSpecificRoute];
  
  return allowedRoles.includes(userRole);
}

// Utility function to get redirect URL for a role
export function getRoleRedirectUrl(role: UserRole, locale: string = 'fr'): string {
  const defaultRoute = AUTH_CONFIG.defaultRedirects[role];
  return `/${locale}${defaultRoute}`;
}

// Utility function to check if a user can access a specific route
export function canAccessRoute(pathname: string, userRole: UserRole): boolean {
  if (isPublicRoute(pathname)) {
    return true;
  }
  return checkRouteAccess(pathname, userRole);
}