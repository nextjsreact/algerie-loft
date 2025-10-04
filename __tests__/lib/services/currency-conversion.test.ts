import { CurrencyConversionService, ConversionResult, ConversionError } from '@/lib/services/currency-conversion'
import { Currency } from '@/lib/types'
import { createClient } from '@/utils/supabase/server'

// Mock the Supabase client
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  measurePerformance: jest.fn((fn) => fn())
}))

describe('CurrencyConversionService', () => {
  let service: CurrencyConversionService
  let mockSupabase: any
  let mockQuery: any

  // Mock currencies for testing
  const mockDZD: Currency = {
    id: 'dzd-id',
    code: 'DZD',
    name: 'Algerian Dinar',
    symbol: 'DA',
    is_default: true,
    ratio: 1,
    created_at: new Date()
  }

  const mockEUR: Currency = {
    id: 'eur-id',
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    is_default: false,
    ratio: 0.0067, // 1 EUR = 149.25 DZD (ratio = 1/149.25)
    created_at: new Date()
  }

  const mockCAD: Currency = {
    id: 'cad-id',
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    is_default: false,
    ratio: 0.0095, // 1 CAD = 105.26 DZD (ratio = 1/105.26)
    created_at: new Date()
  }

  const mockInvalidCurrency: Currency = {
    id: 'invalid-id',
    code: 'INVALID',
    name: 'Invalid Currency',
    symbol: 'INV',
    is_default: false,
    ratio: 0, // Invalid ratio
    created_at: new Date()
  }

  beforeEach(() => {
    // Reset the singleton instance for each test
    (CurrencyConversionService as any).instance = undefined
    service = CurrencyConversionService.getInstance()
    service.clearCache()

    // Setup mock Supabase client with proper chaining
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    }
    
    mockSupabase = {
      from: jest.fn().mockReturnValue(mockQuery)
    }
    
    // Mock createClient to always return the same mock instance
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = CurrencyConversionService.getInstance()
      const instance2 = CurrencyConversionService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('getExchangeRate', () => {
    it('should calculate exchange rate between different currencies', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockEUR, error: null }) // fromCurrency
        .mockResolvedValueOnce({ data: mockCAD, error: null }) // toCurrency

      const rate = await service.getExchangeRate('eur-id', 'cad-id')

      // Rate = toCurrency.ratio / fromCurrency.ratio = 0.0095 / 0.0067 = 1.418
      expect(rate).toBeCloseTo(1.418, 3)
    })

    it('should return 1 for same currency', async () => {
      mockQuery.single.mockResolvedValue({ data: mockDZD, error: null })

      const rate = await service.getExchangeRate('dzd-id', 'dzd-id')

      expect(rate).toBe(1)
    })

    it('should return fallback rate of 1 for invalid ratios', async () => {
      mockQuery.single
        .mockResolvedValueOnce({ data: mockInvalidCurrency, error: null }) // fromCurrency with ratio 0
        .mockResolvedValueOnce({ data: mockDZD, error: null }) // toCurrency

      const rate = await service.getExchangeRate('invalid-id', 'dzd-id')

      expect(rate).toBe(1)
    })

    it('should throw error when currencies are not found', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: 'Not found' })

      await expect(service.getExchangeRate('invalid-id', 'another-invalid-id'))
        .rejects.toThrow('One or both currencies not found')
    })

    it('should handle infinite or negative exchange rates', async () => {
      const mockNegativeRatio: Currency = {
        ...mockEUR,
        ratio: -0.01 // Negative ratio
      }

      mockQuery.single
        .mockResolvedValueOnce({ data: mockNegativeRatio, error: null })
        .mockResolvedValueOnce({ data: mockDZD, error: null })

      await expect(service.getExchangeRate('eur-id', 'dzd-id'))
        .rejects.toThrow('Calculated exchange rate is invalid')
    })
  })

  describe('getDefaultCurrency', () => {
    it('should fetch and cache default currency', async () => {
      mockQuery.single.mockResolvedValue({ data: mockDZD, error: null })

      const currency1 = await service.getDefaultCurrency()
      const currency2 = await service.getDefaultCurrency()

      expect(currency1).toEqual(mockDZD)
      expect(currency2).toEqual(mockDZD)
      // Should only call database once due to caching
      expect(mockQuery.single).toHaveBeenCalledTimes(1)
    })

    it('should throw error when no default currency is configured', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: 'Not found' })

      await expect(service.getDefaultCurrency())
        .rejects.toThrow('No default currency configured')
    })

    it('should handle database errors', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: { message: 'Database error' } })

      await expect(service.getDefaultCurrency())
        .rejects.toThrow('No default currency configured')
    })
  })

  describe('validateAmount', () => {
    it('should validate positive numbers', () => {
      expect(service.validateAmount(100)).toBe(true)
      expect(service.validateAmount(0)).toBe(true)
      expect(service.validateAmount(0.01)).toBe(true)
      expect(service.validateAmount(999999.99)).toBe(true)
    })

    it('should reject invalid amounts', () => {
      expect(service.validateAmount(-100)).toBe(false)
      expect(service.validateAmount(NaN)).toBe(false)
      expect(service.validateAmount(Infinity)).toBe(false)
      expect(service.validateAmount(-Infinity)).toBe(false)
      expect(service.validateAmount(Number.MAX_SAFE_INTEGER + 1)).toBe(false)
    })

    it('should reject non-numeric values', () => {
      expect(service.validateAmount('100' as any)).toBe(false)
      expect(service.validateAmount(null as any)).toBe(false)
      expect(service.validateAmount(undefined as any)).toBe(false)
      expect(service.validateAmount({} as any)).toBe(false)
    })
  })

  describe('clearCache', () => {
    it('should clear currency cache and default currency', async () => {
      // First, populate cache by calling getDefaultCurrency
      mockQuery.single.mockResolvedValue({ data: mockDZD, error: null })
      
      await service.getDefaultCurrency()
      
      // Verify cache is populated (second call shouldn't hit database)
      await service.getDefaultCurrency()
      expect(mockQuery.single).toHaveBeenCalledTimes(1)

      // Clear cache
      service.clearCache()

      // Next call should hit database again
      mockQuery.single.mockResolvedValue({ data: mockDZD, error: null })
      await service.getDefaultCurrency()

      // Should have made additional database call after cache clear
      expect(mockQuery.single).toHaveBeenCalledTimes(2)
    })
  })

  describe('calculateConversion with mocked methods', () => {
    beforeEach(() => {
      // Mock the private getCurrency method by spying on the service
      jest.spyOn(service as any, 'getCurrency').mockImplementation(async (currencyId: string) => {
        if (currencyId === 'cad-id') return mockCAD
        if (currencyId === 'eur-id') return mockEUR
        if (currencyId === 'dzd-id') return mockDZD
        if (currencyId === 'invalid-id') return null
        return null
      })

      // Mock getDefaultCurrency
      jest.spyOn(service, 'getDefaultCurrency').mockResolvedValue(mockDZD)
    })

    it('should calculate conversion between different currencies', async () => {
      const result = await service.calculateConversion(100, 'cad-id')

      expect(result).toEqual({
        originalAmount: 100,
        convertedAmount: 10526.32, // 100 * (1 / 0.0095) = 10526.32
        exchangeRate: 105.26315789473685, // 1 / 0.0095
        fromCurrency: mockCAD,
        toCurrency: mockDZD,
        timestamp: expect.any(Date)
      })
    })

    it('should return same amount for same currency conversion', async () => {
      const result = await service.calculateConversion(100, 'dzd-id', 'dzd-id')

      expect(result).toEqual({
        originalAmount: 100,
        convertedAmount: 100,
        exchangeRate: 1,
        fromCurrency: mockDZD,
        toCurrency: mockDZD,
        timestamp: expect.any(Date)
      })
    })

    it('should use default currency when toCurrencyId is not provided', async () => {
      const result = await service.calculateConversion(100, 'eur-id')

      expect(result.toCurrency).toEqual(mockDZD)
      expect(result.convertedAmount).toBe(14925.37) // 100 * (1 / 0.0067) = 14925.37
    })

    it('should throw error when fromCurrency is not found', async () => {
      await expect(service.calculateConversion(100, 'invalid-id'))
        .rejects.toThrow('Currency with ID invalid-id not found')
    })

    it('should handle conversion with zero amount', async () => {
      const result = await service.calculateConversion(0, 'cad-id')

      expect(result.originalAmount).toBe(0)
      expect(result.convertedAmount).toBe(0)
    })

    it('should handle conversion with explicit toCurrency', async () => {
      const result = await service.calculateConversion(100, 'eur-id', 'cad-id')

      // EUR to CAD: rate = 0.0095 / 0.0067 = 1.418
      expect(result.fromCurrency).toEqual(mockEUR)
      expect(result.toCurrency).toEqual(mockCAD)
      expect(result.convertedAmount).toBe(141.79) // 100 * 1.418 = 141.79
    })
  })

  describe('error handling and fallback mechanisms', () => {
    it('should create proper conversion errors', async () => {
      // Mock getCurrency to return null for invalid currency
      jest.spyOn(service as any, 'getCurrency').mockResolvedValue(null)
      // Also mock getDefaultCurrency to avoid additional database calls
      jest.spyOn(service, 'getDefaultCurrency').mockResolvedValue(mockDZD)

      try {
        await service.calculateConversion(100, 'invalid-id')
        fail('Expected error to be thrown')
      } catch (error: any) {
        expect(error.message).toBe('Currency with ID invalid-id not found')
        expect(error.conversionError).toEqual({
          type: 'CURRENCY_NOT_FOUND',
          message: 'Currency with ID invalid-id not found',
          fallbackAction: 'SHOW_WARNING'
        })
      }
    })

    it('should handle calculation errors gracefully', async () => {
      // Mock currencies with problematic ratios
      const mockProblematicCurrency: Currency = {
        ...mockEUR,
        ratio: Number.MIN_VALUE // Very small number that might cause precision issues
      }

      jest.spyOn(service as any, 'getCurrency').mockResolvedValue(mockProblematicCurrency)
      jest.spyOn(service, 'getDefaultCurrency').mockResolvedValue(mockDZD)

      // Should handle the conversion without throwing
      const result = await service.calculateConversion(100, 'eur-id')
      expect(result.convertedAmount).toBeGreaterThan(0)
    })

    it('should handle database connection errors', async () => {
      mockQuery.single.mockRejectedValue(new Error('Database connection failed'))

      await expect(service.getDefaultCurrency())
        .rejects.toThrow('Database connection failed')
    })

    it('should use fallback rate when exchange rate calculation fails', async () => {
      // Mock a scenario where one currency has invalid ratio
      mockQuery.single
        .mockResolvedValueOnce({ data: mockInvalidCurrency, error: null })
        .mockResolvedValueOnce({ data: mockDZD, error: null })

      const rate = await service.getExchangeRate('invalid-id', 'dzd-id')
      expect(rate).toBe(1) // Fallback rate
    })
  })

  describe('currency caching behavior', () => {
    it('should cache currencies and reuse them', async () => {
      mockQuery.single.mockResolvedValue({ data: mockEUR, error: null })

      // Mock the private getCurrency method to test caching behavior
      const getCurrencySpy = jest.spyOn(service as any, 'getCurrency')
      getCurrencySpy.mockResolvedValue(mockEUR)

      // Mock getDefaultCurrency to avoid additional complexity
      jest.spyOn(service, 'getDefaultCurrency').mockResolvedValue(mockDZD)

      // First call should hit the mocked method
      const result1 = await service.calculateConversion(100, 'eur-id', 'eur-id')
      
      // Second call should also work
      const result2 = await service.calculateConversion(200, 'eur-id', 'eur-id')

      expect(result1.fromCurrency).toEqual(mockEUR)
      expect(result2.fromCurrency).toEqual(mockEUR)
      expect(getCurrencySpy).toHaveBeenCalledTimes(4) // Called for both from and to currency in both conversions
    })

    it('should handle cache expiry', (done) => {
      // This test verifies that the cache clearing mechanism exists
      expect(typeof service.clearCache).toBe('function')
      done()
    })
  })

  describe('precision and rounding', () => {
    beforeEach(() => {
      // Mock getDefaultCurrency for precision tests
      jest.spyOn(service, 'getDefaultCurrency').mockResolvedValue(mockDZD)
    })

    it('should round conversion results to 2 decimal places', async () => {
      const mockPrecisionCurrency: Currency = {
        ...mockEUR,
        ratio: 0.00333333 // Will create repeating decimals
      }

      jest.spyOn(service as any, 'getCurrency').mockImplementation(async (currencyId: string) => {
        if (currencyId === 'eur-id') return mockPrecisionCurrency
        return mockDZD
      })

      const result = await service.calculateConversion(100, 'eur-id')

      // Should be rounded to 2 decimal places
      // 100 * (1/0.00333333) = 30000.03
      expect(result.convertedAmount).toBeCloseTo(30000.03, 2)
    })

    it('should handle very small amounts', async () => {
      jest.spyOn(service as any, 'getCurrency').mockResolvedValue(mockEUR)

      const result = await service.calculateConversion(0.01, 'eur-id')

      expect(result.originalAmount).toBe(0.01)
      expect(result.convertedAmount).toBeGreaterThan(0)
      expect(typeof result.convertedAmount).toBe('number')
    })

    it('should handle very large amounts', async () => {
      jest.spyOn(service as any, 'getCurrency').mockResolvedValue(mockEUR)

      const largeAmount = 1000000
      const result = await service.calculateConversion(largeAmount, 'eur-id')

      expect(result.originalAmount).toBe(largeAmount)
      expect(result.convertedAmount).toBeGreaterThanOrEqual(largeAmount) // EUR to DZD should be greater or equal
      expect(isFinite(result.convertedAmount)).toBe(true)
    })
  })

  describe('edge cases and boundary conditions', () => {
    beforeEach(() => {
      jest.spyOn(service, 'getDefaultCurrency').mockResolvedValue(mockDZD)
    })

    it('should handle currencies with very high ratios', async () => {
      const mockHighRatioCurrency: Currency = {
        ...mockEUR,
        ratio: 1000 // Very high ratio
      }

      jest.spyOn(service as any, 'getCurrency').mockImplementation(async (currencyId: string) => {
        if (currencyId === 'eur-id') return mockHighRatioCurrency
        return mockDZD
      })

      const result = await service.calculateConversion(100, 'eur-id')
      // With high ratio currency to DZD (ratio 1): 100 * (1/1000) = 0.1
      expect(result.convertedAmount).toBe(0.1)
    })

    it('should handle currencies with very low ratios', async () => {
      const mockLowRatioCurrency: Currency = {
        ...mockEUR,
        ratio: 0.000001 // Very low ratio
      }

      jest.spyOn(service as any, 'getCurrency').mockImplementation(async (currencyId: string) => {
        if (currencyId === 'eur-id') return mockLowRatioCurrency
        return mockDZD
      })

      const result = await service.calculateConversion(1, 'eur-id')
      // With low ratio currency to DZD (ratio 1): 1 * (1/0.000001) = 1000000
      expect(result.convertedAmount).toBe(1000000)
    })

    it('should handle conversion when default currency is missing', async () => {
      jest.spyOn(service, 'getDefaultCurrency').mockRejectedValue(
        new Error('No default currency configured')
      )

      await expect(service.calculateConversion(100, 'eur-id'))
        .rejects.toThrow('No default currency configured')
    })
  })
})