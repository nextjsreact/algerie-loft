import { requireAuth } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
// import { ModernDashboard } from "@/components/dashboard/modern-dashboard"

export default async function DashboardTestNextIntlPage() {
  // Temporarily bypass requireAuth for testing purposes
  // const session = await requireAuth();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard Test Temporairement Indisponible</h1>
            <p className="text-gray-600">Le dashboard sera disponible après la correction des dépendances.</p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}