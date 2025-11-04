import { requireRole } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { ManageDisputesClient } from "@/components/disputes/manage-disputes-client"

export default async function ManageDisputesPage() {
  // Seuls les admin et executive peuvent accéder à cette page
  const session = await requireRole(['admin', 'executive']);

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <ManageDisputesClient />
      </div>
    </ErrorBoundary>
  )
}