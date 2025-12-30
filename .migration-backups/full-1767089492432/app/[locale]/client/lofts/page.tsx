import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { ClientLoftsView } from "@/components/client/client-lofts-view"

export default async function ClientLoftsPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await requireRole(["client"], locale)
  
  // Utiliser le service role pour bypasser RLS
  const supabase = await createClient(true)

  // Récupérer tous les lofts
  const { data: loftsData, error: loftsError } = await supabase
    .from("lofts")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (loftsError) {
    console.error('[ClientLoftsPage] Error fetching lofts:', loftsError)
  }

  // Récupérer les zones
  const { data: zonesData } = await supabase
    .from("zone_areas")
    .select("id, name")

  // Récupérer les photos
  const { data: photosData } = await supabase
    .from("loft_photos")
    .select("*")

  // Combiner les données
  const lofts = (loftsData || []).map(loft => {
    const zone = zonesData?.find(z => z.id === loft.zone_area_id)
    const photos = photosData?.filter(p => p.loft_id === loft.id) || []
    
    return {
      ...loft,
      zone_areas: zone ? { id: zone.id, name: zone.name } : undefined,
      loft_photos: photos
    }
  })

  return (
    <ClientLoftsView
      lofts={lofts || []}
      locale={locale}
    />
  )
}
