import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function FrenchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages({ locale: 'fr' });

  return (
    <html lang="fr">
      <body>
        <NextIntlClientProvider messages={messages} locale="fr">
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}