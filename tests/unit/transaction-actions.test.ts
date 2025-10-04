import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { createTransaction, updateTransaction } from '@/app/actions/transactions'
import { currencyConversionService } from '@/lib/services/currency-conversion'
import { logger } from '@/lib/logger'
import { createClient } from '@/utils/supabase/server'

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  requireRole: jest.fn().mockResolvedValue({ user: { id: 'test-user' } })
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn()
}))

jest.mock('@/lib/services/currency-conversion', () => ({
  currencyConversionService: {
    calculateConversion: jest.fn(),
    validateAmount: jest.fn()
  }
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

jest.mock('@/lib/validations', () => ({
  transactionSchema: {
    parse: jest.fn()
  }
}))

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis()
}

describe('🧪 Transaction Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createTransaction', () => {
    const mockTransactionData = {
      amount: 100,
      currency_id: 'cad-id',
      transaction_type: 'expense',
      description: 'Test transaction',
      date: '2024-01-01',
      category: 'test'
    }

    const mockConversionResult = {
      originalAmount: 100,
      convertedAmount: 75,
      exchangeRate: 0.75,
      fromCurrency: { id: 'cad-id', code: 'CAD', symbol: 'C$' },
      toCurrency: { id: 'dzd-id', code: 'DZD', symbol: 'DA' },
      timestamp: new Date()
    }

    it('should create transaction with currency conversion', async () => {
      // Arrange
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(mockTransactionData)
      
      ;(currencyConversionService.validateAmount as jest.Mock).mockReturnValue(true)
      ;(currencyConversionService.calculateConversion as jest.Mock).mockResolvedValue(mockConversionResult)
      
      mockSupabase.insert.mockResolvedValue({ error: null })

      // Act
      await createTransaction(mockTransactionData)

      // Assert
      expect(currencyConversionService.validateAmount).toHaveBeenCalledWith(100)
      expect(currencyConversionService.calculateConversion).toHaveBeenCalledWith(100, 'cad-id')
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...mockTransactionData,
        loft_id: null,
        payment_method_id: null,
        description: 'Test transaction',
        ratio_at_transaction: 0.75,
        equivalent_amount_default_currency: 75
      })
      expect(logger.info).toHaveBeenCalledWith('Transaction created successfully')
    })

    it('should handle conversion error with fallback', async () => {
      // Arrange
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(mockTransactionData)
      
      ;(currencyConversionService.validateAmount as jest.Mock).mockReturnValue(true)
      
      const conversionError = new Error('Conversion failed') as any
      conversionError.conversionError = {
        type: 'INVALID_RATE',
        message: 'Invalid rate',
        fallbackAction: 'USE_DEFAULT_RATE'
      }
      
      ;(currencyConversionService.calculateConversion as jest.Mock).mockRejectedValue(conversionError)
      mockSupabase.insert.mockResolvedValue({ error: null })

      // Act
      await createTransaction(mockTransactionData)

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Using fallback 1:1 conversion rate', {
        currencyId: 'cad-id',
        amount: 100
      })
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...mockTransactionData,
        loft_id: null,
        payment_method_id: null,
        description: 'Test transaction',
        ratio_at_transaction: 1,
        equivalent_amount_default_currency: 100
      })
    })

    it('should block transaction when fallback action is BLOCK_TRANSACTION', async () => {
      // Arrange
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(mockTransactionData)
      
      ;(currencyConversionService.validateAmount as jest.Mock).mockReturnValue(true)
      
      const conversionError = new Error('Critical conversion error') as any
      conversionError.conversionError = {
        type: 'DEFAULT_CURRENCY_MISSING',
        message: 'No default currency',
        fallbackAction: 'BLOCK_TRANSACTION'
      }
      
      ;(currencyConversionService.calculateConversion as jest.Mock).mockRejectedValue(conversionError)

      // Act & Assert
      await expect(createTransaction(mockTransactionData)).rejects.toThrow('Critical conversion error')
      expect(mockSupabase.insert).not.toHaveBeenCalled()
    })

    it('should handle invalid amount', async () => {
      // Arrange
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(mockTransactionData)
      
      ;(currencyConversionService.validateAmount as jest.Mock).mockReturnValue(false)

      // Act & Assert
      await expect(createTransaction(mockTransactionData)).rejects.toThrow('Invalid transaction amount')
      expect(currencyConversionService.calculateConversion).not.toHaveBeenCalled()
    })

    it('should handle database error', async () => {
      // Arrange
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(mockTransactionData)
      
      ;(currencyConversionService.validateAmount as jest.Mock).mockReturnValue(true)
      ;(currencyConversionService.calculateConversion as jest.Mock).mockResolvedValue(mockConversionResult)
      
      const dbError = new Error('Database error')
      mockSupabase.insert.mockResolvedValue({ error: dbError })

      // Act & Assert
      await expect(createTransaction(mockTransactionData)).rejects.toThrow('Database error')
      expect(logger.error).toHaveBeenCalledWith('Error creating transaction in database', dbError)
    })
  })

  describe('updateTransaction', () => {
    const transactionId = 'test-transaction-id'
    const mockUpdateData = {
      amount: 150,
      currency_id: 'eur-id',
      transaction_type: 'income',
      description: 'Updated transaction',
      date: '2024-01-02',
      category: 'updated'
    }

    const mockCurrentTransaction = {
      id: transactionId,
      amount: 100,
      currency_id: 'cad-id',
      ratio_at_transaction: 0.75,
      equivalent_amount_default_currency: 75
    }

    const mockConversionResult = {
      originalAmount: 150,
      convertedAmount: 120,
      exchangeRate: 0.8,
      fromCurrency: { id: 'eur-id', code: 'EUR', symbol: '€' },
      toCurrency: { id: 'dzd-id', code: 'DZD', symbol: 'DA' },
      timestamp: new Date()
    }

    it('should update transaction with recalculated conversion when currency changes', async () => {
      // Arrange
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(mockUpdateData)
      
      mockSupabase.select.mockResolvedValue({ data: mockCurrentTransaction, error: null })
      ;(currencyConversionService.validateAmount as jest.Mock).mockReturnValue(true)
      ;(currencyConversionService.calculateConversion as jest.Mock).mockResolvedValue(mockConversionResult)
      mockSupabase.update.mockResolvedValue({ error: null })

      // Act
      await updateTransaction(transactionId, mockUpdateData)

      // Assert
      expect(currencyConversionService.calculateConversion).toHaveBeenCalledWith(150, 'eur-id')
      expect(mockSupabase.update).toHaveBeenCalledWith({
        ...mockUpdateData,
        loft_id: null,
        payment_method_id: null,
        description: 'Updated transaction',
        ratio_at_transaction: 0.8,
        equivalent_amount_default_currency: 120
      })
      expect(logger.info).toHaveBeenCalledWith('Currency conversion recalculated for transaction update', expect.objectContaining({
        transactionId,
        currencyChanged: true,
        amountChanged: true
      }))
    })

    it('should update transaction with recalculated conversion when amount changes', async () => {
      // Arrange
      const updateDataSameCurrency = { ...mockUpdateData, currency_id: 'cad-id' }
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(updateDataSameCurrency)
      
      mockSupabase.select.mockResolvedValue({ data: mockCurrentTransaction, error: null })
      ;(currencyConversionService.validateAmount as jest.Mock).mockReturnValue(true)
      ;(currencyConversionService.calculateConversion as jest.Mock).mockResolvedValue({
        ...mockConversionResult,
        fromCurrency: { id: 'cad-id', code: 'CAD', symbol: 'C$' }
      })
      mockSupabase.update.mockResolvedValue({ error: null })

      // Act
      await updateTransaction(transactionId, updateDataSameCurrency)

      // Assert
      expect(currencyConversionService.calculateConversion).toHaveBeenCalledWith(150, 'cad-id')
      expect(logger.info).toHaveBeenCalledWith('Currency conversion recalculated for transaction update', expect.objectContaining({
        transactionId,
        currencyChanged: false,
        amountChanged: true
      }))
    })

    it('should not recalculate conversion when neither currency nor amount changes', async () => {
      // Arrange
      const unchangedData = {
        ...mockUpdateData,
        amount: 100,
        currency_id: 'cad-id'
      }
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(unchangedData)
      
      mockSupabase.select.mockResolvedValue({ data: mockCurrentTransaction, error: null })
      mockSupabase.update.mockResolvedValue({ error: null })

      // Act
      await updateTransaction(transactionId, unchangedData)

      // Assert
      expect(currencyConversionService.calculateConversion).not.toHaveBeenCalled()
      expect(mockSupabase.update).toHaveBeenCalledWith({
        ...unchangedData,
        loft_id: null,
        payment_method_id: null,
        description: 'Updated transaction',
        ratio_at_transaction: 0.75, // Original value preserved
        equivalent_amount_default_currency: 75 // Original value preserved
      })
    })

    it('should handle conversion error with fallback during update', async () => {
      // Arrange
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(mockUpdateData)
      
      mockSupabase.select.mockResolvedValue({ data: mockCurrentTransaction, error: null })
      ;(currencyConversionService.validateAmount as jest.Mock).mockReturnValue(true)
      
      const conversionError = new Error('Update conversion failed') as any
      conversionError.conversionError = {
        type: 'INVALID_RATE',
        message: 'Invalid rate for update',
        fallbackAction: 'USE_DEFAULT_RATE'
      }
      
      ;(currencyConversionService.calculateConversion as jest.Mock).mockRejectedValue(conversionError)
      mockSupabase.update.mockResolvedValue({ error: null })

      // Act
      await updateTransaction(transactionId, mockUpdateData)

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Using fallback 1:1 conversion rate for update', {
        transactionId,
        currencyId: 'eur-id',
        amount: 150
      })
      expect(mockSupabase.update).toHaveBeenCalledWith({
        ...mockUpdateData,
        loft_id: null,
        payment_method_id: null,
        description: 'Updated transaction',
        ratio_at_transaction: 1,
        equivalent_amount_default_currency: 150
      })
    })

    it('should handle transaction not found error', async () => {
      // Arrange
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(mockUpdateData)
      
      mockSupabase.select.mockResolvedValue({ data: null, error: new Error('Not found') })

      // Act & Assert
      await expect(updateTransaction(transactionId, mockUpdateData)).rejects.toThrow('Transaction not found')
      expect(logger.error).toHaveBeenCalledWith('Error fetching current transaction for update', expect.any(Error))
    })

    it('should handle database update error', async () => {
      // Arrange
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(mockUpdateData)
      
      mockSupabase.select.mockResolvedValue({ data: mockCurrentTransaction, error: null })
      ;(currencyConversionService.validateAmount as jest.Mock).mockReturnValue(true)
      ;(currencyConversionService.calculateConversion as jest.Mock).mockResolvedValue(mockConversionResult)
      
      const dbError = new Error('Update database error')
      mockSupabase.update.mockResolvedValue({ error: dbError })

      // Act & Assert
      await expect(updateTransaction(transactionId, mockUpdateData)).rejects.toThrow('Update database error')
      expect(logger.error).toHaveBeenCalledWith('Error updating transaction in database', dbError)
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing currency_id in createTransaction', async () => {
      // Arrange
      const dataWithoutCurrency = {
        amount: 100,
        transaction_type: 'expense',
        description: 'Test transaction',
        date: '2024-01-01',
        category: 'test'
      }
      
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(dataWithoutCurrency)
      mockSupabase.insert.mockResolvedValue({ error: null })

      // Act
      await createTransaction(dataWithoutCurrency)

      // Assert
      expect(currencyConversionService.calculateConversion).not.toHaveBeenCalled()
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...dataWithoutCurrency,
        loft_id: null,
        payment_method_id: null,
        description: 'Test transaction',
        ratio_at_transaction: null,
        equivalent_amount_default_currency: null
      })
    })

    it('should handle missing amount in createTransaction', async () => {
      // Arrange
      const dataWithoutAmount = {
        currency_id: 'cad-id',
        transaction_type: 'expense',
        description: 'Test transaction',
        date: '2024-01-01',
        category: 'test'
      }
      
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(dataWithoutAmount)
      mockSupabase.insert.mockResolvedValue({ error: null })

      // Act
      await createTransaction(dataWithoutAmount)

      // Assert
      expect(currencyConversionService.calculateConversion).not.toHaveBeenCalled()
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...dataWithoutAmount,
        loft_id: null,
        payment_method_id: null,
        description: 'Test transaction',
        ratio_at_transaction: null,
        equivalent_amount_default_currency: null
      })
    })

    it('should handle unexpected error during conversion', async () => {
      // Arrange
      const mockTransactionData = {
        amount: 100,
        currency_id: 'cad-id',
        transaction_type: 'expense',
        description: 'Test transaction',
        date: '2024-01-01',
        category: 'test'
      }
      
      const { transactionSchema } = require('@/lib/validations')
      transactionSchema.parse.mockReturnValue(mockTransactionData)
      
      ;(currencyConversionService.validateAmount as jest.Mock).mockReturnValue(true)
      ;(currencyConversionService.calculateConversion as jest.Mock).mockRejectedValue(new Error('Unexpected error'))
      mockSupabase.insert.mockResolvedValue({ error: null })

      // Act
      await createTransaction(mockTransactionData)

      // Assert
      expect(logger.warn).toHaveBeenCalledWith('Using fallback conversion due to unexpected error', {
        currencyId: 'cad-id',
        amount: 100,
        error: 'Unexpected error'
      })
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        ...mockTransactionData,
        loft_id: null,
        payment_method_id: null,
        description: 'Test transaction',
        ratio_at_transaction: 1,
        equivalent_amount_default_currency: 100
      })
    })
  })
})