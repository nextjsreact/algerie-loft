import { requireRole } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { OpenDisputesClient } from "@/components/disputes/open-disputes-client"

export default async function OpenDisputesPage() {
  // Admin, executive et manager peuvent accéder à cette page
  const session = await requireRole(['admin', 'executive', 'manager']);

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <OpenDisputesClient />
      </div>
    </ErrorBoundary>
  )
}