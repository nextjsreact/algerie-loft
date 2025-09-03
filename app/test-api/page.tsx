'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestApiPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAvailabilityApi = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/lofts/availability')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const testDatabaseApi = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/debug/database')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>API Test Page</CardTitle>
          <CardDescription>
            Test the availability API and database connection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testAvailabilityApi} disabled={loading}>
              Test Availability API
            </Button>
            <Button onClick={testDatabaseApi} disabled={loading} variant="outline">
              Test Database Debug API
            </Button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2">Loading...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {data && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <h3 className="font-semibold mb-2">API Response:</h3>
              <pre className="text-sm overflow-auto max-h-96 bg-white p-4 rounded border">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}