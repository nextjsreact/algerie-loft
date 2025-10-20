// Authentication utilities for public website
import { cookies } from 'next/headers';

// Types for authentication
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  updated_at: string | null;
}

export interface AuthSession {
  user: User;
  token: string;
}

// Configuration
const INTERNAL_APP_URL = process.env.INTERNAL_APP_URL || 'http://localhost:3000';
const SESSION_COOKIE_NAME = 'loft-algerie-session';

/**
 * Check if user has a valid session by verifying the session cookie
 * This checks if the user is authenticated in the internal application
 */
export async function getSession(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie?.value) {
      return null;
    }

    // Verify session with internal app API
    const response = await fetch(`${INTERNAL_APP_URL}/api/auth/verify-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionCookie.value}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const sessionData = await response.json();
    return sessionData.session || null;
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Get the internal application URL
 */
export function getInternalAppUrl(): string {
  return INTERNAL_APP_URL;
}

/**
 * Get the login URL for the internal application
 */
export function getLoginUrl(locale: string = 'fr', returnUrl?: string): string {
  const baseUrl = `${INTERNAL_APP_URL}/${locale}/login`;
  
  if (returnUrl) {
    const encodedReturnUrl = encodeURIComponent(returnUrl);
    return `${baseUrl}?returnUrl=${encodedReturnUrl}`;
  }
  
  return baseUrl;
}

/**
 * Get the dashboard URL for authenticated users
 */
export function getDashboardUrl(locale: string = 'fr'): string {
  return `${INTERNAL_APP_URL}/${locale}`;
}

/**
 * Create a secure redirect URL to the internal application
 */
export function createSecureRedirectUrl(locale: string = 'fr', path?: string): string {
  const baseUrl = getDashboardUrl(locale);
  
  if (path && path !== '/') {
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  return baseUrl;
}

/**
 * Logout user from both applications
 */
export async function logout(): Promise<void> {
  try {
    // Call internal app logout endpoint
    await fetch(`${INTERNAL_APP_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error during logout:', error);
  }
}