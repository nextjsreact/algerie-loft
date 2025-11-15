import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../i18n';
import { NextIntlClientProvider } from 'next-intl';
import { getSessionReadOnly } from '@/lib/auth';
import ClientProviders from '@/components/providers/client-providers-nextintl';
import { LangSetter } from '@/components/lang-setter';
// import { NuclearSpacingFix } from '@/components/nuclear-spacing-fix';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }
  
  // Simplified message loading
  let messages: Record<string, any>;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    messages = {};
  }

  // Optimized session loading - only check if auth cookies exist
  let session: Awaited<ReturnType<typeof getSessionReadOnly>> = null;
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const hasAuthCookie = cookieStore.getAll().some(cookie => 
      cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
    );
    
    // Only call getSessionReadOnly if auth cookies exist
    if (hasAuthCookie) {
      session = await getSessionReadOnly();
    }
  } catch (error) {
    session = null;
  }

  return (
    <>
      {/* <NuclearSpacingFix /> */}
      <LangSetter locale={locale} />
      <ClientProviders 
        session={session} 
        unreadCount={0} 
        locale={locale} 
        messages={messages}
      >
        {children}
      </ClientProviders>
    </>
  );
}