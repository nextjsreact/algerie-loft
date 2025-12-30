'use client';

import { useEffect, useState, useCallback } from 'react';
import { SessionManager } from '@/lib/session-manager';
import { useRouter } from 'next/navigation';

interface SessionState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    full_name?: string;
    role: string;
  } | null;
  loading: boolean;
  error: string | null;
}

export function useSessionManager(locale: string = 'fr') {
  const [sessionState, setSessionState] = useState<SessionState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  const router = useRouter();
  const sessionManager = new SessionManager();

  // Initialize session state
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const session = await sessionManager.getCurrentSession();
        
        setSessionState({
          isAuthenticated: !!session,
          user: session?.user || null,
          loading: false,
          error: null
        });
      } catch (error) {
        setSessionState({
          isAuthenticated: false,
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Session initialization failed'
        });
      }
    };

    initializeSession();
  }, []);

  // Listen for session changes
  useEffect(() => {
    const { data: { subscription } } = sessionManager.onSessionChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setSessionState({
            isAuthenticated: true,
            user: {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name,
              role: session.user.user_metadata?.role || 'member'
            },
            loading: false,
            error: null
          });
        } else if (event === 'SIGNED_OUT') {
          setSessionState({
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setSessionState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: {
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name,
              role: session.user.user_metadata?.role || 'member'
            },
            error: null
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Transition to internal app
  const transitionToApp = useCallback(async () => {
    try {
      await sessionManager.transitionToInternalApp(locale);
    } catch (error) {
      setSessionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to transition to app'
      }));
    }
  }, [locale]);

  // Logout from both systems
  const logoutFromBoth = useCallback(async () => {
    try {
      await sessionManager.logoutFromBothSystems();
    } catch (error) {
      setSessionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Logout failed'
      }));
    }
  }, []);

  // Ensure session is valid
  const ensureValidSession = useCallback(async (): Promise<boolean> => {
    try {
      const isValid = await sessionManager.ensureValidSession();
      if (!isValid) {
        setSessionState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          error: 'Session expired'
        }));
      }
      return isValid;
    } catch (error) {
      setSessionState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Session validation failed'
      }));
      return false;
    }
  }, []);

  // Navigate to login
  const navigateToLogin = useCallback((returnUrl?: string) => {
    const url = returnUrl 
      ? `/${locale}/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : `/${locale}/login`;
    router.push(url);
  }, [locale, router]);

  return {
    ...sessionState,
    transitionToApp,
    logoutFromBoth,
    ensureValidSession,
    navigateToLogin,
    refresh: () => router.refresh()
  };
}