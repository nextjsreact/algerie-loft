"use client"

import { useTranslations, useLocale } from 'next-intl'
import { 
  translateTransactionDescription, 
  translateTransactionStatus, 
  translateTransactionType,
  translatePaymentMethod,
  translateCurrency
} from '@/lib/utils/transaction-translator'

interface TransactionsListProps {
  transactions: {
    id: string
    description: string
    status: string
    type: string
    amount: number
    currency: string
    payment_method?: string
    date: string
    equivalent?: number
    ratio?: number
  }[]
  categories: any[]
  lofts: any[]
  currencies: any[]
  paymentMethods: any[]
  isAdmin: boolean
  children?: React.ReactNode
}

export function TransactionsList({ transactions, categories, lofts, currencies, paymentMethods, isAdmin, children }: TransactionsListProps) {
  const locale = useLocale()
  const language = locale

  return (
    <div>
      {children}
    </div>
  )
}