import { requireAuth } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { HomePageClient } from "@/components/home/home-page-client"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { unstable_noStore as noStore } from "next/cache"

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  noStore()
  const { locale } = await params
  const session = await requireAuth();

  // Check login_context cookie — if user chose client or partner, redirect them
  const cookieStore = await cookies();
  const loginContext = cookieStore.get('login_context')?.value;

  if (loginContext === 'client' || session.user.role === 'client') {
    redirect(`/${locale}/client/dashboard`)
  }
  if (loginContext === 'partner' || session.user.role === 'partner') {
    redirect(`/${locale}/partner/dashboard`)
  }
  if (session.user.role === 'executive') {
    redirect(`/${locale}/executive`);
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <HomePageClient />
      </div>
    </ErrorBoundary>
  )
}
