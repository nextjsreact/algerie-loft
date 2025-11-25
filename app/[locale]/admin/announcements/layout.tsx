import { requireRole } from '@/lib/auth'

export default async function AnnouncementsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure user is authenticated and has admin or superuser role
  await requireRole(['admin', 'superuser'])

  // Le sidebar sera géré automatiquement par ClientProviders
  return <>{children}</>
}
