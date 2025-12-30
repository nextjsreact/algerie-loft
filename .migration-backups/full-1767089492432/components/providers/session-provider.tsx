'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SessionManager } from '@/lib/session-manager';

interface SessionContextType {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    full_name?: string;
    role: string;
  } | null;
  loading: boolean;
  error: string | null;
  sessionManager: SessionManager;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
  locale?: string;
}

export function SessionProvider({ children, locale = 'fr' }: SessionProviderProps) {
  const [sessionState, setSessionState] = useState<Omit<SessionContextType, 'sessionManager'>>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null
  });

  const sessionManager = new SessionManager();

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

    // Listen for session changes
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

  const contextValue: SessionContextType = {
    ...sessionState,
    sessionManager
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}