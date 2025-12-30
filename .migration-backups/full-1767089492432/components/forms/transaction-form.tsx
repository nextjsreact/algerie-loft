'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { transactionSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FormWrapper, FormSection } from '@/components/ui/form-wrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Currency, Transaction } from '@/lib/types'
import { Transaction as TransactionFormData } from '@/lib/validations'
import { useTranslations } from 'next-intl'
import { 
  DollarSign, 
  Calendar, 
  FileText, 
  Tag, 
  Building, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Coins
} from 'lucide-react'

interface Category {
  id: string;
  name: string;
  type: string;
}

interface Loft {
  id: string;
  name: string;
}

interface PaymentMethod {
  id: string;
  name: string;
}

interface TransactionFormProps {
  transaction?: Transaction
  categories: Category[]
  lofts: Loft[]
  currencies: Currency[]
  paymentMethods: PaymentMethod[]
  onSubmit: (data: TransactionFormData) => Promise<void>
  isSubmitting?: boolean
}

export function TransactionForm({ transaction, categories, lofts, currencies, paymentMethods, onSubmit, isSubmitting = false }: TransactionFormProps) {
  const router = useRouter()
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      ...transaction, // Spread existing transaction properties
      // Format date to YYYY-MM-DD string for HTML date input
      date: transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
      loft_id: transaction?.loft_id || '', // Ensure it's a string
      currency_id: transaction?.currency_id || '', // Ensure it's a string
      payment_method_id: transaction?.payment_method_id || '', // Ensure it's a string
      // Set default status and type for new transactions if not provided
      status: transaction?.status || 'pending',
      transaction_type: transaction?.transaction_type || 'income',
      amount: transaction?.amount || 0,
      description: transaction?.description || '',
      category: transaction?.category || '',
    },
  })

  const transactionType = watch("transaction_type")
  const status = watch("status")
  const filteredCategories = categories.filter(c => c.type === transactionType)

  const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
  const amount = watch("amount")
  const currencyId = watch("currency_id")

  useEffect(() => {
    const selectedCurrency = currencies.find(c => c.id === currencyId)
    const defaultCurrency = currencies.find(c => c.is_default)

    if (amount && selectedCurrency && defaultCurrency && selectedCurrency.id !== defaultCurrency.id) {
      const converted = (amount * (selectedCurrency.ratio || 1)) / (defaultCurrency.ratio || 1);
      setConvertedAmount(converted)
    } else {
      setConvertedAmount(null)
    }
  }, [amount, currencyId, currencies])

  const getTypeIcon = (type: string) => {
    return type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'failed': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200'
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'failed': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }


