import { Currency } from '@/lib/types'
import { logger } from '@/lib/logger'
import { createClient } from '@/utils/supabase/server'

/**
 * Currency validation utilities
 */
export class CurrencyValidation {
  /**
   * Validate currency amount
   */
  static validateAmount(amount: number): { isValid: boolean; error?: string } {
    if (typeof amount !== 'number') {
      return { isValid: false, error: 'Amount must be a number' }
    }

    if (!isFinite(amount)) {
      return { isValid: false, error: 'Amount must be finite' }
    }

    if (amount < 0) {
      return { isValid: false, error: 'Amount cannot be negative' }
    }

    if (amount > Number.MAX_SAFE_INTEGER) {
      return { isValid: false, error: 'Amount exceeds maximum safe value' }
    }

    return { isValid: true }
  }

  /**
   * Validate currency code format
   */
  static validateCurrencyCode(code: string): { isValid: boolean; error?: string } {
    if (!code || typeof code !== 'string') {
      return { isValid: false, error: 'Currency code must be a non-empty string' }
    }

    if (code.length !== 3) {
      return { isValid: false, error: 'Currency code must be exactly 3 characters' }
    }

    if (!/^[A-Z]{3}$/.test(code)) {
      return { isValid: false, error: 'Currency code must contain only uppercase letters' }
    }

    return { isValid: true }
  }

  /**
   * Validate exchange rate
   */
  static validateExchangeRate(rate: number): { isValid: boolean; error?: string } {
    if (typeof rate !== 'number') {
      return { isValid: false, error: 'Exchange rate must be a number' }
    }

    if (!isFinite(rate)) {
      return { isValid: false, error: 'Exchange rate must be finite' }
    }

    if (rate <= 0) {
      return { isValid: false, error: 'Exchange rate must be positive' }
    }

    return { isValid: true }
  }
}

/**
 * Currency caching utilities
 */
export class CurrencyCache {
  private static cache: Map<string, { data: Currency; timestamp: number }> = new Map()
  private static defaultCacheExpiry = 5 * 60 * 1000 // 5 minutes

  /**
   * Get currency from cache
   */
  static get(currencyId: string): Currency | null {
    const cached = this.cache.get(currencyId)
    
    if (!cached) {
      return null
    }

    // Check if cache has expired
    if (Date.now() - cached.timestamp > this.defaultCacheExpiry) {
      this.cache.delete(currencyId)
      return null
    }

    return cached.data
  }

  /**
   * Set currency in cache
   */
  static set(currencyId: string, currency: Currency, ttl?: number): void {
    this.cache.set(currencyId, {
      data: currency,
      timestamp: Date.now()
    })

    // Set expiry timer
    const expiry = ttl || this.defaultCacheExpiry
    setTimeout(() => {
      this.cache.delete(currencyId)
    }, expiry)
  }

