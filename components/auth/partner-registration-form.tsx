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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, ArrowLeft, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { registerPartner } from '@/lib/auth'

const partnerRegistrationSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  businessName: z.string().optional(),
  businessType: z.enum(['individual', 'company']),
  address: z.string().min(10, 'Please provide a complete address'),
  phone: z.string().min(10, 'Please provide a valid phone number'),
  taxId: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type PartnerRegistrationData = z.infer<typeof partnerRegistrationSchema>

interface PartnerRegistrationFormProps {
  onBack: () => void
  onSuccess: () => void
}

export function PartnerRegistrationForm({ onBack, onSuccess }: PartnerRegistrationFormProps) {
  const t = useTranslations('auth')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<PartnerRegistrationData>({
    resolver: zodResolver(partnerRegistrationSchema),
    defaultValues: {
      businessType: 'individual'
    }
  })

  const businessType = watch('businessType')

  const onSubmit = async (data: PartnerRegistrationData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await registerPartner(
        data.email,
        data.password,
        data.fullName,
        {
          businessName: data.businessName,
          businessType: data.businessType,
          address: data.address,
          phone: data.phone,
          taxId: data.taxId
        }
      )
      
      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => setStep(2)
  const prevStep = () => setStep(1)

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={step === 1 ? onBack : prevStep}
            className="p-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>{t('partnerRegistration.title')}</CardTitle>
            <CardDescription>
              {t('partnerRegistration.description')} - {t('partnerRegistration.step')} {step}/2
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('partnerRegistration.fullName')}</Label>
                <Input
                  id="fullName"
                  {...register('fullName')}
                  placeholder={t('partnerRegistration.fullNamePlaceholder')}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('partnerRegistration.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder={t('partnerRegistration.emailPlaceholder')}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('partnerRegistration.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder={t('partnerRegistration.passwordPlaceholder')}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('partnerRegistration.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  placeholder={t('partnerRegistration.confirmPasswordPlaceholder')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="button"
                onClick={nextStep}
                className="w-full"
              >
                {t('partnerRegistration.nextStep')}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="businessType">{t('partnerRegistration.businessType')}</Label>
                <Select
                  value={businessType}
                  onValueChange={(value: 'individual' | 'company') => setValue('businessType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">{t('partnerRegistration.individual')}</SelectItem>
                    <SelectItem value="company">{t('partnerRegistration.company')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {businessType === 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="businessName">{t('partnerRegistration.businessName')}</Label>
                  <Input
                    id="businessName"
                    {...register('businessName')}
                    placeholder={t('partnerRegistration.businessNamePlaceholder')}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-red-600">{errors.businessName.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="address">{t('partnerRegistration.address')}</Label>
                <Textarea
                  id="address"
                  {...register('address')}
                  placeholder={t('partnerRegistration.addressPlaceholder')}
                  rows={3}
                />
                {errors.address && (
                  <p className="text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('partnerRegistration.phone')}</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder={t('partnerRegistration.phonePlaceholder')}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {businessType === 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="taxId">{t('partnerRegistration.taxId')}</Label>
                  <Input
                    id="taxId"
                    {...register('taxId')}
                    placeholder={t('partnerRegistration.taxIdPlaceholder')}
                  />
                  {errors.taxId && (
                    <p className="text-sm text-red-600">{errors.taxId.message}</p>
                  )}
                </div>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {t('partnerRegistration.verificationNotice')}
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1"
                >
                  {t('partnerRegistration.previousStep')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('partnerRegistration.submit')}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  )
}