"use client"

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { PartnerErrorCodes, PartnerError } from '@/types/partner';
import { PartnerErrorHandler } from '@/lib/services/partner-error-handler';
import { useTranslations } from 'next-intl';

interface PartnerErrorBoundaryState {
  hasError: boolean;
  error?: Error | PartnerError;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface PartnerErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  partnerId?: string;
}

export class PartnerErrorBoundary extends React.Component<
  PartnerErrorBoundaryProps,
  PartnerErrorBoundaryState
> {
  constructor(props: PartnerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PartnerErrorBoundaryState {
    const errorId = PartnerErrorHandler.generateRequestId();
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const context = {
      operation: 'partner_component_render',
      partner_id: this.props.partnerId,
      request_id: this.state.errorId
    };

    // Log the error
    console.error('[PARTNER ERROR BOUNDARY]', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({ errorInfo });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // Example: Sentry.captureException(error, { 
      //   tags: { component: 'partner' },
      //   extra: { errorInfo, context }
      // });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/partner/dashboard';
  };

  handleContactSupport = () => {
    const subject = encodeURIComponent('Partner Dashboard Error Report');
    const body = encodeURIComponent(
      `Error ID: ${this.state.errorId}\n` +
      `Error: ${this.state.error?.message}\n` +
      `Time: ${new Date().toISOString()}\n\n` +
      'Please describe what you were doing when this error occurred:'
    );
    window.location.href = `mailto:support@loftalgerie.com?subject=${subject}&body=${body}`;
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          onContactSupport={this.handleContactSupport}
        />
      );
    }

    return this.props.children;
  }
}

// Functional component for error display with translations
function ErrorBoundaryFallback({
  error,
  errorId,
  onRetry,
  onGoHome,
  onContactSupport,
}: {
  error?: Error | PartnerError;
  errorId?: string;
  onRetry: () => void;
  onGoHome: () => void;
  onContactSupport: () => void;
}) {
  const t = useTranslations('partner.dashboard.error');
  const isPartnerError = error && 'code' in error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {t('boundary.title')}
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {isPartnerError 
              ? t('boundary.partnerError')
              : t('boundary.genericError')
            }
          </p>

          {errorId && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>{t('boundary.errorId')}:</strong> {errorId}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('boundary.errorIdHelp')}
              </p>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
                {t('boundary.devDetails')}:
              </h3>
              <p className="text-xs text-red-700 dark:text-red-300 font-mono break-all">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                    {t('boundary.stackTrace')}
                  </summary>
                  <pre className="text-xs text-red-600 dark:text-red-400 mt-1 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('boundary.tryAgain')}
            </button>

            <button
              onClick={onGoHome}
              className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <Home className="w-4 h-4 mr-2" />
              {t('boundary.goToDashboard')}
            </button>

            <button
              onClick={onContactSupport}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Mail className="w-4 h-4 mr-2" />
              {t('boundary.contactSupport')}
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
            {t('boundary.persistHelp')}
          </p>
        </div>
      </div>
    </div>
  );
}

// HOC to wrap components with partner error boundary
export function withPartnerErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
  partnerId?: string
) {
  return function WrappedComponent(props: P) {
    return (
      <PartnerErrorBoundary fallback={fallback} partnerId={partnerId}>
        <Component {...props} />
      </PartnerErrorBoundary>
    );
  };
}

// Specific error boundary for partner dashboard pages
export function PartnerDashboardErrorBoundary({ 
  children, 
  partnerId 
}: { 
  children: React.ReactNode;
  partnerId?: string;
}) {
  return (
    <PartnerErrorBoundary 
      partnerId={partnerId}
      onError={(error, errorInfo) => {
        // Custom logging for dashboard errors
        console.error('[PARTNER DASHBOARD ERROR]', {
          partnerId,
          error: error.message,
          componentStack: errorInfo.componentStack
        });
      }}
    >
      {children}
    </PartnerErrorBoundary>
  );
}

// Error boundary for partner forms
export function PartnerFormErrorBoundary({ 
  children, 
  onError 
}: { 
  children: React.ReactNode;
  onError?: (error: Error) => void;
}) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('[PARTNER FORM ERROR]', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
    
    if (onError) {
      onError(error);
    }
  };

  return (
    <PartnerErrorBoundary 
      onError={handleError}
      fallback={
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Form Error
              </h3>
              <p className="text-sm text-red-600 mt-1">
                There was an error loading this form. Please refresh the page and try again.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </PartnerErrorBoundary>
  );
}