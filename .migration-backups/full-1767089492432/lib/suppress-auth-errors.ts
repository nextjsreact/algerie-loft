/**
 * Suppress expected Supabase auth errors for unauthenticated users
 * 
 * When users visit the site without being logged in, Supabase attempts to
 * validate refresh tokens that don't exist, which generates expected errors.
 * This utility suppresses these specific errors from console output.
 */

if (typeof window === 'undefined') {
  // Server-side only
  const originalError = console.error;
  
  console.error = function(...args: any[]) {
    // Check if this is a Supabase refresh token error
    const firstArg = args[0];
    
    // Check for AuthApiError object
    if (firstArg && typeof firstArg === 'object') {
      if (firstArg.code === 'refresh_token_not_found' || 
          firstArg.__isAuthError === true) {
        // Silently ignore - this is expected for unauthenticated users
        return;
      }
    }
    
    // Check for error message string
    if (typeof firstArg === 'string' && firstArg.includes('refresh_token_not_found')) {
      return;
    }
    
    // Pass through all other errors
    originalError.apply(console, args);
  };
}

export {};
