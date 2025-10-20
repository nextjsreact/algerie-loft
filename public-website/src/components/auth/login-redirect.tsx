'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, LogIn, Shield, ArrowRight } from 'lucide-react';

interface LoginRedirectProps {
  locale: string;
  loginUrl: string;
  dashboardUrl: string;
}

export function LoginRedirect({ locale, loginUrl, dashboardUrl }: LoginRedirectProps) {
  const t = useTranslations();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLoginRedirect = () => {
    setIsRedirecting(true);
    // Redirect to internal app login
    window.location.href = loginUrl;
  };

  const handleDashboardRedirect = () => {
    setIsRedirecting(true);
    // Redirect to internal app dashboard
    window.location.href = dashboardUrl;
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('app.access.title')}
          </h1>
          <p className="text-gray-600">
            {t('app.access.description')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('app.access.login.title')}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {t('app.access.login.description')}
              </p>
            </div>

            <button
              onClick={handleLoginRedirect}
              disabled={isRedirecting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isRedirecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('app.access.redirecting')}</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>{t('app.access.login.button')}</span>
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t('app.access.or')}
                </span>
              </div>
            </div>

            <button
              onClick={handleDashboardRedirect}
              disabled={isRedirecting}
              className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <ArrowRight className="h-4 w-4" />
              <span>{t('app.access.dashboard.button')}</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>{t('app.access.security.notice')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}