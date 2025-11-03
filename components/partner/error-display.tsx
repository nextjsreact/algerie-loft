"use client"

import React from 'react';
import { AlertTriangle, XCircle, Clock, Ban, FileX, Mail, RefreshCw } from 'lucide-react';
import { PartnerErrorCodes } from '@/types/partner';
import { PartnerAPIError } from '@/lib/services/partner-error-handler';

interface PartnerErrorDisplayProps {
  error: PartnerAPIError;
  onRetry?: () => void;
  onRedirect?: (url: string) => void;
  className?: string;
}

export function PartnerErrorDisplay({ 
  error, 
  onRetry, 
  onRedirect, 
  className = '' 
}: PartnerErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.code) {
      case PartnerErrorCodes.PARTNER_NOT_APPROVED:
      case PartnerErrorCodes.VALIDATION_PENDING:
        return <Clock className="w-8 h-8 text-yellow-500" />;
      
      case PartnerErrorCodes.PARTNER_REJECTED:
      case PartnerErrorCodes.PARTNER_SUSPENDED:
        return <Ban className="w-8 h-8 text-red-500" />;
      
      case PartnerErrorCodes.PARTNER_NOT_FOUND:
        return <FileX className="w-8 h-8 text-gray-500" />;
      
      case PartnerErrorCodes.EMAIL_ALREADY_EXISTS:
        return <Mail className="w-8 h-8 text-blue-500" />;
      
      case PartnerErrorCodes.PROPERTY_NOT_OWNED:
      case PartnerErrorCodes.INSUFFICIENT_PERMISSIONS:
        return <XCircle className="w-8 h-8 text-red-500" />;
      
      default:
        return <AlertTriangle className="w-8 h-8 text-orange-500" />;
    }
  };

  const getErrorColor = () => {
    switch (error.code) {
      case PartnerErrorCodes.PARTNER_NOT_APPROVED:
      case PartnerErrorCodes.VALIDATION_PENDING:
        return 'border-yellow-200 bg-yellow-50';
      
      case PartnerErrorCodes.PARTNER_REJECTED:
      case PartnerErrorCodes.PARTNER_SUSPENDED:
      case PartnerErrorCodes.PROPERTY_NOT_OWNED:
      case PartnerErrorCodes.INSUFFICIENT_PERMISSIONS:
        return 'border-red-200 bg-red-50';
      
      case PartnerErrorCodes.PARTNER_NOT_FOUND:
        return 'border-gray-200 bg-gray-50';
      
      case PartnerErrorCodes.EMAIL_ALREADY_EXISTS:
        return 'border-blue-200 bg-blue-50';
      
      default:
        return 'border-orange-200 bg-orange-50';
    }
  };

  const handleRedirect = () => {
    if (error.redirect_url && onRedirect) {
      onRedirect(error.redirect_url);
    }
  };

  const getActionButton = () => {
    if (error.redirect_url) {
      return (
        <button
          onClick={handleRedirect}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {getRedirectButtonText()}
        </button>
      );
    }

    if (onRetry) {
      return (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>
      );
    }

    return null;
  };

  const getRedirectButtonText = () => {
    switch (error.code) {
      case PartnerErrorCodes.PARTNER_NOT_FOUND:
        return 'Register as Partner';
      
      case PartnerErrorCodes.PARTNER_NOT_APPROVED:
      case PartnerErrorCodes.VALIDATION_PENDING:
        return 'View Status';
      
      case PartnerErrorCodes.PARTNER_REJECTED:
        return 'View Details';
      
      case PartnerErrorCodes.PARTNER_SUSPENDED:
        return 'Contact Support';
      
      case PartnerErrorCodes.EMAIL_ALREADY_EXISTS:
        return 'Login Instead';
      
      default:
        return 'Continue';
    }
  };

  return (
    <div className={`rounded-lg border p-6 ${getErrorColor()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getErrorIcon()}
        </div>
        
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {getErrorTitle()}
          </h3>
          
          <p className="text-gray-700 mb-4">
            {error.error}
          </p>
          
          {error.details && (
            <div className="mb-4 p-3 bg-white bg-opacity-50 rounded border">
              <p className="text-sm text-gray-600">
                <strong>Details:</strong> {error.details}
              </p>
            </div>
          )}
          
          {error.suggestions && error.suggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                What you can do:
              </h4>
              <ul className="list-disc list-inside space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            {getActionButton()}
            
            {error.request_id && (
              <p className="text-xs text-gray-500">
                Error ID: {error.request_id}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getErrorTitle(): string {
  return 'Partner Account Issue';
}

// Specific error display components for common scenarios

export function PartnerNotApprovedDisplay({ 
  onViewStatus 
}: { 
  onViewStatus?: () => void 
}) {
  const error: PartnerAPIError = {
    error: 'Your partner account is pending administrative approval.',
    code: PartnerErrorCodes.PARTNER_NOT_APPROVED,
    suggestions: [
      'Wait for admin approval (usually within 24-48 hours)',
      'Check your email for approval notifications',
      'Contact support if your application has been pending for more than 48 hours'
    ],
    timestamp: new Date().toISOString(),
    redirect_url: '/partner/pending'
  };

  return (
    <PartnerErrorDisplay 
      error={error} 
      onRedirect={onViewStatus}
      className="max-w-2xl mx-auto"
    />
  );
}

export function PartnerRejectedDisplay({ 
  rejectionReason,
  onReapply 
}: { 
  rejectionReason?: string;
  onReapply?: () => void;
}) {
  const error: PartnerAPIError = {
    error: 'Your partner account application has been rejected.',
    code: PartnerErrorCodes.PARTNER_REJECTED,
    details: rejectionReason,
    suggestions: [
      'Review the rejection reason provided',
      'Submit a new application with corrected information',
      'Contact support for clarification on the rejection'
    ],
    timestamp: new Date().toISOString(),
    redirect_url: '/partner/register'
  };

  return (
    <PartnerErrorDisplay 
      error={error} 
      onRedirect={onReapply}
      className="max-w-2xl mx-auto"
    />
  );
}

export function PropertyNotOwnedDisplay({ 
  loftId,
  onBackToDashboard 
}: { 
  loftId: string;
  onBackToDashboard?: () => void;
}) {
  const error: PartnerAPIError = {
    error: 'You do not have access to this property.',
    code: PartnerErrorCodes.PROPERTY_NOT_OWNED,
    field: 'loft_id',
    suggestions: [
      'Check if you are viewing the correct property',
      'Ensure you are logged in with the correct partner account',
      'Contact support if you believe you should have access to this property'
    ],
    timestamp: new Date().toISOString()
  };

  return (
    <PartnerErrorDisplay 
      error={error} 
      onRetry={onBackToDashboard}
      className="max-w-2xl mx-auto"
    />
  );
}

export function PartnerRegistrationErrorDisplay({ 
  validationErrors,
  onRetry 
}: { 
  validationErrors: string[];
  onRetry?: () => void;
}) {
  const error: PartnerAPIError = {
    error: validationErrors.length === 1 
      ? validationErrors[0] 
      : `${validationErrors.length} validation errors occurred`,
    code: PartnerErrorCodes.INVALID_REGISTRATION_DATA,
    details: validationErrors.join('; '),
    suggestions: [
      'Please check all required fields',
      'Ensure all information is accurate and complete',
      'Upload valid verification documents',
      'Contact support if you need assistance'
    ],
    timestamp: new Date().toISOString()
  };

  return (
    <PartnerErrorDisplay 
      error={error} 
      onRetry={onRetry}
      className="max-w-2xl mx-auto"
    />
  );
}

// Inline error display for forms
export function InlinePartnerError({ 
  error, 
  className = '' 
}: { 
  error: PartnerAPIError;
  className?: string;
}) {
  return (
    <div className={`flex items-start p-3 bg-red-50 border border-red-200 rounded-md ${className}`}>
      <XCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-red-800 font-medium">
          {error.error}
        </p>
        {error.details && (
          <p className="text-xs text-red-600 mt-1">
            {error.details}
          </p>
        )}
      </div>
    </div>
  );
}

// Toast-style error notification
export function PartnerErrorToast({ 
  error, 
  onDismiss 
}: { 
  error: PartnerAPIError;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed top-4 right-4 max-w-sm w-full bg-white border border-red-200 rounded-lg shadow-lg z-50">
      <div className="p-4">
        <div className="flex items-start">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Partner Error
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {error.error}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}