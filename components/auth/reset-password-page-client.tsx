"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, CheckCircle, Building2, Shield, ArrowLeft } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useTranslations } from "next-intl"
import Link from "next/link"

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPageClient({ params }: { params: Promise<{ locale: string }> }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [locale, setLocale] = useState('fr')

  const router = useRouter()
  const t = useTranslations('auth')

  useEffect(() => {
    const getLocale = async () => {
      const { locale } = await params
      setLocale(locale)
    }
    getLocale()
  }, [params])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch("password", "")

  // Validation en temps réel du mot de passe
  const passwordValidation = {
    minLength: password.length >= 8,
    hasLowercase: /(?=.*[a-z])/.test(password),
    hasUppercase: /(?=.*[A-Z])/.test(password),
    hasNumber: /(?=.*\d)/.test(password),
  }

  useEffect(() => {
    const checkSession = async () => {
      setIsCheckingSession(true)
      const supabase = createClient()

      console.log('Reset password page - checking session...')

      try {
        // Vérifier si nous avons une session valide (établie par l'API callback)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Session check error:', error)
          setError("Erreur lors de la vérification de la session. Veuillez demander un nouveau lien.")
          return
        }

        if (session) {
          console.log('Valid session found, allowing access to reset form')
          setIsValidSession(true)
        } else {
          console.log('No session found - user needs to use reset link from email')
          setError("Aucune session de reset trouvée. Veuillez utiliser le lien reçu par email.")
        }
      } catch (err: any) {
        console.error('Session check exception:', err)
        setError("Erreur lors de la vérification de la session. Veuillez réessayer.")
      } finally {
        setIsCheckingSession(false)
      }
    }

    checkSession()

    // Écouter les changements d'état d'authentification
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, !!session)
      if (event === 'SIGNED_IN' && session) {
        setIsValidSession(true)
        setError("")
        setIsCheckingSession(false)
      } else if (event === 'SIGNED_OUT') {
        setIsValidSession(false)
        setError("Session expirée. Veuillez demander un nouveau lien.")
        setIsCheckingSession(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()

      // Vérifier à nouveau la session avant la mise à jour
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError("Votre session a expiré. Veuillez demander un nouveau lien de reset.")
        setIsLoading(false)
        return
      }

      console.log('Updating password for user:', session.user.email)

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      })

      if (updateError) {
        console.error('Password update error:', updateError)
        
        // Fournir des messages d'erreur plus spécifiques
        let errorMessage = updateError.message
        
        if (updateError.message.includes('Password should be at least')) {
          errorMessage = "Le mot de passe doit contenir au moins 8 caractères"
        } else if (updateError.message.includes('session_not_found')) {
          errorMessage = "Session expirée. Veuillez demander un nouveau lien de reset."
        } else if (updateError.message.includes('invalid_credentials')) {
          errorMessage = "Identifiants invalides. Veuillez réessayer."
        }
        
        setError(errorMessage)
      } else {
        console.log('Password updated successfully')
        setSuccess(true)
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push(`/${locale}/login?message=password-updated`)
        }, 3000)
      }
    } catch (err: any) {
      console.error('Password update exception:', err)
      
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

  // Page de chargement pendant la vérification de session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Vérification de votre session...</p>
                <p className="mt-1 text-xs text-gray-500">Veuillez patienter</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Page d'erreur si session invalide
  if (error && !isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Lien de reset invalide
            </h2>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
                
                <div>
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                  <p className="mt-2 text-sm text-gray-600">
                    {error.includes('Aucune session de reset trouvée') 
                      ? 'Vous devez utiliser le lien reçu par email pour accéder à cette page.'
                      : 'Le lien de reset peut avoir expiré ou être invalide. Veuillez demander un nouveau lien.'
                    }
                  </p>
                </div>

                <div className="space-y-3">
                  <Link href={`/${locale}/forgot-password`}>
                    <Button className="w-full">
                      Demander un nouveau lien
                    </Button>
                  </Link>
                  <Link href={`/${locale}/login`}>
                    <Button variant="outline" className="w-full">
                      {t('passwordReset.backToLogin')}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Page de succès
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-pulse">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              {t('passwordReset.newPassword.success.title')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('passwordReset.newPassword.success.subtitle')}
            </p>
          </div>
          
          <Card className="shadow-xl border-0">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-700">
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">{t('passwordReset.newPassword.success.message')}</span>
                  </div>
                  
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {t('passwordReset.newPassword.success.description')}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-center space-x-2 text-green-700 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Redirection automatique</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span className="text-green-700 text-xs">{t('passwordReset.newPassword.success.redirecting')}</span>
                  </div>
                </div>

                <Separator />
                
                <Link href={`/${locale}/login`}>
                  <Button className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all duration-200">
                    <div className="flex items-center justify-center space-x-2">
                      <ArrowLeft className="h-4 w-4" />
                      <span>Aller à la connexion</span>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              {t('passwordReset.newPassword.success.footerText')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Formulaire principal de reset de mot de passe
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <Lock className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            {t('passwordReset.newPassword.title')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('passwordReset.newPassword.subtitle')}
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-green-600" />
              {t('passwordReset.newPassword.cardTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription>
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 text-xs font-bold">!</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-red-800">{error}</p>
                        {error.includes("Session expirée") && (
                          <div className="mt-2">
                            <Link href={`/${locale}/forgot-password`}>
                              <Button variant="outline" size="sm" className="text-red-700 border-red-300 hover:bg-red-50">
                                Demander un nouveau lien
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {t('passwordReset.newPassword.passwordLabel')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('passwordReset.newPassword.passwordPlaceholder')}
                    {...register("password")}
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-md transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="text-red-500">⚠</span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  {t('passwordReset.newPassword.confirmLabel')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t('passwordReset.newPassword.confirmPlaceholder')}
                    {...register("confirmPassword")}
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-md transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="text-red-500">⚠</span>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Critères de mot de passe améliorés */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-600" />
                  {t('passwordReset.newPassword.criteriaTitle')}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center space-x-2 ${passwordValidation.minLength ? "text-green-600" : "text-gray-400"}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.minLength ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <span>{t('passwordReset.newPassword.criteria.minLength')}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${passwordValidation.hasLowercase ? "text-green-600" : "text-gray-400"}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.hasLowercase ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <span>{t('passwordReset.newPassword.criteria.lowercase')}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${passwordValidation.hasUppercase ? "text-green-600" : "text-gray-400"}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.hasUppercase ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <span>{t('passwordReset.newPassword.criteria.uppercase')}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${passwordValidation.hasNumber ? "text-green-600" : "text-gray-400"}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.hasNumber ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <span>{t('passwordReset.newPassword.criteria.number')}</span>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('passwordReset.newPassword.updatingButton')}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{t('passwordReset.newPassword.updateButton')}</span>
                  </div>
                )}
              </Button>

              <Separator />

              <div className="text-center">
                <Link 
                  href={`/${locale}/login`} 
                  className="inline-flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t('passwordReset.backToLogin')}</span>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            {t('passwordReset.newPassword.footerText')}
          </p>
        </div>
      </div>
    </div>
  )
}