import { requireRole } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { PendingPartnersClient } from "@/components/partner/pending-partners-client"

export default async function PendingPartnersPage() {
  // Seuls les admin et executive peuvent accéder à cette page
  const session = await requireRole(['admin', 'executive']);

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <PendingPartnersClient />
      </div>
    </ErrorBoundary>
  )
}