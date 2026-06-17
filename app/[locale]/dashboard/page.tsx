import { requireEmployeeAccess } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper"

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Authentifie, redirige client/partner vers leur espace, et bloque les
  // employés "member" non confirmés (is_staff = true requis).
  await requireEmployeeAccess(locale);

  return (
    <ErrorBoundary>
      <DashboardClientWrapper />
    </ErrorBoundary>
  )
}