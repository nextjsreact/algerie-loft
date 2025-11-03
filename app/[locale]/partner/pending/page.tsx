import React from 'react';
import { PartnerStatusMessage } from '@/components/auth/PartnerLoginForm';
import { Metadata } from 'next';

interface PartnerPendingPageProps {
  params: {
    locale: string;
  };
}

export const metadata: Metadata = {
  title: 'Account Pending Approval - Partner Portal',
  description: 'Your partner account is currently under review by our administrators.',
};

export default function PartnerPendingPage({ params }: PartnerPendingPageProps) {
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
        <PartnerStatusMessage status="pending" locale={locale} />
        
        <div className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              What happens next?
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <p>Our team will review your application and submitted documents</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <p>We may contact you for additional information if needed</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <p>You'll receive an email notification with the approval decision</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                </div>
                <div className="ml-3">
                  <p>Once approved, you can access your full partner dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600">
            Questions about your application?{' '}
            <a
              href="mailto:partners@loftalgerie.com"
              className="text-blue-600 hover:text-blue-500"
            >
              Contact our partner team
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