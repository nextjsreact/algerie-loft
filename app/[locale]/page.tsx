import { redirect } from 'next/navigation';
import { getSessionReadOnly } from '@/lib/auth';
import { HomePage } from '@/components/home/home-page';
import { ErrorBoundary } from "@/components/error-boundary";
import ClientProviders from '@/components/providers/client-providers-nextintl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../i18n';

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Check if user is authenticated
  const session = await getSessionReadOnly();

  if (!session) {
    // If not logged in, redirect to login page
    redirect(`/${locale}/login`);
  }

  // Load messages for the locale
  let messages: Record<string, any>;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    console.error("Error loading messages for locale:", locale, error);
    messages = {};
  }

  // If user is logged in, show the home page with the standard layout
  return (
    <ErrorBoundary>
      <ClientProviders
        session={session}
        unreadCount={0}
        locale={locale}
        messages={messages}
        hideSidebar={true}
      >
        <HomePage />
      </ClientProviders>
    </ErrorBoundary>
  );
}