"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { LanguageSelector } from "@/components/ui/language-selector"
import { FormWrapper, FormSection } from "@/components/ui/form-wrapper"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { login } from "@/lib/auth"
import { loginSchema, type LoginFormData } from "@/lib/validations"
import { useTranslation } from "@/lib/i18n/context"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const t = useTranslations("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  })



  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError("")

    try {
      // Connexion en tant qu'EMPLOYÉ
      const result = await login(data.email, data.password, 'fr', 'employee')
      if (result.success && result.user) {
        // Créer le cookie de contexte côté client
        document.cookie = `login_context=employee; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        console.log('✅ Cookie login_context=employee créé')
        
        // Redirection basée sur le rôle de l'employé
        const role = result.user.role
        let redirectPath = "/fr/home" // Par défaut
        
        if (role === 'superuser') {
          redirectPath = "/fr/admin/superuser/dashboard"
        } else if (role === 'executive') {
          redirectPath = "/fr/executive"
        } else if (role === 'admin' || role === 'manager' || role === 'member') {
          redirectPath = "/fr/home"
        }
        
        router.push(redirectPath)
        router.refresh()
      } else {
        setError(result.error || "Login failed")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <FormWrapper 
      maxWidth="md"
      title={t('auth.welcomeBack')}
      description={t('auth.signInDescription')}
      icon="🔐"
    >
      <div className="flex justify-end mb-4">
        <LanguageSelector />
      </div>
      
      <FormSection>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              {...register("email")}
              disabled={isLoading}
              className="bg-white"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
                className="bg-white"
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
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>
      </FormSection>

      <FormSection colorScheme="blue">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t('auth.noAccount')}{" "}
            <Link href="/register" className="text-blue-600 hover:underline font-medium">
              {t('auth.signUp')}
            </Link>
          </p>
          
          <Separator className="my-4" />
          
          <div>
            <p className="text-sm font-medium mb-3 text-blue-900">{t('auth.demoAccounts')}</p>
            <div className="space-y-2 text-xs text-blue-700">
              <p>
                <strong>{t('auth.admin')}:</strong> admin@loftmanager.com / password123
              </p>
              <p>
                <strong>{t('auth.manager')}:</strong> manager@loftmanager.com / password123
              </p>
              <p>
                <strong>{t('auth.member')}:</strong> member@loftmanager.com / password123
              </p>
            </div>
          </div>
        </div>
      </FormSection>
    </FormWrapper>
  )
}