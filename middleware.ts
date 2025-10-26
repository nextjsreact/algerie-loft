import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { performanceMiddleware, addResourceHints, addPerformanceMonitoring, addCSP } from './middleware/performance';
import { authMiddleware } from './middleware/auth';

const intlMiddleware = createIntlMiddleware({
  locales: ['fr', 'ar', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always',
  localeDetection: true,
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

  // Apply authentication middleware
  const authResponse = await authMiddleware(request);
  
  // If auth middleware returns a redirect, return it immediately
  if (authResponse instanceof Response && authResponse.status >= 300 && authResponse.status < 400) {
    return authResponse;
  }
  
  // Use the response from auth middleware if it's not a redirect
  response = authResponse;
  
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
    '/transactions/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/register/:path*',
    '/client/:path*',
    '/partner/:path*',
  ],
};