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
      <div className="text-center space-y-4">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {t('passwordReset.success.title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('passwordReset.success.subtitle')}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
            <Mail className="h-4 w-4" />
            <span className="text-sm font-medium">{t('passwordReset.success.message')}</span>
          </div>

          <p className="text-blue-600 dark:text-blue-400 text-xs mt-2 leading-relaxed">
            {t('passwordReset.success.description')}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-gray-800 dark:text-gray-200 text-xs font-medium">Security</p>
              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                {t('passwordReset.success.securityNote')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Link href="/login">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white h-10 text-sm">
              <ArrowLeft className="h-3 w-3 mr-2" />
              {t('passwordReset.backToLogin')}
            </Button>
          </Link>

          <button
            onClick={() => setSuccess(false)}
            className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
          >
            {t('passwordReset.success.tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center space-y-4">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
        <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {t('passwordReset.title')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('passwordReset.cardTitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                {(error.includes('lien de reset') || error.includes('expiré') || error.includes('invalide')) && (
                  <div className="flex items-start space-x-2 mt-2">
                    <Shield className="h-3 w-3 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Vérifiez votre dossier spam ou demandez un nouveau lien ci-dessous.
                    </p>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={clearError}
                className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-lg font-medium"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 text-left">
            {t('passwordReset.emailLabel')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              id="email"
              type="email"
              placeholder={t('passwordReset.emailPlaceholder')}
              {...register("email")}
              className="pl-10 h-10 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-lg w-full text-sm"
            />
          </div>
          {errors.email && (
            <p className="text-red-600 dark:text-red-400 text-xs flex items-center gap-1 text-left">
              <span className="text-red-500">⚠</span>
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white h-10 text-sm font-medium rounded-lg transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span>{t('passwordReset.sendingButton')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Mail className="h-3 w-3" />
              <span>{t('passwordReset.sendButton')}</span>
            </div>
          )}
        </Button>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>{t('passwordReset.backToLogin')}</span>
          </Link>
        </div>
      </form>
    </div>
  )
}