"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function EnvChecker() {
  const [envInfo, setEnvInfo] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)

  const checkEnvironment = async () => {
    // Vérifier les variables d'environnement côté client
    const clientEnv = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MANQUANT',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'MANQUANT',
      NODE_ENV: process.env.NODE_ENV || 'MANQUANT'
    }

    setEnvInfo(clientEnv)

    // Test de connexion basique
    if (clientEnv.NEXT_PUBLIC_SUPABASE_URL !== 'MANQUANT' && 
        clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'MANQUANT') {
      
      try {
        const supabase = createClient()
        
        // Test simple de ping
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)

        setTestResult({
          success: !error,
          message: error ? error.message : 'Connexion DB réussie',
          url: clientEnv.NEXT_PUBLIC_SUPABASE_URL
        })
      } catch (err: any) {
        setTestResult({
          success: false,
          message: err.message,
          url: clientEnv.NEXT_PUBLIC_SUPABASE_URL
        })
      }
    }
  }

  const testSpecificUser = async () => {
    if (!envInfo) return

    try {
      const supabase = createClient()
      
      // Test avec l'utilisateur créé
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'user1759066310913@dev.local',
        password: 'password123'
      })

      if (error) {
        setTestResult({
          success: false,
          message: `Erreur connexion: ${error.message}`,
          code: error.code,
          status: error.status
        })
      } else {
        setTestResult({
          success: true,
          message: `Connexion réussie: ${data.user?.email}`,
          session: !!data.session
        })
        
        // Déconnexion immédiate
        await supabase.auth.signOut()
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Exception: ${err.message}`
      })
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>🔍 Vérificateur d'environnement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkEnvironment}>
            🌍 Vérifier ENV
          </Button>
          <Button onClick={testSpecificUser} disabled={!envInfo}>
            🔐 Test Utilisateur
          </Button>
        </div>

        {envInfo && (
          <div className="space-y-2">
            <h3 className="font-semibold">Variables d'environnement:</h3>
            {Object.entries(envInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 bg-gray-100 rounded text-sm">
                <span className="font-mono">{key}:</span>
                <span className="font-mono text-right max-w-md truncate">
                  {value === 'MANQUANT' ? (
                    <span className="text-red-600">❌ MANQUANT</span>
                  ) : (
                    <span className="text-green-600">
                      ✅ {typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {testResult && (
          <div className={`p-3 rounded ${testResult.success ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
            <div className="font-semibold">
              {testResult.success ? '✅ Succès' : '❌ Échec'}
            </div>
            <div className="text-sm mt-1">
              {testResult.message}
            </div>
            {testResult.code && (
              <div className="text-xs mt-1 text-gray-600">
                Code: {testResult.code} | Status: {testResult.status}
              </div>
            )}
            {testResult.url && (
              <div className="text-xs mt-1 text-gray-600">
                URL: {testResult.url}
              </div>
            )}
            {testResult.session !== undefined && (
              <div className="text-xs mt-1 text-gray-600">
                Session: {testResult.session ? 'Présente' : 'Absente'}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}