import { createTransaction, updateTransaction } from '@/app/actions/transactions'
import { currencyConversionService } from '@/lib/services/currency-conversion'
import { requireRole } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'

// Mock dependencies
jest.mock('@/lib/auth')
jest.mock('@/utils/supabase/server')
jest.mock('@/lib/services/currency-conversion')
jest.mock('@/lib/logger')
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockCurrencyConversionService = currencyConversionService as jest.Mocked<typeof currencyConversionService>
const mockLogger = logger as jest.Mocked<typeof logger>

// Test UUIDs
const TEST_CURRENCY_ID = '550e8400-e29b-41d4-a716-446655440001'
const TEST_LOFT_ID = '550e8400-e29b-41d4-a716-446655440002'
const TEST_PAYMENT_METHOD_ID = '550e8400-e29b-41d4-a716-446655440003'
const TEST_CURRENCY_2_ID = '550e8400-e29b-41d4-a716-446655440004'
const TEST_TRANSACTION_ID = '550e8400-e29b-41d4-a716-446655440005'

describe('Transaction Actions', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock Supabase client with proper method chaining
    const mockTransactionTable = {
      insert: jest.fn().mockResolvedValue({ error: null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    }
    
    mockSupabase = {
      from: jest.fn().mockReturnValue(mockTransactionTable)
    }
    
    mockCreateClient.mockResolvedValue(mockSupabase)
    mockRequireRole.mockResolvedValue({ user: { id: 'user-1' } } as any)
  })

  describe('createTransaction', () => {
    const validTransactionData = {
      amount: 100,
      transaction_type: 'income' as const,
      status: 'completed' as const,
      description: 'Test transaction',
      date: '2024-01-01',
      category: 'test',
      currency_id: TEST_CURRENCY_ID,
      loft_id: TEST_LOFT_ID,
      payment_method_id: TEST_PAYMENT_METHOD_ID
    }

    it('should create transaction with currency conversion', async () => {
      // Mock successful conversion
      const mockConversionResult = {
        originalAmount: 100,
        convertedAmount: 150,
        exchangeRate: 1.5,
        fromCurrency: { id: TEST_CURRENCY_ID, code: 'CAD', symbol: 'C$' },
        toCurrency: { id: TEST_CURRENCY_2_ID, code: 'DZD', symbol: 'DA' },
        timestamp: new Date()
      }

      mockCurrencyConversionService.validateAmount.mockReturnValue(true)
      mockCurrencyConversionService.calculateConversion.mockResolvedValue(mockConversionResult)

      await createTransaction(validTransactionData)

      // Verify conversion service was called
      expect(mockCurrencyConversionService.validateAmount).toHaveBeenCalledWith(100)
      expect(mockCurrencyConversionService.calculateConversion).toHaveBeenCalledWith(
        100,
        TEST_CURRENCY_ID
      )

      // Verify database insert was called with conversion data
      const transactionTable = mockSupabase.from()
      expect(transactionTable.insert).toHaveBeenCalledWith({
        ...validTransactionData,
        loft_id: TEST_LOFT_ID,
        payment_method_id: TEST_PAYMENT_METHOD_ID,
        description: 'Test transaction',
        ratio_at_transaction: 1.5,
        equivalent_amount_default_currency: 150,
      })

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalledWith('Creating transaction', { data: validTransactionData })
      expect(mockLogger.info).toHaveBeenCalledWith('Currency conversion completed for transaction', expect.any(Object))
      expect(mockLogger.info).toHaveBeenCalledWith('Transaction created successfully')
    })

    it('should handle invalid amount validation with fallback', async () => {
      mockCurrencyConversionService.validateAmount.mockReturnValue(false)

      await createTransaction(validTransactionData)

      expect(mockCurrencyConversionService.validateAmount).toHaveBeenCalledWith(100)
      expect(mockCurrencyConversionService.calculateConversion).not.toHaveBeenCalled()
      
      // Verify fallback values were used
      const transactionTable = mockSupabase.from()
      expect(transactionTable.insert).toHaveBeenCalledWith({
        ...validTransactionData,
        loft_id: TEST_LOFT_ID,
        payment_method_id: TEST_PAYMENT_METHOD_ID,
        description: 'Test transaction',
        ratio_at_transaction: 1,
        equivalent_amount_default_currency: 100,
      })

      expect(mockLogger.warn).toHaveBeenCalledWith('Using fallback conversion due to unexpected error', expect.any(Object))
    })

    it('should use fallback conversion when service fails with USE_DEFAULT_RATE', async () => {
      const conversionError = new Error('Conversion failed') as any
      conversionError.conversionError = {
        type: 'CURRENCY_NOT_FOUND',
        message: 'Currency not found',
        fallbackAction: 'USE_DEFAULT_RATE'
      }

      mockCurrencyConversionService.validateAmount.mockReturnValue(true)
      mockCurrencyConversionService.calculateConversion.mockRejectedValue(conversionError)

      await createTransaction(validTransactionData)

      // Verify fallback values were used
      const transactionTable = mockSupabase.from()
      expect(transactionTable.insert).toHaveBeenCalledWith({
        ...validTransactionData,
        loft_id: TEST_LOFT_ID,
        payment_method_id: TEST_PAYMENT_METHOD_ID,
        description: 'Test transaction',
        ratio_at_transaction: 1,
        equivalent_amount_default_currency: 100,
      })

      expect(mockLogger.warn).toHaveBeenCalledWith('Using fallback 1:1 conversion rate', expect.any(Object))
    })

    it('should block transaction when service fails with BLOCK_TRANSACTION', async () => {
      const conversionError = new Error('Critical conversion error') as any
      conversionError.conversionError = {
        type: 'DEFAULT_CURRENCY_MISSING',
        message: 'Default currency missing',
        fallbackAction: 'BLOCK_TRANSACTION'
      }

      mockCurrencyConversionService.validateAmount.mockReturnValue(true)
      mockCurrencyConversionService.calculateConversion.mockRejectedValue(conversionError)

      await expect(createTransaction(validTransactionData)).rejects.toThrow('Critical conversion error')

      const transactionTable = mockSupabase.from()
      expect(transactionTable.insert).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith('Currency conversion failed during transaction creation', expect.any(Error), expect.any(Object))
    })

    it('should use fallback for unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error')

      mockCurrencyConversionService.validateAmount.mockReturnValue(true)
      mockCurrencyConversionService.calculateConversion.mockRejectedValue(unexpectedError)

      await createTransaction(validTransactionData)

      // Verify fallback values were used
      const transactionTable = mockSupabase.from()
      expect(transactionTable.insert).toHaveBeenCalledWith({
        ...validTransactionData,
        loft_id: TEST_LOFT_ID,
        payment_method_id: TEST_PAYMENT_METHOD_ID,
        description: 'Test transaction',
        ratio_at_transaction: 1,
        equivalent_amount_default_currency: 100,
      })

      expect(mockLogger.warn).toHaveBeenCalledWith('Using fallback conversion due to unexpected error', expect.any(Object))
    })

    it('should handle transaction without currency_id', async () => {
      const dataWithoutCurrency = {
        ...validTransactionData,
        currency_id: undefined
      }

      await createTransaction(dataWithoutCurrency)

      // Verify conversion service was not called
      expect(mockCurrencyConversionService.calculateConversion).not.toHaveBeenCalled()

      // Verify database insert was called without conversion data
      const transactionTable = mockSupabase.from()
      expect(transactionTable.insert).toHaveBeenCalledWith({
        ...dataWithoutCurrency,
        loft_id: TEST_LOFT_ID,
        payment_method_id: TEST_PAYMENT_METHOD_ID,
        description: 'Test transaction',
        ratio_at_transaction: null,
        equivalent_amount_default_currency: null,
      })
    })

    it('should handle database insertion error', async () => {
      const dbError = new Error('Database error')
      
      mockCurrencyConversionService.validateAmount.mockReturnValue(true)
      mockCurrencyConversionService.calculateConversion.mockResolvedValue({
        originalAmount: 100,
        convertedAmount: 150,
        exchangeRate: 1.5,
        fromCurrency: { id: TEST_CURRENCY_ID, code: 'CAD', symbol: 'C$' },
        toCurrency: { id: TEST_CURRENCY_2_ID, code: 'DZD', symbol: 'DA' },
        timestamp: new Date()
      })
      
      // Mock database error
      const transactionTable = mockSupabase.from()
      transactionTable.insert.mockResolvedValue({ error: dbError })

      await expect(createTransaction(validTransactionData)).rejects.toThrow('Database error')

      expect(mockLogger.error).toHaveBeenCalledWith('Error creating transaction in database', dbError)
    })
  })

  describe('updateTransaction', () => {
    const validUpdateData = {
      amount: 200,
      transaction_type: 'expense' as const,
      status: 'completed' as const,
      description: 'Updated transaction',
      date: '2024-01-02',
      category: 'updated',
      currency_id: TEST_CURRENCY_2_ID,
      loft_id: TEST_LOFT_ID,
      payment_method_id: TEST_PAYMENT_METHOD_ID
    }

    const existingTransaction = {
      id: TEST_TRANSACTION_ID,
      amount: 100,
      currency_id: TEST_CURRENCY_ID,
      ratio_at_transaction: 1.2,
      equivalent_amount_default_currency: 120,
      transaction_type: 'income',
      status: 'pending',
      description: 'Original transaction',
      date: '2024-01-01',
      category: 'original'
    }

    beforeEach(() => {
      // Mock the select chain to return existing transaction
      const transactionTable = mockSupabase.from()
      transactionTable.select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: existingTransaction, error: null })
        })
      })
    })

    it('should update transaction with currency conversion when currency changes', async () => {
      const mockConversionResult = {
        originalAmount: 200,
        convertedAmount: 250,
        exchangeRate: 1.25,
        fromCurrency: { id: TEST_CURRENCY_2_ID, code: 'EUR', symbol: '€' },
        toCurrency: { id: TEST_CURRENCY_ID, code: 'DZD', symbol: 'DA' },
        timestamp: new Date()
      }

      mockCurrencyConversionService.validateAmount.mockReturnValue(true)
      mockCurrencyConversionService.calculateConversion.mockResolvedValue(mockConversionResult)

      await updateTransaction(TEST_TRANSACTION_ID, validUpdateData)

      // Verify conversion service was called due to currency change
      expect(mockCurrencyConversionService.validateAmount).toHaveBeenCalledWith(200)
      expect(mockCurrencyConversionService.calculateConversion).toHaveBeenCalledWith(
        200,
        TEST_CURRENCY_2_ID
      )

      // Verify database update was called with new conversion data
      const transactionTable = mockSupabase.from()
      expect(transactionTable.update).toHaveBeenCalledWith({
        ...validUpdateData,
        loft_id: TEST_LOFT_ID,
        payment_method_id: TEST_PAYMENT_METHOD_ID,
        description: 'Updated transaction',
        ratio_at_transaction: 1.25,
        equivalent_amount_default_currency: 250,
      })

      expect(mockLogger.info).toHaveBeenCalledWith('Currency conversion recalculated for transaction update', expect.objectContaining({
        transactionId: TEST_TRANSACTION_ID,
        currencyChanged: true,
        amountChanged: true
      }))
    })

    it('should update transaction with currency conversion when amount changes', async () => {
      const updateDataSameCurrency = {
        ...validUpdateData,
        currency_id: TEST_CURRENCY_ID // Same currency as existing
      }

      const mockConversionResult = {
        originalAmount: 200,
        convertedAmount: 240,
        exchangeRate: 1.2,
        fromCurrency: { id: TEST_CURRENCY_ID, code: 'CAD', symbol: 'C$' },
        toCurrency: { id: TEST_CURRENCY_2_ID, code: 'DZD', symbol: 'DA' },
        timestamp: new Date()
      }

      mockCurrencyConversionService.validateAmount.mockReturnValue(true)
      mockCurrencyConversionService.calculateConversion.mockResolvedValue(mockConversionResult)

      await updateTransaction(TEST_TRANSACTION_ID, updateDataSameCurrency)

      // Verify conversion service was called due to amount change
      expect(mockCurrencyConversionService.calculateConversion).toHaveBeenCalledWith(
        200,
        TEST_CURRENCY_ID
      )

      expect(mockLogger.info).toHaveBeenCalledWith('Currency conversion recalculated for transaction update', expect.objectContaining({
        transactionId: TEST_TRANSACTION_ID,
        currencyChanged: false,
        amountChanged: true
      }))
    })

    it('should not recalculate conversion when neither currency nor amount changes', async () => {
      const updateDataNoChange = {
        ...validUpdateData,
        amount: 100, // Same amount
        currency_id: TEST_CURRENCY_ID // Same currency
      }

      await updateTransaction(TEST_TRANSACTION_ID, updateDataNoChange)

      // Verify conversion service was not called
      expect(mockCurrencyConversionService.calculateConversion).not.toHaveBeenCalled()

      // Verify database update was called with existing conversion data
      const transactionTable = mockSupabase.from()
      expect(transactionTable.update).toHaveBeenCalledWith({
        ...updateDataNoChange,
        loft_id: TEST_LOFT_ID,
        payment_method_id: TEST_PAYMENT_METHOD_ID,
        description: 'Updated transaction',
        ratio_at_transaction: 1.2, // Existing value
        equivalent_amount_default_currency: 120, // Existing value
      })
    })

    it('should handle conversion error with fallback during update', async () => {
      const conversionError = new Error('Conversion failed') as any
      conversionError.conversionError = {
        type: 'INVALID_RATE',
        message: 'Invalid rate',
        fallbackAction: 'USE_DEFAULT_RATE'
      }

      mockCurrencyConversionService.validateAmount.mockReturnValue(true)
      mockCurrencyConversionService.calculateConversion.mockRejectedValue(conversionError)

      await updateTransaction(TEST_TRANSACTION_ID, validUpdateData)

      // Verify fallback values were used
      const transactionTable = mockSupabase.from()
      expect(transactionTable.update).toHaveBeenCalledWith({
        ...validUpdateData,
        loft_id: TEST_LOFT_ID,
        payment_method_id: TEST_PAYMENT_METHOD_ID,
        description: 'Updated transaction',
        ratio_at_transaction: 1,
        equivalent_amount_default_currency: 200,
      })

      expect(mockLogger.warn).toHaveBeenCalledWith('Using fallback 1:1 conversion rate for update', expect.any(Object))
    })

    it('should handle transaction not found error', async () => {
      // Mock transaction not found
      const transactionTable = mockSupabase.from()
      transactionTable.select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
        })
      })

      await expect(updateTransaction(TEST_TRANSACTION_ID, validUpdateData)).rejects.toThrow('Transaction not found')

      expect(mockLogger.error).toHaveBeenCalledWith('Error fetching current transaction for update', expect.any(Error))
    })

    it('should handle invalid amount during update with fallback', async () => {
      mockCurrencyConversionService.validateAmount.mockReturnValue(false)

      await updateTransaction(TEST_TRANSACTION_ID, validUpdateData)

      expect(mockCurrencyConversionService.validateAmount).toHaveBeenCalledWith(200)
      expect(mockCurrencyConversionService.calculateConversion).not.toHaveBeenCalled()
      
      // Verify fallback values were used
      const transactionTable = mockSupabase.from()
      expect(transactionTable.update).toHaveBeenCalledWith({
        ...validUpdateData,
        loft_id: TEST_LOFT_ID,
        payment_method_id: TEST_PAYMENT_METHOD_ID,
        description: 'Updated transaction',
        ratio_at_transaction: 1,
        equivalent_amount_default_currency: 200,
      })

      expect(mockLogger.warn).toHaveBeenCalledWith('Using fallback conversion for update due to unexpected error', expect.any(Object))
    })

    it('should handle database update error', async () => {
      const dbError = new Error('Database update error')
      
      mockCurrencyConversionService.validateAmount.mockReturnValue(true)
      mockCurrencyConversionService.calculateConversion.mockResolvedValue({
        originalAmount: 200,
        convertedAmount: 250,
        exchangeRate: 1.25,
        fromCurrency: { id: TEST_CURRENCY_2_ID, code: 'EUR', symbol: '€' },
        toCurrency: { id: TEST_CURRENCY_ID, code: 'DZD', symbol: 'DA' },
        timestamp: new Date()
      })
      
      // Mock database error
      const transactionTable = mockSupabase.from()
      transactionTable.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: dbError })
      })

      await expect(updateTransaction(TEST_TRANSACTION_ID, validUpdateData)).rejects.toThrow('Database update error')

      expect(mockLogger.error).toHaveBeenCalledWith('Error updating transaction in database', dbError)
    })

    it('should handle missing currency_id in update data', async () => {
      const updateDataNoCurrency = {
        ...validUpdateData,
        currency_id: undefined
      }

      await updateTransaction(TEST_TRANSACTION_ID, updateDataNoCurrency)

      // Verify conversion service was not called
      expect(mockCurrencyConversionService.calculateConversion).not.toHaveBeenCalled()

      // Verify existing conversion data was preserved
      const transactionTable = mockSupabase.from()
      expect(transactionTable.update).toHaveBeenCalledWith({
        ...updateDataNoCurrency,
        loft_id: TEST_LOFT_ID,
        payment_method_id: TEST_PAYMENT_METHOD_ID,
        description: 'Updated transaction',
        ratio_at_transaction: 1.2, // Existing value
        equivalent_amount_default_currency: 120, // Existing value
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle authorization failure', async () => {
      mockRequireRole.mockRejectedValue(new Error('Unauthorized'))

      await expect(createTransaction({ amount: 100 })).rejects.toThrow('Unauthorized')

      expect(mockCurrencyConversionService.calculateConversion).not.toHaveBeenCalled()
    })

    it('should handle malformed transaction data', async () => {
      const invalidData = {
        amount: -100, // Invalid negative amount
        transaction_type: 'invalid_type',
        status: 'invalid_status'
      }

      // This should throw a validation error from the schema
      await expect(createTransaction(invalidData)).rejects.toThrow()
    })

    it('should handle null/undefined values correctly', async () => {
      const dataWithOptionalFields = {
        amount: 100,
        transaction_type: 'income' as const,
        status: 'completed' as const,
        date: '2024-01-01',
        currency_id: TEST_CURRENCY_ID
        // Optional fields omitted
      }

      mockCurrencyConversionService.validateAmount.mockReturnValue(true)
      mockCurrencyConversionService.calculateConversion.mockResolvedValue({
        originalAmount: 100,
        convertedAmount: 150,
        exchangeRate: 1.5,
        fromCurrency: { id: TEST_CURRENCY_ID, code: 'CAD', symbol: 'C$' },
        toCurrency: { id: TEST_CURRENCY_2_ID, code: 'DZD', symbol: 'DA' },
        timestamp: new Date()
      })

      await createTransaction(dataWithOptionalFields)

      const transactionTable = mockSupabase.from()
      expect(transactionTable.insert).toHaveBeenCalledWith({
        ...dataWithOptionalFields,
        loft_id: null,
        payment_method_id: null,
        description: '',
        ratio_at_transaction: 1.5,
        equivalent_amount_default_currency: 150,
      })
    })
  })
})