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
import { Loader2, ArrowLeft, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

const employeeAccessSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  accessCode: z.string().min(6, 'Access code must be at least 6 characters')
})

type EmployeeAccessData = z.infer<typeof employeeAccessSchema>

interface EmployeeAccessFormProps {
  onBack: () => void
}

export function EmployeeAccessForm({ onBack }: EmployeeAccessFormProps) {
  const t = useTranslations('auth')
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<EmployeeAccessData>({
    resolver: zodResolver(employeeAccessSchema)
  })

  const onSubmit = async (data: EmployeeAccessData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate access code (this would typically be done server-side)
      if (data.accessCode !== process.env.NEXT_PUBLIC_EMPLOYEE_ACCESS_CODE) {
        setError(t('employeeAccess.invalidAccessCode'))
        setIsLoading(false)
        return
      }

      // Redirect to regular login with employee context
      const params = new URLSearchParams({
        email: data.email,
        employee: 'true'
      })
      
      router.push(`/login?${params.toString()}`)
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
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              {t('employeeAccess.title')}
            </CardTitle>
            <CardDescription>{t('employeeAccess.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('employeeAccess.email')}</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder={t('employeeAccess.emailPlaceholder')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('employeeAccess.password')}</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder={t('employeeAccess.passwordPlaceholder')}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessCode">{t('employeeAccess.accessCode')}</Label>
            <Input
              id="accessCode"
              {...register('accessCode')}
              placeholder={t('employeeAccess.accessCodePlaceholder')}
            />
            {errors.accessCode && (
              <p className="text-sm text-red-600">{errors.accessCode.message}</p>
            )}
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {t('employeeAccess.securityNotice')}
            </AlertDescription>
          </Alert>

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
            {t('employeeAccess.submit')}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {t('employeeAccess.contactAdmin')}
        </div>
      </CardContent>
    </Card>
  )
}