"use client"

import { useTranslations, useLocale } from 'next-intl'
import { 
  translateTransactionDescription, 
  translateTransactionStatus, 
  translateTransactionType,
  translatePaymentMethod,
  translateCurrency
} from '@/lib/utils/transaction-translator'
import { currencyDisplayService } from '@/lib/services/currency-display'
import { formatDualCurrency, getCurrencySymbol, shouldShowConversion, getAmountColorClass } from '@/lib/utils/currency-display-utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Info, 
  Eye, 
  Edit, 
  Trash2,
  Building,
  CreditCard,
  Tag
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Transaction {
  id: string
  description: string
  status: string
  transaction_type: 'income' | 'expense'
  amount: number
  currency_id?: string
  payment_method_id?: string
  date: string
  category: string
  loft_id?: string
  equivalent_amount_default_currency?: number
  ratio_at_transaction?: number
}

interface TransactionsListProps {
  transactions: Transaction[]
  categories: any[]
  lofts: any[]
  currencies: any[]
  paymentMethods: any[]
  isAdmin: boolean
  onDelete?: (id: string) => void
  showActions?: boolean
  compact?: boolean
}

export function TransactionsList({ 
  transactions, 
  categories, 
  lofts, 
  currencies, 
  paymentMethods, 
  isAdmin, 
  onDelete,
  showActions = true,
  compact = false
}: TransactionsListProps) {
  const locale = useLocale()
  const t = useTranslations('transactions')
  const tCommon = useTranslations('common')
  
  const defaultCurrency = currencies.find(c => c.is_default)

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const renderCurrencyAmount = (transaction: Transaction) => {
    const currency = currencies.find(c => c.id === transaction.currency_id)
    const showConversion = currency && defaultCurrency && shouldShowConversion(currency, defaultCurrency)
    
    const amountColorClass = getAmountColorClass(
      transaction.amount, 
      transaction.transaction_type
    )

    return (
      <div className="text-right">
        <div className={`font-bold ${compact ? 'text-sm' : 'text-lg'} ${amountColorClass}`}>
          {transaction.transaction_type === 'income' ? '+' : '-'}
          {formatAmount(transaction.amount)} {getCurrencySymbol(currency || defaultCurrency)}
        </div>
        
        {showConversion && transaction.equivalent_amount_default_currency && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-gray-500 flex items-center justify-end gap-1 cursor-help">
                  <Info className="h-3 w-3" />
                  ≈ {formatAmount(transaction.equivalent_amount_default_currency)} {getCurrencySymbol(defaultCurrency)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {transaction.ratio_at_transaction && currency && defaultCurrency && (
                    `1 ${currency.code} = ${transaction.ratio_at_transaction.toFixed(4)} ${defaultCurrency.code}`
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('noTransactions')}
        </h3>
        <p className="text-gray-600">
          {t('noTransactionsDescription')}
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-${compact ? '2' : '4'}`}>
      {transactions.map((transaction) => {
        const currency = currencies.find(c => c.id === transaction.currency_id)
        const loft = lofts.find(l => l.id === transaction.loft_id)
        const paymentMethod = paymentMethods.find(pm => pm.id === transaction.payment_method_id)
        
        return (
          <Card key={transaction.id} className={`border-0 shadow-md bg-white hover:shadow-lg transition-all duration-200 ${compact ? 'py-2' : ''}`}>
            <CardContent className={compact ? 'p-4' : 'p-6'}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-1.5 rounded-full ${transaction.transaction_type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {transaction.transaction_type === 'income' ? 
                        <TrendingUp className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-green-600`} /> : 
                        <TrendingDown className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-red-600`} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-900 truncate`}>
                        {transaction.description || t('noDescription')}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(transaction.date), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                    <Badge className={`${getStatusBadgeColor(transaction.status)} border text-xs`}>
                      {translateTransactionStatus(transaction.status, locale)}
                    </Badge>
                  </div>

                  {/* Details */}
                  {!compact && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                      {transaction.category && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span className="truncate">{transaction.category}</span>
                        </div>
                      )}
                      
                      {loft && (
                        <div className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          <span className="truncate">{loft.name}</span>
                        </div>
                      )}
                      
                      {paymentMethod && (
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          <span className="truncate">{paymentMethod.name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {showActions && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/transactions/${transaction.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          {tCommon('view')}
                        </Link>
                      </Button>
                      
                      {isAdmin && (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/transactions/${transaction.id}/edit`}>
                              <Edit className="h-3 w-3 mr-1" />
                              {tCommon('edit')}
                            </Link>
                          </Button>
                          
                          {onDelete && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => onDelete(transaction.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {tCommon('delete')}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="ml-4">
                  {renderCurrencyAmount(transaction)}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}