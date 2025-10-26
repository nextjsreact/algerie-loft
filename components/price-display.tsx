'use client'

import React, { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { 
  PriceData, 
  Currency, 
  formatPrice, 
  convertPrice, 
  getExchangeRates,
  ExchangeRates 
} from '@/lib/currency'
import { Locale } from '@/i18n'
import { useCurrency } from './currency-selector'

interface PriceDisplayProps {
  price: PriceData;
  className?: string;
  showCurrency?: boolean;
  compact?: boolean;
  targetCurrency?: Currency;
}

export function PriceDisplay({ 
  price, 
  className = '', 
  showCurrency = true, 
  compact = false,
  targetCurrency 
}: PriceDisplayProps) {
  const locale = useLocale() as Locale
  const { currency: userCurrency, mounted } = useCurrency()
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)

  useEffect(() => {
    getExchangeRates().then(setExchangeRates)
  }, [])

  // Use target currency or user preference
  const displayCurrency = targetCurrency || userCurrency

  // Show original price during loading
  if (!mounted || !exchangeRates) {
    const formatted = formatPrice(price, locale, { showCurrency, compact })
    return (
      <span className={className}>
        {formatted.formatted}
      </span>
    )
  }

  // Convert and format price
  const convertedPrice = convertPrice(price, displayCurrency, exchangeRates)
  const formatted = formatPrice(convertedPrice, locale, { showCurrency, compact })

  return (
    <span className={className} title={`Original: ${formatPrice(price, locale).formatted}`}>
      {formatted.formatted}
    </span>
  )
}

interface PriceRangeDisplayProps {
  minPrice: PriceData;
  maxPrice: PriceData;
  className?: string;
  compact?: boolean;
  targetCurrency?: Currency;
}

export function PriceRangeDisplay({ 
  minPrice, 
  maxPrice, 
  className = '', 
  compact = false,
  targetCurrency 
}: PriceRangeDisplayProps) {
  const locale = useLocale() as Locale
  const { currency: userCurrency, mounted } = useCurrency()
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)

  useEffect(() => {
    getExchangeRates().then(setExchangeRates)
  }, [])

  const displayCurrency = targetCurrency || userCurrency

  if (!mounted || !exchangeRates) {
    const minFormatted = formatPrice(minPrice, locale, { compact })
    const maxFormatted = formatPrice(maxPrice, locale, { compact })
    
    return (
      <span className={className}>
        {minPrice.amount === maxPrice.amount 
          ? minFormatted.formatted 
          : `${minFormatted.formatted} - ${maxFormatted.formatted}`
        }
      </span>
    )
  }

  const convertedMin = convertPrice(minPrice, displayCurrency, exchangeRates)
  const convertedMax = convertPrice(maxPrice, displayCurrency, exchangeRates)
  
  const minFormatted = formatPrice(convertedMin, locale, { compact })
  const maxFormatted = formatPrice(convertedMax, locale, { compact })

  const displayText = convertedMin.amount === convertedMax.amount 
    ? minFormatted.formatted 
    : `${minFormatted.formatted} - ${maxFormatted.formatted}`

  return (
    <span 
      className={className}
      title={`Original: ${formatPrice(minPrice, locale).formatted} - ${formatPrice(maxPrice, locale).formatted}`}
    >
      {displayText}
    </span>
  )
}

// Utility component for "per night" pricing
interface PerNightPriceProps {
  price: PriceData;
  className?: string;
  targetCurrency?: Currency;
}

export function PerNightPrice({ price, className = '', targetCurrency }: PerNightPriceProps) {
  const locale = useLocale() as Locale
  
  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      <PriceDisplay 
        price={price} 
        targetCurrency={targetCurrency}
        className="text-lg font-semibold" 
      />
      <span className="text-sm text-muted-foreground">
        {locale === 'ar' ? 'في الليلة' : locale === 'fr' ? 'par nuit' : 'per night'}
      </span>
    </div>
  )
}