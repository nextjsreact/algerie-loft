'use client';

import React, { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorTrackingProps {
  userId?: string;
  userEmail?: string;
  environment?: string;
  debug?: boolean;
}

export function ErrorTracking({ 
  userId, 
  userEmail, 
  environment = 'production',
  debug = false 
}: ErrorTrackingProps) {
  useEffect(() => {
    // Set user context
    if (userId || userEmail) {
      Sentry.setUser({
        id: userId,
        email: userEmail,
      });
    }

    // Set environment context
    Sentry.setTag('environment', environment);
    
    // Set additional context
    Sentry.setContext('app', {
      name: 'Loft Algérie Public Website',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    });

    if (debug) {
      console.log('Sentry Error Tracking initialized');
    }
  }, [userId, userEmail, environment, debug]);

  return null;
}

// Hook for manual error tracking
export function useErrorTracking() {
  const trackError = (error: Error, context?: Record<string, any>) => {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }
      Sentry.captureException(error);
    });
  };

  const trackMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
    Sentry.captureMessage(message, level);
  };

  const trackFormError = (formName: string, error: Error, formData?: Record<string, any>) => {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'form_error');
      scope.setContext('form', {
        name: formName,
        data: formData,
      });
      Sentry.captureException(error);
    });
  };

  const trackAPIError = (endpoint: string, error: Error, requestData?: any) => {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'api_error');
      scope.setContext('api', {
        endpoint,
        requestData,
      });
      Sentry.captureException(error);
    });
  };

  const trackPerformanceIssue = (metric: string, value: number, threshold: number) => {
    if (value > threshold) {
      Sentry.withScope((scope) => {
        scope.setTag('issue_type', 'performance');
        scope.setContext('performance', {
          metric,
          value,
          threshold,
        });
        Sentry.captureMessage(`Performance issue: ${metric} (${value}ms) exceeded threshold (${threshold}ms)`, 'warning');
      });
    }
  };

  const addBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') => {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    });
  };

  return {
    trackError,
    trackMessage,
    trackFormError,
    trackAPIError,
    trackPerformanceIssue,
    addBreadcrumb,
  };
}

// Error boundary component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SentryErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.withScope((scope) => {
      scope.setContext('errorInfo', errorInfo);
      scope.setTag('error_boundary', true);
      Sentry.captureException(error);
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Une erreur s'est produite
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Nous avons été notifiés de ce problème et travaillons à le résoudre.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Recharger la page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance monitoring component
export function PerformanceTracker({ debug = false }: { debug?: boolean }) {
  const { trackPerformanceIssue } = useErrorTracking();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track slow page loads
    const trackPageLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        
        // Track if page load is slow (> 3 seconds)
        trackPerformanceIssue('page_load', loadTime, 3000);
        trackPerformanceIssue('dom_content_loaded', domContentLoaded, 2000);
        
        if (debug) {
          console.log('Page Load Performance:', {
            loadTime,
            domContentLoaded,
          });
        }
      }
    };

    // Track when page is fully loaded
    if (document.readyState === 'complete') {
      trackPageLoad();
    } else {
      window.addEventListener('load', trackPageLoad);
      return () => window.removeEventListener('load', trackPageLoad);
    }
  }, [trackPerformanceIssue, debug]);

  return null;
}