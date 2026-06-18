import { requireRole } from "@/lib/auth"

export default async function ReservationsLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  await requireRole(["admin", "manager"], locale)
  return <>{children}</>
}
