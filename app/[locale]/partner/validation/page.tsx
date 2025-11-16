import { requireRole } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { PartnerValidationClient } from "@/components/partner/partner-validation-client"

export default async function PartnerValidationPage() {
  // Seuls les admin et executive peuvent accéder à cette page
  const session = await requireRole(['admin', 'executive']);

  return (
    <ErrorBoundary>
      <PartnerValidationClient />
    </ErrorBoundary>
  )
}