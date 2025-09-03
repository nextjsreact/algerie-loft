"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default function TestReservationsTranslation() {
  const [language, setLanguage] = useState('fr')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">Reservations Translation Test</h1>
          <p className="text-gray-600">Test reservations translations</p>
          
          <div className="flex items-center justify-center gap-4">
            <span className="text-sm font-medium">Current Language:</span>
            <Badge variant="outline">{language}</Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Page Level Translations */}
          <Card>
            <CardHeader>
              <CardTitle>Page Level Translations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="font-semibold">Test Title</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Subtitle</label>
                  <p className="font-semibold">Test Subtitle</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Translations */}
          <Card>
            <CardHeader>
              <CardTitle>Status Translations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Test</label>
                  <p className="font-semibold">Translation test page</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}