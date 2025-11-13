import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { ClientDashboardView } from "@/components/client/client-dashboard-view"

export default async function ClientDashboardPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await requireRole(["client"], locale)
  const supabase = await createClient()

  // Récupérer les lofts disponibles avec photos
  const { data: lofts } = await supabase
    .from("lofts")
    .select(`
      *,
      loft_photos (
        id,
        photo_url,
        display_order
      )
    `)
    .eq("status", "available")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(6)

  // Récupérer les réservations du client
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      lofts (
        id,
        name,
        address,
        price_per_night,
        loft_photos (
          photo_url,
          display_order
        )
      )
    `)
    .eq("client_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <ClientDashboardView
      lofts={lofts || []}
      bookings={bookings || []}
      locale={locale}
      clientName={session.user.full_name || session.user.email}
    />
  )
}
