"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserRole } from '@/lib/types';
import { ArrowLeft, Home, Shield, AlertTriangle } from 'lucide-react';

export interface UnauthorizedAccessProps {
  /** The user's current role */
  userRole: UserRole;
  /** The resource they attempted to access */
  attemptedResource?: string;
  /** The action they attempted to perform */
  attemptedAction?: string;
  /** Custom title for the error message */
  title?: string;
  /** Custom description for the error message */
  description?: string;
  /** Whether to show navigation buttons */
  showNavigation?: boolean;
  /** Custom redirect path for the back button */
  backPath?: string;
  /** Custom redirect path for the home button */
  homePath?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback when user clicks back */
  onBack?: () => void;
  /** Callback when user clicks home */
  onHome?: () => void;
}

/**
 * UnauthorizedAccess component displays a user-friendly error message
 * when a user attempts to access content they don't have permission for
 */
export function UnauthorizedAccess({
  userRole,
  attemptedResource,
  attemptedAction,
  title,
  description,
  showNavigation = true,
  backPath,
  homePath = '/dashboard',
  className = '',
  onBack,
  onHome
}: UnauthorizedAccessProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      router.push(backPath);
    } else {
      router.back();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      router.push(homePath);
    }
  };

  const getDefaultTitle = () => {
    if (title) return title;
    
    switch (userRole) {
      case 'member':
        return 'Access Restricted';
      case 'guest':
        return 'Login Required';
      default:
        return 'Insufficient Permissions';
    }
  };

  const getDefaultDescription = () => {
    if (description) return description;
    
    switch (userRole) {
      case 'member':
        return 'This content is restricted to your current role. You can only access tasks assigned to you and basic operational information.';
      case 'guest':
        return 'Please log in with appropriate credentials to access this content.';
      case 'executive':
        return 'This content requires administrative or managerial permissions.';
      default:
        return 'Your current role does not have permission to access this content.';
    }
  };

  const getSuggestions = () => {
    switch (userRole) {
      case 'member':
        return [
          'Check your assigned tasks in the dashboard',
          'Contact your manager if you need access to additional resources',
          'Review your task assignments and loft access'
        ];
      case 'guest':
        return [
          'Log in with your credentials',
          'Contact an administrator for account access',
          'Return to the login page'
        ];
      case 'executive':
        return [
          'Contact an administrator for elevated permissions',
          'Access financial reports and dashboards instead',
          'Review available executive-level features'
        ];
      default:
        return [
          'Contact your system administrator',
          'Return to your dashboard',
          'Check your role permissions'
        ];
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-[400px] p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {getDefaultTitle()}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {getDefaultDescription()}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {(attemptedResource || attemptedAction) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Attempted access:</strong>{' '}
                {attemptedResource && attemptedAction 
                  ? `${attemptedResource}:${attemptedAction}`
                  : attemptedResource || attemptedAction
                }
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What you can do:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {getSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {showNavigation && (
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button 
                onClick={handleHome}
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compact version of UnauthorizedAccess for inline use
 */
export function UnauthorizedAccessInline({
  userRole,
  attemptedResource,
  className = ''
}: Pick<UnauthorizedAccessProps, 'userRole' | 'attemptedResource' | 'className'>) {
  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <Shield className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <strong>Access Denied:</strong> Your role ({userRole}) cannot access{' '}
        {attemptedResource || 'this content'}.
      </AlertDescription>
    </Alert>
  );
}

/**
 * Banner version for page-level access denial
 */
export function UnauthorizedAccessBanner({
  userRole,
  attemptedResource,
  message,
  className = ''
}: {
  userRole: UserRole;
  attemptedResource?: string;
  message?: string;
  className?: string;
}) {
  return (
    <div className={`bg-red-50 border-l-4 border-red-400 p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">
            <strong>Access Restricted:</strong>{' '}
            {message || `Your current role (${userRole}) does not have permission to access ${attemptedResource || 'this page'}.`}
          </p>
        </div>
      </div>
    </div>
  );
}