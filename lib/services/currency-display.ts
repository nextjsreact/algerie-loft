import { Currency } from '@/lib/types'
import { logger } from '@/lib/logger'

export interface CurrencyDisplayOptions {
  showSymbol?: boolean
  showCode?: boolean
  locale?: string
  precision?: number
}

export interface ConversionDisplayResult {
  originalDisplay: string
  convertedDisplay: string
  combinedDisplay: string
  shouldShowConversion: boolean
}

export class CurrencyDisplayService {
  private static instance: CurrencyDisplayService
  private defaultLocale: string = 'fr-DZ' // Default to Algerian French locale

  private constructor() {}

  public static getInstance(): CurrencyDisplayService {
    if (!CurrencyDisplayService.instance) {
      CurrencyDisplayService.instance = new CurrencyDisplayService()
    }
    return CurrencyDisplayService.instance
  }

  /**
   * Format an amount with currency symbol/code
   */
  public formatAmount(
    amount: number,
    currency: Currency,
    options: CurrencyDisplayOptions = {}
  ): string {
    const {
      showSymbol = true,
      showCode = false,
      locale = this.defaultLocale,
      precision = 2
    } = options

    try {
      // Format the number with proper locale
      const formattedNumber = new Intl.NumberFormat(locale, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      }).format(amount)

      // Build display string
      let display = formattedNumber

      if (showSymbol && currency.symbol) {
        // For some currencies, symbol goes before (like $), for others after (like DA)
        if (this.isSymbolPrefix(currency.code)) {
          display = `${currency.symbol}${formattedNumber}`
        } else {
          display = `${formattedNumber} ${currency.symbol}`
        }
      } else if (showCode) {
        display = `${formattedNumber} ${currency.code}`
      }

      logger.debug('Amount formatted', {
        amount,
        currency: currency.code,
        formatted: display,
        options
      })

      return display

    } catch (error) {
      logger.error('Error formatting amount', error, {
        amount,
        currency: currency.code,
        options
      })
      
      // Fallback to simple formatting
      return `${amount.toFixed(precision)} ${currency.symbol || currency.code}`
    }
  }

  /**
   * Format a conversion display showing both original and converted amounts
   */
  public formatConversion(
    originalAmount: number,
    originalCurrency: Currency,
    convertedAmount: number,
    defaultCurrency: Currency,
    options: CurrencyDisplayOptions = {}
  ): ConversionDisplayResult {
    try {
      const originalDisplay = this.formatAmount(originalAmount, originalCurrency, options)
      const convertedDisplay = this.formatAmount(convertedAmount, defaultCurrency, options)
      
      const shouldShow = this.shouldShowConversion(originalCurrency, defaultCurrency)
      
      let combinedDisplay: string
      if (shouldShow) {
        // Show as "100 CAD ≈ 75 DA" format
        combinedDisplay = `${originalDisplay} ≈ ${convertedDisplay}`
      } else {
        // Same currency, just show original
        combinedDisplay = originalDisplay
      }

      const result: ConversionDisplayResult = {
        originalDisplay,
        convertedDisplay,
        combinedDisplay,
        shouldShowConversion: shouldShow
      }

      logger.debug('Conversion formatted', {
        originalAmount,
        originalCurrency: originalCurrency.code,
        convertedAmount,
        defaultCurrency: defaultCurrency.code,
        result
      })

      return result

    } catch (error) {
      logger.error('Error formatting conversion', error, {
        originalAmount,
        originalCurrency: originalCurrency.code,
        convertedAmount,
        defaultCurrency: defaultCurrency.code
      })

      // Fallback display
      return {
        originalDisplay: `${originalAmount} ${originalCurrency.symbol}`,
        convertedDisplay: `${convertedAmount} ${defaultCurrency.symbol}`,
        combinedDisplay: `${originalAmount} ${originalCurrency.symbol}`,
        shouldShowConversion: false
      }
    }
  }

  /**
   * Determine if conversion should be shown (different currencies)
   */
  public shouldShowConversion(
    transactionCurrency: Currency,
    defaultCurrency: Currency
  ): boolean {
    return transactionCurrency.id !== defaultCurrency.id
  }

  /**
   * Format amount for display in lists (compact format)
   */
  public formatCompactAmount(
    amount: number,
    currency: Currency,
    options: CurrencyDisplayOptions = {}
  ): string {
    const compactOptions = {
      ...options,
      precision: 0, // No decimals for compact display
      showSymbol: true,
      showCode: false
    }

    // For large amounts, use compact notation
    if (Math.abs(amount) >= 1000000) {
      const millions = amount / 1000000
      return `${millions.toFixed(1)}M ${currency.symbol}`
    } else if (Math.abs(amount) >= 1000) {
      const thousands = amount / 1000
      return `${thousands.toFixed(1)}K ${currency.symbol}`
    }

    return this.formatAmount(amount, currency, compactOptions)
  }

  /**
   * Format exchange rate for display
   */
  public formatExchangeRate(
    rate: number,
    fromCurrency: Currency,
    toCurrency: Currency,
    precision: number = 4
  ): string {
    try {
      const formattedRate = rate.toFixed(precision)
      return `1 ${fromCurrency.code} = ${formattedRate} ${toCurrency.code}`
    } catch (error) {
      logger.error('Error formatting exchange rate', error, {
        rate,
        fromCurrency: fromCurrency.code,
        toCurrency: toCurrency.code
      })
      return `1 ${fromCurrency.code} = ${rate} ${toCurrency.code}`
    }
  }

  /**
   * Get currency symbol with fallback
   */
  public getCurrencySymbol(currency: Currency): string {
    return currency.symbol || currency.code
  }

  /**
   * Determine if currency symbol should be prefixed (like $ USD) or suffixed (like DA DZD)
   */
  private isSymbolPrefix(currencyCode: string): boolean {
    const prefixCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    return prefixCurrencies.includes(currencyCode.toUpperCase())
  }

  /**
   * Set default locale for formatting
   */
  public setDefaultLocale(locale: string): void {
    this.defaultLocale = locale
    logger.info('Default locale updated', { locale })
  }

  /**
   * Get appropriate locale for currency
   */
  public getLocaleForCurrency(currencyCode: string): string {
    const localeMap: Record<string, string> = {
      'DZD': 'ar-DZ',
      'EUR': 'fr-FR',
      'USD': 'en-US',
      'CAD': 'en-CA',
      'GBP': 'en-GB'
    }

    return localeMap[currencyCode.toUpperCase()] || this.defaultLocale
  }

  /**
   * Format amount with automatic locale detection
   */
  public formatAmountWithAutoLocale(
    amount: number,
    currency: Currency,
    options: Omit<CurrencyDisplayOptions, 'locale'> = {}
  ): string {
    const locale = this.getLocaleForCurrency(currency.code)
    return this.formatAmount(amount, currency, { ...options, locale })
  }

  /**
   * Create a tooltip text for conversion details
   */
  public createConversionTooltip(
    originalAmount: number,
    originalCurrency: Currency,
    convertedAmount: number,
    defaultCurrency: Currency,
    exchangeRate: number,
    conversionDate?: Date
  ): string {
    try {
      const rateDisplay = this.formatExchangeRate(exchangeRate, originalCurrency, defaultCurrency)
      const dateDisplay = conversionDate 
        ? ` (${conversionDate.toLocaleDateString()})`
        : ''
      
      return `${rateDisplay}${dateDisplay}`
    } catch (error) {
      logger.error('Error creating conversion tooltip', error)
      return 'Conversion details unavailable'
    }
  }
}

// Export singleton instance
export const currencyDisplayService = CurrencyDisplayService.getInstance()