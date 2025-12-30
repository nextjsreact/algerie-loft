import { requireRole } from '@/lib/auth'

export default async function SuperuserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure user is authenticated and has superuser role
  await requireRole(['superuser'])

  // Le sidebar sera géré automatiquement par ClientProviders
  // car il détecte le rôle superuser et affiche le bon sidebar
  return <>{children}</>
}