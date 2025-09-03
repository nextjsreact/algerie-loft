import { createClient } from "@/utils/supabase/server"

export default async function TestEditPage() {
  const supabase = await createClient()

  try {
    // Test simple de récupération d'un loft
    const { data: lofts, error } = await supabase
      .from("lofts")
      .select("*")
      .limit(1)

    if (error) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-red-600">Erreur Supabase</h1>
          <pre className="mt-4 p-4 bg-red-100 rounded">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )
    }

    if (!lofts || lofts.length === 0) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-yellow-600">Aucun loft trouvé</h1>
          <p className="mt-4">La base de données ne contient aucun loft.</p>
        </div>
      )
    }

    const loft = lofts[0]

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-green-600">Test réussi !</h1>
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h2 className="font-bold">Loft trouvé :</h2>
          <p><strong>ID :</strong> {loft.id}</p>
          <p><strong>Nom :</strong> {loft.name}</p>
          <p><strong>Adresse :</strong> {loft.address}</p>
          <p><strong>Prix :</strong> {loft.price_per_month} DA</p>
        </div>
        
        <div className="mt-6">
          <a 
            href={`/lofts/${loft.id}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Aller à la page d'édition
          </a>
        </div>
      </div>
    )

  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Erreur générale</h1>
        <pre className="mt-4 p-4 bg-red-100 rounded">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    )
  }
}