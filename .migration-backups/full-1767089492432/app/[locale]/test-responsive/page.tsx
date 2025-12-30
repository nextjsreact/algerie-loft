import ResponsiveDebugger from '@/components/debug/ResponsiveDebugger'

export default function TestResponsivePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Test Responsive - Élimination du Scroll Horizontal</h1>
          <p className="text-gray-600">
            Détectez et corrigez les problèmes de scroll horizontal pour une meilleure UX
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Débogueur */}
          <ResponsiveDebugger />
          
          {/* Guide */}
          <div className="space-y-6">
            <div className="bg-red-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-red-800 mb-4">
                ❌ Pourquoi éviter le scroll horizontal
              </h2>
              <ul className="text-red-700 space-y-2">
                <li>• <strong>Frustrant</strong> : Navigation non-intuitive</li>
                <li>• <strong>Mobile</strong> : Très difficile à utiliser</li>
                <li>• <strong>Accessibilité</strong> : Problématique</li>
                <li>• <strong>SEO</strong> : Pénalisé par Google</li>
                <li>• <strong>Conversion</strong> : Utilisateurs quittent la page</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-green-800 mb-4">
                ✅ Solutions recommandées
              </h2>
              <ul className="text-green-700 space-y-2">
                <li>• <strong>Grilles responsive</strong> : auto-fit, minmax</li>
                <li>• <strong>Flexbox wrap</strong> : flex-wrap: wrap</li>
                <li>• <strong>Tableaux scrollables</strong> : overflow-x: auto sur conteneur</li>
                <li>• <strong>Images responsive</strong> : max-width: 100%</li>
                <li>• <strong>Box-sizing</strong> : border-box partout</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                🔧 Correction immédiate
              </h2>
              <p className="text-blue-700 mb-3">
                Si vous avez un scroll horizontal maintenant :
              </p>
              <ol className="text-blue-700 space-y-1 list-decimal list-inside">
                <li>Cliquez sur "Mode debug" pour voir les éléments problématiques</li>
                <li>Cliquez sur "Correction rapide" pour un fix temporaire</li>
                <li>Identifiez les éléments avec bordure rouge</li>
                <li>Corrigez le CSS de ces éléments</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Exemples de problèmes courants */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Exemples de Problèmes Courants</h2>
          
          {/* Exemple 1: Grille trop large */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">❌ Grille trop large (problématique)</h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Array.from({length: 5}, (_, i) => (
                <div key={i} className="bg-red-100 p-2 text-center text-sm min-w-[150px]">
                  Colonne {i + 1}
                </div>
              ))}
            </div>
            <p className="text-sm text-red-600">Cette grille force 5 colonnes même sur mobile</p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">✅ Grille responsive (correcte)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
              {Array.from({length: 5}, (_, i) => (
                <div key={i} className="bg-green-100 p-2 text-center text-sm">
                  Colonne {i + 1}
                </div>
              ))}
            </div>
            <p className="text-sm text-green-600">Cette grille s'adapte : 1 col mobile, 3 tablette, 5 desktop</p>
          </div>

          {/* Exemple 2: Tableau responsive */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">✅ Tableau responsive</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2">Nom</th>
                    <th className="border border-gray-300 px-4 py-2">Adresse</th>
                    <th className="border border-gray-300 px-4 py-2">Prix</th>
                    <th className="border border-gray-300 px-4 py-2">Statut</th>
                    <th className="border border-gray-300 px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Loft Marina</td>
                    <td className="border border-gray-300 px-4 py-2">Sidi Fredj, Alger</td>
                    <td className="border border-gray-300 px-4 py-2">18,000 DA</td>
                    <td className="border border-gray-300 px-4 py-2">Disponible</td>
                    <td className="border border-gray-300 px-4 py-2">Modifier</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-green-600 mt-2">Tableau dans un conteneur scrollable</p>
          </div>
        </div>
      </div>
    </div>
  )
}