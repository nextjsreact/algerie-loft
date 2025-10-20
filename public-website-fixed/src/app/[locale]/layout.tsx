import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Geist, Geist_Mono } from 'next/font/google';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { PerformanceMonitor, PerformanceDebugger } from '@/components/performance/performance-monitor';
import '../globals.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
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
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Loft Algérie - {locale.toUpperCase()}</title>
        <meta name="description" content="Services professionnels de gestion de lofts et hébergements en Algérie" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GoogleAnalytics debug={process.env.NODE_ENV === 'development'} />
        <PerformanceMonitor />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <PerformanceDebugger />
      </body>
    </html>
  );
}