'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createClient } from '@/utils/supabase/client';
import { initializeDatabaseSeeding, SeederResult } from '@/lib/services/database-seeder';

interface DatabaseInitializerContextType {
  isInitialized: boolean;
  isInitializing: boolean;
  seederResult: SeederResult | null;
  error: string | null;
  retryInitialization: () => void;
}

const DatabaseInitializerContext = createContext<DatabaseInitializerContextType | undefined>(undefined);

interface DatabaseInitializerProps {
  children: ReactNode;
  enableSeeding?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Database Initializer Provider
 * 
 * Handles automatic database seeding on application startup.
 * Only runs on the client side and respects environment settings.
 */
export function DatabaseInitializer({ 
  children, 
  enableSeeding = true,
  logLevel = 'info'
}: DatabaseInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [seederResult, setSeederResult] = useState<SeederResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initializeDatabase = async () => {
    if (!enableSeeding || isInitializing || isInitialized) {
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      console.log('[DatabaseInitializer] Starting database initialization...');
      
      const supabase = createClient();
      
      // Initialize database seeding
      const result = await initializeDatabaseSeeding(supabase, {
        logLevel,
        forceReseed: false // Never force reseed on startup
      });

      setSeederResult(result);
      setIsInitialized(true);

      if (result.seeded) {
        console.log(`[DatabaseInitializer] Database seeded successfully with ${result.count} lofts`);
      } else {
        console.log('[DatabaseInitializer] Database initialization completed (no seeding needed)');
      }

      if (result.errors.length > 0) {
        console.warn('[DatabaseInitializer] Seeding completed with warnings:', result.errors);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during database initialization';
      setError(errorMessage);
      console.error('[DatabaseInitializer] Database initialization failed:', errorMessage);
    } finally {
      setIsInitializing(false);
    }
  };

  const retryInitialization = () => {
    setIsInitialized(false);
    setError(null);
    initializeDatabase();
  };

  // Initialize database on mount (client-side only)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Small delay to ensure other providers are ready
    const timer = setTimeout(() => {
      initializeDatabase();
    }, 100);

    return () => clearTimeout(timer);
  }, [enableSeeding]);

  const contextValue: DatabaseInitializerContextType = {
    isInitialized,
    isInitializing,
    seederResult,
    error,
    retryInitialization
  };

  return (
    <DatabaseInitializerContext.Provider value={contextValue}>
      {children}
    </DatabaseInitializerContext.Provider>
  );
}

/**
 * Hook to access database initialization status
 */
export function useDatabaseInitializer() {
  const context = useContext(DatabaseInitializerContext);
  if (context === undefined) {
    throw new Error('useDatabaseInitializer must be used within a DatabaseInitializer');
  }
  return context;
}

/**
 * Hook to check if database is ready for use
 */
export function useDatabaseReady() {
  const { isInitialized, error } = useDatabaseInitializer();
  return isInitialized && !error;
}

/**
 * Component to display database initialization status (for debugging)
 */
export function DatabaseInitializationStatus() {
  const { isInitialized, isInitializing, seederResult, error, retryInitialization } = useDatabaseInitializer();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg text-sm max-w-sm z-50">
      <div className="font-semibold text-gray-800 mb-2">Database Status</div>
      
      {isInitializing && (
        <div className="text-blue-600 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Initializing database...
        </div>
      )}
      
      {isInitialized && !error && (
        <div className="text-green-600">
          ✓ Database ready
          {seederResult?.seeded && (
            <div className="text-xs text-gray-600 mt-1">
              Seeded {seederResult.count} lofts in {seederResult.duration}ms
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div className="text-red-600">
          ✗ Initialization failed
          <div className="text-xs text-gray-600 mt-1">{error}</div>
          <button 
            onClick={retryInitialization}
            className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded mt-2"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}