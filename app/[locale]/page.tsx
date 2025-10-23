import { redirect } from 'next/navigation';
import { getSessionReadOnly } from '@/lib/auth';

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  // Check if user is authenticated
  const session = await getSessionReadOnly();
  
  if (session) {
    // If authenticated, redirect to home page (not dashboard)
    redirect(`/${locale}/home`);
  } else {
    // If not authenticated, redirect to public page
    redirect(`/${locale}/public`);
  }
}