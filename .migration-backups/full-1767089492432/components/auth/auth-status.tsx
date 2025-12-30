'use client';

import { AppAccessLink } from './app-access-link';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useSessionManager } from '@/hooks/use-session-manager';

interface AuthStatusProps {
  locale?: string;
  className?: string;
}

export function AuthStatus({ locale = 'fr', className = '' }: AuthStatusProps) {
  const { 
    isAuthenticated, 
    user, 
    loading, 
    error,
    transitionToApp,
    logoutFromBoth,
    navigateToLogin 
  } = useSessionManager(locale);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-red-500 text-sm">Session error</span>
        <Button
          onClick={() => navigateToLogin()}
          variant="outline"
          size="sm"
        >
          <User className="h-4 w-4 mr-1" />
          {locale === 'fr' ? 'Se connecter' :
           locale === 'en' ? 'Sign In' :
           locale === 'ar' ? 'تسجيل الدخول' :
           'Sign In'}
        </Button>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-2 text-sm">
          <User className="h-4 w-4" />
          <span>
            {locale === 'fr' ? 'Connecté en tant que' :
             locale === 'en' ? 'Signed in as' :
             locale === 'ar' ? 'مسجل الدخول كـ' :
             'Signed in as'} {user.full_name || user.email}
          </span>
        </div>
        <Button
          onClick={transitionToApp}
          variant="outline"
          size="sm"
        >
          {locale === 'fr' ? 'Accéder à l\'application' :
           locale === 'en' ? 'Access Application' :
           locale === 'ar' ? 'الوصول إلى التطبيق' :
           'Access Application'}
        </Button>
        <Button
          onClick={logoutFromBoth}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          <LogOut className="h-4 w-4 mr-1" />
          {locale === 'fr' ? 'Déconnexion' :
           locale === 'en' ? 'Sign Out' :
           locale === 'ar' ? 'تسجيل الخروج' :
           'Sign Out'}
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        onClick={() => navigateToLogin()}
        variant="outline"
        size="sm"
      >
        <User className="h-4 w-4 mr-1" />
        {locale === 'fr' ? 'Se connecter' :
         locale === 'en' ? 'Sign In' :
         locale === 'ar' ? 'تسجيل الدخول' :
         'Sign In'}
      </Button>
    </div>
  );
}