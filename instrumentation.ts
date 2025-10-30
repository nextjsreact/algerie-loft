/**
 * Next.js instrumentation file
 * Handles application-wide initialization including database seeding
 */

export async function register() {
  // Only run on server side
  if (typeof window !== 'undefined') {
    return;
  }

  try {
    console.log('[Instrumentation] Starting application initialization...');

    // Initialize database seeding on server startup
    const { initializeServerDatabase } = await import('@/lib/initialization/server-database-init');
    
    const result = await initializeServerDatabase({
      forceReseed: false,
      logLevel: 'info'
    });

    if (result.seeded) {
      console.log(`[Instrumentation] Database seeded with ${result.count} lofts in ${result.duration}ms`);
    } else if (result.errors.length > 0) {
      console.warn('[Instrumentation] Database initialization completed with warnings:', result.errors);
    } else {
      console.log('[Instrumentation] Database initialization completed (no seeding needed)');
    }

  } catch (error) {
    console.error('[Instrumentation] Application initialization failed:', error);
    // Don't throw - allow application to continue even if seeding fails
  }
}