import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { ClientBookingsView } from "@/components/client/client-bookings-view"

export default async function ClientBookingsPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await requireRole(["client"], locale)
  const supabase = await createClient(true)

  // Récupérer les réservations du client
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      lofts (
        id,
        name,
        address,
        loft_photos (
          url,
          order_index
        )
      )
    `)
    .eq("client_id", session.user.id)
    .order("created_at", { ascending: false })

  return (
    <ClientBookingsView
      bookings={bookings || []}
      locale={locale}
    />
  )
}
