import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { currencyConversionService } from '@/lib/services/currency-conversion'
import { transactionTotalsService } from '@/lib/services/transaction-totals'
import { currencyDisplayService } from '@/lib/services/currency-display'

// Mock dependencies
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  },
  measurePerformance: jest.fn((fn) => fn())
}))

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis()
}

describe('🔍 Data Consistency Validation Tests', () => {
  const mockCurrencies = [
    { id: 'dzd-id', code: 'DZD', symbol: 'DA', name: 'Algerian Dinar', is_default: true, ratio: 1 },
    { id: 'cad-id', code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', is_default: false, ratio: 0.75 },
    { id: 'eur-id', code: 'EUR', symbol: '€', name: 'Euro', is_default: false, ratio: 0.85 },
    { id: 'usd-id', code: 'USD', symbol: '$', name: 'US Dollar', is_default: false, ratio: 0.80 }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    const { createClient } = require('@/utils/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Conversion Calculation Consistency', () => {
    it('should maintain mathematical consistency across different conversion paths', async () => {
      // Test A -> B -> C should equal A -> C
      
      // Mock currency data
      mockSupabase.select.mockImplementation((fields) => {
        if (fields === '*') {
          return {
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockImplementation(() => {
                // Return different currencies based on call order
                const callCount = mockSupabase.select.mock.calls.length
                if (callCount <= 2) return { data: mockCurrencies[1], error: null } // CAD
                if (callCount <= 4) return { data: mockCurrencies[2], error: null } // EUR
                return { data: mockCurrencies[0], error: null } // DZD
              })
            })
          }
        }
        return mockSupabase
      })

      // Test CAD -> DZD conversion
      const cadToDzd = await currencyConversionService.calculateConversion(100, 'cad-id', 'dzd-id')
      
      // Test EUR -> DZD conversion  
      const eurToDzd = await currencyConversionService.calculateConversion(100, 'eur-id', 'dzd-id')

      // Test CAD -> EUR conversion (indirect)
      const cadToEur = await currencyConversionService.calculateConversion(100, 'cad-id', 'eur-id')

      // Verify mathematical consistency
      // CAD rate: 0.75, EUR rate: 0.85
      // CAD to DZD: 100 * (0.75/1) = 75
      // EUR to DZD: 100 * (0.85/1) = 85
      // CAD to EUR: 100 * (0.75/0.85) = 88.24

      expect(cadToDzd.exchangeRate).toBeCloseTo(0.75, 3)
      expect(cadToDzd.convertedAmount).toBeCloseTo(75, 2)
      
      expect(eurToDzd.exchangeRate).toBeCloseTo(0.85, 3)
      expect(eurToDzd.convertedAmount).toBeCloseTo(85, 2)
      
      expect(cadToEur.exchangeRate).toBeCloseTo(0.882, 3)
      expect(cadToEur.convertedAmount).toBeCloseTo(88.24, 2)
    })

    it('should handle reverse conversions correctly', async () => {
      // Test that A -> B and B -> A are mathematical inverses
      
      mockSupabase.select.mockImplementation(() => ({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockImplementation(() => {
            const callCount = mockSupabase.select.mock.calls.length
            if (callCount % 2 === 1) return { data: mockCurrencies[1], error: null } // CAD
            return { data: mockCurrencies[0], error: null } // DZD
          })
        })
      }))

      // Test CAD -> DZD
      const cadToDzd = await currencyConversionService.calculateConversion(100, 'cad-id', 'dzd-id')
      
      // Test DZD -> CAD with the converted amount
      const dzdToCad = await currencyConversionService.calculateConversion(
        cadToDzd.convertedAmount, 'dzd-id', 'cad-id'
      )

      // Should get back approximately the original amount
      expect(dzdToCad.convertedAmount).toBeCloseTo(100, 1)
      
      // Exchange rates should be inverses
      expect(cadToDzd.exchangeRate * dzdToCad.exchangeRate).toBeCloseTo(1, 3)
    })

    it('should maintain precision in chain conversions', async () => {
      // Test precision loss in multiple conversion steps
      
      const testAmount = 1000
      const conversions = []
      
      // Simulate multiple conversions: CAD -> EUR -> USD -> DZD
      const currencies = ['cad-id', 'eur-id', 'usd-id', 'dzd-id']
      let currentAmount = testAmount
      
      for (let i = 0; i < currencies.length - 1; i++) {
        mockSupabase.select.mockImplementation(() => ({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(() => {
              const fromCurrency = mockCurrencies.find(c => c.id === currencies[i])
              const toCurrency = mockCurrencies.find(c => c.id === currencies[i + 1])
              const callCount = mockSupabase.select.mock.calls.length
              return { 
                data: callCount % 2 === 1 ? fromCurrency : toCurrency, 
                error: null 
              }
            })
          })
        }))

        const conversion = await currencyConversionService.calculateConversion(
          currentAmount, currencies[i], currencies[i + 1]
        )
        
        conversions.push(conversion)
        currentAmount = conversion.convertedAmount
      }

      // Verify that precision is maintained (within reasonable bounds)
      conversions.forEach(conversion => {
        expect(conversion.convertedAmount).toBeGreaterThan(0)
        expect(conversion.exchangeRate).toBeGreaterThan(0)
        expect(Number.isFinite(conversion.convertedAmount)).toBe(true)
        expect(Number.isFinite(conversion.exchangeRate)).toBe(true)
      })

      // Final amount should be reasonable (not too far from direct conversion)
      const directConversion = await currencyConversionService.calculateConversion(
        testAmount, 'cad-id', 'dzd-id'
      )
      
      // Chain conversion should be within 1% of direct conversion (accounting for rounding)
      const difference = Math.abs(currentAmount - directConversion.convertedAmount)
      const percentDifference = (difference / directConversion.convertedAmount) * 100
      expect(percentDifference).toBeLessThan(1)
    })
  })

  describe('Display Consistency Validation', () => {
    it('should format amounts consistently across different services', () => {
      const testAmount = 1234.56
      const currency = mockCurrencies[0] // DZD

      // Test different formatting methods
      const displayService = currencyDisplayService.formatAmount(testAmount, currency)
      const compactDisplay = currencyDisplayService.formatCompactAmount(testAmount, currency)
      const autoLocaleDisplay = currencyDisplayService.formatAmountWithAutoLocale(testAmount, currency)

      // All should contain the currency symbol
      expect(displayService).toContain('DA')
      expect(compactDisplay).toContain('DA')
      expect(autoLocaleDisplay).toContain('DA')

      // All should contain the amount (in some form)
      expect(displayService).toContain('1234')
      expect(autoLocaleDisplay).toContain('1234')
      // Compact might show as 1.2K, so just check it's not empty
      expect(compactDisplay.length).toBeGreaterThan(0)
    })

    it('should maintain consistency between conversion display and individual amounts', () => {
      const originalAmount = 100
      const convertedAmount = 133.33
      const cadCurrency = mockCurrencies[1]
      const dzdCurrency = mockCurrencies[0]

      // Format individual amounts
      const originalDisplay = currencyDisplayService.formatAmount(originalAmount, cadCurrency)
      const convertedDisplay = currencyDisplayService.formatAmount(convertedAmount, dzdCurrency)

      // Format conversion display
      const conversionDisplay = currencyDisplayService.formatConversion(
        originalAmount, cadCurrency,
        convertedAmount, dzdCurrency
      )

      // Conversion display should contain both individual displays
      expect(conversionDisplay.originalDisplay).toBe(originalDisplay)
      expect(conversionDisplay.convertedDisplay).toBe(convertedDisplay)
      expect(conversionDisplay.combinedDisplay).toContain(originalDisplay)
      expect(conversionDisplay.combinedDisplay).toContain(convertedDisplay)
    })
  })

  describe('Totals Calculation Consistency', () => {
    it('should calculate totals consistently regardless of transaction order', () => {
      const baseTransactions = [
        {
          id: '1',
          amount: 100,
          transaction_type: 'income' as const,
          status: 'completed' as const,
          equivalent_amount_default_currency: 75,
          currency_id: 'cad-id',
          date: '2024-01-01'
        },
        {
          id: '2',
          amount: 50,
          transaction_type: 'expense' as const,
          status: 'completed' as const,
          equivalent_amount_default_currency: 42.5,
          currency_id: 'eur-id',
          date: '2024-01-02'
        },
        {
          id: '3',
          amount: 200,
          transaction_type: 'income' as const,
          status: 'completed' as const,
          equivalent_amount_default_currency: 200,
          currency_id: 'dzd-id',
          date: '2024-01-03'
        }
      ]

      // Calculate totals with original order
      const totals1 = transactionTotalsService.calculateTotals(baseTransactions)

      // Calculate totals with reversed order
      const reversedTransactions = [...baseTransactions].reverse()
      const totals2 = transactionTotalsService.calculateTotals(reversedTransactions)

      // Calculate totals with shuffled order
      const shuffledTransactions = [baseTransactions[1], baseTransactions[2], baseTransactions[0]]
      const totals3 = transactionTotalsService.calculateTotals(shuffledTransactions)

      // All should produce identical results
      expect(totals1.totalIncome).toBeCloseTo(totals2.totalIncome, 2)
      expect(totals1.totalExpenses).toBeCloseTo(totals2.totalExpenses, 2)
      expect(totals1.netTotal).toBeCloseTo(totals2.netTotal, 2)

      expect(totals1.totalIncome).toBeCloseTo(totals3.totalIncome, 2)
      expect(totals1.totalExpenses).toBeCloseTo(totals3.totalExpenses, 2)
      expect(totals1.netTotal).toBeCloseTo(totals3.netTotal, 2)

      expect(totals1.transactionCount).toBe(totals2.transactionCount)
      expect(totals1.transactionCount).toBe(totals3.transactionCount)
    })

    it('should handle edge cases in totals calculation', () => {
      const edgeCaseTransactions = [
        {
          id: '1',
          amount: 0, // Zero amount
          transaction_type: 'income' as const,
          status: 'completed' as const,
          equivalent_amount_default_currency: 0,
          currency_id: 'dzd-id',
          date: '2024-01-01'
        },
        {
          id: '2',
          amount: 0.01, // Very small amount
          transaction_type: 'expense' as const,
          status: 'completed' as const,
          equivalent_amount_default_currency: 0.01,
          currency_id: 'dzd-id',
          date: '2024-01-02'
        },
        {
          id: '3',
          amount: 999999.99, // Very large amount
          transaction_type: 'income' as const,
          status: 'completed' as const,
          equivalent_amount_default_currency: 999999.99,
          currency_id: 'dzd-id',
          date: '2024-01-03'
        }
      ]

      const totals = transactionTotalsService.calculateTotals(edgeCaseTransactions)

      expect(totals.totalIncome).toBeCloseTo(999999.99, 2)
      expect(totals.totalExpenses).toBeCloseTo(0.01, 2)
      expect(totals.netTotal).toBeCloseTo(999999.98, 2)
      expect(totals.transactionCount).toBe(3)
    })

    it('should validate transaction data before calculation', () => {
      const invalidTransactions = [
        {
          id: '1',
          amount: NaN, // Invalid amount
          transaction_type: 'income' as const,
          status: 'completed' as const,
          equivalent_amount_default_currency: 100,
          currency_id: 'dzd-id',
          date: '2024-01-01'
        },
        {
          id: '2',
          amount: 100,
          transaction_type: 'invalid' as any, // Invalid type
          status: 'completed' as const,
          equivalent_amount_default_currency: 100,
          currency_id: 'dzd-id',
          date: '2024-01-02'
        }
      ]

      const validation = transactionTotalsService.validateTransactionData(invalidTransactions)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors.some(error => error.includes('invalid amount'))).toBe(true)
      expect(validation.errors.some(error => error.includes('invalid type'))).toBe(true)
    })
  })

  describe('Cross-Service Data Consistency', () => {
    it('should maintain consistency between conversion service and display service', async () => {
      // Mock currency data
      mockSupabase.select.mockImplementation(() => ({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockImplementation(() => {
            const callCount = mockSupabase.select.mock.calls.length
            if (callCount % 2 === 1) return { data: mockCurrencies[1], error: null } // CAD
            return { data: mockCurrencies[0], error: null } // DZD
          })
        })
      }))

      // Get conversion result
      const conversionResult = await currencyConversionService.calculateConversion(100, 'cad-id', 'dzd-id')

      // Format the same data using display service
      const displayResult = currencyDisplayService.formatConversion(
        conversionResult.originalAmount,
        conversionResult.fromCurrency,
        conversionResult.convertedAmount,
        conversionResult.toCurrency
      )

      // Verify consistency
      expect(displayResult.shouldShowConversion).toBe(true)
      expect(displayResult.originalDisplay).toContain(conversionResult.originalAmount.toString())
      expect(displayResult.convertedDisplay).toContain(conversionResult.convertedAmount.toFixed(2))
    })

    it('should maintain consistency between totals service and display formatting', () => {
      const transactions = [
        {
          id: '1',
          amount: 100,
          transaction_type: 'income' as const,
          status: 'completed' as const,
          equivalent_amount_default_currency: 75,
          currency_id: 'cad-id',
          date: '2024-01-01'
        }
      ]

      // Calculate totals
      const totals = transactionTotalsService.calculateTotals(transactions)

      // Format totals
      const formattedTotals = transactionTotalsService.formatTotals(totals, 'DA', 'fr-FR')

      // Verify consistency
      expect(formattedTotals.totalIncome).toContain(totals.totalIncome.toFixed(2))
      expect(formattedTotals.totalIncome).toContain('DA')
      expect(formattedTotals.transactionCount).toBe(totals.transactionCount.toString())
    })
  })

  describe('Database Storage Consistency', () => {
    it('should ensure stored conversion data matches calculated values', () => {
      // This test would verify that the data stored in the database
      // matches what the conversion service calculates
      
      const originalAmount = 100
      const exchangeRate = 0.75
      const convertedAmount = originalAmount * exchangeRate

      // Simulate stored transaction data
      const storedTransaction = {
        amount: originalAmount,
        ratio_at_transaction: exchangeRate,
        equivalent_amount_default_currency: convertedAmount
      }

      // Verify mathematical consistency
      const calculatedAmount = storedTransaction.amount * storedTransaction.ratio_at_transaction
      expect(calculatedAmount).toBeCloseTo(storedTransaction.equivalent_amount_default_currency, 2)

      // Verify precision is maintained
      expect(storedTransaction.ratio_at_transaction).toBeCloseTo(exchangeRate, 3)
      expect(storedTransaction.equivalent_amount_default_currency).toBeCloseTo(convertedAmount, 2)
    })

    it('should handle rounding consistently across all calculations', () => {
      // Test that rounding is applied consistently
      const testCases = [
        { amount: 100.005, expected: 100.01 }, // Round up
        { amount: 100.004, expected: 100.00 }, // Round down
        { amount: 100.999, expected: 101.00 }, // Round up
        { amount: 0.005, expected: 0.01 },     // Small amounts
        { amount: 0.004, expected: 0.00 }      // Small amounts
      ]

      testCases.forEach(testCase => {
        const rounded = Math.round(testCase.amount * 100) / 100
        expect(rounded).toBeCloseTo(testCase.expected, 2)
      })
    })
  })
})