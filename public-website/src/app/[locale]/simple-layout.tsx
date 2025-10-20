export default async function SimpleLocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return (
    <html lang={locale}>
      <head>
        <title>Test Locale - {locale}</title>
      </head>
      <body style={{ fontFamily: 'Arial, sans-serif', padding: '1rem' }}>
        <div style={{ backgroundColor: '#f0f9ff', padding: '1rem', marginBottom: '1rem' }}>
          <h2>Layout Simple - Locale: {locale}</h2>
        </div>
        {children}
      </body>
    </html>
  );
}