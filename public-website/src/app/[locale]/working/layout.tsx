import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default async function WorkingLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
        <header style={{ marginBottom: '2rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '1rem' }}>
          <h1 style={{ color: '#1f2937', fontSize: '2rem' }}>🏠 Loft Algérie - Test Working</h1>
          <p style={{ color: '#6b7280' }}>Langue: {locale}</p>
        </header>
        {children}
      </div>
    </NextIntlClientProvider>
  );
}