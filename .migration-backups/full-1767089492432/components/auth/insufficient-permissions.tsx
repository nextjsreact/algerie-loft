"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/lib/types';
import { Lock, User, AlertCircle, RefreshCw, Mail } from 'lucide-react';

export interface InsufficientPermissionsProps {
  /** The user's current role */
  userRole: UserRole;
  /** Required roles for access */
  requiredRoles?: UserRole[];
  /** Required permission details */
  requiredPermission?: {
    resource: string;
    action: string;
    scope?: string;
  };
  /** Custom error message */
  message?: string;
  /** Whether to show role upgrade suggestions */
  showUpgradeSuggestions?: boolean;
  /** Whether to show contact admin option */
  showContactAdmin?: boolean;
  /** Custom admin contact email */
  adminEmail?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback for refresh/retry action */
  onRetry?: () => void;
  /** Callback for contact admin action */
  onContactAdmin?: () => void;
}

/**
 * InsufficientPermissions component provides detailed feedback about
 * permission requirements and potential solutions
 */
export function InsufficientPermissions({
  userRole,
  requiredRoles,
  requiredPermission,
  message,
  showUpgradeSuggestions = true,
  showContactAdmin = true,
  adminEmail = 'admin@company.com',
  className = '',
  onRetry,
  onContactAdmin
}: InsufficientPermissionsProps) {
  const router = useRouter();

  const handleContactAdmin = () => {
    if (onContactAdmin) {
      onContactAdmin();
    } else {
      window.location.href = `mailto:${adminEmail}?subject=Permission Request&body=I need access to additional features. Current role: ${userRole}`;
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const getRoleHierarchy = (): UserRole[] => {
    return ['guest', 'member', 'executive', 'manager', 'admin'];
  };

  const getRoleLevel = (role: UserRole): number => {
    return getRoleHierarchy().indexOf(role);
  };

  const getUpgradeOptions = (): UserRole[] => {
    const currentLevel = getRoleLevel(userRole);
    const hierarchy = getRoleHierarchy();
    
    if (requiredRoles) {
      return requiredRoles.filter(role => getRoleLevel(role) > currentLevel);
    }
    
    return hierarchy.slice(currentLevel + 1);
  };

  const getPermissionDescription = () => {
    if (!requiredPermission) return null;
    
    const { resource, action, scope } = requiredPermission;
    
    return (
      <div className="bg-gray-50 p-3 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Required Permission:</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <div><strong>Resource:</strong> {resource}</div>
          <div><strong>Action:</strong> {action}</div>
          {scope && <div><strong>Scope:</strong> {scope}</div>}
        </div>
      </div>
    );
  };

  const getRoleDescription = (role: UserRole): string => {
    switch (role) {
      case 'admin':
        return 'Full system access and user management';
      case 'manager':
        return 'Team management, financial data, and operational oversight';
      case 'executive':
        return 'Financial reports and high-level dashboard access';
      case 'member':
        return 'Task management and assigned loft access';
      case 'guest':
        return 'Limited read-only access';
      default:
        return 'Unknown role';
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-[500px] p-4 ${className}`}>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Insufficient Permissions
          </CardTitle>
          <CardDescription className="text-gray-600">
            {message || 'You need additional permissions to access this feature.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Role */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Current Role:</span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {userRole}
            </Badge>
          </div>

          {/* Required Roles */}
          {requiredRoles && requiredRoles.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Required Roles:</h4>
              <div className="space-y-2">
                {requiredRoles.map((role) => (
                  <div key={role} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <Badge variant="outline" className="mr-2">{role}</Badge>
                      <span className="text-sm text-gray-600">
                        {getRoleDescription(role)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permission Details */}
          {getPermissionDescription()}

          {/* Upgrade Suggestions */}
          {showUpgradeSuggestions && getUpgradeOptions().length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Possible Solutions:</h4>
              <div className="space-y-2">
                {getUpgradeOptions().slice(0, 2).map((role) => (
                  <div key={role} className="flex items-start space-x-2 p-2 bg-green-50 rounded">
                    <AlertCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <strong className="text-green-800">Upgrade to {role}:</strong>
                      <span className="text-green-700 ml-1">
                        {getRoleDescription(role)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-4 border-t">
            {showContactAdmin && (
              <Button 
                onClick={handleContactAdmin}
                className="w-full"
                variant="default"
              >
                <Mail className="w-4 h-4 mr-2" />
                Request Access from Administrator
              </Button>
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="flex-1"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              If you believe you should have access to this feature, please contact your system administrator 
              or check if your role permissions have been updated recently.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Compact version for inline permission errors
 */
export function InsufficientPermissionsInline({
  userRole,
  requiredRoles,
  className = ''
}: Pick<InsufficientPermissionsProps, 'userRole' | 'requiredRoles' | 'className'>) {
  return (
    <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
      <Lock className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <strong>Insufficient Permissions:</strong> This feature requires{' '}
        {requiredRoles ? requiredRoles.join(' or ') : 'elevated'} permissions. 
        Your current role: <Badge variant="outline" className="ml-1">{userRole}</Badge>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Modal version for permission errors in dialogs
 */
export function InsufficientPermissionsModal({
  userRole,
  requiredRoles,
  onClose,
  className = ''
}: Pick<InsufficientPermissionsProps, 'userRole' | 'requiredRoles' | 'className'> & {
  onClose: () => void;
}) {
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="w-5 h-5 mr-2 text-orange-600" />
            Permission Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            This action requires {requiredRoles ? requiredRoles.join(' or ') : 'elevated'} permissions.
          </p>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm">Your role:</span>
            <Badge variant="outline">{userRole}</Badge>
          </div>
          <Button onClick={onClose} className="w-full">
            Understood
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}