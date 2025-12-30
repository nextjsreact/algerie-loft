"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginDebug() {
  const [email, setEmail] = useState("user1759066310913@dev.local")
  const [password, setPassword] = useState("password123")
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  const clearLogs = () => {
    setLogs([])
    setError("")
  }

  const testLogin = async () => {
    setIsLoading(true)
    setError("")
    clearLogs()
    
    addLog("🔐 Début du test de connexion")
    addLog(`📧 Email: ${email}`)
    addLog(`🔑 Password: ${password}`)

    try {
      addLog("⏳ Appel signInWithPassword...")
      const startTime = Date.now()

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      const loginTime = Date.now() - startTime
      addLog(`⏱️ Temps de réponse: ${loginTime}ms`)

      if (signInError) {
        addLog(`❌ Erreur: ${signInError.message}`)
        addLog(`📊 Code: ${signInError.code}`)
        addLog(`📊 Status: ${signInError.status}`)
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      addLog("✅ signInWithPassword réussi")
      addLog(`👤 User: ${signInData.user?.email}`)
      addLog(`🎫 Session: ${signInData.session ? 'Présente' : 'Absente'}`)

      if (signInData.user && signInData.session) {
        addLog("✅ Conditions de redirection remplies")
        
        // Test de la session
        addLog("🔍 Vérification de la session...")
        const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          addLog(`❌ Erreur getSession: ${sessionError.message}`)
        } else if (sessionCheck.session) {
          addLog("✅ Session confirmée")
          
          // Test accès aux données
          addLog("🔍 Test accès aux données...")
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signInData.user.id)
            .single()

          if (profileError) {
            addLog(`❌ Erreur profil: ${profileError.message}`)
          } else {
            addLog(`✅ Profil récupéré: ${profile.full_name} (${profile.role})`)
          }

          // Tentative de redirection
          addLog("🚀 Tentative de redirection vers /fr/dashboard...")
          
          // Attendre un peu pour voir les logs
          setTimeout(() => {
            router.push("/fr/dashboard")
          }, 1000)
          
        } else {
          addLog("❌ Session non confirmée")
          setError("Session non établie")
          setIsLoading(false)
        }
      } else {
        addLog("❌ Conditions de redirection non remplies")
        setError("Données utilisateur manquantes")
        setIsLoading(false)
      }

    } catch (err: any) {
      addLog(`💥 Exception: ${err.message}`)
      setError(err.message)
      setIsLoading(false)
    }
  }

  const testLogout = async () => {
    addLog("🚪 Test de déconnexion...")
    const { error } = await supabase.auth.signOut()
    if (error) {
      addLog(`❌ Erreur déconnexion: ${error.message}`)
    } else {
      addLog("✅ Déconnexion réussie")
    }
  }

  const checkCurrentSession = async () => {
    addLog("🔍 Vérification session actuelle...")
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      addLog(`❌ Erreur: ${error.message}`)
    } else if (session) {
      addLog(`✅ Session active: ${session.user.email}`)
    } else {
      addLog("ℹ️ Aucune session active")
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug Login - Test en temps réel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={testLogin} disabled={isLoading}>
              {isLoading ? "Test en cours..." : "🔐 Test Login"}
            </Button>
            <Button onClick={testLogout} variant="outline">
              🚪 Logout
            </Button>
            <Button onClick={checkCurrentSession} variant="outline">
              🔍 Check Session
            </Button>
            <Button onClick={clearLogs} variant="outline">
              🧹 Clear Logs
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
              ❌ {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Logs en temps réel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Aucun log pour le moment...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}