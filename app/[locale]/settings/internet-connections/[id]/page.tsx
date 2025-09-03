import { notFound } from 'next/navigation';
import { getInternetConnectionTypeById } from '@/app/actions/internet-connections';
import { InternetConnectionTypeForm } from '@/components/forms/internet-connection-type-form';
import { getTranslations } from 'next-intl/server';

interface EditInternetConnectionPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: EditInternetConnectionPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'internetConnections' });
  
  return {
    title: t('editConnectionType'),
    description: t('updateConnectionInfo'),
  };
}

export default async function EditInternetConnectionPage({ params }: EditInternetConnectionPageProps) {
  const { id } = await params;
  
  // Fetch the connection data
  const { data: connection, error } = await getInternetConnectionTypeById(id);
  
  // If connection not found, show 404
  if (error || !connection) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-6">
      <InternetConnectionTypeForm initialData={connection} />
    </div>
  );
}