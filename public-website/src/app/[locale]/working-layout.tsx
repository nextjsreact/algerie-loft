import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function WorkingLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <title>Loft Algérie - Site Public</title>
        <meta name="description" content="Services professionnels de gestion de lofts en Algérie" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ margin: 0, fontFamily: 'Arial, sans-serif' }}>
        <NextIntlClientProvider messages={messages}>
          <header style={{ backgroundColor: '#1f2937', color: 'white', padding: '1rem' }}>
            <h1>🏠 Loft Algérie</h1>
          </header>
          <main style={{ minHeight: '80vh' }}>
            {children}
          </main>
          <footer style={{ backgroundColor: '#f3f4f6', padding: '1rem', textAlign: 'center' }}>
            <p>&copy; 2024 Loft Algérie - Tous droits réservés</p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}