import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'
import { Currency } from '@/lib/types'

export interface ConversionResult {
  originalAmount: number
  convertedAmount: number
  exchangeRate: number
  fromCurrency: Currency
  toCurrency: Currency
  timestamp: Date
}

export interface ConversionError {
  type: 'CURRENCY_NOT_FOUND' | 'INVALID_RATE' | 'CALCULATION_ERROR' | 'DEFAULT_CURRENCY_MISSING'
  message: string
  fallbackAction: 'USE_DEFAULT_RATE' | 'SHOW_WARNING' | 'BLOCK_TRANSACTION'
}

export class CurrencyConversionService {
  private static instance: CurrencyConversionService
  private currencyCache: Map<string, Currency> = new Map()
  private defaultCurrency: Currency | null = null
  private cacheExpiry: number = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  public static getInstance(): CurrencyConversionService {
    if (!CurrencyConversionService.instance) {
      CurrencyConversionService.instance = new CurrencyConversionService()
    }
    return CurrencyConversionService.instance
  }

  /**
   * Calculate currency conversion between two currencies
   */
  public async calculateConversion(
    amount: number,
    fromCurrencyId: string,
    toCurrencyId?: string
  ): Promise<ConversionResult> {
    return measurePerformance(async () => {
      logger.info('Calculating currency conversion', { 
        amount, 
        fromCurrencyId, 
        toCurrencyId 
      })

      try {
        // Get currencies
        const fromCurrency = await this.getCurrency(fromCurrencyId)
        const toCurrency = toCurrencyId 
          ? await this.getCurrency(toCurrencyId)
          : await this.getDefaultCurrency()

        if (!fromCurrency) {
          throw this.createConversionError(
            'CURRENCY_NOT_FOUND',
            `Currency with ID ${fromCurrencyId} not found`,
            'SHOW_WARNING'
          )
        }

        if (!toCurrency) {
          throw this.createConversionError(
            'DEFAULT_CURRENCY_MISSING',
            'Default currency not found',
            'BLOCK_TRANSACTION'
          )
        }

        // If same currency, no conversion needed
        if (fromCurrency.id === toCurrency.id) {
          return {
            originalAmount: amount,
            convertedAmount: amount,
            exchangeRate: 1,
            fromCurrency,
            toCurrency,
            timestamp: new Date()
          }
        }

        // Calculate exchange rate and converted amount
        const exchangeRate = await this.getExchangeRate(fromCurrencyId, toCurrency.id)
        const convertedAmount = this.performConversion(amount, exchangeRate)

        const result: ConversionResult = {
          originalAmount: amount,
          convertedAmount,
          exchangeRate,
          fromCurrency,
          toCurrency,
          timestamp: new Date()
        }

        logger.info('Currency conversion completed', { result })
        return result

      } catch (error) {
        logger.error('Currency conversion failed', error, { 
          amount, 
          fromCurrencyId, 
          toCurrencyId 
        })
        throw error
      }
    }, 'calculateConversion')
  }

  /**
   * Get exchange rate between two currencies
   */
  public async getExchangeRate(
    fromCurrencyId: string,
    toCurrencyId: string
  ): Promise<number> {
    return measurePerformance(async () => {
      logger.info('Getting exchange rate', { fromCurrencyId, toCurrencyId })

      try {
        const fromCurrency = await this.getCurrency(fromCurrencyId)
        const toCurrency = await this.getCurrency(toCurrencyId)

        if (!fromCurrency || !toCurrency) {
          throw this.createConversionError(
            'CURRENCY_NOT_FOUND',
            'One or both currencies not found',
            'USE_DEFAULT_RATE'
          )
        }

        // If same currency, rate is 1
        if (fromCurrency.id === toCurrency.id) {
          return 1
        }

        // Calculate rate using the ratio field
        // The ratio represents the value of the currency relative to a base currency
        if (fromCurrency.ratio === 0 || toCurrency.ratio === 0) {
          logger.warn('Invalid currency ratio detected, using fallback rate', {
            fromCurrency: fromCurrency.code,
            toCurrency: toCurrency.code,
            fromRatio: fromCurrency.ratio,
            toRatio: toCurrency.ratio
          })
          return 1 // Fallback to 1:1 rate
        }

        // Exchange rate = (from_currency_ratio / to_currency_ratio)
        // If CAD ratio is 0.75 and DZD ratio is 1, then 1 CAD = 0.75 DZD
        // So to convert CAD to DZD: amount * (fromCurrency.ratio / toCurrency.ratio)
        const exchangeRate = fromCurrency.ratio / toCurrency.ratio

        if (!isFinite(exchangeRate) || exchangeRate <= 0) {
          throw this.createConversionError(
            'INVALID_RATE',
            'Calculated exchange rate is invalid',
            'USE_DEFAULT_RATE'
          )
        }

        logger.info('Exchange rate calculated', { 
          fromCurrency: fromCurrency.code,
          toCurrency: toCurrency.code,
          exchangeRate 
        })

        return exchangeRate

      } catch (error) {
        logger.error('Failed to get exchange rate', error, { 
          fromCurrencyId, 
          toCurrencyId 
        })
        
        // Return fallback rate of 1:1 for error cases
        if (error instanceof Error && error.message.includes('fallbackAction')) {
          return 1
        }
        throw error
      }
    }, 'getExchangeRate')
  }

