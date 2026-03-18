import { requireAuth } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function DashboardPage() {
  const session = await requireAuth();

  const cookieStore = await cookies();
  const loginContext = cookieStore.get('login_context')?.value;

  if (loginContext === 'client' || session.user.role === 'client') redirect('/fr/client/dashboard')
  if (loginContext === 'partner' || session.user.role === 'partner') redirect('/fr/partner/dashboard')

  return (
    <ErrorBoundary>
      <DashboardClientWrapper />
    </ErrorBoundary>
  )
}