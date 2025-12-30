import { ErrorBoundary } from "@/components/error-boundary"
import { ModernDashboard } from "@/components/dashboard/modern-dashboard"

export default async function ModernDashboardPage() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <ModernDashboard />
      </div>
    </ErrorBoundary>
  )
}