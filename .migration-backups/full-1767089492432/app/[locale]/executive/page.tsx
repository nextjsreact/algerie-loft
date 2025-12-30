import { requireRole } from "@/lib/auth"
import { ExecutiveDashboard } from "@/components/executive/executive-dashboard"

export default async function ExecutivePage() {
  const session = await requireRole(["executive"])

  return (
    <div className="min-h-screen">
      <ExecutiveDashboard session={session} />
    </div>
  )
}