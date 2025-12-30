'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { registerClientComplete } from '@/lib/client-auth'

const clientRegistrationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type ClientRegistrationData = z.infer<typeof clientRegistrationSchema>

interface ClientRegistrationFormProps {
  onBack: () => void
  onSuccess: () => void
}

export function ClientRegistrationForm({ onBack, onSuccess }: ClientRegistrationFormProps) {
  const t = useTranslations('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ClientRegistrationData>({
    resolver: zodResolver(clientRegistrationSchema)
  })

  const onSubmit = async (data: ClientRegistrationData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await registerClientComplete({
        email: data.email,
        password: data.password,
        fullName: data.fullName
      })
      
      if (result.success) {
        if (result.requiresEmailVerification) {
          setError('Please check your email to verify your account before logging in.')
        } else {
          onSuccess()
        }
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>{t('clientRegistration.title')}</CardTitle>
            <CardDescription>{t('clientRegistration.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('clientRegistration.fullName')}</Label>
            <Input
              id="fullName"
              {...register('fullName')}
              placeholder={t('clientRegistration.fullNamePlaceholder')}
            />
            {errors.fullName && (
              <p className="text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('clientRegistration.email')}</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder={t('clientRegistration.emailPlaceholder')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('clientRegistration.password')}</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder={t('clientRegistration.passwordPlaceholder')}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('clientRegistration.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              placeholder={t('clientRegistration.confirmPasswordPlaceholder')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('clientRegistration.submit')}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {t('clientRegistration.benefits')}
        </div>
      </CardContent>
    </Card>
  )
}