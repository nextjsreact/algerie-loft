import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '../../i18n';
import { NextIntlClientProvider } from 'next-intl';

export default async function LocaleLayoutTest({
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
  
  // Get messages with minimal error handling
  let messages = {};
  try {
    messages = await getMessages({ locale });
  } catch {
    messages = {};
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div>
            <h1>Test Layout</h1>
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}