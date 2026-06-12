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

  // Un employé connecté en tant qu'employé ne doit JAMAIS être redirigé vers client/partner
  // même si son rôle DB est 'admin', 'manager', etc.
  const isStaffRole = ['admin', 'manager', 'member', 'executive', 'superuser'].includes(session.user.role)

  // Redirection client : seulement si le contexte de login est explicitement 'client'
  // ET que le rôle DB est bien 'client' (pas un employé qui se connecte en mode client)
  if (loginContext === 'client' && !isStaffRole) {
    redirect(`/${locale}/client/dashboard`)
  }
  if (loginContext === 'partner' && !isStaffRole) {
    redirect(`/${locale}/partner/dashboard`)
  }

  // Si rôle DB est client ou partner sans contexte, rediriger vers leur espace
  if (!isStaffRole && session.user.role === 'client') {
    redirect(`/${locale}/client/dashboard`)
  }
  if (!isStaffRole && session.user.role === 'partner') {
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
