import * as Sentry from '@sentry/nextjs';

export const initSentry = () => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: process.env.NODE_ENV === 'development',
    
    // Performance monitoring with new API
    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    // Error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;
      
      if (error && typeof error === 'object' && 'message' in error) {
        const message = error.message as string;
        
        // Filter out common browser extension errors
        if (message.includes('Non-Error promise rejection captured')) {
          return null;
        }
        
        // Filter out network errors that are not actionable
        if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
          return null;
        }
      }
      
      return event;
    },

    // Set user context
    initialScope: {
      tags: {
        component: 'public-website',
      },
    },
  });
};

// Custom error reporting functions
export const reportError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional_info', context);
    }
    Sentry.captureException(error);
  });
};

export const reportMessage = (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('additional_info', context);
    }
    Sentry.captureMessage(message, level);
  });
};

// Performance monitoring with new API
export const startTransaction = (name: string, op: string) => {
  return Sentry.startSpan({ name, op }, () => {
    // Transaction logic here
  });
};

// User context
export const setUserContext = (user: {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
}) => {
  Sentry.setUser(user);
};

// Custom breadcrumbs
export const addBreadcrumb = (
  message: string,
  category: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};