  /**
   * Get default currency
   */
  public async getDefaultCurrency(): Promise<Currency> {
    return measurePerformance(async () => {
      // Check cache first
      if (this.defaultCurrency) {
        return this.defaultCurrency
      }

      logger.info('Fetching default currency')
      const supabase = await createClient()

      try {
        const { data, error } = await supabase
          .from('currencies')
          .select('*')
          .eq('is_default', true)
          .single()

        if (error || !data) {
          logger.error('Default currency not found', error)
          throw this.createConversionError(
            'DEFAULT_CURRENCY_MISSING',
            'No default currency configured',
            'BLOCK_TRANSACTION'
          )
        }

        this.defaultCurrency = data
        logger.info('Default currency loaded', { currency: data.code })
        return data

      } catch (error) {
        logger.error('Failed to fetch default currency', error)
        throw error
      }
    }, 'getDefaultCurrency')
  }

  /**
   * Get currency by ID with caching
   */
  private async getCurrency(currencyId: string): Promise<Currency | null> {
    // Check cache first
    if (this.currencyCache.has(currencyId)) {
      return this.currencyCache.get(currencyId) || null
    }

    logger.info('Fetching currency from database', { currencyId })
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('id', currencyId)
        .single()

      if (error || !data) {
        logger.warn('Currency not found', { currencyId, error })
        return null
      }

      // Cache the currency
      this.currencyCache.set(currencyId, data)
      
      // Set cache expiry
      setTimeout(() => {
        this.currencyCache.delete(currencyId)
      }, this.cacheExpiry)

      logger.info('Currency loaded and cached', { currency: data.code })
      return data

    } catch (error) {
      logger.error('Failed to fetch currency', error, { currencyId })
      return null
    }
  }

  /**
   * Perform the actual conversion calculation
   */
  private performConversion(amount: number, exchangeRate: number): number {
    try {
      const convertedAmount = amount * exchangeRate
      
      // Round to 2 decimal places for financial precision
      return Math.round(convertedAmount * 100) / 100

    } catch (error) {
      logger.error('Conversion calculation failed', error, { amount, exchangeRate })
      throw this.createConversionError(
        'CALCULATION_ERROR',
        'Failed to calculate conversion',
        'SHOW_WARNING'
      )
    }
  }

  /**
   * Create a standardized conversion error
   */
  private createConversionError(
    type: ConversionError['type'],
    message: string,
    fallbackAction: ConversionError['fallbackAction']
  ): Error {
    const error = new Error(message) as Error & { conversionError: ConversionError }
    error.conversionError = {
      type,
      message,
      fallbackAction
    }
    return error
  }

  /**
   * Clear currency cache (useful for testing or when currencies are updated)
   */
  public clearCache(): void {
    this.currencyCache.clear()
    this.defaultCurrency = null
    logger.info('Currency cache cleared')
  }

  /**
   * Validate currency amount
   */
  public validateAmount(amount: number): boolean {
    return typeof amount === 'number' && 
           isFinite(amount) && 
           amount >= 0 && 
           amount <= Number.MAX_SAFE_INTEGER
  }
}

// Export singleton instance
export const currencyConversionService = CurrencyConversionService.getInstance()