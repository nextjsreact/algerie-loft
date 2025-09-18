import { requireAuth } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { DashboardClientWrapper } from "@/components/dashboard/dashboard-client-wrapper"

export default async function DashboardPage() {
  // This is the main dashboard page after login.
  const session = await requireAuth();

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <DashboardClientWrapper />
      </div>
    </ErrorBoundary>
  )
}