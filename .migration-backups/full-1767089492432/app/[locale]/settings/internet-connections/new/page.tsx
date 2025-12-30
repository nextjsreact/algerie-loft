import { InternetConnectionTypeForm } from '@/components/forms/internet-connection-type-form';
import { getTranslations } from 'next-intl/server';

interface NewInternetConnectionPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: NewInternetConnectionPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'internetConnections' });
  
  return {
    title: t('addNewConnectionType'),
    description: t('createNewConnectionType'),
  };
}

export default async function NewInternetConnectionPage({ params }: NewInternetConnectionPageProps) {
  return (
    <div className="container mx-auto py-6">
      <InternetConnectionTypeForm />
    </div>
  );
}