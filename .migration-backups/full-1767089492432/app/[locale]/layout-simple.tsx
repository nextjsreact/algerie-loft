export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return (
    <div>
      <div style={{ padding: '10px', background: '#f0f0f0', marginBottom: '10px' }}>
        Locale: {locale}
      </div>
      {children}
    </div>
  );
}