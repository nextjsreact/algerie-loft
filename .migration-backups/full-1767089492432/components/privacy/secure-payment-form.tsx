"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  Wallet,
  Shield, 
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { securePaymentSchema, type SecurePaymentData } from '@/lib/schemas/privacy'
import { SecurePaymentService } from '@/lib/services/secure-payment-service'
import { toast } from 'sonner'

interface SecurePaymentFormProps {
  userId: string
  bookingId: string
  amount: number
  currency: string
  description: string
  onPaymentComplete?: (result: any) => void
  onCancel?: () => void
  className?: string
}

export function SecurePaymentForm({
  userId,
  bookingId,
  amount,
  currency,
  description,
  onPaymentComplete,
  onCancel,
  className
}: SecurePaymentFormProps) {
  const t = useTranslations('privacy.payment')
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'bank' | 'wallet'>('card')
  const [showCardDetails, setShowCardDetails] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [error, setError] = useState<string | null>(null)

  const form = useForm<SecurePaymentData>({
    resolver: zodResolver(securePaymentSchema),
    defaultValues: {
      amount,
      currency: currency as 'DZD' | 'EUR' | 'USD',
      description,
      consentToCharge: false,
      termsAccepted: false,
      website: '' // Honeypot
    }
  })

  const handlePaymentMethodChange = (method: 'card' | 'mobile' | 'bank' | 'wallet') => {
    setPaymentMethod(method)
    // Clear previous method data
    form.setValue('cardToken', undefined)
    form.setValue('cardLast4', undefined)
    form.setValue('cardBrand', undefined)
    form.setValue('mobileNumber', undefined)
    form.setValue('mobileProvider', undefined)
    form.setValue('accountMask', undefined)
    form.setValue('bankCode', undefined)
    form.setValue('walletId', undefined)
    form.setValue('walletProvider', undefined)
  }

  const handleSubmit = async (data: SecurePaymentData) => {
    // Check honeypot
    if (data.website) {
      console.log("Payment blocked - honeypot triggered")
      return
    }

    setIsProcessing(true)
    setError(null)
    
    try {
      // Validate security requirements
      if (!SecurePaymentService.validatePaymentSecurity(data)) {
        throw new Error(t('errors.securityValidation'))
      }

      setProcessingStep(t('processing.validating'))
      
      // Add security context
      const paymentData: SecurePaymentData = {
        ...data,
        clientIp: await getClientIP(),
        userAgent: navigator.userAgent,
        sessionId: getSessionId()
      }

      setProcessingStep(t('processing.tokenizing'))
      
      // Process secure payment
      const result = await SecurePaymentService.processSecurePayment(
        paymentData,
        userId,
        bookingId
      )

      if (result.success) {
        toast.success(t('success.message'))
        onPaymentComplete?.(result)
      } else {
        throw new Error(result.message || t('errors.paymentFailed'))
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.unknown')
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('/api/client-ip')
      const data = await response.json()
      return data.ip || 'unknown'
    } catch {
      return 'unknown'
    }
  }

  const getSessionId = (): string => {
    return sessionStorage.getItem('session-id') || 'unknown'
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '')
    const formatted = cleaned.replace(/(.{4})/g, '$1 ').trim()
    return formatted.substring(0, 19)
  }

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4)
    }
    return cleaned
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="w-5 h-5" />
      case 'mobile': return <Smartphone className="w-5 h-5" />
      case 'bank': return <Building className="w-5 h-5" />
      case 'wallet': return <Wallet className="w-5 h-5" />
      default: return <CreditCard className="w-5 h-5" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>
          {t('description', { amount, currency })}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Honeypot field */}
          <input
            type="text"
            {...form.register("website")}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>{t('paymentMethod')} *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['card', 'mobile', 'bank', 'wallet'] as const).map((method) => (
                <div
                  key={method}
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all text-center",
                    paymentMethod === method
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handlePaymentMethodChange(method)}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {getPaymentMethodIcon(method)}
                    <span className="text-sm font-medium">
                      {t(`methods.${method}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Forms */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">{t('card.number')} *</Label>
                <div className="relative">
                  <Input
                    id="cardNumber"
                    type={showCardDetails ? "text" : "password"}
                    placeholder="•••• •••• •••• ••••"
                    onChange={(e) => {
                      const formatted = formatCardNumber(e.target.value)
                      form.setValue('cardToken', formatted)
                      // Extract last 4 digits for display
                      const cleaned = formatted.replace(/\s/g, '')
                      if (cleaned.length >= 4) {
                        form.setValue('cardLast4', cleaned.slice(-4))
                      }
                    }}
                    className={form.formState.errors.cardToken ? "border-red-500" : ""}
                    maxLength={19}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowCardDetails(!showCardDetails)}
                  >
                    {showCardDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {form.formState.errors.cardToken && (
                  <p className="text-sm text-red-500">{form.formState.errors.cardToken.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">{t('card.expiry')} *</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    onChange={(e) => {
                      const formatted = formatExpiryDate(e.target.value)
                      e.target.value = formatted
                    }}
                    maxLength={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">{t('card.cvv')} *</Label>
                  <Input
                    id="cvv"
                    type="password"
                    placeholder="•••"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardBrand">{t('card.brand')} *</Label>
                <Select onValueChange={(value) => form.setValue('cardBrand', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('card.selectBrand')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="cib">CIB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {paymentMethod === 'mobile' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobileProvider">{t('mobile.provider')} *</Label>
                <Select onValueChange={(value) => form.setValue('mobileProvider', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('mobile.selectProvider')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobilis">Mobilis Money</SelectItem>
                    <SelectItem value="djezzy">Djezzy Pay</SelectItem>
                    <SelectItem value="ooredoo">Ooredoo Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileNumber">{t('mobile.number')} *</Label>
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="+213 XX XX XX XX"
                  {...form.register('mobileNumber')}
                  className={form.formState.errors.mobileNumber ? "border-red-500" : ""}
                />
                {form.formState.errors.mobileNumber && (
                  <p className="text-sm text-red-500">{form.formState.errors.mobileNumber.message}</p>
                )}
              </div>
            </div>
          )}

          {paymentMethod === 'bank' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankCode">{t('bank.code')} *</Label>
                <Select onValueChange={(value) => form.setValue('bankCode', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('bank.selectBank')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BNA">Banque Nationale d'Algérie</SelectItem>
                    <SelectItem value="BEA">Banque Extérieure d'Algérie</SelectItem>
                    <SelectItem value="CPA">Crédit Populaire d'Algérie</SelectItem>
                    <SelectItem value="BADR">BADR Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountMask">{t('bank.account')} *</Label>
                <Input
                  id="accountMask"
                  placeholder="••••••••••••1234"
                  {...form.register('accountMask')}
                />
              </div>
            </div>
          )}

          {paymentMethod === 'wallet' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="walletProvider">{t('wallet.provider')} *</Label>
                <Select onValueChange={(value) => form.setValue('walletProvider', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('wallet.selectProvider')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baridimob">BaridiMob</SelectItem>
                    <SelectItem value="satimpay">SatimPay</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="walletId">{t('wallet.id')} *</Label>
                <Input
                  id="walletId"
                  placeholder={t('wallet.idPlaceholder')}
                  {...form.register('walletId')}
                />
              </div>
            </div>
          )}

          {/* Security Information */}
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  {t('security.title')}
                </h4>
              </div>
              <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                <div className="flex items-center space-x-2">
                  <Lock className="w-3 h-3" />
                  <span>{t('security.encryption')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-3 h-3" />
                  <span>{t('security.pciCompliant')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3" />
                  <span>{t('security.tokenization')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consent Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="consentToCharge"
                checked={form.watch("consentToCharge")}
                onCheckedChange={(checked) => form.setValue("consentToCharge", checked as boolean)}
                className={form.formState.errors.consentToCharge ? "border-red-500" : ""}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="consentToCharge" className="text-sm font-normal leading-snug">
                  {t('consent.charge', { amount, currency })} *
                </Label>
                {form.formState.errors.consentToCharge && (
                  <p className="text-sm text-red-500">{form.formState.errors.consentToCharge.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="termsAccepted"
                checked={form.watch("termsAccepted")}
                onCheckedChange={(checked) => form.setValue("termsAccepted", checked as boolean)}
                className={form.formState.errors.termsAccepted ? "border-red-500" : ""}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="termsAccepted" className="text-sm font-normal leading-snug">
                  {t('consent.terms')} *
                </Label>
                {form.formState.errors.termsAccepted && (
                  <p className="text-sm text-red-500">{form.formState.errors.termsAccepted.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                {processingStep || t('processing.default')}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={isProcessing || !form.watch('consentToCharge') || !form.watch('termsAccepted')}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('processing.button')}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {t('payNow', { amount, currency })}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}