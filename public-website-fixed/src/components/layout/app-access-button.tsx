'use client';

import { useSession } from '@/hooks/use-session';
import { useTranslations } from 'next-intl';
import { ExternalLink, User, LogIn } from 'lucide-react';
import Link from 'next/link';

interface AppAccessButtonProps {
  locale: string;
  className?: string;
}

export function AppAccessButton({ locale, className = '' }: AppAccessButtonProps) {
  const { isAuthenticated, session, isLoading } = useSession();
  const t = useTranslations();

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg h-10 w-24 ${className}`} />
    );
  }

  if (isAuthenticated && session) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span className="truncate max-w-32">
            {session.user.full_name || session.user.email}
          </span>
        </div>
        <Link
          href={`/${locale}/app`}
          className="inline-flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-200"
        >
          <ExternalLink className="h-4 w-4" />
          <span className="hidden sm:inline">{t('navigation.app')}</span>
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={`/${locale}/app`}
      className={`inline-flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-200 ${className}`}
    >
      <LogIn className="h-4 w-4" />
      <span className="hidden sm:inline">{t('navigation.login')}</span>
    </Link>
  );
}