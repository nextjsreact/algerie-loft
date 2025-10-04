"use client"

import { getCurrencies, setDefaultCurrency, deleteCurrency } from '@/app/actions/currencies'
import { CurrencyClient } from './components/client'
import { useEffect, useState } from "react"
import { useTranslations } from 'next-intl';
import type { Currency } from "@/lib/types"
import { Button } from "@/components/ui/button"

export default function CurrenciesPage() {
  const t = useTranslations();
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCurrencies() {
      try {
        setError(null)
        const data = await getCurrencies()
        setCurrencies(data)
      } catch (error) {
        console.error('Failed to load currencies:', error)
        setError(error instanceof Error ? error.message : 'Failed to load currencies')
      } finally {
        setLoading(false)
      }
    }
    loadCurrencies()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-6">
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-destructive mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('common.error')}</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t('common.retry') || 'Try Again'}
          </Button>
        </div>
      </div>
    )
  }

  const handleSetDefault = async (id: string) => {
    // Optimistic update
    const previousCurrencies = [...currencies]
    setCurrencies(prev =>
      prev.map(currency => ({
        ...currency,
        is_default: currency.id === id
      }))
    )

    try {
      await setDefaultCurrency(id)
    } catch (error) {
      // Revert on error
      setCurrencies(previousCurrencies)
      console.error('Failed to set default currency:', error)
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    // Optimistic update
    const previousCurrencies = [...currencies]
    setCurrencies(prev => prev.filter(currency => currency.id !== id))

    try {
      await deleteCurrency(id)
    } catch (error) {
      // Revert on error
      setCurrencies(previousCurrencies)
      console.error('Failed to delete currency:', error)
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <CurrencyClient
        data={currencies}
        onSetDefault={handleSetDefault}
        onDelete={handleDelete}
      />
    </div>
  )
}