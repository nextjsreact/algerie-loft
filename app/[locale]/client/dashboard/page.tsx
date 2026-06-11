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

  // Même logique que /api/public/featured-lofts pour les photos
  const { data: photos } = await supabase
    .from('loft_photos')
    .select('loft_id, url, is_cover, mime_type')
    .order('is_cover', { ascending: false })
    .order('created_at', { ascending: true })

  const photoMap = new Map<string, string>()
  const mimeMap = new Map<string, string>()
  photos?.forEach((p: any) => {
    if (p.is_cover === true) {
      photoMap.set(p.loft_id, p.url)
      mimeMap.set(p.loft_id, p.mime_type || '')
    }
  })
  photos?.forEach((p: any) => {
    if (!photoMap.has(p.loft_id)) {
      photoMap.set(p.loft_id, p.url)
      mimeMap.set(p.loft_id, p.mime_type || '')
    }
  })

  const validLoftIds = Array.from(photoMap.keys()).filter(id => {
    const mime = mimeMap.get(id) || ''
    const url = photoMap.get(id) || ''
    const isHeic = mime.includes('heic') || mime.includes('heif') ||
                   url.toLowerCase().includes('.heic') || url.toLowerCase().includes('.heif')
    return !isHeic
  })

  const { data: loftsData } = await supabase
    .from('lofts')
    .select('id, name, address, description, price_per_night, zone_area_id, is_published, created_at, zone_areas!lofts_zone_area_id_fkey(name)')
    .eq('status', 'available')
    .in('id', validLoftIds)
    .order('is_published', { ascending: false })
    .order('created_at', { ascending: false })

  const lofts = (loftsData || []).map((l: any) => ({
    id: l.id,
    name: l.name,
    address: l.address || '',
    description: l.description || '',
    price_per_night: l.price_per_night || 0,
    zone: (l.zone_areas as any)?.name || l.address?.split(',')[0] || '',
    photo: photoMap.get(l.id) || '',
    is_published: l.is_published,
    created_at: l.created_at,
  }))

  // Récupérer les réservations du client
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("*")
    .eq("client_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const loftIds = bookingsData?.map(b => b.loft_id).filter(Boolean) || []
  let bookingLoftsData: any[] = []
  
  if (loftIds.length > 0) {
    const { data } = await supabase
      .from("lofts")
      .select("*, zone_areas!lofts_zone_area_id_fkey(name)")
      .in("id", loftIds)
    bookingLoftsData = data || []
  }

  const bookings = (bookingsData || []).map(booking => {
    const loft = bookingLoftsData?.find(l => l.id === booking.loft_id)
    const loftPhotos = photos?.filter(p => p.loft_id === booking.loft_id) || []
    return {
      ...booking,
      lofts: loft ? { ...loft, loft_photos: loftPhotos } : null
    }
  })

  return (
    <ClientDashboardView
      lofts={lofts}
      bookings={bookings || []}
      locale={locale}
      clientName={session.user.full_name || session.user.email}
    />
  )
}
