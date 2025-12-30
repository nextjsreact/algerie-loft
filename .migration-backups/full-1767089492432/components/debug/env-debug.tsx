"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function EnvDebug() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({})

  const checkEnvVars = () => {
    const vars = {
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || 'MANQUANT',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'MANQUANT',
      'NODE_ENV': process.env.NODE_ENV || 'MANQUANT',
    }
    
    setEnvVars(vars)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>🌍 Variables d'environnement côté client</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={checkEnvVars} className="mb-4">
          🔍 Vérifier les variables
        </Button>
        
        {Object.keys(envVars).length > 0 && (
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                <span className="font-mono text-sm">{key}:</span>
                <span className="font-mono text-sm text-right max-w-md truncate">
                  {value === 'MANQUANT' ? (
                    <span className="text-red-600">❌ MANQUANT</span>
                  ) : (
                    <span className="text-green-600">
                      ✅ {value.length > 50 ? value.substring(0, 50) + '...' : value}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}