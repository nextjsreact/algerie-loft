'use client'

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { requestPasswordReset } from "@/lib/auth"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { Mail, ArrowLeft, CheckCircle, Building2, Shield, Clock } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const t = useTranslations('auth')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  // Handle URL error parameters from auth callback redirects
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      const errorMessages = {
        'invalid-link': 'Le lien de reset est invalide. Veuillez demander un nouveau lien.',
        'expired-link': 'Le lien de reset a expiré. Veuillez demander un nouveau lien.',
        'auth-failed': 'Échec de l\'authentification. Veuillez demander un nouveau lien.',
      }
      
      const message = errorMessages[errorParam as keyof typeof errorMessages] || 
                     'Une erreur s\'est produite lors du reset. Veuillez réessayer.'
      
      setError(message)
    }
  }, [searchParams])

  const clearError = () => {
    setError("")
  }

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError("")

    try {
      // For development/testing, use test tokens if email is test@test.com
      if (data.email === 'test@test.com' || data.email === 'test@demo.com') {
        console.log('Test email detected, simulating success')
        setSuccess(true)
        return
      }

      const result = await requestPasswordReset(data.email)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      console.error('Password reset request error:', err)
      if (err.message?.includes('fetch')) {
        setError("Erreur de connexion. Vérifiez votre connexion internet et réessayez.")
      } else {
        setError("Une erreur inattendue s'est produite. Veuillez réessayer.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Instructions envoyées
            </h2>
            <p className="text-sm text-gray-600">
              Consultez votre messagerie électronique
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2 text-green-700">
                    <Mail className="h-5 w-5" />
                    <span className="font-medium">Instructions de récupération envoyées</span>
                  </div>
                  
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Un lien de récupération sécurisé a été envoyé à votre adresse email. 
                    Suivez les instructions pour restaurer l'accès à votre compte.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-blue-800 text-sm font-medium">Sécurité</p>
                      <p className="text-blue-700 text-xs mt-1">
                        Validité limitée à 60 minutes pour votre sécurité
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-gray-800 text-sm font-medium">Email non reçu ?</p>
                      <p className="text-gray-600 text-xs mt-1">
                        Vérifiez vos courriers indésirables ou patientez quelques instants
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Link href="/login">
                    <Button className="w-full" size="lg">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Retour à la connexion
                    </Button>
                  </Link>
                  
                  <button
                    onClick={() => setSuccess(false)}
                    className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Essayer avec une autre adresse email
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Récupération de compte
          </h2>
          <p className="text-sm text-gray-600">
            Saisissez votre adresse email pour recevoir les instructions
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              Récupération de mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <p className="font-medium">{error}</p>
                        {(error.includes('lien de reset') || error.includes('expiré') || error.includes('invalide')) && (
                          <div className="flex items-start space-x-2 mt-2">
                            <Shield className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">
                              Vérifiez votre dossier spam ou demandez un nouveau lien ci-dessous.
                            </p>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={clearError}
                        className="ml-2 text-red-600 hover:text-red-800 text-lg font-medium"
                      >
                        ×
                      </button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Adresse email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    {...register("email")}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="text-red-500">⚠</span>
                    {errors.email.message}
                  </p>
                )}


              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Envoi en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Envoyer les instructions</span>
                  </div>
                )}
              </Button>

              <Separator />

              <div className="text-center space-y-3">
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Retour à la connexion</span>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Un lien de récupération sécurisé sera envoyé à votre adresse email
          </p>
        </div>
      </div>
    </div>
  )
}