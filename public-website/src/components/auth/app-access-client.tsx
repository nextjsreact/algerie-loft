'use client';

import { useSession } from '@/hooks/use-session';
import { LoginRedirect } from './login-redirect';
import { AuthenticatedAccess } from './authenticated-access';
import { useTranslations } from 'next-intl';
import { Shield } from 'lucide-react';

interface AppAccessClientProps {
  locale: string;
}

export function AppAccessClient({ locale }: AppAccessClientProps) {
  const { isAuthenticated, session, isLoading, error, logout, transitionToApp } = useSession();
  const t = useTranslations();

  // Generate URLs for the internal application
  const internalAppUrl = process.env.NEXT_PUBLIC_INTERNAL_APP_URL || 'http://localhost:3000';
  const loginUrl = `${internalAppUrl}/${locale}/login`;
  const dashboardUrl = `${internalAppUrl}/${locale}`;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleTransition = async (path?: string) => {
    try {
      await transitionToApp(locale, path);
    } catch (error) {
      console.error('Transition failed:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('app.access.title')}
          </h1>
          <p className="text-gray-600">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('app.access.title')}
          </h1>
          <p className="text-red-600 mb-6">
            {error}
          </p>
          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {t('common.retry')}
            </button>
            <a
              href={loginUrl}
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {t('app.access.login.button')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Render appropriate component based on authentication status
  if (isAuthenticated && session) {
    return (
      <AuthenticatedAccess
        locale={locale}
        session={session}
        dashboardUrl={dashboardUrl}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <LoginRedirect
      locale={locale}
      loginUrl={loginUrl}
      dashboardUrl={dashboardUrl}
    />
  );
}