import React from 'react';
import { PartnerStatusMessage } from '@/components/auth/PartnerLoginForm';
import { Metadata } from 'next';

interface PartnerSuspendedPageProps {
  params: {
    locale: string;
  };
}

export const metadata: Metadata = {
  title: 'Account Suspended - Partner Portal',
  description: 'Your partner account has been temporarily suspended. Contact support to resolve this issue.',
};

export default function PartnerSuspendedPage({ params }: PartnerSuspendedPageProps) {
  const { locale } = params;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.png"
            alt="Loft Algérie"
          />
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Partner Portal
          </h1>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <PartnerStatusMessage status="suspended" locale={locale} />
        
        <div className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Common reasons for suspension
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <p>Violation of partner terms and conditions</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <p>Multiple guest complaints or poor ratings</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <p>Failure to maintain property standards</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <p>Outstanding payment or billing issues</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <p>Suspicious or fraudulent activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Account Restoration
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  To restore your account, please contact our partner support team. 
                  We'll work with you to resolve any issues and get your account back in good standing.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Steps to resolve suspension
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    1
                  </div>
                </div>
                <div className="ml-3">
                  <p>Contact our partner support team immediately</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    2
                  </div>
                </div>
                <div className="ml-3">
                  <p>Review the specific reasons for suspension</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    3
                  </div>
                </div>
                <div className="ml-3">
                  <p>Provide documentation or take corrective actions as required</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    4
                  </div>
                </div>
                <div className="ml-3">
                  <p>Wait for account review and restoration</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600">
            Need immediate assistance?{' '}
            <a
              href="mailto:partners@loftalgerie.com"
              className="text-orange-600 hover:text-orange-500 font-medium"
            >
              Contact Partner Support
            </a>
          </div>
        </div>

        <div className="mt-4 text-center">
          <a
            href={`/${locale}/partner/login`}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to login
          </a>
        </div>
      </div>
    </div>
  );
}