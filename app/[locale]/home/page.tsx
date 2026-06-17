import { requireEmployeeAccess } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { HomePageClient } from "@/components/home/home-page-client"
import { redirect } from "next/navigation"
import { unstable_noStore as noStore } from "next/cache"

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  noStore()
  const { locale } = await params
  // Authentifie, redirige client/partner vers leur espace, et bloque les
  // employés "member" non confirmés (is_staff = true requis).
  const session = await requireEmployeeAccess(locale);

  // Les employés confirmés (member staff, admin, manager) accèdent à /home.
  // Les executive/superuser sont redirigés vers leur interface dédiée.
  if (session.user.role === 'executive') {
    redirect(`/${locale}/executive`);
  }
  if (session.user.role === 'superuser') {
    redirect(`/${locale}/admin/superuser/dashboard`);
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <HomePageClient />
      </div>
    </ErrorBoundary>
  )
}
