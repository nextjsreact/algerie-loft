import { requireRole } from '@/lib/auth'
import Heartbeat from '@/components/admin/heartbeat'

export default async function SuperuserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ensure user is authenticated and has superuser role
  await requireRole(['superuser'])

  return (
    <>
      <Heartbeat />
      {children}
    </>
  )
}