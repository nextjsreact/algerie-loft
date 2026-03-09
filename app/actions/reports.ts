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
    // Get revenue (income transactions)
    const { data: revenueData } = await supabase
      .from("transactions")
      .select("equivalent_amount_default_currency")
      .eq("loft_id", loft.id)
      .eq("type", "income")

    // Get expenses (expense transactions)
    const { data: expensesData } = await supabase
      .from("transactions")
      .select("equivalent_amount_default_currency")
      .eq("loft_id", loft.id)
      .eq("type", "expense")

    const revenue = revenueData?.reduce((sum, t) => sum + (t.equivalent_amount_default_currency || 0), 0) || 0
    const expenses = expensesData?.reduce((sum, t) => sum + (t.equivalent_amount_default_currency || 0), 0) || 0

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
    
    // Get revenue for this month
    const { data: revenueData } = await supabase
      .from("transactions")
      .select("equivalent_amount_default_currency")
      .eq("type", "income")
      .gte("date", date.toISOString())
      .lt("date", nextDate.toISOString())

    // Get expenses for this month
    const { data: expensesData } = await supabase
      .from("transactions")
      .select("equivalent_amount_default_currency")
      .eq("type", "expense")
      .gte("date", date.toISOString())
      .lt("date", nextDate.toISOString())

    const revenue = revenueData?.reduce((sum, t) => sum + (t.equivalent_amount_default_currency || 0), 0) || 0
    const expenses = expensesData?.reduce((sum, t) => sum + (t.equivalent_amount_default_currency || 0), 0) || 0

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
