/**
 * Next.js instrumentation file
 * Handles application-wide initialization
 * 
 * Note: Database seeding is now handled by the DatabaseInitializer client component
 * to avoid issues with cookies being called outside request context.
 */

export async function register() {
  // Only run on server side
  if (typeof window !== 'undefined') {
    return;
  }

  try {
    console.log('[Instrumentation] Application initialization completed');
    
    // Database seeding is now handled by:
    // - DatabaseInitializer component (client-side, automatic)
    // - API routes can use ensureDatabaseReady() if needed
    
  } catch (error) {
    console.error('[Instrumentation] Application initialization failed:', error);
  }
}