'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

interface DebugResult {
  step: string
  status: 'pending' | 'success' | 'error'
  message: string
  details?: any
}

export function PhotoUploadDebug() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DebugResult[]>([])

  const addResult = (step: string, status: 'success' | 'error', message: string, details?: any) => {
    setResults(prev => [...prev, { step, status, message, details }])
  }

  const runDiagnostic = async () => {
    setIsRunning(true)
    setResults([])

    try {
      // Test 1: Vérifier l'API d'upload
      addResult('API Upload', 'pending', 'Test de l\'API d\'upload...')
      
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', testFile)
      
      try {
        const response = await fetch('/api/lofts/photos/upload', {
          method: 'POST',
          body: formData
        })
        
        if (response.ok) {
          const result = await response.json()
          addResult('API Upload', 'success', 'API accessible', result)
        } else {
          const error = await response.json().catch(() => ({}))
          addResult('API Upload', 'error', `HTTP ${response.status}: ${error.error || 'Erreur inconnue'}`, error)
        }
      } catch (error) {
        addResult('API Upload', 'error', `Erreur réseau: ${error instanceof Error ? error.message : 'Inconnue'}`)
      }

      // Test 2: Vérifier l'authentification
      addResult('Auth', 'pending', 'Vérification de l\'authentification...')
      
      try {
        const authResponse = await fetch('/api/health')
        if (authResponse.ok) {
          addResult('Auth', 'success', 'Session utilisateur active')
        } else {
          addResult('Auth', 'error', 'Problème d\'authentification')
        }
      } catch (error) {
        addResult('Auth', 'error', 'Impossible de vérifier l\'auth')
      }

      // Test 3: Test de validation des fichiers
      addResult('Validation', 'pending', 'Test de validation des fichiers...')
      
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const invalidFormData = new FormData()
      invalidFormData.append('file', invalidFile)
      
      try {
        const validationResponse = await fetch('/api/lofts/photos/upload', {
          method: 'POST',
          body: invalidFormData
        })
        
        if (validationResponse.status === 400) {
          addResult('Validation', 'success', 'Validation des types de fichiers fonctionne')
        } else {
          addResult('Validation', 'error', 'Validation des fichiers ne fonctionne pas correctement')
        }
      } catch (error) {
        addResult('Validation', 'error', 'Erreur lors du test de validation')
      }

    } catch (error) {
      addResult('Diagnostic', 'error', `Erreur générale: ${error instanceof Error ? error.message : 'Inconnue'}`)
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: DebugResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: DebugResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Succès</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erreur</Badge>
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Diagnostic Upload Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cet outil permet de diagnostiquer les problèmes d'upload de photos pour les lofts.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={runDiagnostic} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Diagnostic en cours...
            </>
          ) : (
            'Lancer le diagnostic'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Résultats du diagnostic</h3>
            
            {results.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.step}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                  
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        Voir les détails
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {results.length > 0 && !isRunning && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {results.some(r => r.status === 'error') ? (
                <span className="text-red-600">
                  Des erreurs ont été détectées. Vérifiez la configuration de votre base de données et du storage Supabase.
                </span>
              ) : (
                <span className="text-green-600">
                  Tous les tests sont passés avec succès !
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}