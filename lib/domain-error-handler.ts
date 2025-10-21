/**
 * Domain routing error handling utilities
 */

import { NextRequest, NextResponse } from 'next/server';

export interface DomainError {
  code: string;
  message: string;
  timestamp: Date;
  url: string;
  userAgent?: string;
}

/**
 * Error codes for domain routing issues
 */
export const DOMAIN_ERROR_CODES = {
  REDIRECT_LOOP: 'REDIRECT_LOOP',
  INVALID_LOCALE: 'INVALID_LOCALE',
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  DOMAIN_RESOLUTION: 'DOMAIN_RESOLUTION',
  SSL_ERROR: 'SSL_ERROR',
  MIDDLEWARE_ERROR: 'MIDDLEWARE_ERROR'
} as const;

/**
 * Maximum number of redirects to prevent loops
 */
const MAX_REDIRECTS = 3;

/**
 * Track redirect counts to prevent loops
 */
const redirectCounts = new Map<string, number>();

/**
 * Log domain-related errors
 */
export function logDomainError(error: DomainError): void {
  console.error('[Domain Error]', {
    code: error.code,
    message: error.message,
    url: error.url,
    timestamp: error.timestamp.toISOString(),
    userAgent: error.userAgent
  });
  
  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or your own logging service
}

/**
 * Check for redirect loops and prevent them
 */
export function checkRedirectLoop(request: NextRequest, destination: string): boolean {
  const key = `${request.ip}-${request.nextUrl.pathname}`;
  const currentCount = redirectCounts.get(key) || 0;
  
  if (currentCount >= MAX_REDIRECTS) {
    logDomainError({
      code: DOMAIN_ERROR_CODES.REDIRECT_LOOP,
      message: `Redirect loop detected for ${request.nextUrl.pathname} -> ${destination}`,
      timestamp: new Date(),
      url: request.nextUrl.toString(),
      userAgent: request.headers.get('user-agent') || undefined
    });
    
    // Clear the count and return true to indicate a loop
    redirectCounts.delete(key);
    return true;
  }
  
  // Increment the count
  redirectCounts.set(key, currentCount + 1);
  
  // Clean up old entries (simple cleanup after 1 minute)
  setTimeout(() => {
    redirectCounts.delete(key);
  }, 60000);
  
  return false;
}

/**
 * Validate locale and provide fallback
 */
export function validateLocale(locale: string, validLocales: string[] = ['fr', 'en', 'ar']): string {
  if (validLocales.includes(locale)) {
    return locale;
  }
  
  logDomainError({
    code: DOMAIN_ERROR_CODES.INVALID_LOCALE,
    message: `Invalid locale '${locale}', falling back to 'fr'`,
    timestamp: new Date(),
    url: `/${locale}`
  });
  
  return 'fr'; // Default fallback
}

/**
 * Handle domain resolution errors gracefully
 */
export function handleDomainError(request: NextRequest, error: Error): NextResponse {
  logDomainError({
    code: DOMAIN_ERROR_CODES.DOMAIN_RESOLUTION,
    message: error.message,
    timestamp: new Date(),
    url: request.nextUrl.toString(),
    userAgent: request.headers.get('user-agent') || undefined
  });
  
  // Fallback to a safe route
  const fallbackUrl = new URL('/fr/public', request.url);
  return NextResponse.redirect(fallbackUrl);
}

/**
 * Create a safe redirect that checks for loops
 */
export function createSafeRedirect(request: NextRequest, destination: string): NextResponse | null {
  // Check for redirect loop
  if (checkRedirectLoop(request, destination)) {
    // Return a fallback response instead of redirecting
    const fallbackUrl = new URL('/fr/public', request.url);
    return NextResponse.redirect(fallbackUrl);
  }
  
  try {
    const redirectUrl = new URL(destination, request.url);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    logDomainError({
      code: DOMAIN_ERROR_CODES.MIDDLEWARE_ERROR,
      message: `Failed to create redirect to ${destination}: ${error}`,
      timestamp: new Date(),
      url: request.nextUrl.toString(),
      userAgent: request.headers.get('user-agent') || undefined
    });
    
    return null;
  }
}

/**
 * Middleware wrapper with error handling
 */
export function withDomainErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleDomainError(request, error as Error);
    }
  };
}

/**
 * Check if SSL is properly configured (client-side check)
 */
export function checkSSL(): boolean {
  if (typeof window === 'undefined') return true; // Server-side, assume OK
  
  const isHTTPS = window.location.protocol === 'https:';
  const isLocalhost = window.location.hostname === 'localhost';
  
  if (!isHTTPS && !isLocalhost) {
    logDomainError({
      code: DOMAIN_ERROR_CODES.SSL_ERROR,
      message: 'SSL not properly configured - site not served over HTTPS',
      timestamp: new Date(),
      url: window.location.href
    });
    return false;
  }
  
  return true;
}

/**
 * Get error page URL based on error type and locale
 */
export function getErrorPageUrl(errorCode: string, locale: string = 'fr'): string {
  const baseUrl = `/${locale}`;
  
  switch (errorCode) {
    case DOMAIN_ERROR_CODES.ROUTE_NOT_FOUND:
      return `${baseUrl}/public`; // Redirect to home
    case DOMAIN_ERROR_CODES.REDIRECT_LOOP:
      return `${baseUrl}/public`; // Safe fallback
    case DOMAIN_ERROR_CODES.INVALID_LOCALE:
      return '/fr/public'; // Default locale
    default:
      return `${baseUrl}/public`; // Generic fallback
  }
}