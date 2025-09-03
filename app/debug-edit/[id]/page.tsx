import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { DebugLoftForm } from "@/components/forms/debug-loft-form"

export default async function DebugEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  console.log('🔍 Debug Edit Page - ID:', id)

  try {
    // Récupération du loft
    const { data: loft, error: loftError } = await supabase
      .from("lofts")
      .select("*")
      .eq("id", id)
      .single()

    console.log('🏠 Loft récupéré:', loft ? 'OK' : 'ERREUR')
    if (loftError) console.error('❌ Erreur loft:', loftError)

    if (loftError || !loft) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-600">Loft non trouvé</h1>
          <p className="mt-4">ID recherché: {id}</p>
          {loftError && (
            <pre className="mt-4 p-4 bg-red-100 rounded text-sm">
              {JSON.stringify(loftError, null, 2)}
            </pre>
          )}
        </div>
      )
    }

    // Récupération des données associées
    const { data: owners } = await supabase.from("loft_owners").select("*")
    const { data: zoneAreas } = await supabase.from("zone_areas").select("*")
    const { data: internetTypes } = await supabase.from("internet_connection_types").select("*")

    console.log('👥 Propriétaires:', owners?.length || 0)
    console.log('🗺️ Zones:', zoneAreas?.length || 0)
    console.log('🌐 Internet:', internetTypes?.length || 0)

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">🔧 Page de Debug - Édition Loft</h1>
          <p className="text-gray-600 mt-2">Cette page teste le formulaire d'édition sans les traductions</p>
        </div>

        <DebugLoftForm
          loft={loft}
          owners={owners || []}
          zoneAreas={zoneAreas || []}
          internetConnectionTypes={internetTypes || []}
          onSubmit={async (data) => {
            console.log('📝 Données soumises:', data)
            // Simulation de mise à jour
            const { error } = await supabase
              .from("lofts")
              .update(data)
              .eq("id", id)
            
            if (error) {
              console.error('❌ Erreur mise à jour:', error)
              throw error
            }
            
            console.log('✅ Mise à jour réussie')
          }}
        />
      </div>
    )

  } catch (error) {
    console.error('💥 Erreur générale:', error)
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Erreur générale</h1>
        <pre className="mt-4 p-4 bg-red-100 rounded text-sm">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    )
  }
}