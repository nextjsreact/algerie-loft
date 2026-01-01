import { ErrorBoundary } from "@/components/error-boundary"
import { ModernDashboard } from "@/components/dashboard/modern-dashboard"

export default async function ModernDashboardPage() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <ModernDashboard />
        </div>
      </div>
    </ErrorBoundary>
  )
}