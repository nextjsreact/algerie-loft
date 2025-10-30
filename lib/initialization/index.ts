/**
 * Database Initialization Module
 * 
 * Centralized exports for all database initialization functionality.
 * Provides both client-side and server-side initialization capabilities.
 */

// Server-side initialization
export {
  initializeServerDatabase,
  withDatabaseInitialization,
  isDatabaseInitializationNeeded,
  ensureDatabaseReady,
  getDatabaseStatus
} from './server-database-init';

// Client-side initialization (re-export from providers)
export {
  DatabaseInitializer,
  useDatabaseInitializer,
  useDatabaseReady,
  DatabaseInitializationStatus
} from '../../../components/providers/database-initializer';

// Core seeder functionality
export {
  DatabaseSeeder,
  initializeDatabaseSeeding,
  manualSeed,
  type SeederConfig,
  type SeederResult,
  type SeederMetadata
} from '../services/database-seeder';

// Test data
export {
  TEST_LOFTS,
  getTestLoftById,
  getAllTestLofts,
  getTestLoftsForSeeding,
  filterTestLofts,
  getTestLoftIds,
  isTestLoftId,
  type TestLoft
} from '../data/test-lofts';

/**
 * Utility function to get initialization status for debugging
 */
export async function getInitializationInfo() {
  if (typeof window !== 'undefined') {
    // Client-side: return basic info
    return {
      environment: 'client',
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV
    };
  } else {
    // Server-side: return detailed status
    const { getDatabaseStatus } = await import('./server-database-init');
    const dbStatus = await getDatabaseStatus();
    
    return {
      environment: 'server',
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      database: dbStatus
    };
  }
}