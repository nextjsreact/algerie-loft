'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FormWrapper, FormSection } from "@/components/ui/form-wrapper"
import { Calendar, DollarSign, FileText } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { markBillAsPaid } from '@/app/actions/bill-notifications'
import { useTranslations } from 'next-intl'

type UtilityType = 'eau' | 'energie' | 'telephone' | 'internet' | 'tv' | 'gas'

const UTILITY_LABELS = {
  eau: 'bills.utilities.eau',
  energie: 'bills.utilities.energie', 
  telephone: 'bills.utilities.telephone',
  internet: 'bills.utilities.internet',
  tv: 'bills.utilities.tv',
  gas: 'bills.utilities.gas'
}

const UTILITY_CATEGORIES = {
  eau: 'Water Bill',
  energie: 'Energy Bill',
  telephone: 'Phone Bill',
  internet: 'Internet Bill',
  tv: 'TV Bill',
  gas: 'Gas Bill'
}

const billPaymentSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be positive'),
  currency_id: z.string().optional(),
  description: z.string().optional(),
  date: z.string(),
  payment_method_id: z.string().optional(),
  notes: z.string().optional()
})

type BillPaymentFormData = z.infer<typeof billPaymentSchema>

interface BillPaymentFormProps {
  loftId: string
  loftName: string
  utilityType: 'eau' | 'energie' | 'telephone' | 'internet' | 'tv' | 'gas'
  dueDate: string
  onSuccess: () => void
  onCancel: () => void
}

export function BillPaymentForm({ 
  loftId, 
  loftName, 
  utilityType, 
  dueDate, 
  onSuccess, 
  onCancel 
}: BillPaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<Array<{id: string, name: string}>>([])
  const [currencies, setCurrencies] = useState<Array<{id: string, code: string, name: string, symbol: string, is_default: boolean, ratio: number}>>([])
  const [defaultCurrency, setDefaultCurrency] = useState<{id: string, code: string, symbol: string} | null>(null)
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>('')
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const supabase = createClient()
  const t = useTranslations('bills')

  const getUtilityLabel = () => t(UTILITY_LABELS[utilityType as UtilityType])

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BillPaymentFormData>({
    resolver: zodResolver(billPaymentSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: ''
    }
  })

  // Set description after translations are loaded
  useEffect(() => {
    if (utilityType && loftName) {
      const utilityLabel = t(UTILITY_LABELS[utilityType as UtilityType])
      setValue('description', `${utilityLabel} bill payment for ${loftName}`)
    }
  }, [utilityType, loftName, t, setValue])

  // Load payment methods and currencies
  useEffect(() => {
    const loadData = async () => {
      // Load payment methods
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_methods')
        .select('id, name')
        .order('name')

      if (!paymentError && paymentData) {
        setPaymentMethods(paymentData)
        
        // Set Cash as default payment method
        const cashMethod = paymentData.find(method => 
          method.name.toLowerCase().includes('cash') || 
          method.name.toLowerCase().includes('espèce') ||
          method.name.toLowerCase().includes('liquide')
        )
        if (cashMethod) {
          setValue('payment_method_id', cashMethod.id)
        }
      }

      // Load currencies
      const { data: currencyData, error: currencyError } = await supabase
        .from('currencies')
        .select('id, code, name, symbol, is_default, ratio')
        .order('is_default', { ascending: false })
        .order('code', { ascending: true })

      if (!currencyError && currencyData) {
        console.log('Loaded currencies:', currencyData)
        setCurrencies(currencyData)
        
        // Find and set default currency
        const defaultCurr = currencyData.find(c => c.is_default)
        console.log('Default currency:', defaultCurr)
        if (defaultCurr) {
          setDefaultCurrency({
            id: defaultCurr.id,
            code: defaultCurr.code,
            symbol: defaultCurr.symbol
          })
          setSelectedCurrencyId(defaultCurr.id)
          setValue('currency_id', defaultCurr.id)
        }
      } else {
        console.error('Currency loading error:', currencyError)
      }
    }
    loadData()
  }, [setValue])

  // Watch amount changes to calculate conversion
  const watchedAmount = watch('amount')
  
  useEffect(() => {
    if (watchedAmount && selectedCurrencyId && defaultCurrency) {
      const selectedCurrency = currencies.find(c => c.id === selectedCurrencyId)
      if (selectedCurrency && selectedCurrency.id !== defaultCurrency.id) {
        // Convert to default currency using the ratio
        const converted = watchedAmount * selectedCurrency.ratio
        setConvertedAmount(converted)
      } else {
        setConvertedAmount(null)
      }
    } else {
      setConvertedAmount(null)
    }
  }, [watchedAmount, selectedCurrencyId, currencies, defaultCurrency])

  const handleCurrencyChange = (currencyId: string) => {
    setSelectedCurrencyId(currencyId)
    setValue('currency_id', currencyId)
  }

  const onSubmit = async (data: BillPaymentFormData) => {
    setIsSubmitting(true)
    
    try {
      console.log('Form data being submitted:', data)
      console.log('Selected currency ID:', selectedCurrencyId)
      console.log('Available currencies:', currencies)
      
      // Safe utility label function
      const getUtilityLabelSafe = () => {
        try {
          return t(UTILITY_LABELS[utilityType as UtilityType]) || utilityType
        } catch {
          return utilityType
        }
      }
      
      // Get the category ID for this utility type
      const result = await markBillAsPaid(
        loftId,
        utilityType,
        data.amount,
        data.description || `${getUtilityLabelSafe()} bill payment for ${loftName}`,
        data.currency_id || selectedCurrencyId, // Use selectedCurrencyId as fallback
        data.payment_method_id
      );

      if (!result.success) {
        throw new Error(result.message);
      }

      // Safe success message
      const successMsg = t('bills.successMessage', { utility: getUtilityLabelSafe() })
      
      toast.success(successMsg)
      onSuccess()
    } catch (error) {
      console.error('Error recording bill payment:', error)
      const errorMsg = t('bills.errorMessage')
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t('bills.title')}
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{loftName}</Badge>
            <Badge className="bg-blue-100 text-blue-800">
              {getUtilityLabel()}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            {t('bills.due')}: {new Date(dueDate).toLocaleDateString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t('bills.amount')}</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder={t('amountPlaceholder')}
                {...register('amount', { valueAsNumber: true })}
                className="flex-1 bg-white"
              />
              <Select value={selectedCurrencyId} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="DA" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.symbol}
                    </SelectItem>
                  ))}
                  {currencies.length === 0 && (
                    <SelectItem value="loading" disabled>
                      Loading currencies...
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {convertedAmount && (
              <p className="text-sm text-blue-600">
                ≈ {convertedAmount.toFixed(2)} {defaultCurrency?.symbol} ({defaultCurrency?.code})
              </p>
            )}
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">{t('bills.paymentDate')}</Label>
            <Input
              id="date"
              type="date"
              {...register('date')} 
              placeholder="jj/mm/aaaa"
              className="bg-white"
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">{t('bills.paymentMethod')}</Label>
            <Select 
              value={watch('payment_method_id') || ''} 
              onValueChange={(value) => setValue('payment_method_id', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder={t('bills.selectPaymentMethod')} />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('bills.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('bills.descriptionPlaceholder')}
              {...register('description')} className="bg-white"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? t('bills.recording') : t('bills.recordPayment')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('bills.cancel')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}