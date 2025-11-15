"use client"

import React from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, XCircle, WifiOff, Clock, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export type DashboardErrorType = 
  | 'stats'
  | 'properties'
  | 'bookings'
  | 'unauthorized'
  | 'network'
  | 'timeout'
  | 'generic';

interface DashboardErrorDisplayProps {
  type: DashboardErrorType;
  message?: string;
  onRetry?: () => void;
  showContactSupport?: boolean;
  className?: string;
}

export function DashboardErrorDisplay({
  type,
  message,
  onRetry,
  showContactSupport = false,
  className = ''
}: DashboardErrorDisplayProps) {
  const t = useTranslations('partner.dashboard.error');

  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff className="w-8 h-8 text-orange-500" />;
      case 'timeout':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case 'unauthorized':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-orange-500" />;
    }
  };

  const getErrorColor = () => {
    switch (type) {
      case 'network':
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
      case 'timeout':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'unauthorized':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      default:
        return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20';
    }
  };

  const getTitle = () => {
    return t(`${type}.title`);
  };

  const getMessage = () => {
    return message || t(`${type}.message`);
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Partner Dashboard Error');
    const body = encodeURIComponent(
      `Error Type: ${type}\n` +
      `Message: ${getMessage()}\n` +
      `Time: ${new Date().toISOString()}\n\n` +
      'Please describe what you were doing when this error occurred:'
    );
    window.location.href = `mailto:support@loftalgerie.com?subject=${subject}&body=${body}`;
  };

  return (
    <Card className={`border ${getErrorColor()} ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {getErrorIcon()}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {getTitle()}
            </h3>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {getMessage()}
            </p>
            
            <div className="flex flex-wrap items-center gap-3">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('retry')}
                </Button>
              )}
              
              {showContactSupport && (
                <Button
                  onClick={handleContactSupport}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {t('boundary.contactSupport')}
                </Button>
              )}
            </div>

            {showContactSupport && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                {t('contactSupportMessage')}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Inline error display for smaller sections
export function InlineErrorDisplay({
  type,
  message,
  onRetry,
  className = ''
}: {
  type: DashboardErrorType;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const t = useTranslations('partner.dashboard.error');

  return (
    <div className={`flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
      <div className="flex items-center gap-3">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-400">
            {t(`${type}.title`)}
          </p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
            {message || t(`${type}.message`)}
          </p>
        </div>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="ghost"
          size="sm"
          className="text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

// Full page error display
export function FullPageErrorDisplay({
  type,
  message,
  onRetry,
  showContactSupport = true,
}: {
  type: DashboardErrorType;
  message?: string;
  onRetry?: () => void;
  showContactSupport?: boolean;
}) {
  const t = useTranslations('partner.dashboard.error');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full">
        <DashboardErrorDisplay
          type={type}
          message={message}
          onRetry={onRetry}
          showContactSupport={showContactSupport}
        />
      </div>
    </div>
  );
}

// Error display for specific sections
export function StatsErrorDisplay({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="md:col-span-2 lg:col-span-4">
        <InlineErrorDisplay
          type="stats"
          onRetry={onRetry}
        />
      </div>
    </div>
  );
}

export function PropertiesErrorDisplay({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card>
      <CardContent className="p-6">
        <InlineErrorDisplay
          type="properties"
          onRetry={onRetry}
        />
      </CardContent>
    </Card>
  );
}

export function BookingsErrorDisplay({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card>
      <CardContent className="p-6">
        <InlineErrorDisplay
          type="bookings"
          onRetry={onRetry}
        />
      </CardContent>
    </Card>
  );
}

// Error toast notification
export function ErrorToast({
  type,
  message,
  onDismiss,
  className = ''
}: {
  type: DashboardErrorType;
  message?: string;
  onDismiss: () => void;
  className?: string;
}) {
  const t = useTranslations('partner.dashboard.error');

  return (
    <div className={`fixed top-4 right-4 max-w-sm w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg shadow-lg z-50 ${className}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t(`${type}.title`)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {message || t(`${type}.message`)}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for managing error state
export function useErrorHandler() {
  const [error, setError] = React.useState<{
    type: DashboardErrorType;
    message?: string;
  } | null>(null);

  const handleError = (type: DashboardErrorType, message?: string) => {
    setError({ type, message });
  };

  const clearError = () => {
    setError(null);
  };

  const getErrorType = (error: any): DashboardErrorType => {
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return 'network';
    }
    if (error?.message?.includes('timeout')) {
      return 'timeout';
    }
    if (error?.status === 401 || error?.status === 403) {
      return 'unauthorized';
    }
    return 'generic';
  };

  return {
    error,
    handleError,
    clearError,
    getErrorType,
  };
}
