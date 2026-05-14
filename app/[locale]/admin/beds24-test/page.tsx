'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, Home, Calendar } from 'lucide-react'

export default function Beds24TestPage() {
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [properties, setProperties] = useState<any>(null)
  const [bookings, setBookings] = useState<any>(null)
  const [createTest, setCreateTest] = useState<any>(null)
  const [tokenExchange, setTokenExchange] = useState<any>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const runConnectionTest = async () => {
    setLoading(true)
    setError(null)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/beds24/test')
      const data = await response.json()
      
      if (response.ok) {
        setTestResult(data)
      } else {
        setError(data.error || 'Test failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    setLoading(true)
    setError(null)
    setProperties(null)
    
    try {
      const response = await fetch('/api/beds24/properties')
      const data = await response.json()
      
      if (response.ok) {
        setProperties(data)
      } else {
        setError(data.error || 'Failed to fetch properties')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    setLoading(true)
    setError(null)
    setBookings(null)
    
    try {
      // Fetch bookings from last 30 days
      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      const from = thirtyDaysAgo.toISOString().split('T')[0].replace(/-/g, '')
      const to = today.toISOString().split('T')[0].replace(/-/g, '')
      
      const response = await fetch(`/api/beds24/bookings?from=${from}&to=${to}`)
      const data = await response.json()
      
      if (response.ok) {
        setBookings(data)
      } else {
        setError(data.error || 'Failed to fetch bookings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const testCreateProperty = async () => {
    setLoading(true)
    setError(null)
    setCreateTest(null)
    
    try {
      const response = await fetch('/api/beds24/test-create', {
        method: 'POST',
      })
      const data = await response.json()
      
      setCreateTest(data)
      if (!data.success) {
        setError('Property creation failed - see details below')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const exchangeInviteCode = async () => {
    if (!inviteCode.trim()) {
      setError('Veuillez entrer un invite code')
      return
    }

    setLoading(true)
    setError(null)
    setTokenExchange(null)
    
    try {
      const response = await fetch('/api/beds24/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })
      const data = await response.json()
      
      setTokenExchange(data)
      if (!data.success) {
        setError(data.error || 'Token exchange failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Beds24 API Test</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600">
            🔑 Étape 1: Échanger l'Invite Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Allez dans Beds24 → Settings → Account → API</li>
              <li>Section "Invite Code"</li>
              <li>Cochez: Read Properties + <strong>Write Properties</strong> + Read Bookings</li>
              <li>Cliquez "Generate Invite Code"</li>
              <li>Copiez le code et collez-le ci-dessous</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Collez votre invite code ici"
              className="flex-1 px-4 py-2 border rounded-lg"
              disabled={loading}
            />
            <Button 
              onClick={exchangeInviteCode} 
              disabled={loading || !inviteCode.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Échange...
                </>
              ) : (
                'Échanger le code'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Test de connexion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runConnectionTest} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                'Tester la connexion'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5" />
              Propriétés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={fetchProperties} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                'Récupérer les lofts'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Réservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={fetchBookings} 
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                'Récupérer les réservations'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5" />
              Test Création
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testCreateProperty} 
              disabled={loading}
              className="w-full"
              variant="secondary"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test...
                </>
              ) : (
                'Test créer propriété'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Connexion réussie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {properties && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Propriétés trouvées: {properties.properties?.count || properties.count || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(properties.properties?.data) && properties.properties.data.map((prop: any) => (
                <div key={prop.id} className="p-4 border rounded-lg">
                  <h3 className="font-semibold text-lg">{prop.name}</h3>
                  <p className="text-sm text-gray-600">ID: {prop.id}</p>
                  {prop.address && <p className="text-sm">{prop.address}</p>}
                  {prop.city && <p className="text-sm">{prop.city}, {prop.country}</p>}
                  {prop.phone && <p className="text-sm">📞 {prop.phone}</p>}
                  <p className="text-sm text-gray-500 mt-2">Check-in: {prop.checkInStart} | Check-out: {prop.checkOutEnd}</p>
                </div>
              ))}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                  Voir les données brutes
                </summary>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs mt-2">
                  {JSON.stringify(properties, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}

      {bookings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Réservations trouvées: {bookings.count}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(bookings.bookings) && bookings.bookings.map((booking: any, idx: number) => (
                <div key={booking.id || idx} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{booking.guestName || 'Guest'}</h3>
                  <p className="text-sm text-gray-600">
                    {booking.arrival} → {booking.departure}
                  </p>
                  <p className="text-sm">Property ID: {booking.propId}</p>
                  {booking.price && <p className="text-sm font-medium">Price: {booking.price} {booking.currency}</p>}
                  {booking.status && <p className="text-sm">Status: {booking.status}</p>}
                </div>
              ))}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                  Voir les données brutes
                </summary>
                <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs mt-2">
                  {JSON.stringify(bookings, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}

      {createTest && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${createTest.success ? 'text-green-600' : 'text-red-600'}`}>
              {createTest.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              Test de création de propriété
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold">Status HTTP:</p>
                  <p className={`text-lg font-bold ${createTest.success ? 'text-green-600' : 'text-red-600'}`}>
                    {createTest.status} {createTest.statusText}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Résultat:</p>
                  <p className={`text-lg font-bold ${createTest.success ? 'text-green-600' : 'text-red-600'}`}>
                    {createTest.success ? '✓ Succès' : '✗ Échec'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Données envoyées:</p>
                <pre className="bg-blue-50 p-4 rounded-lg overflow-auto text-xs border border-blue-200">
                  {JSON.stringify(createTest.requestBody, null, 2)}
                </pre>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Réponse de Beds24:</p>
                <pre className={`p-4 rounded-lg overflow-auto text-xs border ${createTest.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {JSON.stringify(createTest.responseBody, null, 2)}
                </pre>
              </div>

              {!createTest.success && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">💡 Analyse de l'erreur:</p>
                  <p className="text-sm text-yellow-800">
                    {typeof createTest.responseBody === 'object' && createTest.responseBody.error 
                      ? `Erreur: ${createTest.responseBody.error}`
                      : 'Voir la réponse brute ci-dessus pour plus de détails'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tokenExchange && (
        <Card className="border-2 border-green-500">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${tokenExchange.success ? 'text-green-600' : 'text-red-600'}`}>
              {tokenExchange.success ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              Résultat de l'échange de token
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tokenExchange.success ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900 mb-2">✅ Succès! Voici votre nouveau token:</p>
                  <div className="bg-white p-3 rounded border border-green-300 font-mono text-xs break-all">
                    {tokenExchange.refreshToken}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tokenExchange.refreshToken)
                      alert('Token copié dans le presse-papier!')
                    }}
                    className="mt-2 text-sm text-green-700 hover:text-green-900 underline"
                  >
                    📋 Copier le token
                  </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-yellow-900 mb-2">📝 Prochaines étapes:</p>
                  <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                    {tokenExchange.instructions?.map((instruction: string, idx: number) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>

                <details>
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                    Voir les données complètes
                  </summary>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs mt-2">
                    {JSON.stringify(tokenExchange, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  {tokenExchange.error || 'Erreur inconnue'}
                </p>
                {tokenExchange.details && (
                  <pre className="mt-2 text-xs text-red-700 overflow-auto">
                    {JSON.stringify(tokenExchange.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
