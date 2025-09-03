'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, CheckCircle, AlertCircle } from 'lucide-react'

export default function AddSampleLoftsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const addSampleLofts = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/lofts/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `Successfully added ${result.count} sample lofts to your database!`
        })
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to add sample lofts'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-6 w-6" />
            Add Sample Lofts
          </CardTitle>
          <CardDescription>
            This will add some sample lofts to your database so you can see them in the availability and lofts pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold">Sample lofts will include:</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Loft Artistique Hydra - 45,000 DA/month</li>
              <li>Loft Moderne Centre-Ville - 55,000 DA/month</li>
              <li>Studio Haut de Gamme Hydra - 38,000 DA/month</li>
              <li>Loft Étudiant Bab Ezzouar - 28,000 DA/month</li>
              <li>Penthouse Vue Mer Oran - 75,000 DA/month</li>
              <li>Loft Familial Constantine - 42,000 DA/month</li>
            </ul>
          </div>

          <Button 
            onClick={addSampleLofts} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Sample Lofts...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Sample Lofts
              </>
            )}
          </Button>

          <div className="text-sm text-gray-500">
            <p><strong>Note:</strong> This will also create sample owners and zone areas if they don't exist.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}