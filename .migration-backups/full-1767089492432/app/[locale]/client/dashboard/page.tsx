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
  const supabase = await createClient(true)

  // Récupérer les lofts disponibles
  const { data: loftsData } = await supabase
    .from("lofts")
    .select("*")
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(6)

  // Récupérer les photos
  const { data: photosData } = await supabase
    .from("loft_photos")
    .select("*")

  // Combiner lofts avec photos
  const lofts = (loftsData || []).map(loft => ({
    ...loft,
    loft_photos: photosData?.filter(p => p.loft_id === loft.id) || []
  }))

  // Récupérer les réservations du client
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("*")
    .eq("client_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Récupérer les lofts des réservations
  const loftIds = bookingsData?.map(b => b.loft_id).filter(Boolean) || []
  let bookingLoftsData = []
  
  if (loftIds.length > 0) {
    const { data } = await supabase
      .from("lofts")
      .select("*")
      .in("id", loftIds)
    bookingLoftsData = data || []
  }

  // Combiner bookings avec lofts et photos
  const bookings = (bookingsData || []).map(booking => {
    const loft = bookingLoftsData?.find(l => l.id === booking.loft_id)
    const loftPhotos = photosData?.filter(p => p.loft_id === booking.loft_id) || []
    
    return {
      ...booking,
      lofts: loft ? {
        ...loft,
        loft_photos: loftPhotos
      } : null
    }
  })

  return (
    <ClientDashboardView
      lofts={lofts || []}
      bookings={bookings || []}
      locale={locale}
      clientName={session.user.full_name || session.user.email}
    />
  )
}
