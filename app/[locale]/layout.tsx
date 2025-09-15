import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../i18n';
import { NextIntlClientProvider } from 'next-intl';
import { getSessionReadOnly } from '@/lib/auth';
import ClientProviders from '@/components/providers/client-providers-nextintl';
import { LangSetter } from '@/components/lang-setter';

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
  let messages: Record<string, any>; // Use a more flexible type for messages
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    console.error("Error loading messages for locale:", locale, error);
    messages = {};
  }

  console.log("Loaded messages for locale:", locale);
  console.log("Notifications messages:", messages?.notifications);
  console.log("newTaskAssigned key exists:", !!messages?.notifications?.newTaskAssigned);
  console.log("newTaskAssignedMessage key exists:", !!messages?.notifications?.newTaskAssignedMessage);

  // Simplified session loading
  let session: Awaited<ReturnType<typeof getSessionReadOnly>>;
  try {
    session = await getSessionReadOnly();
  } catch (error) {
    console.error("Error loading session:", error);
    session = null;
  }

  return (
    <>
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