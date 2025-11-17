import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { performanceMiddleware, addResourceHints, addPerformanceMonitoring, addCSP } from './middleware/performance';
import { partnerAuthMiddleware } from './middleware/partner-auth';
// Temporarily disable other auth middleware during build
// import { authMiddleware } from './middleware/auth';
// import { superuserMiddleware } from './middleware/superuser';

const intlMiddleware = createIntlMiddleware({
  locales: ['fr', 'ar', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always',
  localeDetection: false, // Désactiver la détection automatique pour éviter les mélanges
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  console.log(`[MIDDLEWARE] Processing: ${pathname}`);
  
  // Apply internationalization first
  let response = intlMiddleware(request);
  
  // If intlMiddleware returns a redirect, return it immediately
  if (response instanceof Response && response.status >= 300 && response.status < 400) {
    return response;
  }

  // Apply partner authentication middleware for partner routes
  const partnerAuthResponse = await partnerAuthMiddleware(request);
  if (partnerAuthResponse.status >= 300 && partnerAuthResponse.status < 400) {
    return partnerAuthResponse;
  }
  
  // Temporarily disable other auth middleware during build
  // const authResponse = await authMiddleware(request);
  // const superuserResponse = await superuserMiddleware(request);
  
  // Apply performance optimizations
  response = performanceMiddleware(request);
  
  // Add resource hints
  response = addResourceHints(response, pathname);
  
  // Add performance monitoring
  response = addPerformanceMonitoring(response);
  
  // Add Content Security Policy
  response = addCSP(response);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets
     * Use multiple patterns to avoid capturing groups
     */
    '/',
    '/(fr|en|ar)/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/auth/:path*',
    '/public/:path*',
    '/lofts/:path*',
    '/owners/:path*',
    '/transactions/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/register/:path*',
    '/client/:path*',
    '/partner/:path*',
  ],
};