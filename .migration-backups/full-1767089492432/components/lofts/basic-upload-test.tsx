'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, CheckCircle, XCircle, Loader2, Database, HardDrive } from 'lucide-react'

export function BasicUploadTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [hasError, setHasError] = useState(false)

  const addResult = (message: string, isError = false) => {
    setResults(prev => [...prev, `${isError ? '❌' : '✅'} ${message}`])
    if (isError) setHasError(true)
  }

  const runBasicTests = async () => {
    setIsLoading(true)
    setResults([])
    setHasError(false)

    try {
      // Test 1: API de test simple
      addResult('Test de l\'API de base...')
      try {
        const testResponse = await fetch('/api/test-upload')
        if (testResponse.ok) {
          const testData = await testResponse.json()
          addResult(`API de test OK: ${testData.message}`)
        } else {
          addResult(`API de test échoue: ${testResponse.status}`, true)
        }
      } catch (error) {
        addResult(`Erreur API de test: ${error instanceof Error ? error.message : 'Inconnue'}`, true)
      }

      // Test 2: API de vérification DB
      addResult('Vérification de la base de données...')
      try {
        const dbResponse = await fetch('/api/check-db')
        if (dbResponse.ok) {
          const dbData = await dbResponse.json()
          if (dbData.success) {
            const checks = dbData.checks
            
            if (checks.database.connected) {
              addResult('Base de données connectée')
            } else {
              addResult('Base de données non connectée', true)
            }
            
            if (checks.database.loft_photos_table) {
              addResult('Table loft_photos existe')
            } else {
              addResult('Table loft_photos manquante - Exécutez la migration!', true)
            }
            
            if (checks.storage.loft_photos_bucket) {
              addResult('Bucket loft-photos existe')
            } else {
              addResult('Bucket loft-photos manquant - Créez-le dans Supabase!', true)
            }
          } else {
            addResult(`Erreur vérification DB: ${dbData.error}`, true)
          }
        } else {
          addResult(`API vérification DB échoue: ${dbResponse.status}`, true)
        }
      } catch (error) {
        addResult(`Erreur vérification DB: ${error instanceof Error ? error.message : 'Inconnue'}`, true)
      }

      // Test 3: Test upload simple (sans fichier)
      addResult('Test de l\'API d\'upload...')
      try {
        const uploadResponse = await fetch('/api/lofts/photos/upload', {
          method: 'POST',
          body: new FormData() // FormData vide pour tester la validation
        })
        
        if (uploadResponse.status === 400) {
          addResult('API d\'upload accessible (validation fonctionne)')
        } else if (uploadResponse.status === 401) {
          addResult('API d\'upload accessible (authentification requise)', true)
        } else {
          addResult(`API d\'upload répond: ${uploadResponse.status}`)
        }
      } catch (error) {
        addResult(`Erreur API upload: ${error instanceof Error ? error.message : 'Inconnue'}`, true)
      }

    } catch (error) {
      addResult(`Erreur générale: ${error instanceof Error ? error.message : 'Inconnue'}`, true)
    } finally {
      setIsLoading(false)
    }
  }

  const testFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      setIsLoading(true)
      setResults([])
      setHasError(false)

      try {
        addResult(`Fichier sélectionné: ${file.name} (${file.size} bytes, ${file.type})`)

        const formData = new FormData()
        formData.append('file', file)

        addResult('Upload en cours...')
        const response = await fetch('/api/lofts/photos/upload', {
          method: 'POST',
          body: formData
        })

        addResult(`Réponse serveur: ${response.status} ${response.statusText}`)

        if (response.ok) {
          const data = await response.json()
          addResult(`Upload réussi! URL: ${data.url || 'N/A'}`)
        } else {
          const errorData = await response.json().catch(() => ({}))
          addResult(`Upload échoué: ${errorData.error || 'Erreur inconnue'}`, true)
        }

      } catch (error) {
        addResult(`Erreur upload: ${error instanceof Error ? error.message : 'Inconnue'}`, true)
      } finally {
        setIsLoading(false)
      }
    })

    input.click()
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Test Upload Photos - Version Basique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={runBasicTests} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Test Configuration
              </>
            )}
          </Button>

          <Button 
            onClick={testFileUpload} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload...
              </>
            ) : (
              <>
                <HardDrive className="mr-2 h-4 w-4" />
                Test avec Fichier
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Résultats des tests:</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <Alert className={hasError ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            {hasError ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <AlertDescription className={hasError ? "text-red-700" : "text-green-700"}>
              <strong>
                {hasError 
                  ? "Des problèmes ont été détectés. Suivez les instructions ci-dessus."
                  : "Tous les tests sont passés avec succès!"
                }
              </strong>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Upload className="h-4 w-4" />
          <AlertDescription>
            <strong>Instructions:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <strong>Test Configuration:</strong> Vérifie l'état de la base de données et du storage</li>
              <li>• <strong>Test avec Fichier:</strong> Sélectionnez une vraie image pour tester l'upload complet</li>
              <li>• Consultez la console du navigateur (F12) pour plus de détails</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}