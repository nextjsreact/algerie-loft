import { requireRole } from '@/lib/auth'
import { PartnerSidebar } from '@/components/partner/partner-sidebar'

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure user is authenticated and has partner role
  await requireRole(['partner'])

  return (
    <div className="flex h-screen bg-gray-50">
      <PartnerSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}