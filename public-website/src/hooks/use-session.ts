'use client';

import { useState, useEffect, useCallback } from 'react';
import { sessionManager, SessionState } from '@/lib/session-manager';
import { AuthSession } from '@/types';

export interface UseSessionReturn {
  isAuthenticated: boolean;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
  transitionToApp: (locale: string, path?: string) => Promise<void>;
}

/**
 * Hook for managing session state in the public website
 */
export function useSession(): UseSessionReturn {
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session state
  useEffect(() => {
    // Get initial state from storage
    const initialState = sessionManager.getSessionState();
    if (initialState) {
      setSessionState(initialState);
      setIsLoading(false);
    }

    // Subscribe to session changes
    const unsubscribe = sessionManager.subscribe((state) => {
      setSessionState(state);
      setIsLoading(false);
      setError(null);
    });

    // Perform initial session check
    sessionManager.checkSessionStatus().catch((err) => {
      setError('Failed to check session status');
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await sessionManager.checkSessionStatus();
    } catch (err) {
      setError('Failed to check session status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    
    try {
      await sessionManager.logout();
    } catch (err) {
      setError('Failed to logout');
      throw err;
    }
  }, []);

  const transitionToApp = useCallback(async (locale: string, path?: string) => {
    setError(null);
    
    try {
      await sessionManager.transitionToInternalApp(locale, path);
    } catch (err) {
      setError('Failed to transition to application');
      throw err;
    }
  }, []);

  return {
    isAuthenticated: sessionState?.isAuthenticated ?? false,
    session: sessionState?.session ?? null,
    isLoading,
    error,
    checkSession,
    logout,
    transitionToApp,
  };
}