import { requireAuth } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await requireAuth();

  // Clients et partenaires n'ont pas accès au dashboard employé
  if (session.user.role === 'client') redirect('/fr/client/dashboard')
  if (session.user.role === 'partner') redirect('/fr/partner/dashboard')

  return (
    <ErrorBoundary>
      <DashboardClientWrapper />
    </ErrorBoundary>
  )
}