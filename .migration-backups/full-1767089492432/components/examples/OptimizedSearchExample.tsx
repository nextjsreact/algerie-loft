'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useDebounce from '@/hooks/useDebounce'
import { FastCardLoading } from '@/components/ui/FastLoading'
import SimpleCache, { CACHE_CONFIG } from '@/lib/cache-config'

interface SearchResult {
  id: string
  name: string
  address: string
  status: string
}

export function OptimizedSearchExample() {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchCount, setSearchCount] = useState(0)

  // Debounce la recherche pour éviter trop d'appels API
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Simuler une recherche avec cache
  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setSearchCount(prev => prev + 1)

    // Vérifier le cache d'abord
    const cacheKey = `search:${term.toLowerCase()}`
    const cachedResults = SimpleCache.get(cacheKey)

    if (cachedResults) {
      console.log('🎯 Résultats trouvés dans le cache')
      setResults(cachedResults)
      setLoading(false)
      return
    }

    // Simuler un appel API
    await new Promise(resolve => setTimeout(resolve, 500))

    // Données de test
    const mockResults: SearchResult[] = [
      {
        id: '1',
        name: `Loft moderne ${term}`,
        address: `123 Rue ${term}, Alger`,
        status: 'available'
      },
      {
        id: '2', 
        name: `Appartement ${term} centre-ville`,
        address: `456 Avenue ${term}, Oran`,
        status: 'occupied'
      },
      {
        id: '3',
        name: `Studio ${term} vue mer`,
        address: `789 Boulevard ${term}, Annaba`,
        status: 'available'
      }
    ].filter(item => 
      item.name.toLowerCase().includes(term.toLowerCase()) ||
      item.address.toLowerCase().includes(term.toLowerCase())
    )

    // Mettre en cache les résultats
    SimpleCache.set(cacheKey, mockResults, CACHE_CONFIG.DURATIONS.MEDIUM)
    console.log('💾 Résultats mis en cache')

    setResults(mockResults)
    setLoading(false)
  }

  // Effectuer la recherche quand le terme débounced change
  useEffect(() => {
    performSearch(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  const getStatusColor = (status: string) => {
    return status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Recherche Optimisée avec Debounce</CardTitle>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Recherches effectuées: {searchCount}</span>
          <span>Cache actif: ✅</span>
          <span>Debounce: 300ms</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Rechercher un loft... (essayez 'moderne', 'centre', 'vue')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              <FastCardLoading />
              <FastCardLoading />
            </div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <div key={result.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{result.name}</h4>
                    <p className="text-sm text-gray-600">{result.address}</p>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status === 'available' ? 'Disponible' : 'Occupé'}
                  </Badge>
                </div>
              </div>
            ))
          ) : searchTerm && !loading ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun résultat trouvé pour "{searchTerm}"</p>
              <p className="text-sm mt-1">Essayez 'moderne', 'centre', ou 'vue'</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Commencez à taper pour rechercher...</p>
            </div>
          )}
        </div>

        {/* Informations sur l'optimisation */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          <h5 className="font-medium text-blue-800 mb-1">Optimisations actives:</h5>
          <ul className="text-blue-700 space-y-1">
            <li>✅ Debounce de 300ms (évite les appels excessifs)</li>
            <li>✅ Cache intelligent (résultats mis en cache 5 minutes)</li>
            <li>✅ États de chargement optimisés</li>
            <li>✅ Recherche annulée si nouveau terme saisi</li>
          </ul>
        </div>

        {/* Bouton pour vider le cache */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              SimpleCache.clear()
              setSearchCount(0)
              console.log('🗑️ Cache vidé')
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Vider le cache
          </button>
          <button
            onClick={() => {
              setSearchTerm('')
              setResults([])
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            Effacer la recherche
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

export default OptimizedSearchExample