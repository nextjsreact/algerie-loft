// Session management utilities for seamless transition between apps
'use client';

import { AuthSession } from '@/types';

const SESSION_STORAGE_KEY = 'loft-algerie-session-state';
const SESSION_CHECK_INTERVAL = 30000; // 30 seconds

export interface SessionState {
  isAuthenticated: boolean;
  lastChecked: number;
  session?: AuthSession;
}

/**
 * Session Manager class for handling cross-app session state
 */
export class SessionManager {
  private static instance: SessionManager;
  private checkInterval?: NodeJS.Timeout;
  private listeners: Array<(state: SessionState) => void> = [];

  private constructor() {
    // Initialize session checking if in browser
    if (typeof window !== 'undefined') {
      this.startSessionChecking();
    }
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Start periodic session checking
   */
  private startSessionChecking() {
    this.checkInterval = setInterval(() => {
      this.checkSessionStatus();
    }, SESSION_CHECK_INTERVAL);

    // Also check immediately
    this.checkSessionStatus();
  }

  /**
   * Stop session checking
   */
  stopSessionChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * Check current session status with internal app
   */
  async checkSessionStatus(): Promise<SessionState> {
    try {
      const internalAppUrl = process.env.NEXT_PUBLIC_INTERNAL_APP_URL || 'http://localhost:3000';
      
      const response = await fetch(`${internalAppUrl}/api/auth/verify-session`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const state: SessionState = {
        isAuthenticated: response.ok,
        lastChecked: Date.now(),
      };

      if (response.ok) {
        const data = await response.json();
        state.session = data.session;
      }

      this.updateSessionState(state);
      return state;
    } catch (error) {
      console.error('Session check failed:', error);
      const state: SessionState = {
        isAuthenticated: false,
        lastChecked: Date.now(),
      };
      this.updateSessionState(state);
      return state;
    }
  }

  /**
   * Update session state and notify listeners
   */
  private updateSessionState(state: SessionState) {
    // Store in session storage for persistence across tabs
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    }

    // Notify all listeners
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Get current session state from storage
   */
  getSessionState(): SessionState | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored) as SessionState;
        // Check if the stored state is not too old (5 minutes)
        if (Date.now() - state.lastChecked < 300000) {
          return state;
        }
      }
    } catch (error) {
      console.error('Error reading session state:', error);
    }

    return null;
  }

  /**
   * Subscribe to session state changes
   */
  subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Perform logout across both applications
   */
  async logout(): Promise<void> {
    try {
      const internalAppUrl = process.env.NEXT_PUBLIC_INTERNAL_APP_URL || 'http://localhost:3000';
      
      // Call internal app logout
      await fetch(`${internalAppUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      // Clear local session state
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }

      // Update state to logged out
      this.updateSessionState({
        isAuthenticated: false,
        lastChecked: Date.now(),
      });
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Create a secure redirect URL with return path
   */
  createRedirectUrl(locale: string, returnPath?: string): string {
    const internalAppUrl = process.env.NEXT_PUBLIC_INTERNAL_APP_URL || 'http://localhost:3000';
    const baseUrl = `${internalAppUrl}/${locale}`;
    
    if (returnPath && returnPath !== '/') {
      const encodedPath = encodeURIComponent(returnPath);
      return `${baseUrl}?returnUrl=${encodedPath}`;
    }
    
    return baseUrl;
  }

  /**
   * Handle seamless transition to internal app
   */
  async transitionToInternalApp(locale: string, path?: string): Promise<void> {
    const state = await this.checkSessionStatus();
    
    if (state.isAuthenticated) {
      // User is authenticated, redirect to dashboard
      const redirectUrl = this.createRedirectUrl(locale, path);
      window.location.href = redirectUrl;
    } else {
      // User is not authenticated, redirect to login
      const internalAppUrl = process.env.NEXT_PUBLIC_INTERNAL_APP_URL || 'http://localhost:3000';
      const loginUrl = `${internalAppUrl}/${locale}/login`;
      const returnUrl = encodeURIComponent(window.location.href);
      window.location.href = `${loginUrl}?returnUrl=${returnUrl}`;
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopSessionChecking();
    this.listeners = [];
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();