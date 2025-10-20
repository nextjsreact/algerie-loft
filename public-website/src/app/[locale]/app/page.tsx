import { AppAccessClient } from '@/components/auth/app-access-client';

interface AppPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AppPage({ params }: AppPageProps) {
  const { locale } = await params;

  return (
    <div className="container mx-auto px-4 py-16">
      <AppAccessClient locale={locale} />
    </div>
  );
}