import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === 'production') {
      // Skip network errors that are likely user-related
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }
      
      // Skip hydration errors (common in Next.js)
      if (event.message?.includes('Hydration')) {
        return null;
      }
      
      // Skip ResizeObserver errors (browser-specific)
      if (event.message?.includes('ResizeObserver')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Integration configuration
  integrations: [
    // Temporarily disabled BrowserTracing due to compatibility issue
    // new Sentry.BrowserTracing({
    //   tracePropagationTargets: [
    //     'localhost',
    //     /^https:\/\/yourapp\.vercel\.app/,
    //     /^https:\/\/yourdomain\.com/,
    //   ],
    // }),
    // Temporarily disabled Replay due to compatibility issue
    // new Sentry.Replay({
    //   maskAllText: true,
    //   maskAllInputs: true,
    //   blockAllMedia: true,
    // }),
  ],
  
  // Additional options
  debug: process.env.NODE_ENV === 'development',
  
  // Capture unhandled promise rejections
  captureUnhandledRejections: true,
  
  // Set user context automatically
  initialScope: {
    tags: {
      component: 'public-website',
    },
  },
});