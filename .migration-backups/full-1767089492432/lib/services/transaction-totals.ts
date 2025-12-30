import { logger, measurePerformance } from '@/lib/logger'

export interface Transaction {
  id: string
  amount: number
  transaction_type: 'income' | 'expense'
  status: 'pending' | 'completed' | 'failed'
  equivalent_amount_default_currency?: number
  currency_id?: string
  date: string
  category?: string
  loft_id?: string
}

export interface TransactionTotals {
  totalIncome: number
  totalExpenses: number
  netTotal: number
  transactionCount: number
  incomeCount: number
  expenseCount: number
  completedCount: number
  pendingCount: number
  failedCount: number
}

export interface FilterOptions {
  includeStatus?: ('pending' | 'completed' | 'failed')[]
  includeTypes?: ('income' | 'expense')[]
  dateFrom?: Date
  dateTo?: Date
  categories?: string[]
  loftIds?: string[]
  currencyIds?: string[]
}

export class TransactionTotalsService {
  private static instance: TransactionTotalsService

  private constructor() {}

  public static getInstance(): TransactionTotalsService {
    if (!TransactionTotalsService.instance) {
      TransactionTotalsService.instance = new TransactionTotalsService()
    }
    return TransactionTotalsService.instance
  }

  /**
   * Calculate comprehensive totals for a set of transactions
   */
  public calculateTotals(
    transactions: Transaction[],
    filters?: FilterOptions
  ): TransactionTotals {
    return measurePerformance(() => {
      logger.info('Calculating transaction totals', { 
        transactionCount: transactions.length,
        filters 
      })

      try {
        // Apply filters if provided
        const filteredTransactions = this.applyFilters(transactions, filters)

        const totals = filteredTransactions.reduce(
          (acc, transaction) => {
            // Use converted amount if available, otherwise use original amount
            const amount = this.getEffectiveAmount(transaction)
            
            // Count transactions by type
            if (transaction.transaction_type === 'income') {
              acc.totalIncome += amount
              acc.incomeCount++
            } else if (transaction.transaction_type === 'expense') {
              acc.totalExpenses += amount
              acc.expenseCount++
            }

            // Count by status
            switch (transaction.status) {
              case 'completed':
                acc.completedCount++
                break
              case 'pending':
                acc.pendingCount++
                break
              case 'failed':
                acc.failedCount++
                break
            }

            acc.transactionCount++
            return acc
          },
          {
            totalIncome: 0,
            totalExpenses: 0,
            netTotal: 0,
            transactionCount: 0,
            incomeCount: 0,
            expenseCount: 0,
            completedCount: 0,
            pendingCount: 0,
            failedCount: 0
          }
        )

        // Calculate net total
        totals.netTotal = totals.totalIncome - totals.totalExpenses

        logger.info('Transaction totals calculated', { totals })
        return totals

      } catch (error) {
        logger.error('Error calculating transaction totals', error, {
          transactionCount: transactions.length,
          filters
        })
        
        // Return empty totals on error
        return {
          totalIncome: 0,
          totalExpenses: 0,
          netTotal: 0,
          transactionCount: 0,
          incomeCount: 0,
          expenseCount: 0,
          completedCount: 0,
          pendingCount: 0,
          failedCount: 0
        }
      }
    }, 'calculateTotals')
  }

  /**
   * Calculate totals for income transactions only
   */
  public calculateIncomeTotals(
    transactions: Transaction[],
    filters?: FilterOptions
  ): number {
    const incomeFilters = {
      ...filters,
      includeTypes: ['income' as const]
    }
    
    const totals = this.calculateTotals(transactions, incomeFilters)
    return totals.totalIncome
  }

  /**
   * Calculate totals for expense transactions only
   */
  public calculateExpenseTotals(
    transactions: Transaction[],
    filters?: FilterOptions
  ): number {
    const expenseFilters = {
      ...filters,
      includeTypes: ['expense' as const]
    }
    
    const totals = this.calculateTotals(transactions, expenseFilters)
    return totals.totalExpenses
  }

  /**
   * Calculate net total (income - expenses)
   */
  public calculateNetTotal(
    transactions: Transaction[],
    filters?: FilterOptions
  ): number {
    const totals = this.calculateTotals(transactions, filters)
    return totals.netTotal
  }

  /**
   * Calculate totals by status
   */
  public calculateTotalsByStatus(
    transactions: Transaction[],
    status: 'pending' | 'completed' | 'failed',
    filters?: FilterOptions
  ): TransactionTotals {
    const statusFilters = {
      ...filters,
      includeStatus: [status]
    }
    
    return this.calculateTotals(transactions, statusFilters)
  }

  /**
   * Calculate totals by date range
   */
  public calculateTotalsByDateRange(
    transactions: Transaction[],
    dateFrom: Date,
    dateTo: Date,
    filters?: FilterOptions
  ): TransactionTotals {
    const dateFilters = {
      ...filters,
      dateFrom,
      dateTo
    }
    
    return this.calculateTotals(transactions, dateFilters)
  }

