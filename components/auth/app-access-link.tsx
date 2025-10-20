'use client';

import { Button } from '@/components/ui/button';
import { LogIn, ExternalLink } from 'lucide-react';
import { useSessionManager } from '@/hooks/use-session-manager';

interface AppAccessLinkProps {
  locale?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function AppAccessLink({ 
  locale = 'fr',
  className = '',
  variant = 'default',
  size = 'default',
  showIcon = true,
  children
}: AppAccessLinkProps) {
  const { transitionToApp } = useSessionManager(locale);

  return (
    <Button
      onClick={transitionToApp}
      variant={variant}
      size={size}
      className={className}
    >
      {showIcon && <LogIn className="mr-2 h-4 w-4" />}
      {children || (
        locale === 'fr' ? 'Accéder à l\'application' :
        locale === 'en' ? 'Access Application' :
        locale === 'ar' ? 'الوصول إلى التطبيق' :
        'Access Application'
      )}
      {showIcon && <ExternalLink className="ml-2 h-4 w-4" />}
    </Button>
  );
}