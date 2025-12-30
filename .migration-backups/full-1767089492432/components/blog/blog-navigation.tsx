'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, BookOpen } from 'lucide-react';

interface BlogNavigationProps {
  locale: string;
  showBackToBlog?: boolean;
  showBackToHome?: boolean;
}

export function BlogNavigation({ 
  locale, 
  showBackToBlog = false, 
  showBackToHome = false 
}: BlogNavigationProps) {
  const t = useTranslations('blog');

  return (
    <nav className="flex items-center gap-4 mb-8">
      {showBackToHome && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            {t('navigation.home')}
          </Link>
        </Button>
      )}
      
      {showBackToBlog && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/${locale}/blog`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('navigation.backToBlog')}
          </Link>
        </Button>
      )}
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <span>{t('title')}</span>
      </div>
    </nav>
  );
}