import { createClient } from '@/utils/supabase/server'
import { logger, measurePerformance } from '@/lib/logger'

export interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  occupancyRate: number
  averageRentPerLoft: number
  monthlyGrowth: number
}

export interface LatePayment {
  id: string
  loft_name: string
  tenant_name: string
  amount: number
  due_date: string
  days_overdue: number
  late_fee: number
}

export interface RecurringPayment {
  id: string
  loft_id: string
  amount: number
  frequency: 'monthly' | 'quarterly' | 'yearly'
  next_due_date: string
  status: 'active' | 'paused' | 'cancelled'
}

export async function getFinancialSummary(period: 'month' | 'quarter' | 'year' = 'month'): Promise<FinancialSummary> {
  return measurePerformance(async () => {
    logger.info('Fetching financial summary', { period })
    const supabase = await createClient()

    try {
      // Calculate date range based on period
      const now = new Date()
      const startDate = new Date()
      
      switch (period) {
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }

      const [
        { data: revenueData, error: revenueError },
        { data: expenseData, error: expenseError },
        { data: loftsData, error: loftsError },
        { data: previousRevenueData, error: previousRevenueError }
      ] = await Promise.all([
        supabase
          .from('transactions')
          .select('amount')
          .eq('transaction_type', 'income')
          .eq('status', 'completed')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('transactions')
          .select('amount')
          .eq('transaction_type', 'expense')
          .eq('status', 'completed')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('lofts')
          .select('status, price_per_month'),
        supabase
          .from('transactions')
          .select('amount')
          .eq('transaction_type', 'income')
          .eq('status', 'completed')
          .lt('created_at', startDate.toISOString())
          .gte('created_at', new Date(startDate.getTime() - (now.getTime() - startDate.getTime())).toISOString())
      ])

      if (revenueError || expenseError || loftsError) {
        logger.error('Error fetching financial data', { revenueError, expenseError, loftsError })
        throw new Error('Failed to fetch financial data')
      }

      const totalRevenue = (revenueData || []).reduce((sum, t) => sum + t.amount, 0)
      const totalExpenses = (expenseData || []).reduce((sum, t) => sum + t.amount, 0)
      const previousRevenue = (previousRevenueData || []).reduce((sum, t) => sum + t.amount, 0)
      
      const totalLofts = loftsData?.length || 0
      const occupiedLofts = (loftsData || []).filter(l => l.status === 'occupied').length
      const occupancyRate = totalLofts > 0 ? (occupiedLofts / totalLofts) * 100 : 0
      
      const averageRentPerLoft = totalLofts > 0 
        ? (loftsData || []).reduce((sum, l) => sum + (l.price_per_month || 0), 0) / totalLofts 
        : 0

      const monthlyGrowth = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0

      const summary: FinancialSummary = {
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        occupancyRate,
        averageRentPerLoft,
        monthlyGrowth
      }

      logger.info('Financial summary calculated', { summary, period })
      return summary

    } catch (error) {
      logger.error('Financial summary calculation failed', error)
      throw error
    }
  }, 'getFinancialSummary')
}

export async function getLatePayments(): Promise<LatePayment[]> {
  return measurePerformance(async () => {
    logger.info('Fetching late payments')
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          due_date,
          loft:lofts(name),
          tenant_name
        `)
        .eq('status', 'pending')
        .eq('transaction_type', 'income')
        .lt('due_date', new Date().toISOString())

      if (error) {
        logger.error('Error fetching late payments', error)
        throw error
      }

      const latePayments: LatePayment[] = (data || []).map(payment => {
        const dueDate = new Date(payment.due_date)
        const now = new Date()
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // Calculate late fee (example: 5% after 7 days, 10% after 30 days)
        let lateFeeRate = 0
        if (daysOverdue > 30) lateFeeRate = 0.10
        else if (daysOverdue > 7) lateFeeRate = 0.05
        
        const lateFee = payment.amount * lateFeeRate

        return {
          id: payment.id,
          loft_name: payment.loft?.[0]?.name || 'Unknown',
          tenant_name: payment.tenant_name || 'Unknown',
          amount: payment.amount,
          due_date: payment.due_date,
          days_overdue: daysOverdue,
          late_fee: lateFee
        }
      })

      logger.info('Late payments fetched', { count: latePayments.length })
      return latePayments

    } catch (error) {
      logger.error('Failed to fetch late payments', error)
      throw error
    }
  }, 'getLatePayments')
}

export async function calculateLateFees(paymentId: string): Promise<number> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, due_date')
      .eq('id', paymentId)
      .single()

    if (error || !data) {
      throw new Error('Payment not found')
    }

    const dueDate = new Date(data.due_date)
    const now = new Date()
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysOverdue <= 0) return 0

    // Progressive late fee structure
    let lateFeeRate = 0
    if (daysOverdue > 30) lateFeeRate = 0.10
    else if (daysOverdue > 14) lateFeeRate = 0.07
    else if (daysOverdue > 7) lateFeeRate = 0.05
    else lateFeeRate = 0.02

    return data.amount * lateFeeRate

  } catch (error) {
    logger.error('Failed to calculate late fees', error, { paymentId })
    throw error
  }
}

export async function generateRecurringPayments(): Promise<void> {
  return measurePerformance(async () => {
    logger.info('Generating recurring payments')
    const supabase = await createClient()

    try {
      // Get all active lofts with monthly rent
      const { data: lofts, error: loftsError } = await supabase
        .from('lofts')
        .select('id, name, price_per_month, status')
        .eq('status', 'occupied')

      if (loftsError) {
        throw loftsError
      }

      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

      const recurringPayments = (lofts || []).map(loft => ({
        loft_id: loft.id,
        amount: loft.price_per_month,
        transaction_type: 'income',
        status: 'pending',
        due_date: nextMonth.toISOString(),
        description: `Monthly rent for ${loft.name}`,
        created_at: now.toISOString()
      }))

      if (recurringPayments.length > 0) {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(recurringPayments)

        if (insertError) {
          throw insertError
        }

        logger.info('Recurring payments generated', { count: recurringPayments.length })
      }

    } catch (error) {
      logger.error('Failed to generate recurring payments', error)
      throw error
    }
  }, 'generateRecurringPayments')
}