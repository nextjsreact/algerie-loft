"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { NextIntlLanguageSelector } from "@/components/ui/next-intl-language-selector"
import { Eye, EyeOff, Building2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { loginSchema, type LoginFormData } from "@/lib/validations"

/**
 * Version next-intl du SimpleLoginForm
 * Utilise useTranslations au lieu de useSimpleTranslation
 */
export function SimpleLoginFormNextIntl() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')
  const roleParam = searchParams.get('role')
  const locale = useLocale()
  const supabase = createClient()
  
  // Utilisation de next-intl au lieu de useSimpleTranslation
  const t = useTranslations('auth')

  // Initialize selected role from URL parameter
  useState(() => {
    if (roleParam) {
      setSelectedRole(roleParam)
    }
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError("")

    try {
      console.log('🔐 Tentative de connexion avec:', data.email)
      
      // Timeout pour éviter les blocages
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de connexion (10s)')), 10000)
      )
      
      const loginPromise = supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      const { data: signInData, error: signInError } = await Promise.race([
        loginPromise,
        timeoutPromise
      ]) as any

      if (signInError) {
        console.error("Erreur connexion:", signInError)
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      if (signInData.user && signInData.session) {
        console.log('✅ Connexion réussie:', signInData.user.email)
        console.log('✅ Session établie - redirection...')
        
        // Check for role parameter in URL or selected role
        const redirectParam = searchParams.get('redirect')
        const roleToUse = selectedRole || roleParam
        
        // If we have a return URL, redirect there
        if (returnUrl) {
          window.location.href = decodeURIComponent(returnUrl)
        } else if (redirectParam) {
          // If we have a specific redirect, use it
          window.location.href = `/${locale}${redirectParam}`
        } else if (roleToUse) {
          // Redirect based on selected role or role parameter
          switch (roleToUse) {
            case 'client':
              window.location.href = `/${locale}/client/dashboard`
              break
            case 'partner':
              window.location.href = `/${locale}/partner/dashboard`
              break
            case 'admin':
            case 'manager':
            case 'executive':
              window.location.href = `/${locale}/app/dashboard`
              break
            default:
              window.location.href = `/${locale}/home`
          }
        } else {
          // Default redirect
          const validLocale = locale && ['fr', 'en', 'ar'].includes(locale) ? locale : 'fr'
          window.location.href = `/${validLocale}/home`
        }
        // Ne pas appeler setIsLoading(false) ici car on redirige
      } else {
        console.warn('⚠️ Pas de session dans la réponse')
        setError("Erreur d'authentification - session non établie")
        setIsLoading(false)
      }
    } catch (err: any) {
      console.error("Erreur inattendue:", err)
      setError(err.message || "Une erreur inattendue s'est produite")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
              <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            🔐 {t('welcomeBack')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('signInDescription')}
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex justify-end">
          <NextIntlLanguageSelector />
        </div>

        {/* Role Selection */}
        <Card className="shadow-lg border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-center text-lg text-blue-900 dark:text-blue-300">
              👤 Choisissez votre profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('client')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRole === 'client'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="text-2xl mb-2">🏠</div>
                <div className="font-medium text-sm">Client</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Réserver des lofts</div>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedRole('partner')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRole === 'partner'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                }`}
              >
                <div className="text-2xl mb-2">🏢</div>
                <div className="font-medium text-sm">Partenaire</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Gérer mes biens</div>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedRole === 'admin'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
                }`}
              >
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-medium text-sm">Employé</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Administration</div>
              </button>
            </div>
            
            {selectedRole && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  ✓ Profil sélectionné : <strong>
                    {selectedRole === 'client' ? 'Client' : 
                     selectedRole === 'partner' ? 'Partenaire' : 'Employé'}
                  </strong>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-xl">{t('signIn')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Ex: nom@exemple.com" 
                  {...register("email")} 
                  disabled={isLoading}
                  className="bg-white dark:bg-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:opacity-100"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isLoading}
                    className="bg-white dark:bg-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:opacity-100"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between">
                <Link href={`/${locale}/forgot-password`} className="text-sm text-blue-600 hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('signingIn') : t('signIn')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign Up Section */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {t('noAccount')}{" "}
                <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  {t('signUp')}
                </Link>
              </p>
              
              <Separator className="my-4" />
              
              <div>
                <p className="text-sm font-medium mb-3 text-blue-900 dark:text-blue-300">Identifiants DEV</p>
                <div className="space-y-2 text-xs text-blue-700 dark:text-blue-300">
                  <p>
                    <strong>Test User:</strong> user1759066310913@dev.local / password123
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}