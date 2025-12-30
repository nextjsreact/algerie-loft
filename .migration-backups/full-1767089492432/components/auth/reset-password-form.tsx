"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react"
import Link from "next/link"

export function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('auth')
  const supabase = createClient()

  useEffect(() => {
    // Vérifier si nous avons une session de reset valide
    const checkSession = async () => {
      setIsCheckingSession(true)
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error.message)
          setError("Erreur lors de la vérification de la session")
          setIsCheckingSession(false)
          return
        }
        
        if (session) {
          // Vérifier que la session est valide et récente (pour le reset de mot de passe)
          const sessionAge = Date.now() - new Date(session.expires_at || 0).getTime()
          const maxAge = 60 * 60 * 1000 // 1 heure en millisecondes
          
          if (sessionAge > maxAge) {
            setError("La session de reset a expiré")
            setIsCheckingSession(false)
            return
          }
          
          setIsValidSession(true)
        } else {
          // Aucune session trouvée - l'utilisateur doit passer par le processus de reset
          setError("Aucune session de reset trouvée")
        }
      } catch (err: any) {
        console.error('Error checking session:', err.message)
        setError("Erreur lors de la vérification de la session")
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()
    
    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsValidSession(true)
        setError("")
        setIsCheckingSession(false)
      } else if (event === 'SIGNED_OUT') {
        setIsValidSession(false)
        setError("Session expirée")
        setIsCheckingSession(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return "Le mot de passe doit contenir au moins 8 caractères"
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return "Le mot de passe doit contenir au moins une minuscule"
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return "Le mot de passe doit contenir au moins une majuscule"
    }
    if (!/(?=.*\d)/.test(pwd)) {
      return "Le mot de passe doit contenir au moins un chiffre"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validation
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setIsLoading(false)
      return
    }

    try {
      // Vérifier à nouveau la session avant la mise à jour
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError("Votre session a expiré. Veuillez demander un nouveau lien de reset.")
        setIsLoading(false)
        return
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        // Fournir des messages d'erreur plus spécifiques
        let errorMessage = updateError.message
        
        if (updateError.message.includes('Password should be at least')) {
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères"
        } else if (updateError.message.includes('session_not_found')) {
          errorMessage = "Session expirée. Veuillez demander un nouveau lien de reset."
        } else if (updateError.message.includes('invalid_credentials')) {
          errorMessage = "Identifiants invalides. Veuillez réessayer."
        }
        
        setError(errorMessage)
      } else {
        setSuccess(true)
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push(`/${locale}/login?message=password-updated`)
        }, 3000)
      }
    } catch (err: any) {
      console.error('Password update error:', err)
      
      // Gérer les erreurs réseau et autres erreurs inattendues
      if (err.name === 'NetworkError' || err.message.includes('fetch')) {
        setError("Erreur de connexion. Vérifiez votre connexion internet et réessayez.")
      } else {
        setError(err.message || "Une erreur inattendue s'est produite. Veuillez réessayer.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Vérification de votre session...</p>
            <p className="mt-1 text-xs text-gray-500">Veuillez patienter</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error && !isValidSession) {
    const getErrorMessage = (errorMsg: string) => {
      if (errorMsg.includes("session de reset a expiré") || errorMsg.includes("Session expirée")) {
        return {
          title: "Session expirée",
          message: "Votre session de reset de mot de passe a expiré. Veuillez demander un nouveau lien.",
          showRetry: true
        }
      } else if (errorMsg.includes("Aucune session de reset trouvée")) {
        return {
          title: "Accès non autorisé",
          message: "Vous devez utiliser le lien reçu par email pour accéder à cette page.",
          showRetry: true
        }
      } else {
        return {
          title: "Erreur d'authentification",
          message: errorMsg,
          showRetry: true
        }
      }
    }

    const errorInfo = getErrorMessage(error)

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-red-600">{errorInfo.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">{errorInfo.message}</p>
            
            <div className="space-y-2">
              <Link href={`/${locale}/login`}>
                <Button variant="outline" className="w-full">
                  {t('passwordReset.backToLogin')}
                </Button>
              </Link>
              {errorInfo.showRetry && (
                <Link href={`/${locale}/forgot-password`}>
                  <Button className="w-full">
                    Demander un nouveau lien
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-green-600 flex items-center justify-center gap-2">
            <CheckCircle className="h-6 w-6" />
            Mot de passe mis à jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Votre mot de passe a été mis à jour avec succès.
            </p>
            <p className="text-sm text-gray-600">
              Vous allez être redirigé vers la page de connexion...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center gap-2">
          <Lock className="h-6 w-6" />
          Nouveau mot de passe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre nouveau mot de passe"
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Critères de mot de passe */}
          <div className="text-xs text-gray-600 space-y-1">
            <p>Le mot de passe doit contenir :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li className={password.length >= 8 ? "text-green-600" : "text-gray-400"}>
                Au moins 8 caractères
              </li>
              <li className={/(?=.*[a-z])/.test(password) ? "text-green-600" : "text-gray-400"}>
                Une lettre minuscule
              </li>
              <li className={/(?=.*[A-Z])/.test(password) ? "text-green-600" : "text-gray-400"}>
                Une lettre majuscule
              </li>
              <li className={/(?=.*\d)/.test(password) ? "text-green-600" : "text-gray-400"}>
                Un chiffre
              </li>
            </ul>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="font-medium">Erreur</p>
                  <p>{error}</p>
                </div>
              </div>
              {error.includes("Session expirée") || error.includes("session_not_found") ? (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <Link href={`/${locale}/forgot-password`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Demander un nouveau lien
                    </Button>
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </Button>

          <div className="text-center">
            <Link href={`/${locale}/login`} className="text-sm text-blue-600 hover:underline">
              {t('passwordReset.backToLogin')}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}