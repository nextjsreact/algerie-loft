'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function SimpleUploadTest() {
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testSimpleUpload = async () => {
    setIsUploading(true)
    setResult(null)
    setError(null)

    try {
      // Test 1: Vérifier que l'API de test fonctionne
      console.log('Test 1: Vérification API de test...')
      const testResponse = await fetch('/api/test-upload')
      const testData = await testResponse.json()
      console.log('API de test:', testData)

      // Test 2: Upload vers l'API de test
      console.log('Test 2: Upload vers API de test...')
      const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const testFormData = new FormData()
      testFormData.append('file', testFile)

      const uploadTestResponse = await fetch('/api/test-upload', {
        method: 'POST',
        body: testFormData
      })

      if (!uploadTestResponse.ok) {
        throw new Error(`Test API failed: ${uploadTestResponse.status}`)
      }

      const uploadTestData = await uploadTestResponse.json()
      console.log('Upload test réussi:', uploadTestData)

      // Test 3: Upload vers l'API réelle
      console.log('Test 3: Upload vers API réelle...')
      const realFormData = new FormData()
      realFormData.append('file', testFile)

      const realResponse = await fetch('/api/lofts/photos/upload', {
        method: 'POST',
        body: realFormData
      })

      console.log('Réponse API réelle:', realResponse.status, realResponse.statusText)

      if (!realResponse.ok) {
        const errorData = await realResponse.json().catch(() => ({}))
        throw new Error(`API réelle failed: ${realResponse.status} - ${errorData.error || 'Erreur inconnue'}`)
      }

      const realData = await realResponse.json()
      console.log('Upload réel réussi:', realData)

      setResult({
        testApi: testData,
        uploadTest: uploadTestData,
        realUpload: realData,
        success: true
      })

    } catch (error) {
      console.error('Erreur lors du test:', error)
      setError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setIsUploading(false)
    }
  }

  const testFileSelection = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    const handleFileChange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      setIsUploading(true)
      setResult(null)
      setError(null)

      try {
        console.log('Test avec fichier réel:', file.name, file.size, file.type)

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/lofts/photos/upload', {
          method: 'POST',
          body: formData
        })

        console.log('Réponse:', response.status, response.statusText)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`Upload failed: ${response.status} - ${errorData.error || 'Erreur inconnue'}`)
        }

        const data = await response.json()
        console.log('Upload réussi:', data)

        setResult({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadResult: data,
          success: true
        })

      } catch (error) {
        console.error('Erreur upload fichier réel:', error)
        setError(error instanceof Error ? error.message : 'Erreur inconnue')
      } finally {
        setIsUploading(false)
      }
    }
    
    input.addEventListener('change', handleFileChange)
    input.click()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Test Simple Upload Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={testSimpleUpload} 
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              'Test Automatique'
            )}
          </Button>

          <Button 
            onClick={testFileSelection} 
            disabled={isUploading}
            variant="outline"
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload en cours...
              </>
            ) : (
              'Test avec Fichier Réel'
            )}
          </Button>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              <strong>Erreur:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              <strong>Succès!</strong> Test d'upload réussi.
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">Voir les détails</summary>
                <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto border">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Upload className="h-4 w-4" />
          <AlertDescription>
            <strong>Instructions:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <strong>Test Automatique:</strong> Teste les APIs avec un fichier factice</li>
              <li>• <strong>Test avec Fichier Réel:</strong> Sélectionnez une vraie image pour tester</li>
              <li>• Ouvrez la console du navigateur pour voir les logs détaillés</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}