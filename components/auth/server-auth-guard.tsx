import { redirect } from 'next/navigation';
import { getSessionReadOnly } from '@/lib/auth';

interface ServerAuthGuardProps {
  children: React.ReactNode;
  locale: string;
  redirectTo?: string;
}

export async function ServerAuthGuard({ children, locale, redirectTo }: ServerAuthGuardProps) {
  const session = await getSessionReadOnly();
  
  if (!session) {
    const redirectPath = redirectTo || `/${locale}/login`;
    redirect(redirectPath);
  }

  return <>{children}</>;
}