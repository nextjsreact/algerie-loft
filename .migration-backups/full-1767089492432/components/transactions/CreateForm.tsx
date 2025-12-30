"use client"

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslations } from 'next-intl'
import { currencyDisplayService } from '@/lib/services/currency-display'
import { getCurrencySymbol, shouldShowConversion } from '@/lib/utils/currency-display-utils'
import { Info, Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export function CreateForm({
  onSubmit,
  categories,
  lofts,
  currencies,
  paymentMethods
}: {
  onSubmit: (data: any) => Promise<void>,
  categories: any[],
  lofts: any[],
  currencies: any[],
  paymentMethods: any[]
}) {
  const t = useTranslations('transactions')
  const [formData, setFormData] = useState({
    amount: '',
    transaction_type: 'income',
    status: 'completed',
    description: '',
    category: '',
    loft_id: '',
    currency_id: '',
    payment_method_id: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const [conversionPreview, setConversionPreview] = useState<{
    convertedAmount: number
    exchangeRate: number
    isLoading: boolean
    error?: string
  } | null>(null)

  const defaultCurrency = currencies.find(c => c.is_default)
  const selectedCurrency = currencies.find(c => c.id === formData.currency_id)

  // Calculate conversion preview when amount or currency changes
  useEffect(() => {
    const calculateConversion = async () => {
      if (!formData.amount || !formData.currency_id || !defaultCurrency) {
        setConversionPreview(null)
        return
      }

      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        setConversionPreview(null)
        return
      }

      const currency = currencies.find(c => c.id === formData.currency_id)
      if (!currency || !shouldShowConversion(currency, defaultCurrency)) {
        setConversionPreview(null)
        return
      }

      setConversionPreview(prev => ({ ...prev, isLoading: true }))

      try {
        // Simple conversion using the ratio field
        // If CAD ratio is 0.75 and DZD ratio is 1, then 1 CAD = 0.75 DZD
        const exchangeRate = currency.ratio / defaultCurrency.ratio
        const convertedAmount = amount * exchangeRate

        setConversionPreview({
          convertedAmount: Math.round(convertedAmount * 100) / 100,
          exchangeRate,
          isLoading: false
        })
      } catch (error) {
        setConversionPreview({
          convertedAmount: 0,
          exchangeRate: 1,
          isLoading: false,
          error: 'Conversion failed'
        })
      }
    }

    const debounceTimer = setTimeout(calculateConversion, 300)
    return () => clearTimeout(debounceTimer)
  }, [formData.amount, formData.currency_id, currencies, defaultCurrency])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({...prev, [name]: value}))
  }

  const handleSelect = (name: string, value: string) => {
    setFormData(prev => ({...prev, [name]: value}))
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      date: formData.date || new Date().toISOString().split('T')[0],
      description: formData.description || 'Transaction'
    })
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('createTransaction', { ns: 'transactions' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  {t('amount', { ns: 'transactions' })}
                </Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  className="text-lg font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  {t('description', { ns: 'transactions' })}
                </Label>
                <Input
                  id="description"
                  name="description"
                  placeholder={t('descriptionPlaceholder', { ns: 'transactions' })}
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('type', { ns: 'transactions' })}
                </Label>
                <Select name="transaction_type" onValueChange={(value) => handleSelect('transaction_type', value)} defaultValue="income">
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectType', { ns: 'transactions' })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        {t('income', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                    <SelectItem value="expense">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        {t('expense', { ns: 'transactions' })}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('currency', { ns: 'transactions' })}</Label>
                <Select name="currency_id" onValueChange={(value) => handleSelect('currency_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCurrency', { ns: 'transactions' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <span>{c.name}</span>
                          <Badge variant="outline">{c.symbol}</Badge>
                          {c.is_default && <Badge variant="secondary">Default</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('date', { ns: 'transactions' })}</Label>
                <Input
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Optional Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('category', { ns: 'transactions' })}</Label>
                <Select name="category" onValueChange={(value) => handleSelect('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCategory', { ns: 'transactions' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('loft', { ns: 'transactions' })}</Label>
                <Select name="loft_id" onValueChange={(value) => handleSelect('loft_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectLoft', { ns: 'transactions' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {lofts.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('paymentMethod', { ns: 'transactions' })}</Label>
                <Select name="payment_method_id" onValueChange={(value) => handleSelect('payment_method_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectPaymentMethod', { ns: 'transactions' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              {t('createTransaction', { ns: 'transactions' })}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Conversion Preview */}
      {conversionPreview && selectedCurrency && defaultCurrency && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Info className="h-5 w-5" />
              {t('conversionPreview', { ns: 'transactions' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {t('originalAmount', { ns: 'transactions' })}
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {formatAmount(parseFloat(formData.amount) || 0)} {getCurrencySymbol(selectedCurrency)}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {t('convertedAmount', { ns: 'transactions' })}
                </span>
                <span className="text-lg font-bold text-green-600">
                  ≈ {formatAmount(conversionPreview.convertedAmount)} {getCurrencySymbol(defaultCurrency)}
                </span>
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center p-2 bg-blue-100 rounded-lg cursor-help">
                      <span className="text-xs text-blue-700 flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        1 {selectedCurrency.code} = {conversionPreview.exchangeRate.toFixed(4)} {defaultCurrency.code}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('exchangeRateTooltip', { ns: 'transactions' })}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {conversionPreview.error && (
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-xs text-red-700">{conversionPreview.error}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
