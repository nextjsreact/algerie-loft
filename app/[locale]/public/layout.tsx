import { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { locale } = await params;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {children}
    </div>
  );
}