'use client'

import { useState } from 'react'
import ResponsiveDebugger from '@/components/debug/ResponsiveDebugger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Smartphone, Tablet, Monitor } from 'lucide-react'

export default function TestResponsivePage() {
  const [showProblematicElements, setShowProblematicElements] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Test Responsive - Élimination du Scroll Horizontal
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Cette page vous permet de tester et déboguer les problèmes de scroll horizontal. 
            Utilisez le débogueur ci-dessous et redimensionnez votre fenêtre pour tester différentes tailles d'écran.
          </p>
        </div>

        {/* Débogueur Responsive */}
        <div className="flex justify-center">
          <ResponsiveDebugger />
        </div>

        {/* Exemples de bonnes pratiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              ✅ Exemples de Bonnes Pratiques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Grille responsive */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Grille Responsive</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-green-100 p-4 rounded-lg text-center">
                    <div className="text-green-800 font-medium">Carte {i}</div>
                    <div className="text-green-600 text-sm">Responsive</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Images responsive */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Images Responsive</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-100 aspect-video rounded-lg flex items-center justify-center">
                  <span className="text-blue-800">Image 1 (max-w-full)</span>
                </div>
                <div className="bg-blue-100 aspect-video rounded-lg flex items-center justify-center">
                  <span className="text-blue-800">Image 2 (max-w-full)</span>
                </div>
                <div className="bg-blue-100 aspect-video rounded-lg flex items-center justify-center">
                  <span className="text-blue-800">Image 3 (max-w-full)</span>
                </div>
              </div>
            </div>

            {/* Tableau responsive */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Tableau Responsive</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ville</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[1, 2, 3].map(i => (
                      <tr key={i}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Utilisateur {i}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">user{i}@example.com</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">+213 123 456 78{i}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Alger</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button size="sm" variant="outline">Voir</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Flexbox responsive */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Flexbox Responsive</h3>
              <div className="flex flex-wrap gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex-1 min-w-[200px] bg-purple-100 p-4 rounded-lg text-center">
                    <div className="text-purple-800 font-medium">Élément {i}</div>
                    <div className="text-purple-600 text-sm">Flex responsive</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exemples problématiques (optionnel) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              ❌ Exemples Problématiques (pour test)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Button 
                onClick={() => setShowProblematicElements(!showProblematicElements)}
                variant={showProblematicElements ? "destructive" : "outline"}
              >
                {showProblematicElements ? 'Masquer' : 'Afficher'} les éléments problématiques
              </Button>
            </div>
            
            {showProblematicElements && (
              <div className="space-y-6 p-4 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="text-red-800 font-medium mb-4">
                  ⚠️ Ces éléments vont créer un scroll horizontal (pour test uniquement)
                </div>
                
                {/* Élément trop large */}
                <div>
                  <h4 className="text-red-700 font-medium mb-2">Élément avec largeur fixe trop grande</h4>
                  <div className="bg-red-200 p-4 rounded" style={{ width: '1500px' }}>
                    Cet élément fait 1500px de large et va créer un scroll horizontal
                  </div>
                </div>

                {/* Grille non-responsive */}
                <div>
                  <h4 className="text-red-700 font-medium mb-2">Grille non-responsive</h4>
                  <div className="grid grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="bg-red-200 p-4 rounded text-center min-w-[150px]">
                        Col {i}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tableau sans conteneur scrollable */}
                <div>
                  <h4 className="text-red-700 font-medium mb-2">Tableau sans conteneur scrollable</h4>
                  <table className="border-collapse border border-red-300" style={{ minWidth: '1200px' }}>
                    <thead>
                      <tr className="bg-red-200">
                        <th className="border border-red-300 p-2">Colonne très longue 1</th>
                        <th className="border border-red-300 p-2">Colonne très longue 2</th>
                        <th className="border border-red-300 p-2">Colonne très longue 3</th>
                        <th className="border border-red-300 p-2">Colonne très longue 4</th>
                        <th className="border border-red-300 p-2">Colonne très longue 5</th>
                        <th className="border border-red-300 p-2">Colonne très longue 6</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-red-300 p-2">Données longues 1</td>
                        <td className="border border-red-300 p-2">Données longues 2</td>
                        <td className="border border-red-300 p-2">Données longues 3</td>
                        <td className="border border-red-300 p-2">Données longues 4</td>
                        <td className="border border-red-300 p-2">Données longues 5</td>
                        <td className="border border-red-300 p-2">Données longues 6</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Instructions de Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Test Mobile (320px - 767px)
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Ouvrez les outils développeur (F12)</li>
                  <li>• Activez le mode responsive (Ctrl+Shift+M)</li>
                  <li>• Testez à 320px, 375px, 414px</li>
                  <li>• Vérifiez qu'il n'y a pas de scroll horizontal</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Tablet className="h-4 w-4" />
                  Test Tablette (768px - 1023px)
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Testez à 768px, 834px, 1024px</li>
                  <li>• Vérifiez l'adaptation des grilles</li>
                  <li>• Testez en mode portrait et paysage</li>
                  <li>• Validez la navigation tactile</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Test Desktop (1024px+)
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Testez à 1024px, 1280px, 1920px</li>
                  <li>• Vérifiez l'utilisation de l'espace</li>
                  <li>• Testez le redimensionnement dynamique</li>
                  <li>• Validez les interactions souris</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">🔧 Utilisation du Débogueur</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Activez le mode debug pour voir les problèmes</li>
                  <li>• Utilisez "Correction rapide" pour un fix temporaire</li>
                  <li>• Identifiez les éléments qui débordent</li>
                  <li>• Appliquez les corrections CSS permanentes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Résultats attendus */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Résultats Attendus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-green-700">✅ Comportement Correct</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Aucun scroll horizontal sur aucun appareil
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Contenu s'adapte à la largeur de l'écran
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Grilles se réorganisent selon la taille
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Tableaux ont un scroll interne si nécessaire
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Images se redimensionnent automatiquement
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-red-700">❌ Problèmes à Éviter</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Scroll horizontal sur mobile
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Éléments coupés ou tronqués
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Grilles qui ne s'adaptent pas
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Tableaux qui débordent
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Images qui dépassent
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-600">
            🚀 Une fois tous les tests validés, votre site sera parfaitement responsive !
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Règle d'or : Zéro scroll horizontal = UX parfaite 📱✨
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}