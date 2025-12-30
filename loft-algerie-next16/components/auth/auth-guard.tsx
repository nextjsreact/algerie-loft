'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface AuthGuardProps {
  children: React.ReactNode;
  locale: string;
  redirectTo?: string;
}

export function AuthGuard({ children, locale, redirectTo }: AuthGuardProps) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        const redirect = redirectTo || `/${locale}/login`;
        router.push(redirect);
        return;
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        const redirect = redirectTo || `/${locale}/login`;
        router.push(redirect);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, locale, redirectTo, supabase.auth]);

  return <>{children}</>;
}