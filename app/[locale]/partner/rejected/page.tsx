import React from 'react';
import { PartnerStatusMessage } from '@/components/auth/PartnerLoginForm';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

interface PartnerRejectedPageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Application Rejected - Partner Portal',
  description: 'Your partner application has been rejected. Contact support for more information.',
};

export default async function PartnerRejectedPage({ params }: PartnerRejectedPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'partnerRejected' });
  const isRTL = locale === 'ar';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <img
            className="mx-auto h-12 w-auto"
            src="/logo.png"
            alt="Loft Algérie"
          />
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            {t('portalTitle')}
          </h1>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <PartnerStatusMessage status="rejected" locale={locale} />
        
        <div className="mt-8 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {t('reasons.title')}
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                </div>
                <div className={isRTL ? 'mr-3' : 'ml-3'}>
                  <p>{t('reasons.incomplete')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                </div>
                <div className={isRTL ? 'mr-3' : 'ml-3'}>
                  <p>{t('reasons.quality')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                </div>
                <div className={isRTL ? 'mr-3' : 'ml-3'}>
                  <p>{t('reasons.location')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                </div>
                <div className={isRTL ? 'mr-3' : 'ml-3'}>
                  <p>{t('reasons.verification')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className={isRTL ? 'mr-3' : 'ml-3'}>
              <h3 className="text-sm font-medium text-blue-800">
                {t('reapply.title')}
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>{t('reapply.message')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600">
            {t('help')}{' '}
            <a
              href="mailto:partners@loftalgerie.com"
              className="text-blue-600 hover:text-blue-500"
            >
              {t('contact')}
            </a>
          </div>
        </div>

        <div className="mt-4 text-center">
          <a
            href={`/${locale}/partner/register`}
            className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
          >
            {t('actions.newApplication')}
          </a>
          <a
            href={`/${locale}/partner/login`}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {t('actions.backToLogin')}
          </a>
        </div>
      </div>
    </div>
  );
}