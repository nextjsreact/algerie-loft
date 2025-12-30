import { requireRole } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { ClientSearchView } from "@/components/client/client-search-view"

export default async function ClientSearchPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const { locale } = await params
  const search = await searchParams
  await requireRole(["client"], locale)
  
  const supabase = await createClient()

  // Construire la requête de recherche
  let query = supabase
    .from("lofts")
    .select(`
      *,
      loft_photos (
        id,
        photo_url,
        display_order
      ),
      zone_areas (
        name
      )
    `)
    .eq("status", "available")
    .eq("is_published", true)

  // Filtrer par destination si fournie
  if (search.destination) {
    query = query.or(`address.ilike.%${search.destination}%,name.ilike.%${search.destination}%`)
  }

  // Filtrer par nombre de voyageurs
  if (search.guests) {
    query = query.gte("max_guests", parseInt(search.guests))
  }

  const { data: lofts } = await query.order("created_at", { ascending: false })

  return (
    <ClientSearchView
      lofts={lofts || []}
      searchParams={search}
      locale={locale}
    />
  )
}
