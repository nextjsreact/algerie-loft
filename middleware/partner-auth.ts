import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { PartnerAuthService } from '@/lib/services/partner-auth-service';
import type { PartnerStatus } from '@/lib/types/partner-auth';
import type { UserRole } from '@/lib/types';

export interface PartnerAuthMiddlewareConfig {
  partnerRoutes: string[];
  statusRequirements: {
    [key: string]: PartnerStatus[];
  };
  redirectUrls: {
    [key in PartnerStatus]: string;
  };
}

const PARTNER_AUTH_CONFIG: PartnerAuthMiddlewareConfig = {
  partnerRoutes: [
    '/partner/dashboard',
    '/partner/properties',
    '/partner/reservations',
    '/partner/revenue',
    '/partner/profile',
    '/partner/settings',
    '/partner/application-pending'
  ],
  statusRequirements: {
    '/partner/dashboard': ['active', 'verified'],
    '/partner/properties': ['active', 'verified'],
    '/partner/reservations': ['active', 'verified'],
    '/partner/revenue': ['active', 'verified'],
    '/partner/profile': ['active', 'verified', 'pending', 'rejected'],
    '/partner/settings': ['active', 'verified', 'pending'],
    '/partner/application-pending': ['pending']
  },
  redirectUrls: {
    pending: '/partner/application-pending',
    rejected: '/partner/rejected',
    suspended: '/partner/suspended',
    verified: '/partner/dashboard',
    active: '/partner/dashboard'
  }
};

export async function partnerAuthMiddleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split('/')[1];
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
  
  console.log(`[PARTNER AUTH MIDDLEWARE] Processing: ${pathname} (without locale: ${pathWithoutLocale})`);

  // Check if this is a partner route
  if (!isPartnerRoute(pathWithoutLocale)) {
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
      console.log(`[PARTNER AUTH MIDDLEWARE] No valid session, redirecting to partner login`);
      return NextResponse.redirect(new URL(`/${locale}/partner/login`, request.url));
    }

    // Get partner profile directly from partner_profiles table
    const { data: partnerProfile, error: partnerError } = await supabase
      .from('partner_profiles')
      .select('id, verification_status')
      .eq('user_id', user.id)
      .single();

    console.log(`[PARTNER AUTH MIDDLEWARE] Partner profile query result:`, { 
      hasProfile: !!partnerProfile, 
      error: partnerError?.message,
      status: partnerProfile?.verification_status 
    });

    // Quick check: if no partner profile, redirect immediately
    if (!partnerProfile) {
      console.log(`[PARTNER AUTH MIDDLEWARE] No partner profile, redirecting to registration`);
      return NextResponse.redirect(new URL(`/${locale}/partner/register`, request.url));
    }

    const partnerStatus = partnerProfile.verification_status;
    console.log(`[PARTNER AUTH MIDDLEWARE] Partner status: ${partnerStatus}`);

    // Quick check: if pending, redirect to application-pending (unless already there)
    if (partnerStatus === 'pending' && pathWithoutLocale !== '/partner/application-pending') {
      console.log(`[PARTNER AUTH MIDDLEWARE] Pending status, redirecting to application-pending`);
      return NextResponse.redirect(new URL(`/${locale}/partner/application-pending`, request.url));
    }

    // Quick check: if rejected, redirect to rejected page (unless already there)
    if (partnerStatus === 'rejected' && pathWithoutLocale !== '/partner/rejected') {
      console.log(`[PARTNER AUTH MIDDLEWARE] Rejected status, redirecting to rejected page`);
      return NextResponse.redirect(new URL(`/${locale}/partner/rejected`, request.url));
    }
    
    // Quick check: if suspended, redirect to suspended page (unless already there)
    if (partnerStatus === 'suspended' && pathWithoutLocale !== '/partner/suspended') {
      console.log(`[PARTNER AUTH MIDDLEWARE] Suspended status, redirecting to suspended page`);
      return NextResponse.redirect(new URL(`/${locale}/partner/suspended`, request.url));
    }

    // Allow access based on status and route
    const allowedStatuses = ['verified', 'active', 'pending', 'rejected', 'suspended'];
    if (!allowedStatuses.includes(partnerStatus)) {
      console.log(`[PARTNER AUTH MIDDLEWARE] Invalid partner status: ${partnerStatus}, redirecting to registration`);
      return NextResponse.redirect(new URL(`/${locale}/partner/register`, request.url));
    }
    
    // Set headers and allow access
    response.headers.set('x-partner-id', partnerProfile.id);
    response.headers.set('x-partner-status', partnerStatus);
    console.log(`[PARTNER AUTH MIDDLEWARE] Access granted for status: ${partnerStatus} on route: ${pathWithoutLocale}`);
    response.headers.set('x-user-id', user.id);

    return response;

  } catch (error) {
    console.error('[PARTNER AUTH MIDDLEWARE] Error:', error);
    return NextResponse.redirect(new URL(`/${locale}/partner/login`, request.url));
  }
}

function isPartnerRoute(pathname: string): boolean {
  return PARTNER_AUTH_CONFIG.partnerRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1));
    }
    return pathname === route || pathname.startsWith(route + '/');
  });
}

function getRequiredStatusesForRoute(pathname: string): PartnerStatus[] {
  // Find the most specific route match
  const matchingRoutes = Object.keys(PARTNER_AUTH_CONFIG.statusRequirements)
    .filter(route => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length);

  if (matchingRoutes.length === 0) {
    // Default to requiring active status
    return ['active'];
  }

  const mostSpecificRoute = matchingRoutes[0];
  return PARTNER_AUTH_CONFIG.statusRequirements[mostSpecificRoute];
}

// Utility functions for partner authentication
export function getPartnerRedirectUrl(status: PartnerStatus, locale: string = 'fr'): string {
  const redirectPath = PARTNER_AUTH_CONFIG.redirectUrls[status];
  return `/${locale}${redirectPath}`;
}

export function canPartnerAccessRoute(pathname: string, status: PartnerStatus): boolean {
  if (!isPartnerRoute(pathname)) {
    return false;
  }
  
  const requiredStatuses = getRequiredStatusesForRoute(pathname);
  return requiredStatuses.length === 0 || requiredStatuses.includes(status);
}

// Middleware helper to extract partner info from request headers
export function getPartnerInfoFromHeaders(request: NextRequest) {
  return {
    partnerId: request.headers.get('x-partner-id'),
    partnerStatus: request.headers.get('x-partner-status') as PartnerStatus,
    userId: request.headers.get('x-user-id')
  };
}