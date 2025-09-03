"use client"

import { getCurrencies, setDefaultCurrency, deleteCurrency } from '@/app/actions/currencies'
import { CurrencyClient } from './components/client'
import { useEffect, useState } from "react"
import { useTranslations } from 'next-intl';
import type { Currency } from "@/lib/types"

export default function CurrenciesPage() {
  const t = useTranslations();
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCurrencies() {
      try {
        const data = await getCurrencies()
        setCurrencies(data)
      } catch (error) {
        console.error('Failed to load currencies:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCurrencies()
  }, [])

  if (loading) {
    return <div className="p-8">{t('common.loading')}</div>
  }

  return (
    <div className="space-y-6">
      <CurrencyClient data={currencies} onSetDefault={setDefaultCurrency} onDelete={deleteCurrency} />
    </div>
  )
}
