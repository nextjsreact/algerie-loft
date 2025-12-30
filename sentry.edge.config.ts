import * as Sentry from '@/lib/mocks/sentry';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Minimal configuration for edge runtime
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Edge-specific configuration
  debug: false, // Keep debug off for edge runtime
  
  // Minimal error filtering for edge
  beforeSend(event, hint) {
    // Only capture critical errors in edge runtime
    if (event.level !== 'error' && event.level !== 'fatal') {
      return null;
    }
    
    return event;
  },
  
  // Set edge context
  initialScope: {
    tags: {
      component: 'public-website-edge',
    },
  },
});