import { createClient } from '@/utils/supabase/server'

export default async function DebugLoftsPage() {
  const supabase = await createClient()

  try {
    // Check lofts table
    const { data: lofts, error: loftsError, count: loftsCount } = await supabase
      .from("lofts")
      .select("*", { count: 'exact' })

    // Check owners table
    const { data: owners, error: ownersError, count: ownersCount } = await supabase
      .from("loft_owners")
      .select("*", { count: 'exact' })

    // Check zone areas table
    const { data: zoneAreas, error: zoneAreasError, count: zoneAreasCount } = await supabase
      .from("zone_areas")
      .select("*", { count: 'exact' })

    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Database Debug Information</h1>
        
        <div className="space-y-8">
          {/* Lofts Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Lofts Table</h2>
            <p className="mb-4">Count: {loftsCount || 0}</p>
            {loftsError ? (
              <div className="bg-red-100 p-4 rounded text-red-700">
                <strong>Error:</strong> {loftsError.message}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <pre className="bg-gray-100 p-4 rounded text-sm">
                  {JSON.stringify(lofts, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Owners Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Loft Owners Table</h2>
            <p className="mb-4">Count: {ownersCount || 0}</p>
            {ownersError ? (
              <div className="bg-red-100 p-4 rounded text-red-700">
                <strong>Error:</strong> {ownersError.message}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <pre className="bg-gray-100 p-4 rounded text-sm">
                  {JSON.stringify(owners, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Zone Areas Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Zone Areas Table</h2>
            <p className="mb-4">Count: {zoneAreasCount || 0}</p>
            {zoneAreasError ? (
              <div className="bg-red-100 p-4 rounded text-red-700">
                <strong>Error:</strong> {zoneAreasError.message}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <pre className="bg-gray-100 p-4 rounded text-sm">
                  {JSON.stringify(zoneAreas, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-red-600">Database Connection Error</h1>
        <div className="bg-red-100 p-6 rounded-lg">
          <pre className="text-red-700">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    )
  }
}