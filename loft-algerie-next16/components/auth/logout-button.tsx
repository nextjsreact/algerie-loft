'use client';

import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useSessionManager } from '@/hooks/use-session-manager';
import { useState } from 'react';

interface LogoutButtonProps {
  locale?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
  confirmLogout?: boolean;
}

export function LogoutButton({ 
  locale = 'fr',
  className = '',
  variant = 'ghost',
  size = 'default',
  showIcon = true,
  children,
  confirmLogout = false
}: LogoutButtonProps) {
  const { logoutFromBoth } = useSessionManager(locale);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (confirmLogout) {
      const message = locale === 'fr' ? 'Êtes-vous sûr de vouloir vous déconnecter ?' :
                     locale === 'en' ? 'Are you sure you want to sign out?' :
                     locale === 'ar' ? 'هل أنت متأكد من أنك تريد تسجيل الخروج؟' :
                     'Are you sure you want to sign out?';
      
      if (!confirm(message)) {
        return;
      }
    }

    setIsLoggingOut(true);
    try {
      await logoutFromBoth();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={`text-red-600 hover:text-red-700 ${className}`}
      disabled={isLoggingOut}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {children || (
        isLoggingOut ? (
          locale === 'fr' ? 'Déconnexion...' :
          locale === 'en' ? 'Signing out...' :
          locale === 'ar' ? 'جاري تسجيل الخروج...' :
          'Signing out...'
        ) : (
          locale === 'fr' ? 'Déconnexion' :
          locale === 'en' ? 'Sign Out' :
          locale === 'ar' ? 'تسجيل الخروج' :
          'Sign Out'
        )
      )}
    </Button>
  );
}