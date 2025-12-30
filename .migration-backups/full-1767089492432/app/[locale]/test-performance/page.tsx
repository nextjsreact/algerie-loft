import { Suspense } from 'react'
import FastImage from '@/components/ui/FastImage'
import { FastCardLoading } from '@/components/ui/FastLoading'
import QuickPerformanceTest from '@/components/debug/QuickPerformanceTest'
import OptimizedSearchExample from '@/components/examples/OptimizedSearchExample'

// Composant de test avec les optimisations
function OptimizedContent() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Test des Optimisations de Performance</h1>
      
      {/* Test des images optimisées */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Images Optimisées</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FastImage 
            src="/logo.jpg" 
            alt="Logo Loft Algérie" 
            width={300} 
            height={200} 
            priority 
            className="rounded-lg"
          />
          <FastImage 
            src="/placeholder.jpg" 
            alt="Placeholder" 
            width={300} 
            height={200} 
            className="rounded-lg"
          />
          <FastImage 
            src="/placeholder.svg" 
            alt="Placeholder SVG" 
            width={300} 
            height={200} 
            className="rounded-lg"
          />
        </div>
      </section>

      {/* Test des états de chargement */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">États de Chargement Optimisés</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Chargement de carte</h3>
            <FastCardLoading />
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Contenu chargé</h3>
            <div className="space-y-2">
              <div className="h-6 bg-blue-100 rounded flex items-center px-3">
                <span className="text-blue-800 font-medium">Titre du loft</span>
              </div>
              <div className="h-4 bg-gray-100 rounded flex items-center px-3">
                <span className="text-gray-600 text-sm">Adresse du loft</span>
              </div>
              <div className="h-4 bg-green-100 rounded flex items-center px-3">
                <span className="text-green-800 text-sm">Prix: 18,000 DA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Test de recherche optimisée */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recherche Optimisée</h2>
        <OptimizedSearchExample />
      </section>

      {/* Test de performance en temps réel */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Test de Performance</h2>
        <QuickPerformanceTest />
      </section>
    </div>
  )
}

export default function TestPerformancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<FastCardLoading />}>
        <OptimizedContent />
      </Suspense>
    </div>
  )
}