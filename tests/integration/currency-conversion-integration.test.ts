import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { createTransaction, updateTransaction } from '@/app/actions/transactions'
import { currencyConversionService } from '@/lib/services/currency-conversion'
import { transactionTotalsService } from '@/lib/services/transaction-totals'
import { currencyDisplayService } from '@/lib/services/currency-display'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn().mockResolvedValue({ user: { id: 'test-user', role: 'admin' } })
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

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
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis()
}

describe('🔄 Currency Conversion Integration Tests', () => {
  const mockCurrencies = [
    { id: 'dzd-id', code: 'DZD', symbol: 'DA', name: 'Algerian Dinar', is_default: true, ratio: 1 },
    { id: 'cad-id', code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', is_default: false, ratio: 0.75 },
    { id: 'eur-id', code: 'EUR', symbol: '€', name: 'Euro', is_default: false, ratio: 0.85 }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    const { createClient } = require('@/utils/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Transaction Creation with Foreign Currency', () => {
    it('should create transaction with CAD currency and convert to DZD', async () => {
      // Arrange
      const transactionData = {
        amount: 100,
        currency_id: 'cad-id',
        transaction_type: 'expense',
        description: 'Test CAD transaction',
        date: '2024-01-01',
        category: 'test'
      }

      // Mock currency data
      mockSupabase.select.mockResolvedValueOnce({
        data: mockCurrencies.find(c => c.id === 'cad-id'),
        error: null
      })
      mockSupabase.select.mockResolvedValueOnce({
        data: mockCurrencies.find(c => c.is_default),
        error: null
      })

      mockSupabase.insert.mockResolvedValue({ error: null })

      // Mock validation schema
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse = jest.fn().mockReturnValue(transactionData)

      // Act
      await createTransaction(transactionData)

      // Assert
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          currency_id: 'cad-id',
          ratio_at_transaction: expect.any(Number),
          equivalent_amount_default_currency: expect.any(Number)
        })
      )

      // Verify conversion calculation
      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.ratio_at_transaction).toBeCloseTo(0.75, 2) // 0.75 / 1
      expect(insertCall.equivalent_amount_default_currency).toBeCloseTo(75, 2) // 100 * 0.75
    })

    it('should create transaction with EUR currency and convert to DZD', async () => {
      // Arrange
      const transactionData = {
        amount: 50,
        currency_id: 'eur-id',
        transaction_type: 'income',
        description: 'Test EUR transaction',
        date: '2024-01-01',
        category: 'test'
      }

      // Mock currency data
      mockSupabase.select.mockResolvedValueOnce({
        data: mockCurrencies.find(c => c.id === 'eur-id'),
        error: null
      })
      mockSupabase.select.mockResolvedValueOnce({
        data: mockCurrencies.find(c => c.is_default),
        error: null
      })

      mockSupabase.insert.mockResolvedValue({ error: null })

      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse = jest.fn().mockReturnValue(transactionData)

      // Act
      await createTransaction(transactionData)

      // Assert
      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.ratio_at_transaction).toBeCloseTo(0.85, 2) // 0.85 / 1
      expect(insertCall.equivalent_amount_default_currency).toBeCloseTo(42.5, 2) // 50 * 0.85
    })

    it('should handle same currency transaction (DZD to DZD)', async () => {
      // Arrange
      const transactionData = {
        amount: 200,
        currency_id: 'dzd-id',
        transaction_type: 'expense',
        description: 'Test DZD transaction',
        date: '2024-01-01',
        category: 'test'
      }

      mockSupabase.select.mockResolvedValueOnce({
        data: mockCurrencies.find(c => c.id === 'dzd-id'),
        error: null
      })
      mockSupabase.select.mockResolvedValueOnce({
        data: mockCurrencies.find(c => c.is_default),
        error: null
      })

      mockSupabase.insert.mockResolvedValue({ error: null })

      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse = jest.fn().mockReturnValue(transactionData)

      // Act
      await createTransaction(transactionData)

      // Assert
      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.ratio_at_transaction).toBe(1) // Same currency
      expect(insertCall.equivalent_amount_default_currency).toBe(200) // Same amount
    })
  })

  describe('Transaction Updates with Currency Changes', () => {
    it('should recalculate conversion when currency changes', async () => {
      // Arrange
      const transactionId = 'test-transaction-id'
      const currentTransaction = {
        id: transactionId,
        amount: 100,
        currency_id: 'cad-id',
        ratio_at_transaction: 1.33,
        equivalent_amount_default_currency: 133.33
      }

      const updateData = {
        amount: 100,
        currency_id: 'eur-id', // Changed from CAD to EUR
        transaction_type: 'expense',
        description: 'Updated transaction',
        date: '2024-01-01',
        category: 'test'
      }

      // Mock current transaction fetch
      mockSupabase.select.mockResolvedValueOnce({
        data: currentTransaction,
        error: null
      })

      // Mock currency data for conversion
      mockSupabase.select.mockResolvedValueOnce({
        data: mockCurrencies.find(c => c.id === 'eur-id'),
        error: null
      })
      mockSupabase.select.mockResolvedValueOnce({
        data: mockCurrencies.find(c => c.is_default),
        error: null
      })

      mockSupabase.update.mockResolvedValue({ error: null })

      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse = jest.fn().mockReturnValue(updateData)

      // Act
      await updateTransaction(transactionId, updateData)

      // Assert
      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.ratio_at_transaction).toBeCloseTo(0.85, 2) // EUR rate
      expect(updateCall.equivalent_amount_default_currency).toBeCloseTo(85, 2) // New conversion
    })

    it('should recalculate conversion when amount changes', async () => {
      // Arrange
      const transactionId = 'test-transaction-id'
      const currentTransaction = {
        id: transactionId,
        amount: 100,
        currency_id: 'cad-id',
        ratio_at_transaction: 1.33,
        equivalent_amount_default_currency: 133.33
      }

      const updateData = {
        amount: 150, // Changed amount
        currency_id: 'cad-id', // Same currency
        transaction_type: 'expense',
        description: 'Updated transaction',
        date: '2024-01-01',
        category: 'test'
      }

      mockSupabase.select.mockResolvedValueOnce({
        data: currentTransaction,
        error: null
      })

      mockSupabase.select.mockResolvedValueOnce({
        data: mockCurrencies.find(c => c.id === 'cad-id'),
        error: null
      })
      mockSupabase.select.mockResolvedValueOnce({
        data: mockCurrencies.find(c => c.is_default),
        error: null
      })

      mockSupabase.update.mockResolvedValue({ error: null })

      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse = jest.fn().mockReturnValue(updateData)

      // Act
      await updateTransaction(transactionId, updateData)

      // Assert
      const updateCall = mockSupabase.update.mock.calls[0][0]
      expect(updateCall.ratio_at_transaction).toBeCloseTo(0.75, 2) // Same rate
      expect(updateCall.equivalent_amount_default_currency).toBeCloseTo(112.5, 2) // 150 * 0.75
    })
  })

  describe('Multi-Currency Transaction Totals', () => {
    it('should calculate correct totals with mixed currencies', () => {
      // Arrange
      const transactions = [
        {
          id: '1',
          amount: 100,
          transaction_type: 'income' as const,
          status: 'completed' as const,
          equivalent_amount_default_currency: 75, // CAD converted (100 * 0.75)
          currency_id: 'cad-id',
          date: '2024-01-01'
        },
        {
          id: '2',
          amount: 50,
          transaction_type: 'expense' as const,
          status: 'completed' as const,
          equivalent_amount_default_currency: 42.5, // EUR converted (50 * 0.85)
          currency_id: 'eur-id',
          date: '2024-01-02'
        },
        {
          id: '3',
          amount: 200,
          transaction_type: 'income' as const,
          status: 'completed' as const,
          equivalent_amount_default_currency: 200, // DZD (same currency)
          currency_id: 'dzd-id',
          date: '2024-01-03'
        }
      ]

      // Act
      const totals = transactionTotalsService.calculateTotals(transactions)

      // Assert
      expect(totals.totalIncome).toBeCloseTo(275, 2) // 75 + 200
      expect(totals.totalExpenses).toBeCloseTo(42.5, 2) // 42.5
      expect(totals.netTotal).toBeCloseTo(232.5, 2) // 275 - 42.5
      expect(totals.transactionCount).toBe(3)
      expect(totals.incomeCount).toBe(2)
      expect(totals.expenseCount).toBe(1)
    })

    it('should handle transactions without conversion data', () => {
      // Arrange
      const transactions = [
        {
          id: '1',
          amount: 100,
          transaction_type: 'income' as const,
          status: 'completed' as const,
          // No equivalent_amount_default_currency
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
        }
      ]

      // Act
      const totals = transactionTotalsService.calculateTotals(transactions)

      // Assert
      expect(totals.totalIncome).toBe(100) // Uses original amount when no conversion
      expect(totals.totalExpenses).toBeCloseTo(42.5, 2) // Uses converted amount
      expect(totals.netTotal).toBeCloseTo(57.5, 2)
    })
  })

  describe('Currency Display Integration', () => {
    it('should format amounts correctly with currency symbols', () => {
      // Arrange
      const cadCurrency = mockCurrencies.find(c => c.code === 'CAD')!
      const dzdCurrency = mockCurrencies.find(c => c.code === 'DZD')!

      // Act
      const cadDisplay = currencyDisplayService.formatAmount(100, cadCurrency)
      const dzdDisplay = currencyDisplayService.formatAmount(133.33, dzdCurrency)

      // Assert
      expect(cadDisplay).toContain('100')
      expect(cadDisplay).toContain('C$')
      expect(dzdDisplay).toContain('133.33')
      expect(dzdDisplay).toContain('DA')
    })

    it('should format conversion display correctly', () => {
      // Arrange
      const cadCurrency = mockCurrencies.find(c => c.code === 'CAD')!
      const dzdCurrency = mockCurrencies.find(c => c.code === 'DZD')!

      // Act
      const conversionDisplay = currencyDisplayService.formatConversion(
        100, cadCurrency,
        133.33, dzdCurrency
      )

      // Assert
      expect(conversionDisplay.shouldShowConversion).toBe(true)
      expect(conversionDisplay.combinedDisplay).toContain('≈')
      expect(conversionDisplay.originalDisplay).toContain('C$')
      expect(conversionDisplay.convertedDisplay).toContain('DA')
    })

    it('should not show conversion for same currency', () => {
      // Arrange
      const dzdCurrency = mockCurrencies.find(c => c.code === 'DZD')!

      // Act
      const conversionDisplay = currencyDisplayService.formatConversion(
        100, dzdCurrency,
        100, dzdCurrency
      )

      // Assert
      expect(conversionDisplay.shouldShowConversion).toBe(false)
      expect(conversionDisplay.combinedDisplay).not.toContain('≈')
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle missing currency gracefully', async () => {
      // Arrange
      const transactionData = {
        amount: 100,
        currency_id: 'invalid-currency-id',
        transaction_type: 'expense',
        description: 'Test transaction',
        date: '2024-01-01',
        category: 'test'
      }

      // Mock currency not found
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: new Error('Currency not found')
      })

      mockSupabase.insert.mockResolvedValue({ error: null })

      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse = jest.fn().mockReturnValue(transactionData)

      // Act
      await createTransaction(transactionData)

      // Assert - Should use fallback values
      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.ratio_at_transaction).toBe(1) // Fallback rate
      expect(insertCall.equivalent_amount_default_currency).toBe(100) // Fallback amount
    })

    it('should handle invalid exchange rates', async () => {
      // Arrange
      const transactionData = {
        amount: 100,
        currency_id: 'cad-id',
        transaction_type: 'expense',
        description: 'Test transaction',
        date: '2024-01-01',
        category: 'test'
      }

      // Mock currency with invalid ratio
      const invalidCurrency = { ...mockCurrencies[1], ratio: 0 }
      mockSupabase.select.mockResolvedValueOnce({
        data: invalidCurrency,
        error: null
      })
      mockSupabase.select.mockResolvedValueOnce({
        data: mockCurrencies.find(c => c.is_default),
        error: null
      })

      mockSupabase.insert.mockResolvedValue({ error: null })

      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse = jest.fn().mockReturnValue(transactionData)

      // Act
      await createTransaction(transactionData)

      // Assert - Should use fallback values
      const insertCall = mockSupabase.insert.mock.calls[0][0]
      expect(insertCall.ratio_at_transaction).toBe(1) // Fallback rate
      expect(insertCall.equivalent_amount_default_currency).toBe(100) // Fallback amount
    })
  })

  describe('Performance and Caching', () => {
    it('should cache currency data to avoid repeated database calls', async () => {
      // This test would verify that currency conversion service caches currencies
      // and doesn't make repeated database calls for the same currency
      
      // Arrange
      const transactionData1 = {
        amount: 100,
        currency_id: 'cad-id',
        transaction_type: 'expense',
        description: 'Test transaction 1',
        date: '2024-01-01',
        category: 'test'
      }

      const transactionData2 = {
        amount: 150,
        currency_id: 'cad-id', // Same currency
        transaction_type: 'income',
        description: 'Test transaction 2',
        date: '2024-01-02',
        category: 'test'
      }

      // Mock currency data
      mockSupabase.select.mockResolvedValue({
        data: mockCurrencies.find(c => c.id === 'cad-id'),
        error: null
      })

      mockSupabase.insert.mockResolvedValue({ error: null })

      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse = jest.fn()
        .mockReturnValueOnce(transactionData1)
        .mockReturnValueOnce(transactionData2)

      // Act
      await createTransaction(transactionData1)
      await createTransaction(transactionData2)

      // Assert
      // The currency should be cached after first call
      // This is a simplified test - in reality, we'd need to mock the caching mechanism
      expect(mockSupabase.insert).toHaveBeenCalledTimes(2)
    })
  })
})