import React from 'react';
import { PartnerLoginForm } from '@/components/auth/PartnerLoginForm';
import { Metadata } from 'next';

interface PartnerLoginPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    redirect?: string;
    error?: string;
  };
}

export const metadata: Metadata = {
  title: 'Partner Login - Loft Algérie',
  description: 'Sign in to your partner dashboard to manage your properties and reservations.',
};

export default function PartnerLoginPage({ params, searchParams }: PartnerLoginPageProps) {
  const { locale } = params;
  const { redirect, error } = searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.png"
            alt="Loft Algérie"
          />
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Partner Portal
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your partner dashboard
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  {decodeURIComponent(error)}
                </p>
              </div>
            </div>
          </div>
        )}

        <PartnerLoginForm
          locale={locale}
          redirectTo={redirect}
          onSuccess={(partnerId, status) => {
            console.log(`Partner ${partnerId} logged in with status: ${status}`);
          }}
          onError={(error) => {
            console.error('Partner login error:', error);
          }}
        />
      </div>

      {/* Additional Information */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              New to our partner program?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Join our partner network to list and manage your properties on our platform.
            </p>
            <a
              href={`/${locale}/partner/register`}
              className="w-full flex justify-center py-2 px-4 border border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Apply to Become a Partner
            </a>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 text-center">
        <div className="text-sm text-gray-600">
          Need help?{' '}
          <a
            href={`mailto:partners@loftalgerie.com`}
            className="text-blue-600 hover:text-blue-500"
          >
            Contact Partner Support
          </a>
        </div>
      </div>
    </div>
  );
}