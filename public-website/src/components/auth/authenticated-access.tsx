'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, User, Shield, ArrowRight, LogOut } from 'lucide-react';
import type { AuthSession } from '@/types';

interface AuthenticatedAccessProps {
  locale: string;
  session: AuthSession;
  dashboardUrl: string;
  onLogout: () => void;
}

export function AuthenticatedAccess({ 
  locale, 
  session, 
  dashboardUrl, 
  onLogout 
}: AuthenticatedAccessProps) {
  const t = useTranslations();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleDashboardRedirect = () => {
    setIsRedirecting(true);
    // Redirect to internal app dashboard
    window.location.href = dashboardUrl;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('app.access.authenticated.title')}
          </h1>
          <p className="text-gray-600">
            {t('app.access.authenticated.description')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border">
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.user.full_name || session.user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session.user.email}
                </p>
                <p className="text-xs text-gray-400 capitalize">
                  {session.user.role}
                </p>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('app.access.authenticated.welcome')}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {t('app.access.authenticated.ready')}
              </p>
            </div>

            <button
              onClick={handleDashboardRedirect}
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
                  <ArrowRight className="h-4 w-4" />
                  <span>{t('app.access.dashboard.button')}</span>
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
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isLoggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                  <span>{t('app.access.logout.processing')}</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span>{t('app.access.logout.button')}</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>{t('app.access.security.authenticated')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}