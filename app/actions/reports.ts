"use server"

import { createClient } from '@/utils/supabase/server'
import { requireRole } from "@/lib/auth"

interface LoftRevenue {
  name: string
  revenue: number
  expenses: number
  net_profit: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
  expenses: number
}

export async function getReportsData() {
  // Require admin, manager, or executive role
  await requireRole(["admin", "manager", "executive"])
  
  const supabase = await createClient()

  // Get loft revenue data
  const { data: lofts, error: loftsError } = await supabase
    .from("lofts")
    .select("id, name")
    .order("name")

  if (loftsError) {
    console.error("Error fetching lofts:", loftsError)
    throw loftsError
  }

  // Calculate revenue and expenses per loft
  const loftRevenuePromises = (lofts || []).map(async (loft) => {
    // Get revenue (income transactions) with currency info
    const { data: revenueData } = await supabase
      .from("transactions")
      .select("amount, equivalent_amount_default_currency, ratio_at_transaction, currency_id")
      .eq("loft_id", loft.id)
      .eq("transaction_type", "income")

    // Get expenses (expense transactions) with currency info
    const { data: expensesData } = await supabase
      .from("transactions")
      .select("amount, equivalent_amount_default_currency, ratio_at_transaction, currency_id")
      .eq("loft_id", loft.id)
      .eq("transaction_type", "expense")

    // Calculate revenue with fallback conversion
    const revenue = revenueData?.reduce((sum, t) => {
      // Use equivalent_amount_default_currency if available, otherwise calculate from amount and ratio
      const convertedAmount = t.equivalent_amount_default_currency || 
                             (t.ratio_at_transaction ? t.amount * t.ratio_at_transaction : t.amount)
      return sum + (convertedAmount || 0)
    }, 0) || 0

    // Calculate expenses with fallback conversion
    const expenses = expensesData?.reduce((sum, t) => {
      // Use equivalent_amount_default_currency if available, otherwise calculate from amount and ratio
      const convertedAmount = t.equivalent_amount_default_currency || 
                             (t.ratio_at_transaction ? t.amount * t.ratio_at_transaction : t.amount)
      return sum + (convertedAmount || 0)
    }, 0) || 0

    return {
      name: loft.name,
      revenue: Math.round(revenue),
      expenses: Math.round(expenses),
      net_profit: Math.round(revenue - expenses)
    }
  })

  const loftRevenue: LoftRevenue[] = await Promise.all(loftRevenuePromises)

  // Get monthly revenue data for the last 12 months
  const monthlyRevenueData: MonthlyRevenue[] = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short' })
    
    // Get revenue for this month with currency info
    const { data: revenueData } = await supabase
      .from("transactions")
      .select("amount, equivalent_amount_default_currency, ratio_at_transaction, currency_id")
      .eq("transaction_type", "income")
      .gte("date", date.toISOString())
      .lt("date", nextDate.toISOString())

    // Get expenses for this month with currency info
    const { data: expensesData } = await supabase
      .from("transactions")
      .select("amount, equivalent_amount_default_currency, ratio_at_transaction, currency_id")
      .eq("transaction_type", "expense")
      .gte("date", date.toISOString())
      .lt("date", nextDate.toISOString())

    // Calculate revenue with fallback conversion
    const revenue = revenueData?.reduce((sum, t) => {
      // Use equivalent_amount_default_currency if available
      if (t.equivalent_amount_default_currency) {
        return sum + t.equivalent_amount_default_currency
      }
      // If ratio exists, divide amount by ratio to get default currency amount
      // (ratio is typically: 1 default currency = X foreign currency)
      if (t.ratio_at_transaction && t.ratio_at_transaction !== 0) {
        return sum + (t.amount / t.ratio_at_transaction)
      }
      // Fallback to original amount
      return sum + (t.amount || 0)
    }, 0) || 0

    // Calculate expenses with fallback conversion
    const expenses = expensesData?.reduce((sum, t) => {
      // Use equivalent_amount_default_currency if available
      if (t.equivalent_amount_default_currency) {
        return sum + t.equivalent_amount_default_currency
      }
      // If ratio exists, divide amount by ratio to get default currency amount
      if (t.ratio_at_transaction && t.ratio_at_transaction !== 0) {
        return sum + (t.amount / t.ratio_at_transaction)
      }
      // Fallback to original amount
      return sum + (t.amount || 0)
    }, 0) || 0

    monthlyRevenueData.push({
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      revenue: Math.round(revenue),
      expenses: Math.round(expenses)
    })
  }

  return {
    loftRevenue: loftRevenue.filter(l => l.revenue > 0 || l.expenses > 0), // Only show lofts with activity
    monthlyRevenue: monthlyRevenueData
  }
}
