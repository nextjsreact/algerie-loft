import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['fr', 'ar', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always',
  localeDetection: false,
});

export async function middleware(request: NextRequest) {
  // Apply internationalization
  const response = intlMiddleware(request);
  
  // Add basic security headers
  if (response instanceof NextResponse) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
  }
  
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