'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Loader2, Bug, FileSearch } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface DebugStep {
  step: string
  status: 'success' | 'error'
  message: string
  details?: any
}

interface DebugResult {
  success: boolean
  message?: string
  error?: string
  debugInfo: {
    timestamp: string
    steps: DebugStep[]
  }
}

export function DetailedDebug() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<DebugResult | null>(null)
  const t = useTranslations('debug')

  const runDetailedDebug = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.addEventListener('change', async (e) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      setIsRunning(true)
      setResult(null)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/debug-upload', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()
        setResult(data)

      } catch (error) {
        setResult({
          success: false,
          error: error instanceof Error ? error.message : t('unknownError'),
          debugInfo: {
            timestamp: new Date().toISOString(),
            steps: [{
              step: 'Network Error',
              status: 'error',
              message: t('networkError'),
              details: error
            }]
          }
        })
      } finally {
        setIsRunning(false)
      }
    })

    input.click()
  }

  const getStepIcon = (status: 'success' | 'error') => {
    return status === 'success' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStepBadge = (status: 'success' | 'error') => {
    return status === 'success' ? (
      <Badge className="bg-green-100 text-green-800">{t('ok')}</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">{t('error')}</Badge>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileSearch className="h-4 w-4" />
          <AlertDescription>
            {t('description')}
          </AlertDescription>
        </Alert>

        <Button 
          onClick={runDetailedDebug} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('running')}
            </>
          ) : (
            <>
              <Bug className="mr-2 h-4 w-4" />
              {t('runDebug')}
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-4">
            {/* Résultat global */}
            <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription className={result.success ? "text-green-700" : "text-red-700"}>
                <strong>
                  {result.success ? `✅ ${t('success')}` : `❌ ${t('problemDetected')}`}
                </strong>
                {result.message && <div className="mt-1">{result.message}</div>}
                {result.error && <div className="mt-1">{t('error')}: {result.error}</div>}
              </AlertDescription>
            </Alert>

            {/* Étapes détaillées */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{t('steps')}</h3>
              
              {result.debugInfo.steps.map((step, index) => (
                <Card key={index} className={`border-l-4 ${step.status === 'success' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStepIcon(step.status)}
                        <span className="font-medium">{step.step}</span>
                      </div>
                      {getStepBadge(step.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{step.message}</p>
                    
                    {step.details && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                          {t('viewDetails')}
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(step.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommandations */}
            {!result.success && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">{t('recommendations')}</h3>
                
                {result.debugInfo.steps.some(s => s.step === 'Table Check' && s.status === 'error') && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-700">
                      <strong>{t('tableMissing')}:</strong>
                      <br />{t('runMigration')}: <code className="bg-orange-100 px-1 rounded">supabase db push</code>
                    </AlertDescription>
                  </Alert>
                )}

                {result.debugInfo.steps.some(s => s.step === 'Storage' && s.status === 'error') && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-700">
                      <strong>{t('storageProblem')}:</strong>
                      <br />{t('createBucket')}
                    </AlertDescription>
                  </Alert>
                )}

                {result.debugInfo.steps.some(s => s.step === 'Database' && s.status === 'error') && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-700">
                      <strong>{t('dbProblem')}:</strong>
                      <br />{t('checkEnvVars')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Timestamp */}
            <p className="text-xs text-gray-500 text-center">
              {t('executedOn')}: {new Date(result.debugInfo.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}