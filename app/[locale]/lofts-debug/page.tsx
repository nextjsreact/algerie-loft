import { createClient } from '@/utils/supabase/server'
import { requireRole } from '@/lib/auth'

export default async function LoftsDebugPage() {
  try {
    const session = await requireRole(["admin", "manager", "member"])
    const supabase = await createClient()

    // Test simple de récupération des lofts
    const { data: lofts, error } = await supabase
      .from('lofts')
      .select('id, name, status, address')
      .limit(10)

    if (error) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de base de données</h1>
          <pre className="bg-red-50 p-4 rounded">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )
    }

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug - Liste des Lofts</h1>
        <p className="mb-4">Utilisateur connecté : {session.user.email} ({session.user.role})</p>
        <p className="mb-4">Nombre de lofts trouvés : {lofts?.length || 0}</p>
        
        {lofts && lofts.length > 0 ? (
          <div className="space-y-4">
            {lofts.map((loft) => (
              <div key={loft.id} className="border p-4 rounded">
                <h3 className="font-bold">{loft.name}</h3>
                <p>ID: {loft.id}</p>
                <p>Statut: {loft.status}</p>
                <p>Adresse: {loft.address}</p>
                <a 
                  href={`/ar/lofts/${loft.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Voir les détails →
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p>Aucun loft trouvé</p>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur générale</h1>
        <pre className="bg-red-50 p-4 rounded">{String(error)}</pre>
      </div>
    )
  }
}