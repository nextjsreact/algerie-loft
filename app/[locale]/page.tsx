import { redirect } from 'next/navigation';

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  // Always redirect to public page - this makes the route truly public
  redirect(`/${locale}/public`);
}