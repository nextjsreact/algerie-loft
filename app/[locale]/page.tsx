import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { HomePage } from '@/components/home/home-page';
import { ErrorBoundary } from "@/components/error-boundary";

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  // Check if user is authenticated
  const session = await getSession();
  
  if (!session) {
    // If not logged in, redirect to login page
    redirect(`/${locale}/login`);
  }
  
  // If user is logged in, show the home page
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <HomePage />
      </div>
    </ErrorBoundary>
  );
}