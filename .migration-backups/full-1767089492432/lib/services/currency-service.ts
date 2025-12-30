import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'
import { Currency } from '@/lib/types'
import { CurrencyUtils } from '@/lib/utils/currency-helpers'

export interface CurrencyListOptions {
  includeInactive?: boolean
  sortBy?: 'code' | 'name' | 'is_default'
  sortOrder?: 'asc' | 'desc'
}

export interface CurrencyUpdateData {
  name?: string
  symbol?: string
  ratio?: number
  is_default?: boolean
}

/**
 * Service for managing currencies and their operations
 */
export class CurrencyService {
  private static instance: CurrencyService
  private defaultCurrency: Currency | null = null

  private constructor() {}

  public static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService()
    }
    return CurrencyService.instance
  }

  /**
   * Get all currencies
   */
  public async getAllCurrencies(options: CurrencyListOptions = {}): Promise<Currency[]> {
    return measurePerformance(async () => {
      logger.info('Fetching all currencies', options)
      const supabase = await createClient()

      try {
        let query = supabase.from('currencies').select('*')

        // Apply sorting
        if (options.sortBy) {
          query = query.order(options.sortBy, { 
            ascending: options.sortOrder !== 'desc' 
          })
        } else {
          // Default sort: default currency first, then by code
          query = query.order('is_default', { ascending: false })
                      .order('code', { ascending: true })
        }

        const { data, error } = await query

        if (error) {
          logger.error('Failed to fetch currencies', error)
          throw error
        }

        logger.info('Currencies fetched successfully', { count: data?.length || 0 })
        return data || []

      } catch (error) {
        logger.error('Error fetching currencies', error)
        throw error
      }
    }, 'getAllCurrencies')
  }

  /**
   * Get currency by ID
   */
  public async getCurrencyById(id: string): Promise<Currency | null> {
    return measurePerformance(async () => {
      // Check cache first
      const cached = CurrencyUtils.Cache.get(id)
      if (cached) {
        logger.info('Currency retrieved from cache', { id, code: cached.code })
        return cached
      }

      logger.info('Fetching currency by ID', { id })
      const supabase = await createClient()

      try {
        const { data, error } = await supabase
          .from('currencies')
          .select('*')
          .eq('id', id)
          .single()

        if (error || !data) {
          logger.warn('Currency not found', { id, error })
          return null
        }

        // Cache the result
        CurrencyUtils.Cache.set(id, data)
        
        logger.info('Currency fetched successfully', { id, code: data.code })
        return data

      } catch (error) {
        logger.error('Error fetching currency by ID', error, { id })
        return null
      }
    }, 'getCurrencyById')
  }

  /**
   * Get currency by code
   */
  public async getCurrencyByCode(code: string): Promise<Currency | null> {
    return measurePerformance(async () => {
      // Validate currency code format
      const validation = CurrencyUtils.Validation.validateCurrencyCode(code)
      if (!validation.isValid) {
        logger.warn('Invalid currency code format', { code, error: validation.error })
        return null
      }

      logger.info('Fetching currency by code', { code })
      const supabase = await createClient()

      try {
        const { data, error } = await supabase
          .from('currencies')
          .select('*')
          .eq('code', code.toUpperCase())
          .single()

        if (error || !data) {
          logger.warn('Currency not found by code', { code, error })
          return null
        }

        // Cache the result
        CurrencyUtils.Cache.set(data.id, data)
        
        logger.info('Currency fetched by code successfully', { code, id: data.id })
        return data

      } catch (error) {
        logger.error('Error fetching currency by code', error, { code })
        return null
      }
    }, 'getCurrencyByCode')
  }

  /**
   * Get default currency
   */
  public async getDefaultCurrency(): Promise<Currency | null> {
    return measurePerformance(async () => {
      // Return cached default currency if available
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
          logger.warn('Default currency not found, trying fallback')
          
          // Try fallback mechanism
          const fallbackCurrency = await CurrencyUtils.Fallbacks.handleMissingDefaultCurrency()
          if (fallbackCurrency) {
            this.defaultCurrency = fallbackCurrency
            return fallbackCurrency
          }

          logger.error('No default currency found and no fallback available')
          return null
        }

        this.defaultCurrency = data
        logger.info('Default currency loaded', { code: data.code, id: data.id })
        return data

      } catch (error) {
        logger.error('Error fetching default currency', error)
        return null
      }
    }, 'getDefaultCurrency')
  }

  /**
   * Create new currency
   */
  public async createCurrency(currencyData: {
    code: string
    name: string
    symbol: string
    ratio: number
    is_default?: boolean
  }): Promise<Currency> {
    return measurePerformance(async () => {
      logger.info('Creating new currency', currencyData)

      // Validate input data
      const codeValidation = CurrencyUtils.Validation.validateCurrencyCode(currencyData.code)
      if (!codeValidation.isValid) {
        throw new Error(`Invalid currency code: ${codeValidation.error}`)
      }

      const rateValidation = CurrencyUtils.Validation.validateExchangeRate(currencyData.ratio)
      if (!rateValidation.isValid) {
        throw new Error(`Invalid exchange rate: ${rateValidation.error}`)
      }

      const supabase = await createClient()

      try {
        // Check if currency code already exists
        const existing = await this.getCurrencyByCode(currencyData.code)
        if (existing) {
          throw new Error(`Currency with code ${currencyData.code} already exists`)
        }

        // If this is set as default, unset other defaults
        if (currencyData.is_default) {
          await supabase
            .from('currencies')
            .update({ is_default: false })
            .eq('is_default', true)
        }

        const { data, error } = await supabase
          .from('currencies')
          .insert([{
            code: currencyData.code.toUpperCase(),
            name: currencyData.name,
            symbol: currencyData.symbol,
            ratio: currencyData.ratio,
            is_default: currencyData.is_default || false
          }])
          .select()
          .single()

        if (error || !data) {
          logger.error('Failed to create currency', error)
          throw error || new Error('Failed to create currency')
        }

        // Clear cache and default currency if this is the new default
        if (data.is_default) {
          this.defaultCurrency = data
        }
        CurrencyUtils.Cache.clear()

        logger.info('Currency created successfully', { id: data.id, code: data.code })
        return data

      } catch (error) {
        logger.error('Error creating currency', error, currencyData)
        throw error
      }
    }, 'createCurrency')
  }

  /**
   * Update currency
   */
  public async updateCurrency(id: string, updateData: CurrencyUpdateData): Promise<Currency> {
    return measurePerformance(async () => {
      logger.info('Updating currency', { id, updateData })

      // Validate ratio if provided
      if (updateData.ratio !== undefined) {
        const rateValidation = CurrencyUtils.Validation.validateExchangeRate(updateData.ratio)
        if (!rateValidation.isValid) {
          throw new Error(`Invalid exchange rate: ${rateValidation.error}`)
        }
      }

      const supabase = await createClient()

      try {
        // If setting as default, unset other defaults first
        if (updateData.is_default) {
          await supabase
            .from('currencies')
            .update({ is_default: false })
            .eq('is_default', true)
        }

        const { data, error } = await supabase
          .from('currencies')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()

        if (error || !data) {
          logger.error('Failed to update currency', error, { id })
          throw error || new Error('Failed to update currency')
        }

        // Clear cache and update default currency if needed
        CurrencyUtils.Cache.clear(id)
        if (data.is_default) {
          this.defaultCurrency = data
        } else if (this.defaultCurrency?.id === id) {
          this.defaultCurrency = null
        }

        logger.info('Currency updated successfully', { id, code: data.code })
        return data

      } catch (error) {
        logger.error('Error updating currency', error, { id, updateData })
        throw error
      }
    }, 'updateCurrency')
  }

  /**
   * Delete currency
   */
  public async deleteCurrency(id: string): Promise<void> {
    return measurePerformance(async () => {
      logger.info('Deleting currency', { id })
      const supabase = await createClient()

      try {
        // Check if currency is in use
        const { data: transactionCount } = await supabase
          .from('transactions')
          .select('id', { count: 'exact' })
          .eq('currency_id', id)

        if (transactionCount && transactionCount.length > 0) {
          throw new Error('Cannot delete currency that is used in transactions')
        }

        // Check if it's the default currency
        const currency = await this.getCurrencyById(id)
        if (currency?.is_default) {
          throw new Error('Cannot delete the default currency')
        }

        const { error } = await supabase
          .from('currencies')
          .delete()
          .eq('id', id)

        if (error) {
          logger.error('Failed to delete currency', error, { id })
          throw error
        }

        // Clear from cache
        CurrencyUtils.Cache.clear(id)
        if (this.defaultCurrency?.id === id) {
          this.defaultCurrency = null
        }

        logger.info('Currency deleted successfully', { id })

      } catch (error) {
        logger.error('Error deleting currency', error, { id })
        throw error
      }
    }, 'deleteCurrency')
  }

  /**
   * Refresh currency cache
   */
  public refreshCache(): void {
    CurrencyUtils.Cache.clear()
    this.defaultCurrency = null
    logger.info('Currency cache refreshed')
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return CurrencyUtils.Cache.getStats()
  }
}

// Export singleton instance
export const currencyService = CurrencyService.getInstance()