'use client'

import React, { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DollarSign } from 'lucide-react'
import { 
  Currency, 
  CURRENCIES, 
  getStoredCurrency, 
  storeCurrency,
  getCurrencyName 
} from '@/lib/currency'
import { Locale } from '@/i18n'
import { isRTL } from '@/lib/rtl'

interface CurrencySelectorProps {
  value?: Currency;
  onChange?: (currency: Currency) => void;
  className?: string;
}

export function CurrencySelector({ 
  value, 
  onChange, 
  className = '' 
}: CurrencySelectorProps) {
  const locale = useLocale() as Locale
  const t = useTranslations('currency')
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('DZD')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = value || getStoredCurrency(locale)
    setCurrentCurrency(stored)
    setMounted(true)
  }, [value, locale])

  const handleCurrencyChange = (currency: Currency) => {
    setCurrentCurrency(currency)
    storeCurrency(currency)
    onChange?.(currency)
  }

  // Show loading state during SSR
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className={`h-8 px-2 ${className}`} disabled>
        <DollarSign className="w-4 h-4" />
        <span className="sr-only">Select currency</span>
      </Button>
    )
  }

  const isCurrentRTL = isRTL(locale)
  const currentCurrencyInfo = CURRENCIES[currentCurrency]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-8 px-2 gap-1 ${isCurrentRTL ? 'flex-row-reverse' : 'flex-row'} ${className}`}
          title={t('selector.change')}
        >
          <span className="font-mono text-sm font-medium">
            {currentCurrencyInfo.symbol}
          </span>
          <span className="text-xs font-medium hidden sm:inline">
            {currentCurrency}
          </span>
          <span className="sr-only">{t('selector.title')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align={isCurrentRTL ? "start" : "end"}
        className={isCurrentRTL ? 'text-right' : 'text-left'}
      >
        {Object.entries(CURRENCIES).map(([code, info]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleCurrencyChange(code as Currency)}
            className={`${isCurrentRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'} ${
              code === currentCurrency ? 'bg-accent' : ''
            }`}
          >
            <span 
              className={`font-mono font-medium ${isCurrentRTL ? 'ml-2' : 'mr-2'}`}
            >
              {info.symbol}
            </span>
            <div className="flex flex-col">
              <span className="font-medium">{code}</span>
              <span className="text-xs text-muted-foreground">
                {getCurrencyName(code as Currency, locale)}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Hook for using currency in components
export function useCurrency() {
  const locale = useLocale() as Locale
  const [currency, setCurrency] = useState<Currency>('DZD')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = getStoredCurrency(locale)
    setCurrency(stored)
    setMounted(true)
  }, [locale])

  const updateCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency)
    storeCurrency(newCurrency)
  }

  return {
    currency,
    setCurrency: updateCurrency,
    mounted
  }
}