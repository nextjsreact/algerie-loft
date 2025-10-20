'use client';

import { createClient } from '@/utils/supabase/client';

export class SessionManager {
  private supabase = createClient();

  /**
   * Check if user has an active session
   */
  async hasActiveSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      return !error && !!session;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  }

  /**
   * Get current user session data
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error || !session) {
        return null;
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name,
          role: session.user.user_metadata?.role || 'member'
        },
        token: session.access_token,
        expires_at: session.expires_at
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Seamlessly transition to internal app
   * Checks session and redirects appropriately
   */
  async transitionToInternalApp(locale: string = 'fr'): Promise<void> {
    const hasSession = await this.hasActiveSession();
    
    if (hasSession) {
      // User is authenticated, redirect to dashboard
      window.location.href = `/${locale}/dashboard`;
    } else {
      // User is not authenticated, redirect to login with return URL
      const returnUrl = encodeURIComponent('/app');
      window.location.href = `/${locale}/login?returnUrl=${returnUrl}`;
    }
  }

  /**
   * Logout from both public and internal systems
   */
  async logoutFromBothSystems(): Promise<void> {
    try {
      // Sign out from Supabase
      await this.supabase.auth.signOut();
      
      // Clear any local storage or session storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear any cookies by setting them to expire
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=");
          const name = eqPos > -1 ? c.substr(0, eqPos) : c;
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
      }
      
      // Redirect to public homepage or login
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if there's an error, redirect to clear the session
      window.location.href = '/';
    }
  }

  /**
   * Listen for session changes and handle them appropriately
   */
  onSessionChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  /**
   * Refresh the current session
   */
  async refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return null;
      }
      return data.session;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
  }

  /**
   * Check if session is about to expire and refresh if needed
   */
  async ensureValidSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error || !session) {
        return false;
      }

      // Check if session expires in the next 5 minutes
      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      if (expiresAt < fiveMinutesFromNow) {
        // Session is about to expire, try to refresh
        const refreshedSession = await this.refreshSession();
        return !!refreshedSession;
      }

      return true;
    } catch (error) {
      console.error('Error ensuring valid session:', error);
      return false;
    }
  }
}