import { requireAuth } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { HomePageClient } from "@/components/home/home-page-client"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await requireAuth();

  // Rediriger les clients et partenaires vers leur page dédiée
  if (session.user.role === 'client') {
    redirect('/fr/client/dashboard')
  }
  if (session.user.role === 'partner') {
    redirect('/fr/partner/dashboard')
  }

  // Rediriger les Executives vers leur page dédiée
  if (session.user.role === 'executive') {
    redirect('/fr/executive');
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <HomePageClient />
      </div>
    </ErrorBoundary>
  )
}