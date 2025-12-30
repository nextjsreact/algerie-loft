import { redirect } from 'next/navigation';
import { getSessionReadOnly } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function AppAccessPage() {
  // Get the Accept-Language header to determine preferred locale
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Simple locale detection based on Accept-Language header
  let locale = 'fr'; // default
  
  if (acceptLanguage.includes('en')) {
    locale = 'en';
  } else if (acceptLanguage.includes('ar')) {
    locale = 'ar';
  }

  // Check if user is authenticated
  const session = await getSessionReadOnly();

  if (!session) {
    // If not logged in, redirect to login page with return URL
    const returnUrl = encodeURIComponent('/app');
    redirect(`/${locale}/login?returnUrl=${returnUrl}`);
  }

  // If user is authenticated, redirect to the internal application dashboard
  redirect(`/${locale}/dashboard`);
}