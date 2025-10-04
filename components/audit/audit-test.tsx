'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TestResult {
  success: boolean
  message?: string
  tests?: Record<string, boolean>
  details?: Record<string, any>
  error?: string
}

export function AuditTest() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDiagnostic = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/audit/test')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testOriginalAPI = async () => {
    setIsLoading(true)
    
    try {
      // Test the original API
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      console.log('🧪 Testing original entity API with:', { fakeId })
      
      const response = await fetch(`/api/audit/entity/transactions/${fakeId}`)
      console.log('📡 Response status:', response.status, response.statusText)
      
      // Check if response has content
      const responseText = await response.text()
      console.log('📄 Response text:', responseText)
      
      let data;
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError)
        setTestResult({
          success: false,
          error: `JSON parse error: ${parseError.message}`,
          details: { responseText, status: response.status }
        })
        return
      }
      
      setTestResult({
        success: response.ok,
        message: `Original API test: ${response.status} ${response.statusText}`,
        details: data
      })
    } catch (error) {
      console.error('❌ Original API test error:', error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testPingAPI = async () => {
    setIsLoading(true)
    
    try {
      console.log('🏓 Testing ping API')
      
      const response = await fetch('/api/audit/ping')
      console.log('📡 Ping response status:', response.status, response.statusText)
      
      const responseText = await response.text()
      console.log('📄 Ping response text:', responseText)
      
      let data;
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        setTestResult({
          success: false,
          error: `Ping JSON parse error: ${parseError.message}`,
          details: { responseText, status: response.status }
        })
        return
      }
      
      setTestResult({
        success: response.ok,
        message: `Ping test: ${response.status} ${response.statusText}`,
        details: data
      })
    } catch (error) {
      console.error('❌ Ping test error:', error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testEntityAPI = async () => {
    setIsLoading(true)
    
    try {
      // Test with a fake UUID using the simple API
      const fakeId = '123e4567-e89b-12d3-a456-426614174000'
      console.log('🧪 Testing entity API with:', { fakeId })
      
      const response = await fetch(`/api/audit/entity-simple/transactions/${fakeId}`)
      console.log('📡 Response status:', response.status, response.statusText)
      
      // Check if response has content
      const responseText = await response.text()
      console.log('📄 Response text:', responseText)
      
      let data;
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError)
        setTestResult({
          success: false,
          error: `JSON parse error: ${parseError.message}`,
          details: { responseText, status: response.status }
        })
        return
      }
      
      setTestResult({
        success: response.ok,
        message: `Entity API test: ${response.status} ${response.statusText}`,
        details: data
      })
    } catch (error) {
      console.error('❌ Entity API test error:', error)
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Test du Système d'Audit</CardTitle>
        <CardDescription>
          Diagnostiquer les problèmes du système d'audit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runDiagnostic} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Test en cours...' : 'Test Diagnostic'}
          </Button>
          
          <Button 
            onClick={testEntityAPI} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Test en cours...' : 'Test API Simple'}
          </Button>
          
          <Button 
            onClick={testOriginalAPI} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Test en cours...' : 'Test API Original'}
          </Button>
          
          <Button 
            onClick={testPingAPI} 
            disabled={isLoading}
            variant="secondary"
          >
            {isLoading ? 'Test en cours...' : 'Test Ping'}
          </Button>
        </div>

        {testResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={testResult.success ? 'default' : 'destructive'}>
                {testResult.success ? '✅ Succès' : '❌ Échec'}
              </Badge>
              {testResult.message && (
                <span className="text-sm text-muted-foreground">
                  {testResult.message}
                </span>
              )}
            </div>

            {testResult.tests && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(testResult.tests).map(([test, passed]) => (
                  <div key={test} className="flex items-center gap-2">
                    <Badge variant={passed ? 'default' : 'destructive'} className="text-xs">
                      {passed ? '✅' : '❌'}
                    </Badge>
                    <span className="text-sm capitalize">{test}</span>
                  </div>
                ))}
              </div>
            )}

            {testResult.details && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Détails:</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              </div>
            )}

            {testResult.error && (
              <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                <h4 className="font-medium text-destructive mb-2">Erreur:</h4>
                <p className="text-sm text-destructive">{testResult.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}