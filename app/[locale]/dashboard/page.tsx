import { requireAuth } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function DashboardPage() {
  const session = await requireAuth();

  const cookieStore = await cookies();
  const loginContext = cookieStore.get('login_context')?.value;

  // Le login_context prime sur le rôle DB : un employé qui se connecte
  // en tant que client/partner doit être redirigé vers son dashboard.
  if (loginContext === 'client') redirect('/fr/client/dashboard')
  if (loginContext === 'partner') redirect('/fr/partner/dashboard')

  // Fallback : si pas de cookie, utiliser le rôle DB
  if (session.user.role === 'client') redirect('/fr/client/dashboard')
  if (session.user.role === 'partner') redirect('/fr/partner/dashboard')

  return (
    <ErrorBoundary>
      <DashboardClientWrapper />
    </ErrorBoundary>
  )
}