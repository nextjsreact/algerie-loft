import { requireRole } from "@/lib/auth"
import { ErrorBoundary } from "@/components/error-boundary"
import { PlatformSettingsClient } from "@/components/platform/platform-settings-client"

export default async function PlatformSettingsPage() {
  // Seuls les admin peuvent accéder à cette page
  const session = await requireRole(['admin']);

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <PlatformSettingsClient />
      </div>
    </ErrorBoundary>
  )
}