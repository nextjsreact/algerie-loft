/**
 * CSRF (Cross-Site Request Forgery) protection utilities
 * Provides token generation, validation, and middleware for form protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { logger } from '@/lib/logger';

export interface CsrfConfig {
  tokenLength?: number;
  cookieName?: string;
  headerName?: string;
  formFieldName?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number; // in seconds
}

const DEFAULT_CONFIG: Required<CsrfConfig> = {
  tokenLength: 32,
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  formFieldName: '_csrf',
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 3600 // 1 hour
};

/**
 * Generate a secure CSRF token
 */
export function generateCsrfToken(length: number = DEFAULT_CONFIG.tokenLength): string {
  return randomBytes(length).toString('hex');
}

/**
 * Create a hash of the token for secure storage
 */
export function hashCsrfToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Verify CSRF token
 */
export function verifyCsrfToken(token: string, hashedToken: string): boolean {
  if (!token || !hashedToken) {
    return false;
  }
  
  const computedHash = hashCsrfToken(token);
  return computedHash === hashedToken;
}

/**
 * Extract CSRF token from request
 */
export function extractCsrfToken(
  request: NextRequest,
  config: CsrfConfig = {}
): string | null {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Try to get token from header first
  const headerToken = request.headers.get(finalConfig.headerName);
  if (headerToken) {
    return headerToken;
  }
  
  // Try to get token from form data
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded') || 
      contentType.includes('multipart/form-data')) {
    // Note: This would need to be called after parsing form data
    // Implementation depends on how form data is handled in the specific route
    return null;
  }
  
  return null;
}

/**
 * Get CSRF token from cookie
 */
export function getCsrfTokenFromCookie(
  request: NextRequest,
  config: CsrfConfig = {}
): string | null {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const cookie = request.cookies.get(finalConfig.cookieName);
  return cookie?.value || null;
}

/**
 * Set CSRF token cookie
 */
export function setCsrfTokenCookie(
  response: NextResponse,
  token: string,
  config: CsrfConfig = {}
): void {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  response.cookies.set(finalConfig.cookieName, hashCsrfToken(token), {
    httpOnly: true,
    secure: finalConfig.secure,
    sameSite: finalConfig.sameSite,
    maxAge: finalConfig.maxAge,
    path: '/'
  });
}

/**
 * CSRF protection middleware
 */
export function createCsrfMiddleware(config: CsrfConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  return async (request: NextRequest): Promise<NextResponse | null> => {
    try {
      // Skip CSRF protection for safe methods
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return null; // Continue to next middleware
      }
      
      // Get token from request
      const requestToken = extractCsrfToken(request, config);
      
      // Get hashed token from cookie
      const cookieToken = getCsrfTokenFromCookie(request, config);
      
      if (!requestToken || !cookieToken) {
        logger.warn('CSRF token missing', {
          method: request.method,
          url: request.url,
          hasRequestToken: !!requestToken,
          hasCookieToken: !!cookieToken
        });
        
        return NextResponse.json(
          { error: 'CSRF token missing' },
          { status: 403 }
        );
      }
      
      // Verify token
      if (!verifyCsrfToken(requestToken, cookieToken)) {
        logger.warn('CSRF token verification failed', {
          method: request.method,
          url: request.url,
          clientIp: request.headers.get('x-forwarded-for') || 'unknown'
        });
        
        return NextResponse.json(
          { error: 'CSRF token invalid' },
          { status: 403 }
        );
      }
      
      return null; // Token is valid, continue
    } catch (error) {
      logger.error('CSRF middleware error', error);
      return NextResponse.json(
        { error: 'CSRF protection error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Generate and set CSRF token for a response
 */
export function generateAndSetCsrfToken(
  response: NextResponse,
  config: CsrfConfig = {}
): string {
  const token = generateCsrfToken(config.tokenLength);
  setCsrfTokenCookie(response, token, config);
  return token;
}

/**
 * Middleware to automatically generate CSRF tokens for GET requests
 */
export function csrfTokenGeneratorMiddleware(config: CsrfConfig = {}) {
  return (request: NextRequest): NextResponse | null => {
    if (request.method === 'GET') {
      const response = NextResponse.next();
      
      // Check if token already exists
      const existingToken = getCsrfTokenFromCookie(request, config);
      
      if (!existingToken) {
        // Generate new token
        generateAndSetCsrfToken(response, config);
      }
      
      return response;
    }
    
    return null; // Not a GET request, continue
  };
}

/**
 * Validate CSRF token from form data
 */
export async function validateCsrfFromFormData(
  formData: FormData,
  cookieToken: string,
  config: CsrfConfig = {}
): Promise<boolean> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const formToken = formData.get(finalConfig.formFieldName) as string;
  
  if (!formToken || !cookieToken) {
    return false;
  }
  
  return verifyCsrfToken(formToken, cookieToken);
}

/**
 * Add CSRF token to form HTML
 */
export function addCsrfTokenToForm(
  formHtml: string,
  token: string,
  config: CsrfConfig = {}
): string {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const tokenInput = `<input type="hidden" name="${finalConfig.formFieldName}" value="${token}" />`;
  
  // Insert token input after opening form tag
  return formHtml.replace(/<form([^>]*)>/i, `<form$1>${tokenInput}`);
}

/**
 * Create CSRF token for client-side use
 */
export function createClientCsrfToken(request: NextRequest): {
  token: string;
  response: NextResponse;
} {
  const token = generateCsrfToken();
  const response = NextResponse.json({ csrfToken: token });
  
  setCsrfTokenCookie(response, token);
  
  return { token, response };
}

/**
 * Refresh CSRF token
 */
export function refreshCsrfToken(
  request: NextRequest,
  config: CsrfConfig = {}
): NextResponse {
  const token = generateCsrfToken(config.tokenLength);
  const response = NextResponse.json({ 
    success: true, 
    csrfToken: token 
  });
  
  setCsrfTokenCookie(response, token, config);
  
  return response;
}