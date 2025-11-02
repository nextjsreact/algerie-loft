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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou continuer avec
                  </span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                          redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}&role=${selectedRole || 'client'}`
                        }
                      })
                      if (error) {
                        setError(error.message)
                        setIsLoading(false)
                      }
                    } catch (err: any) {
                      setError(err.message)
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'github',
                        options: {
                          redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}&role=${selectedRole || 'client'}`
                        }
                      })
                      if (error) {
                        setError(error.message)
                        setIsLoading(false)
                      }
                    } catch (err: any) {
                      setError(err.message)
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading}
                  className="w-full"
                >
                  <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  GitHub
                </Button>
              </div>
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