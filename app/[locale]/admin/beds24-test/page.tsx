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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  )
}
