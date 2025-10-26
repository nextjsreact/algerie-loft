"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Trash2, 
  Edit, 
  Share, 
  Shield, 
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Mail,
  Phone,
  CreditCard
} from 'lucide-react'
import { gdprDataRequestSchema, type GDPRDataRequestData } from '@/lib/schemas/privacy'
import { PrivacyService } from '@/lib/services/privacy-service'
import { toast } from 'sonner'

interface GDPRRequestFormProps {
  onSubmit?: (data: GDPRDataRequestData) => Promise<void>
  className?: string
  showTitle?: boolean
}

export function GDPRRequestForm({ onSubmit, className, showTitle = true }: GDPRRequestFormProps) {
  const t = useTranslations('privacy.gdpr')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [requestId, setRequestId] = useState<string | null>(null)

  const form = useForm<GDPRDataRequestData>({
    resolver: zodResolver(gdprDataRequestSchema),
    defaultValues: {
      requestType: 'export',
      email: '',
      fullName: '',
      reason: '',
      dataCategories: [],
      verificationMethod: 'email',
      consentToProcess: false,
      website: '' // Honeypot field
    }
  })

  const handleSubmit = async (data: GDPRDataRequestData) => {
    // Check honeypot field
    if (data.website) {
      console.log("GDPR request blocked - honeypot triggered")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        // Default submission to service
        const result = await PrivacyService.submitGDPRRequest(data)
        
        if (result.success) {
          setRequestId(result.requestId)
          setIsSuccess(true)
          form.reset()
          toast.success(t('form.successMessage'))
        } else {
          throw new Error(result.message)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('form.submitError')
      setSubmitError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'export': return <Download className="w-4 h-4" />
      case 'deletion': return <Trash2 className="w-4 h-4" />
      case 'rectification': return <Edit className="w-4 h-4" />
      case 'portability': return <Share className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'export': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'deletion': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'rectification': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'portability': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getVerificationIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="w-4 h-4" />
      case 'phone': return <Phone className="w-4 h-4" />
      case 'document': return <CreditCard className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  const dataCategories = [
    { id: 'personal_info', name: t('dataCategories.personalInfo'), description: t('dataCategories.personalInfoDesc') },
    { id: 'booking_history', name: t('dataCategories.bookingHistory'), description: t('dataCategories.bookingHistoryDesc') },
    { id: 'payment_data', name: t('dataCategories.paymentData'), description: t('dataCategories.paymentDataDesc') },
    { id: 'communication_logs', name: t('dataCategories.communicationLogs'), description: t('dataCategories.communicationLogsDesc') },
    { id: 'preferences', name: t('dataCategories.preferences'), description: t('dataCategories.preferencesDesc') },
    { id: 'analytics_data', name: t('dataCategories.analyticsData'), description: t('dataCategories.analyticsDataDesc') }
  ]

  if (isSuccess) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{t('form.successTitle')}</h3>
              <p className="text-muted-foreground">{t('form.successMessage')}</p>
              {requestId && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {t('form.requestId')}: {requestId}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {t('form.keepReference')}
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                {t('form.processingTime')}
              </p>
            </div>
            <Button onClick={() => setIsSuccess(false)} variant="outline">
              {t('form.submitAnother')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>{t('form.title')}</span>
          </CardTitle>
          <CardDescription>{t('form.description')}</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Honeypot field - hidden from users */}
          <input
            type="text"
            {...form.register("website")}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Request Type */}
          <div className="space-y-3">
            <Label>{t('form.requestType')} *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['export', 'deletion', 'rectification', 'portability'] as const).map((type) => (
                <div
                  key={type}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    form.watch('requestType') === type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => form.setValue('requestType', type)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded ${getRequestTypeColor(type)}`}>
                      {getRequestTypeIcon(type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{t(`requestTypes.${type}.name`)}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t(`requestTypes.${type}.description`)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('form.fullName')} *</Label>
              <Input
                id="fullName"
                {...form.register("fullName")}
                placeholder={t('form.fullNamePlaceholder')}
                className={form.formState.errors.fullName ? "border-red-500" : ""}
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('form.email')} *</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder={t('form.emailPlaceholder')}
                className={form.formState.errors.email ? "border-red-500" : ""}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Data Categories (for export/deletion requests) */}
          {(['export', 'deletion'] as const).includes(form.watch('requestType')) && (
            <div className="space-y-3">
              <Label>{t('form.dataCategories')}</Label>
              <p className="text-sm text-muted-foreground">{t('form.dataCategoriesDesc')}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dataCategories.map((category) => (
                  <div key={category.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={form.watch('dataCategories')?.includes(category.id as any)}
                      onCheckedChange={(checked) => {
                        const current = form.watch('dataCategories') || []
                        if (checked) {
                          form.setValue('dataCategories', [...current, category.id as any])
                        } else {
                          form.setValue('dataCategories', current.filter(id => id !== category.id))
                        }
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{category.name}</h4>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t('form.reason')} *</Label>
            <Textarea
              id="reason"
              {...form.register("reason")}
              placeholder={t('form.reasonPlaceholder')}
              rows={4}
              className={form.formState.errors.reason ? "border-red-500" : ""}
            />
            {form.formState.errors.reason && (
              <p className="text-sm text-red-500">{form.formState.errors.reason.message}</p>
            )}
          </div>

          {/* Verification Method */}
          <div className="space-y-3">
            <Label>{t('form.verificationMethod')} *</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['email', 'phone', 'document'] as const).map((method) => (
                <div
                  key={method}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    form.watch('verificationMethod') === method
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => form.setValue('verificationMethod', method)}
                >
                  <div className="flex items-center space-x-2">
                    {getVerificationIcon(method)}
                    <span className="text-sm font-medium">
                      {t(`verificationMethods.${method}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processing Time Notice */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {t('form.processingNotice')}
            </AlertDescription>
          </Alert>

          {/* Consent */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="consent"
              checked={form.watch("consentToProcess")}
              onCheckedChange={(checked) => form.setValue("consentToProcess", checked as boolean)}
              className={form.formState.errors.consentToProcess ? "border-red-500" : ""}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="consent"
                className="text-sm font-normal leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {t('form.consentText')} *
              </Label>
              {form.formState.errors.consentToProcess && (
                <p className="text-sm text-red-500">{form.formState.errors.consentToProcess.message}</p>
              )}
            </div>
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? t('form.submitting') : t('form.submit')}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              {t('form.legalNotice')}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}