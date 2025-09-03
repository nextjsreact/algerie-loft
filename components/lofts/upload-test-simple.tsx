'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, CheckCircle, XCircle, Loader2, FileImage } from 'lucide-react'

export function UploadTestSimple() {
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testWithDummyFile = async () => {
    setIsUploading(true)
    setResult(null)
    setError(null)

    try {
      // Créer un fichier de test simple
      const testData = new Uint8Array([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
      ])
      
      const blob = new Blob([testData], { type: 'image/jpeg' })
      const file = new File([blob], 'test.jpg', { type: 'image/jpeg' })

      console.log('Test avec fichier factice:', file.name, file.size, file.type)

      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/lofts/photos/upload', {
        method: 'POST',
        body: formData
      })

      console.log('Réponse API:', uploadResponse.status, uploadResponse.statusText)

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        throw new Error(`HTTP ${uploadResponse.status}: ${errorData.error || 'Erreur inconnue'}`)
      }

      const data = await uploadResponse.json()
      console.log('Upload réussi:', data)

      setResult(`✅ Upload réussi! Fichier: ${data.name || 'test.jpg'}, URL: ${data.url || 'N/A'}`)

    } catch (error) {
      console.error('Erreur upload:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  const testApiConnection = async () => {
    setIsUploading(true)
    setResult(null)
    setError(null)

    try {
      console.log('Test de connexion API...')

      // Test 1: API de test
      const testResponse = await fetch('/api/test-upload')
      if (!testResponse.ok) {
        throw new Error(`API de test inaccessible: ${testResponse.status}`)
      }
      const testData = await testResponse.json()
      console.log('API de test OK:', testData)

      // Test 2: API de vérification DB
      const dbResponse = await fetch('/api/check-db')
      if (!dbResponse.ok) {
        throw new Error(`API de vérification DB inaccessible: ${dbResponse.status}`)
      }
      const dbData = await dbResponse.json()
      console.log('API de vérification DB OK:', dbData)

      setResult(`✅ APIs accessibles! Test: ${testData.message}, DB checks: ${dbData.success ? 'OK' : 'Erreurs détectées'}`)

    } catch (error) {
      console.error('Erreur test API:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Test Upload Simplifié
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={testApiConnection} 
            disabled={isUploading}
            variant="outline"
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Test APIs
              </>
            )}
          </Button>

          <Button 
            onClick={testWithDummyFile} 
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Upload...
              </>
            ) : (
              <>
                <FileImage className="mr-2 h-4 w-4" />
                Test Upload
              </>
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
              {result}
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Upload className="h-4 w-4" />
          <AlertDescription>
            <strong>Instructions:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <strong>Test APIs:</strong> Vérifie que les APIs sont accessibles</li>
              <li>• <strong>Test Upload:</strong> Teste l'upload avec un fichier factice</li>
              <li>• Consultez la console du navigateur (F12) pour plus de détails</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}