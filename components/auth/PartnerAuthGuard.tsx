"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PartnerAuthService } from '@/lib/services/partner-auth-service';
import type { PartnerAuthSession, PartnerStatus } from '@/lib/types/partner-auth';

interface PartnerAuthGuardProps {
  children: React.ReactNode;
  requiredStatus?: PartnerStatus | 'any';
  fallbackComponent?: React.ComponentType<{ status?: PartnerStatus; error?: string }>;
  redirectTo?: string;
}

interface PartnerAuthGuardState {
  isLoading: boolean;
  isAuthenticated: boolean;
  session: PartnerAuthSession | null;
  error: string | null;
  partnerStatus?: PartnerStatus;
}

export function PartnerAuthGuard({ 
  children, 
  requiredStatus = 'active',
  fallbackComponent: FallbackComponent,
  redirectTo 
}: PartnerAuthGuardProps) {
  const router = useRouter();
  const [state, setState] = useState<PartnerAuthGuardState>({
    isLoading: true,
    isAuthenticated: false,
    session: null,
    error: null
  });

  useEffect(() => {
    checkPartnerAuth();
  }, []);

  const checkPartnerAuth = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const session = await PartnerAuthService.getPartnerSession();
      
      if (!session) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          error: 'No partner session found'
        }));
        
        if (redirectTo) {
          router.push(redirectTo);
        }
        return;
      }

      // Validate partner status if required
      if (requiredStatus !== 'any') {
        const statusError = PartnerAuthService.validatePartnerStatus(session.partner_status);
        
        if (statusError && requiredStatus !== session.partner_status) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isAuthenticated: false,
            session,
            partnerStatus: session.partner_status,
            error: statusError.message
          }));

          if (statusError.redirect_url) {
            router.push(statusError.redirect_url);
          }
          return;
        }
      }

      // Update last login timestamp
      if (session.partner_profile.id) {
        await PartnerAuthService.updateLastLogin(session.partner_profile.id);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: true,
        session,
        partnerStatus: session.partner_status,
        error: null
      }));

    } catch (error) {
      console.error('Partner auth check failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));

      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  };

  // Loading state
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Verifying partner access...</span>
      </div>
    );
  }

  // Error state with fallback component
  if (!state.isAuthenticated && FallbackComponent) {
    return <FallbackComponent status={state.partnerStatus} error={state.error || undefined} />;
  }

  // Error state without fallback - show default error message
  if (!state.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h3>
          <p className="text-red-700 mb-4">
            {state.error || 'You do not have permission to access this area.'}
          </p>
          {state.partnerStatus && (
            <p className="text-sm text-red-600 mb-4">
              Partner Status: <span className="font-medium capitalize">{state.partnerStatus}</span>
            </p>
          )}
          <button
            onClick={() => router.push('/partner/login')}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Go to Partner Login
          </button>
        </div>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}

// Default fallback components for different partner statuses
export function PartnerPendingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full text-center">
        <div className="text-yellow-600 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Account Pending Approval</h3>
        <p className="text-yellow-700 mb-4">
          Your partner account is currently under review by our administrators. 
          You will receive an email notification once your account has been approved.
        </p>
        <p className="text-sm text-yellow-600">
          This process typically takes 1-2 business days.
        </p>
      </div>
    </div>
  );
}

export function PartnerRejectedFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center">
        <div className="text-red-600 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Account Rejected</h3>
        <p className="text-red-700 mb-4">
          Unfortunately, your partner application has been rejected. 
          Please contact our support team for more information.
        </p>
        <button
          onClick={() => window.location.href = 'mailto:support@loftalgerie.com'}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}

export function PartnerSuspendedFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 max-w-md w-full text-center">
        <div className="text-orange-600 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-orange-800 mb-2">Account Suspended</h3>
        <p className="text-orange-700 mb-4">
          Your partner account has been temporarily suspended. 
          Please contact our support team to resolve this issue.
        </p>
        <button
          onClick={() => window.location.href = 'mailto:support@loftalgerie.com'}
          className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}