  /**
   * Calculate totals by category
   */
  public calculateTotalsByCategory(
    transactions: Transaction[],
    categories: string[],
    filters?: FilterOptions
  ): TransactionTotals {
    const categoryFilters = {
      ...filters,
      categories
    }
    
    return this.calculateTotals(transactions, categoryFilters)
  }

  /**
   * Calculate monthly totals breakdown
   */
  public calculateMonthlyTotals(
    transactions: Transaction[],
    year: number,
    filters?: FilterOptions
  ): Record<string, TransactionTotals> {
    return measurePerformance(() => {
      const monthlyTotals: Record<string, TransactionTotals> = {}

      for (let month = 0; month < 12; month++) {
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
        const dateFrom = new Date(year, month, 1)
        const dateTo = new Date(year, month + 1, 0, 23, 59, 59)

        monthlyTotals[monthKey] = this.calculateTotalsByDateRange(
          transactions,
          dateFrom,
          dateTo,
          filters
        )
      }

      return monthlyTotals
    }, 'calculateMonthlyTotals')
  }

  /**
   * Get the effective amount for calculation (converted amount if available)
   */
  private getEffectiveAmount(transaction: Transaction): number {
    // Prioritize converted amount for accurate totals in default currency
    if (transaction.equivalent_amount_default_currency !== undefined && 
        transaction.equivalent_amount_default_currency !== null) {
      return Math.abs(transaction.equivalent_amount_default_currency)
    }
    
    // Fallback to original amount
    return Math.abs(transaction.amount)
  }

  /**
   * Apply filters to transaction list
   */
  private applyFilters(
    transactions: Transaction[],
    filters?: FilterOptions
  ): Transaction[] {
    if (!filters) return transactions

    return transactions.filter(transaction => {
      // Status filter
      if (filters.includeStatus && 
          !filters.includeStatus.includes(transaction.status)) {
        return false
      }

      // Type filter
      if (filters.includeTypes && 
          !filters.includeTypes.includes(transaction.transaction_type)) {
        return false
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const transactionDate = new Date(transaction.date)
        
        if (filters.dateFrom && transactionDate < filters.dateFrom) {
          return false
        }
        
        if (filters.dateTo && transactionDate > filters.dateTo) {
          return false
        }
      }

      // Category filter
      if (filters.categories && filters.categories.length > 0) {
        if (!transaction.category || 
            !filters.categories.includes(transaction.category)) {
          return false
        }
      }

      // Loft filter
      if (filters.loftIds && filters.loftIds.length > 0) {
        if (!transaction.loft_id || 
            !filters.loftIds.includes(transaction.loft_id)) {
          return false
        }
      }

      // Currency filter
      if (filters.currencyIds && filters.currencyIds.length > 0) {
        if (!transaction.currency_id || 
            !filters.currencyIds.includes(transaction.currency_id)) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Validate transaction data for calculations
   */
  public validateTransactionData(transactions: Transaction[]): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    transactions.forEach((transaction, index) => {
      // Check required fields
      if (!transaction.id) {
        errors.push(`Transaction at index ${index} missing ID`)
      }

      if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
        errors.push(`Transaction ${transaction.id} has invalid amount`)
      }

      if (!['income', 'expense'].includes(transaction.transaction_type)) {
        errors.push(`Transaction ${transaction.id} has invalid type`)
      }

      if (!['pending', 'completed', 'failed'].includes(transaction.status)) {
        errors.push(`Transaction ${transaction.id} has invalid status`)
      }

      // Check for potential issues
      if (transaction.amount < 0) {
        warnings.push(`Transaction ${transaction.id} has negative amount`)
      }

      if (transaction.equivalent_amount_default_currency !== undefined &&
          transaction.equivalent_amount_default_currency < 0) {
        warnings.push(`Transaction ${transaction.id} has negative converted amount`)
      }

      if (!transaction.date) {
        warnings.push(`Transaction ${transaction.id} missing date`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Format totals for display
   */
  public formatTotals(
    totals: TransactionTotals,
    currencySymbol: string = 'DA',
    locale: string = 'fr-FR'
  ): {
    totalIncome: string
    totalExpenses: string
    netTotal: string
    transactionCount: string
  } {
    const formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })

    return {
      totalIncome: `${formatter.format(totals.totalIncome)} ${currencySymbol}`,
      totalExpenses: `${formatter.format(totals.totalExpenses)} ${currencySymbol}`,
      netTotal: `${formatter.format(totals.netTotal)} ${currencySymbol}`,
      transactionCount: totals.transactionCount.toString()
    }
  }
}

// Export singleton instance
export const transactionTotalsService = TransactionTotalsService.getInstance()