import { requireRole } from "@/lib/auth"
import type { Database, LoftWithRelations } from "@/lib/types"
import { LoftsWrapper } from "@/components/lofts/lofts-wrapper"
import { createClient } from '@/utils/supabase/server'

type Loft = Database['public']['Tables']['lofts']['Row']
type LoftOwner = Database['public']['Tables']['loft_owners']['Row']
type ZoneArea = Database['public']['Tables']['zone_areas']['Row']

export default async function LoftsPage() {
  const session = await requireRole(["admin", "manager"]);
  const supabase = await createClient()

  try {
    // Récupération des lofts sans les relations pour éviter l'ambiguïté
    const { data: loftsData, error: loftsError } = await supabase
      .from("lofts")
      .select("*")
      .order("created_at", { ascending: false })

    // Récupération des propriétaires
    const { data: ownersData, error: ownersError } = await supabase
      .from("loft_owners")
      .select("*")
      .order("name")

    // Récupération des zones
    const { data: zoneAreasData, error: zoneAreasError } = await supabase
      .from("zone_areas")
      .select("*")
      .order("name")

    if (loftsError) {
      console.error("Lofts data error:", loftsError);
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">😞</span>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Oups ! Une erreur s'est produite</h1>
            <p className="text-gray-600 mb-4">
              Impossible de charger les lofts pour le moment.
            </p>
            <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
              {loftsError.message}
            </p>
          </div>
        </div>
      )
    }

    // Créer un map des propriétaires et zones pour les relations
    const ownersMap = new Map((ownersData || []).map(owner => [owner.id, owner.name]))
    const zonesMap = new Map((zoneAreasData || []).map(zone => [zone.id, zone.name]))

    const lofts = (loftsData || []).map(loft => ({
      ...loft,
      owner_name: ownersMap.get(loft.owner_id) || null,
      zone_area_name: zonesMap.get(loft.zone_area_id) || null
    })) as LoftWithRelations[]

    const owners = ownersData || []
    const zoneAreas = zoneAreasData || []
    const isAdmin = session.user.role === "admin"
    const canManage = ["admin", "manager"].includes(session.user.role)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <LoftsWrapper
            lofts={lofts}
            owners={owners}
            zoneAreas={zoneAreas}
            isAdmin={isAdmin}
            canManage={canManage}
          />
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error fetching lofts page data:", error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">🚨</span>
          </div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Erreur système</h1>
          <p className="text-gray-600 mb-6">
            Une erreur inattendue s'est produite lors du chargement de la page.
          </p>
          <details className="text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
              Détails techniques
            </summary>
            <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-32">
              {error instanceof Error ? error.message : String(error)}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
