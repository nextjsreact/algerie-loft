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

  // Récupérer les photos pour déterminer la cover
  const { data: photosData } = await supabase
    .from("loft_photos")
    .select("loft_id, url, is_cover, mime_type")
    .order("is_cover", { ascending: false })
    .order("created_at", { ascending: true })

  // Construire la map loft_id -> meilleure photo (cover d'abord, puis première photo)
  const photoMap = new Map<string, string>()
  const mimeMap = new Map<string, string>()
  photosData?.forEach((p: any) => {
    if (p.is_cover === true) {
      photoMap.set(p.loft_id, p.url)
      mimeMap.set(p.loft_id, p.mime_type || '')
    }
  })
  photosData?.forEach((p: any) => {
    if (!photoMap.has(p.loft_id)) {
      photoMap.set(p.loft_id, p.url)
      mimeMap.set(p.loft_id, p.mime_type || '')
    }
  })

  // Filtrer les lofts HEIC (non affichables dans les navigateurs)
  const validLoftIds = Array.from(photoMap.keys()).filter(id => {
    const mime = mimeMap.get(id) || ''
    const url = photoMap.get(id) || ''
    const isHeic = mime.includes('heic') || mime.includes('heif') ||
                   url.toLowerCase().includes('.heic') || url.toLowerCase().includes('.heif')
    return !isHeic
  })

  // Récupérer les lofts avec jointure zone_areas
  const { data: loftsData } = await supabase
    .from("lofts")
    .select("id, name, address, description, price_per_night, zone_area_id, is_published, created_at, zone_areas!lofts_zone_area_id_fkey(name)")
    .eq("status", "available")
    .in("id", validLoftIds)
    .order("created_at", { ascending: false })
    .limit(20)

  // Combiner lofts avec photo et zone
  const lofts = (loftsData || []).map(loft => ({
    id: loft.id,
    name: loft.name,
    address: loft.address || '',
    description: loft.description || '',
    price_per_night: loft.price_per_night || 0,
    zone: (loft.zone_areas as any)?.name || loft.address?.split(',')[0] || '',
    photo: photoMap.get(loft.id) || '',
    average_rating: null,
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
      .select("*, zone_areas!lofts_zone_area_id_fkey(name)")
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
