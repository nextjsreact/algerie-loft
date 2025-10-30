/**
 * Server-side Database Initialization
 * 
 * Provides server-side database initialization for API routes and server components.
 * This ensures the database is seeded before any API operations that depend on loft data.
 */

import { createClient } from '@/utils/supabase/server';
import { initializeDatabaseSeeding, SeederResult, DatabaseSeeder } from '@/lib/services/database-seeder';

interface ServerInitOptions {
  forceReseed?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  useServiceRole?: boolean;
}

/**
 * Initialize database seeding on the server side
 * @param options Configuration options for server initialization
 * @returns Promise with seeding results
 */
export async function initializeServerDatabase(options: ServerInitOptions = {}): Promise<SeederResult> {
  const {
    forceReseed = false,
    logLevel = 'info',
    useServiceRole = false
  } = options;

  try {
    // Create Supabase client (optionally with service role for admin operations)
    const supabase = await createClient(useServiceRole);
    
    // Initialize database seeding with server-specific configuration
    const result = await initializeDatabaseSeeding(supabase, {
      environment: DatabaseSeeder.detectEnvironment(),
      forceReseed,
      logLevel
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server initialization error';
    
    return {
      seeded: false,
      count: 0,
      errors: [errorMessage],
      environment: DatabaseSeeder.detectEnvironment()
    };
  }
}

/**
 * Middleware function to ensure database is initialized before API operations
 * @param options Initialization options
 * @returns Function that can be used as middleware
 */
export function withDatabaseInitialization(options: ServerInitOptions = {}) {
  return async function <T>(operation: () => Promise<T>): Promise<T> {
    // Initialize database if needed
    const initResult = await initializeServerDatabase(options);
    
    // Log any initialization issues but don't block the operation
    if (initResult.errors.length > 0) {
      console.warn('[ServerDatabaseInit] Initialization warnings:', initResult.errors);
    }
    
    // Continue with the original operation
    return await operation();
  };
}

/**
 * Check if database initialization is needed (for conditional initialization)
 * @returns Promise<boolean> - true if initialization is needed
 */
export async function isDatabaseInitializationNeeded(): Promise<boolean> {
  try {
    const supabase = await createClient();
    
    // Check if lofts table is empty
    const { count, error } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('[ServerDatabaseInit] Could not check lofts table:', error.message);
      return false; // Assume no initialization needed if we can't check
    }

    return (count || 0) === 0;
  } catch (error) {
    console.warn('[ServerDatabaseInit] Error checking initialization need:', error);
    return false;
  }
}

/**
 * Utility function for API routes to ensure database is ready
 * Usage: await ensureDatabaseReady() at the start of API route handlers
 */
export async function ensureDatabaseReady(options: ServerInitOptions = {}): Promise<void> {
  const initResult = await initializeServerDatabase({
    ...options,
    logLevel: options.logLevel || 'warn' // Less verbose for API routes
  });

  if (initResult.errors.length > 0) {
    console.warn('[API Database Init] Initialization completed with warnings:', initResult.errors);
  }
}

/**
 * Create a database initialization status object for API responses
 * @returns Promise with database status information
 */
export async function getDatabaseStatus(): Promise<{
  initialized: boolean;
  loftCount: number;
  environment: string;
  lastSeeded?: string;
}> {
  try {
    const supabase = await createClient();
    
    // Get loft count
    const { count: loftCount, error: countError } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to get loft count: ${countError.message}`);
    }

    // Try to get last seeding metadata
    let lastSeeded: string | undefined;
    try {
      const { data: metadata } = await supabase
        .from('seeding_metadata')
        .select('seeded_at')
        .eq('table_name', 'lofts')
        .order('seeded_at', { ascending: false })
        .limit(1)
        .single();

      lastSeeded = metadata?.seeded_at;
    } catch {
      // Ignore errors - metadata table might not exist
    }

    return {
      initialized: (loftCount || 0) > 0,
      loftCount: loftCount || 0,
      environment: DatabaseSeeder.detectEnvironment(),
      lastSeeded
    };
  } catch (error) {
    console.error('[ServerDatabaseInit] Error getting database status:', error);
    
    return {
      initialized: false,
      loftCount: 0,
      environment: DatabaseSeeder.detectEnvironment()
    };
  }
}