import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance monitoring (lower sample rate for server)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Server-specific configuration
  debug: process.env.NODE_ENV === 'development',
  
  // Error filtering for server
  beforeSend(event, hint) {
    // Filter out non-critical server errors
    if (process.env.NODE_ENV === 'production') {
      // Skip expected API errors
      if (event.exception?.values?.[0]?.type === 'ValidationError') {
        return null;
      }
      
      // Skip rate limiting errors
      if (event.message?.includes('Rate limit')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Server-specific integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],
  
  // Set server context
  initialScope: {
    tags: {
      component: 'public-website-server',
    },
  },
});