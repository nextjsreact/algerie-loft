import { requireAuth } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { ModernDashboard } from "@/components/dashboard/modern-dashboard"

export default async function DashboardTestNextIntlPage() {
  // Temporarily bypass requireAuth for testing purposes
  // const session = await requireAuth();

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <ModernDashboard />
      </div>
    </ErrorBoundary>
  )
}