export function generateStaticParams() {
  return [
    { locale: 'fr' },
    { locale: 'en' },
    { locale: 'ar' }
  ];
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Simple validation
  if (!['fr', 'en', 'ar'].includes(locale)) {
    return <div>Invalid locale: {locale}</div>;
  }

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Loft Algérie - {locale.toUpperCase()}</title>
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', padding: '1rem' }}>
        <div style={{ backgroundColor: '#10b981', color: 'white', padding: '1rem', marginBottom: '1rem' }}>
          <h1>🎉 SUCCESS! Loft Algérie - {locale.toUpperCase()}</h1>
          <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>
            ✅ Route fonctionnelle: /{locale} | Direction: {locale === 'ar' ? 'RTL' : 'LTR'}
          </div>
        </div>
        <main>
          {children}
        </main>
        <footer style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f3f4f6', textAlign: 'center' }}>
          <p>&copy; 2024 Loft Algérie - Routes [locale] fonctionnelles !</p>
        </footer>
      </body>
    </html>
  );
}