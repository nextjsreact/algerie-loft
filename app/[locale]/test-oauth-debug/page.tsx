"use client"

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestOAuthDebugPage() {
  const [results, setResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`])
  }

  const testOAuth = async (provider: 'google' | 'github', role: string) => {
    setIsLoading(true)
    addResult(`🚀 Test OAuth ${provider.toUpperCase()} - Rôle: ${role}`)
    
    try {
      // Construction de l'URL de redirection
      const baseUrl = 'https://loftalgerie.com'
      const callbackUrl = `${baseUrl}/api/auth/callback`
      const fullRedirectUrl = `${callbackUrl}?next=/fr&role=${role}`
      
      addResult(`📍 URL de redirection: ${fullRedirectUrl}`)
      
      console.log(`🔄 [OAuth Test] Provider: ${provider}, Role: ${role}`)
      console.log(`🔄 [OAuth Test] Callback URL: ${callbackUrl}`)
      console.log(`🔄 [OAuth Test] Full redirect URL: ${fullRedirectUrl}`)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: fullRedirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) {
        console.error(`❌ [OAuth Error]`, error)
        addResult(`❌ Erreur OAuth: ${error.message}`)
      } else {
        console.log(`✅ [OAuth Success]`, data)
        addResult(`✅ OAuth initié avec succès! Redirection vers ${provider}...`)
        // La redirection va se faire automatiquement
      }
    } catch (err: any) {
      console.error(`❌ [OAuth Exception]`, err)
      addResult(`❌ Exception: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const runDiagnostic = async () => {
    setResults([])
    addResult('🔍 Démarrage du diagnostic...')
    
    // Test 1: Vérifier l'accès au callback
    try {
      addResult('🔄 Test 1: Vérification de l\'accès au callback...')
      const response = await fetch('/api/auth/callback', { 
        method: 'GET',
        redirect: 'manual'
      })
      addResult(`Status callback: ${response.status} ${response.statusText}`)
      
      if (response.status === 400) {
        addResult('✅ Route callback accessible (erreur 400 normale sans code OAuth)')
      } else {
        addResult(`⚠️ Status inattendu: ${response.status}`)
      }
    } catch (err: any) {
      addResult(`❌ Erreur accès callback: ${err.message}`)
    }
    
    // Test 2: Vérifier la session actuelle
    try {
      addResult('🔄 Test 2: Vérification de la session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session) {
        addResult('✅ Session active trouvée')
        addResult(`Utilisateur: ${session.user.email}`)
      } else {
        addResult('ℹ️ Aucune session active (normal si pas connecté)')
      }
      
      if (error) {
        addResult(`❌ Erreur session: ${error.message}`)
      }
    } catch (err: any) {
      addResult(`❌ Exception session: ${err.message}`)
    }
    
    // Configuration
    addResult('📋 Configuration URLs Supabase:')
    addResult('✅ https://loftalgerie.com/api/auth/callback')
    addResult('✅ https://loftalgerie.com/auth/reset-password')
    addResult('Site URL: https://loftalgerie.com')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">🔍 Test OAuth Production Debug</CardTitle>
          <p className="text-muted-foreground">
            Diagnostic OAuth pour production Vercel
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Configuration Production</h3>
            <ul className="text-sm space-y-1">
              <li><strong>Domaine:</strong> https://loftalgerie.com</li>
              <li><strong>Environment:</strong> Production (Vercel)</li>
              <li><strong>Callback URL:</strong> https://loftalgerie.com/api/auth/callback</li>
            </ul>
          </div>

          {/* Diagnostic */}
          <div>
            <Button onClick={runDiagnostic} className="mb-4">
              🔧 Lancer le diagnostic
            </Button>
          </div>

          {/* Tests OAuth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-3">🔵 Google OAuth</h3>
              <div className="space-y-2">
                <Button 
                  onClick={() => testOAuth('google', 'client')} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Google - Client
                </Button>
                <Button 
                  onClick={() => testOAuth('google', 'partner')} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Google - Partner
                </Button>
                <Button 
                  onClick={() => testOAuth('google', 'admin')} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  Google - Admin
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">⚫ GitHub OAuth</h3>
              <div className="space-y-2">
                <Button 
                  onClick={() => testOAuth('github', 'client')} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  GitHub - Client
                </Button>
                <Button 
                  onClick={() => testOAuth('github', 'partner')} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  GitHub - Partner
                </Button>
                <Button 
                  onClick={() => testOAuth('github', 'admin')} 
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                >
                  GitHub - Admin
                </Button>
              </div>
            </div>
          </div>

          {/* Résultats */}
          {results.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">📊 Résultats</h3>
              <div className="space-y-1 text-sm font-mono">
                {results.map((result, index) => (
                  <div key={index} className="text-xs">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">💡 Instructions</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Cliquez sur "Lancer le diagnostic" pour vérifier la configuration</li>
              <li>Testez OAuth avec les boutons Google/GitHub</li>
              <li>Regardez les logs Vercel dans votre dashboard</li>
              <li>Vérifiez si le callback /api/auth/callback est appelé</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}