return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {transaction ? t('editTransaction') : t('addNewTransaction')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {transaction ? t('updateTransactionInfo') : t('createNewTransaction')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Transaction Type & Status */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
                {getTypeIcon(transactionType)}
                {t('transactionType')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="transaction_type" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Tag className="h-4 w-4" />
                    {t('type')}
                  </Label>
                  <Select onValueChange={(value) => setValue('transaction_type', value as any)} defaultValue={transaction?.transaction_type}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-2 hover:border-blue-300 dark:hover:border-blue-400 transition-colors dark:border-slate-600 dark:text-white">
                      <SelectValue placeholder={tCommon('selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          {t('income')}
                        </div>
                      </SelectItem>
                      <SelectItem value="expense" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          {t('expense')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.transaction_type && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.transaction_type.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    {getStatusIcon(status)}
                    {t('status')}
                  </Label>
                  <Select onValueChange={(value) => setValue('status', value as any)} defaultValue={transaction?.status}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-2 hover:border-blue-300 dark:hover:border-blue-400 transition-colors dark:border-slate-600 dark:text-white">
                      <SelectValue placeholder={tCommon('selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          {t('pending')}
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {t('completed')}
                        </div>
                      </SelectItem>
                      <SelectItem value="failed">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          {t('failed')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.status.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount & Date */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
                <DollarSign className="h-5 w-5" />
                {t('amountAndDate')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Coins className="h-4 w-4" />
                    {t('amount')}
                  </Label>
                  <div className="relative">
                    <Input 
                      id="amount" 
                      type="number" 
                      step="0.01" 
                      {...register('amount', { valueAsNumber: true })}
                      className="bg-white dark:bg-slate-700 border-2 hover:border-blue-300 dark:hover:border-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors pl-8 dark:border-slate-600 dark:text-white"
                      placeholder={t('amountPlaceholder')}
                    />
                    <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-300" />
                  </div>
                  {errors.amount && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.amount.message}</p>}
                  
                  {/* Currency Info */}
                  {amount !== null && amount !== undefined && amount > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {t('selectedCurrency')}: {currencies.find(c => c.id === currencyId)?.symbol || ''}{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}
                      </p>
                      {convertedAmount !== null && (
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {t('equivalent')} {currencies.find(c => c.is_default)?.symbol || 'Default'}: {new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(convertedAmount)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Calendar className="h-4 w-4" />
                    {t('date')}
                  </Label>
                  <Input 
                    id="date" 
                    type="date" 
                    {...register('date')}
                    placeholder="jj/mm/aaaa"
                    className="bg-white dark:bg-slate-700 border-2 hover:border-blue-300 dark:hover:border-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors dark:border-slate-600 dark:text-white"
                  />
                  {errors.date && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.date.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
                <FileText className="h-5 w-5" />
                {t('description')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <FileText className="h-4 w-4" />
                  {t('transactionDescription')}
                </Label>
                <Textarea 
                  id="description" 
                  {...register('description')}
                  className="bg-white dark:bg-slate-700 border-2 hover:border-blue-300 dark:hover:border-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors min-h-[100px] resize-none dark:border-slate-600 dark:text-white dark:placeholder-gray-400"
                  placeholder={t('descriptionPlaceholder')}
                />
                {errors.description && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.description.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Categories & Properties */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
                <Tag className="h-5 w-5" />
                {t('categoriesAndProperties')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Tag className="h-4 w-4" />
                    {t('category')}
                  </Label>
                  <Select onValueChange={(value) => setValue('category', value)} defaultValue={transaction?.category || ''}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-2 hover:border-blue-300 dark:hover:border-blue-400 transition-colors dark:border-slate-600 dark:text-white">
                      <SelectValue placeholder={tCommon('selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map(category => (
                        <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.category.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="loft" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Building className="h-4 w-4" />
                    {t('loft')} 
                    <Badge variant="secondary" className="text-xs">{t('optional')}</Badge>
                  </Label>
                  <Select onValueChange={(value) => setValue('loft_id', value)} defaultValue={transaction?.loft_id || ''}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-2 hover:border-blue-300 dark:hover:border-blue-400 transition-colors dark:border-slate-600 dark:text-white">
                      <SelectValue placeholder={tCommon('selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(lofts || []).map(loft => (
                        <SelectItem key={loft.id} value={loft.id}>{loft.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.loft_id && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.loft_id.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-white">
                <CreditCard className="h-5 w-5" />
                {t('paymentDetails', { ns: 'transactions' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency_id" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Coins className="h-4 w-4" />
                    {t('currency', { ns: 'transactions' })} 
                    <Badge variant="secondary" className="text-xs">{t('optional', { ns: 'transactions' })}</Badge>
                  </Label>
                  <Select onValueChange={(value) => setValue('currency_id', value)} defaultValue={transaction?.currency_id || ''}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-2 hover:border-blue-300 dark:hover:border-blue-400 transition-colors dark:border-slate-600 dark:text-white">
                      <SelectValue placeholder={tCommon('selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map(currency => (
                        <SelectItem key={currency.id} value={currency.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{currency.symbol}</span>
                            <span>{currency.name}</span>
                            {currency.is_default && <Badge variant="outline" className="text-xs">Default</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.currency_id && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.currency_id.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method_id" className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <CreditCard className="h-4 w-4" />
                    {t('paymentMethod', { ns: 'transactions' })} 
                    <Badge variant="secondary" className="text-xs">{t('optional', { ns: 'transactions' })}</Badge>
                  </Label>
                  <Select onValueChange={(value) => setValue('payment_method_id', value)} defaultValue={transaction?.payment_method_id || ''}>
                    <SelectTrigger className="bg-white dark:bg-slate-700 border-2 hover:border-blue-300 dark:hover:border-blue-400 transition-colors dark:border-slate-600 dark:text-white">
                      <SelectValue placeholder={tCommon('selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(paymentMethods || []).map(method => (
                        <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.payment_method_id && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.payment_method_id.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {tCommon('saving')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      {transaction ? t('updateTransaction', { ns: 'transactions' }) : t('createTransaction', { ns: 'transactions' })}
                    </div>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/transactions')}
                  className="border-2 border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 px-8 py-3 text-lg font-medium transition-all duration-200 dark:text-gray-200 dark:hover:text-white"
                >
                  {tCommon('cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
