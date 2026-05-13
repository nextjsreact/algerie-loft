'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export default function Beds24ImportPage() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const startImport = async () => {
    if (!confirm('Voulez-vous importer tous les listings Airbnb non mappés dans Beds24?\n\nCela peut prendre plusieurs minutes.')) {
      return
    }

    setImporting(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await fetch('/api/beds24/import-all', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult(data.results)
      } else {
        setError(data.error || 'Import failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Import Airbnb Listings</h1>
          <p className="text-gray-600 mt-2">
            Importez automatiquement tous vos listings Airbnb dans Beds24
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import automatique
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Ce que fait cet import:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Récupère tous vos listings Airbnb depuis Beds24</li>
              <li>✓ Crée automatiquement une propriété pour chaque listing non mappé</li>
              <li>✓ Ignore les propriétés déjà existantes</li>
              <li>✓ Configure les paramètres de base (check-in, check-out, devise)</li>
            </ul>
          </div>

          <Button 
            onClick={startImport} 
            disabled={importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Import en cours... Veuillez patienter
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Démarrer l'import automatique
              </>
            )}
          </Button>

          {importing && (
            <div className="space-y-2">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-center text-gray-600">
                Import en cours... Cela peut prendre plusieurs minutes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Import terminé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{result.success}</div>
                <div className="text-sm text-green-700">Créées</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-gray-600">{result.skipped}</div>
                <div className="text-sm text-gray-700">Ignorées</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-red-700">Échouées</div>
              </div>
            </div>

            {result.created && result.created.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Propriétés créées ({result.created.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.created.map((prop: any, idx: number) => (
                    <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                      <div className="font-medium">{prop.name}</div>
                      <div className="text-xs text-gray-600">
                        Beds24 ID: {prop.id} | Airbnb ID: {prop.airbnbId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Erreurs ({result.errors.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.errors.map((err: any, idx: number) => (
                    <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                      <div className="font-medium">{err.name}</div>
                      <div className="text-xs text-red-600">{err.error}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button 
                onClick={() => window.location.href = '/fr/admin/beds24-test'}
                variant="outline"
                className="w-full"
              >
                Voir les propriétés importées
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
