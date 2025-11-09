"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PartnerAuthService } from '@/lib/services/partner-auth-service';
import type { PartnerStatus } from '@/lib/types/partner-auth';

interface PartnerLoginFormProps {
  onSuccess?: (partnerId: string, status: PartnerStatus) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  locale?: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function PartnerLoginForm({ 
  onSuccess, 
  onError, 
  redirectTo,
  locale = 'fr' 
}: PartnerLoginFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[name as keyof LoginFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Use the existing login function from auth.ts - PARTNER context
      const { login } = await import('@/lib/auth');
      const loginResult = await login(formData.email, formData.password, locale, 'partner');

      if (!loginResult.success) {
        setErrors({ general: loginResult.error || 'Login failed' });
        onError?.(loginResult.error || 'Login failed');
        return;
      }

      // Créer le cookie de contexte côté client
      document.cookie = `login_context=partner; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      console.log('✅ Cookie login_context=partner créé');

      // After successful login, get partner session to validate status
      const partnerSession = await PartnerAuthService.getPartnerSession();
      
      if (!partnerSession) {
        setErrors({ general: 'Partner account not found. Please contact support.' });
        onError?.('Partner account not found');
        return;
      }

      // Check partner status and handle accordingly
      const statusError = PartnerAuthService.validatePartnerStatus(partnerSession.partner_status);
      
      if (statusError && partnerSession.partner_status !== 'active') {
        // For non-active partners, still call onSuccess but let the redirect logic handle the status
        onSuccess?.(partnerSession.partner_profile.id, partnerSession.partner_status);
        
        // Redirect based on status
        const redirectUrl = getStatusRedirectUrl(partnerSession.partner_status, locale);
        if (redirectTo && partnerSession.partner_status === 'active') {
          router.push(redirectTo);
        } else {
          router.push(redirectUrl);
        }
        return;
      }

      // Active partner - proceed normally
      onSuccess?.(partnerSession.partner_profile.id, partnerSession.partner_status);
      
      // Redirect to dashboard or specified URL
      const finalRedirectUrl = redirectTo || `/${locale}/partner/dashboard`;
      router.push(finalRedirectUrl);

    } catch (error) {
      console.error('Partner login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusRedirectUrl = (status: PartnerStatus, locale: string): string => {
    const statusUrls = {
      pending: `/${locale}/partner/pending`,
      rejected: `/${locale}/partner/rejected`,
      suspended: `/${locale}/partner/suspended`,
      active: `/${locale}/partner/dashboard`
    };
    return statusUrls[status];
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Partner Login</h2>
          <p className="text-gray-600 mt-2">Access your partner dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{errors.general}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email address"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            } transition-colors`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Additional Links */}
        <div className="mt-6 text-center space-y-2">
          <a
            href={`/${locale}/partner/forgot-password`}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot your password?
          </a>
          <div className="text-sm text-gray-600">
            Don't have a partner account?{' '}
            <a
              href={`/${locale}/partner/register`}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Apply now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Status-specific components for different partner states
export function PartnerStatusMessage({ status, locale = 'fr' }: { status: PartnerStatus; locale?: string }) {
  const statusConfig = {
    pending: {
      title: 'Account Pending Approval',
      message: 'Your partner application is currently under review. You will receive an email notification once approved.',
      color: 'yellow',
      icon: (
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    rejected: {
      title: 'Application Rejected',
      message: 'Your partner application has been rejected. Please contact support for more information.',
      color: 'red',
      icon: (
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    suspended: {
      title: 'Account Suspended',
      message: 'Your partner account has been temporarily suspended. Please contact support to resolve this issue.',
      color: 'orange',
      icon: (
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
      )
    },
    active: {
      title: 'Welcome Back!',
      message: 'Your partner account is active and ready to use.',
      color: 'green',
      icon: (
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  };

  const config = statusConfig[status];
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    green: 'bg-green-50 border-green-200 text-green-600'
  };

  return (
    <div className={`border rounded-lg p-6 text-center ${colorClasses[config.color as keyof typeof colorClasses]}`}>
      <div className="mb-4">
        {config.icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
      <p className="mb-4">{config.message}</p>
      {(status === 'rejected' || status === 'suspended') && (
        <button
          onClick={() => window.location.href = 'mailto:support@loftalgerie.com'}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            config.color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
          } transition-colors`}
        >
          Contact Support
        </button>
      )}
    </div>
  );
}