  /**
   * Clear specific currency from cache
   */
  static clear(currencyId?: string): void {
    if (currencyId) {
      this.cache.delete(currencyId)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

/**
 * Fallback mechanisms for missing exchange rates
 */
export class CurrencyFallbacks {
  /**
   * Get fallback exchange rate when primary rate is unavailable
   */
  static getFallbackRate(
    fromCurrency: Currency,
    toCurrency: Currency
  ): { rate: number; source: string; warning: string } {
    logger.warn('Using fallback exchange rate', {
      from: fromCurrency.code,
      to: toCurrency.code
    })

    // Strategy 1: Use stored ratios if available
    if (fromCurrency.ratio && toCurrency.ratio && 
        fromCurrency.ratio > 0 && toCurrency.ratio > 0) {
      const rate = toCurrency.ratio / fromCurrency.ratio
      return {
        rate,
        source: 'stored_ratios',
        warning: 'Using stored currency ratios - may not reflect current market rates'
      }
    }

    // Strategy 2: Default to 1:1 rate
    return {
      rate: 1,
      source: 'default_rate',
      warning: 'Using 1:1 exchange rate - conversion may be inaccurate'
    }
  }

  /**
   * Handle missing default currency
   */
  static async handleMissingDefaultCurrency(): Promise<Currency | null> {
    logger.warn('Default currency not found, attempting to find fallback')
    
    const supabase = await createClient()

    try {
      // Try to find any currency marked as default
      const { data: defaultCurrency } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_default', true)
        .limit(1)
        .single()

      if (defaultCurrency) {
        return defaultCurrency
      }

      // If no default found, try to find DZD (Algerian Dinar)
      const { data: dzdCurrency } = await supabase
        .from('currencies')
        .select('*')
        .eq('code', 'DZD')
        .limit(1)
        .single()

      if (dzdCurrency) {
        logger.info('Using DZD as fallback default currency')
        return dzdCurrency
      }

      // Last resort: get the first available currency
      const { data: firstCurrency } = await supabase
        .from('currencies')
        .select('*')
        .limit(1)
        .single()

      if (firstCurrency) {
        logger.warn('Using first available currency as fallback default', {
          currency: firstCurrency.code
        })
        return firstCurrency
      }

      return null

    } catch (error) {
      logger.error('Failed to find fallback default currency', error)
      return null
    }
  }
}

/**
 * Currency formatting utilities
 */
export class CurrencyFormatting {
  /**
   * Format amount with currency symbol
   */
  static formatWithSymbol(
    amount: number,
    currency: Currency,
    locale: string = 'en-US'
  ): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch (error) {
      // Fallback to manual formatting
      const formattedNumber = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount)
      
      return `${formattedNumber} ${currency.symbol}`
    }
  }

  /**
   * Format conversion display (original + converted)
   */
  static formatConversion(
    originalAmount: number,
    originalCurrency: Currency,
    convertedAmount: number,
    convertedCurrency: Currency,
    locale: string = 'en-US'
  ): string {
    const originalFormatted = this.formatWithSymbol(originalAmount, originalCurrency, locale)
    const convertedFormatted = this.formatWithSymbol(convertedAmount, convertedCurrency, locale)
    
    return `${originalFormatted} ≈ ${convertedFormatted}`
  }

  /**
   * Format exchange rate for display
   */
  static formatExchangeRate(
    rate: number,
    fromCurrency: Currency,
    toCurrency: Currency
  ): string {
    const formattedRate = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(rate)

    return `1 ${fromCurrency.code} = ${formattedRate} ${toCurrency.code}`
  }
}

/**
 * Currency precision utilities
 */
export class CurrencyPrecision {
  /**
   * Round amount to appropriate decimal places for currency
   */
  static roundToCurrencyPrecision(amount: number, currencyCode: string): number {
    // Most currencies use 2 decimal places
    // Some currencies like JPY use 0 decimal places
    // Some cryptocurrencies might use more
    
    const precisionMap: Record<string, number> = {
      'JPY': 0,
      'KRW': 0,
      'VND': 0,
      'CLP': 0,
      'ISK': 0,
      'BTC': 8,
      'ETH': 8,
    }

    const precision = precisionMap[currencyCode] ?? 2
    const multiplier = Math.pow(10, precision)
    
    return Math.round(amount * multiplier) / multiplier
  }

  /**
   * Check if amount has appropriate precision for currency
   */
  static hasValidPrecision(amount: number, currencyCode: string): boolean {
    const rounded = this.roundToCurrencyPrecision(amount, currencyCode)
    return Math.abs(amount - rounded) < Number.EPSILON
  }
}

/**
 * Currency comparison utilities
 */
export class CurrencyComparison {
  /**
   * Check if two currencies are the same
   */
  static areSameCurrency(currency1: Currency, currency2: Currency): boolean {
    return currency1.id === currency2.id || currency1.code === currency2.code
  }

  /**
   * Check if conversion is needed
   */
  static needsConversion(fromCurrency: Currency, toCurrency: Currency): boolean {
    return !this.areSameCurrency(fromCurrency, toCurrency)
  }

  /**
   * Compare exchange rates for significant changes
   */
  static hasSignificantRateChange(
    oldRate: number,
    newRate: number,
    threshold: number = 0.05 // 5% threshold
  ): boolean {
    if (oldRate === 0) return true
    
    const changePercent = Math.abs((newRate - oldRate) / oldRate)
    return changePercent > threshold
  }
}

/**
 * Export all utilities as a single object for convenience
 */
export const CurrencyUtils = {
  Validation: CurrencyValidation,
  Cache: CurrencyCache,
  Fallbacks: CurrencyFallbacks,
  Formatting: CurrencyFormatting,
  Precision: CurrencyPrecision,
  Comparison: CurrencyComparison,
}