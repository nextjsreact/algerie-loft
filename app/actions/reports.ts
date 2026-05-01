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

/**
 * Calculates the prorated amount of a reservation for a given month.
 * Example: reservation 28 mars → 05 avril (8 nights), total 8000 DA
 *   → mars: 3/8 × 8000 = 3000 DA
 *   → avril: 5/8 × 8000 = 5000 DA
 */
function prorateReservation(
  checkIn: Date,
  checkOut: Date,
  totalAmount: number,
  monthStart: Date,
  monthEnd: Date
): number {
  // Total nights = checkout - checkin (checkout day not counted)
  const totalNights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000)
  if (totalNights <= 0) return 0

  // Nights within this month
  const overlapStart = checkIn < monthStart ? monthStart : checkIn
  const overlapEnd = checkOut > monthEnd ? monthEnd : checkOut
  const nightsInMonth = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000)

  if (nightsInMonth <= 0) return 0
  return Math.round((nightsInMonth / totalNights) * totalAmount)
}

export async function getReportsData() {
  await requireRole(["admin", "manager", "executive"])
  
  const supabase = await createClient(true) // service role to bypass RLS

  // Get loft revenue data from transactions (all time)
  const { data: lofts, error: loftsError } = await supabase
    .from("lofts")
    .select("id, name")
    .order("name")

  if (loftsError) {
    console.error("Error fetching lofts:", loftsError)
    throw loftsError
  }

  const loftRevenuePromises = (lofts || []).map(async (loft) => {
    const { data: revenueData } = await supabase
      .from("transactions")
      .select("equivalent_amount_default_currency")
      .eq("loft_id", loft.id)
      .eq("transaction_type", "income")

    const { data: expensesData } = await supabase
      .from("transactions")
      .select("equivalent_amount_default_currency")
      .eq("loft_id", loft.id)
      .eq("transaction_type", "expense")

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

  // Monthly revenue: prorated from reservations + manual income transactions + expenses from transactions
  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth()

  const twelveMonthsAgo = new Date(Date.UTC(currentYear, currentMonth - 11, 1))
  const nextMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 1))

  // Fetch all reservations that overlap with the last 12 months
  const { data: reservations } = await supabase
    .from("reservations")
    .select("check_in_date, check_out_date, total_amount, status")
    .in("status", ["confirmed", "completed"])
    .gte("check_out_date", twelveMonthsAgo.toISOString().split('T')[0])
    .lt("check_in_date", nextMonth.toISOString().split('T')[0])

  // Fetch all income transactions for the last 12 months (manual income hors réservations)
  const { data: incomeTransactions } = await supabase
    .from("transactions")
    .select("equivalent_amount_default_currency, date")
    .eq("transaction_type", "income")
    .gte("date", twelveMonthsAgo.toISOString())
    .lt("date", nextMonth.toISOString())

  // Fetch all expense transactions for the last 12 months
  const { data: expenseTransactions } = await supabase
    .from("transactions")
    .select("equivalent_amount_default_currency, date")
    .eq("transaction_type", "expense")
    .gte("date", twelveMonthsAgo.toISOString())
    .lt("date", nextMonth.toISOString())

  const monthlyRevenueData: MonthlyRevenue[] = []

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(Date.UTC(currentYear, currentMonth - i, 1))
    const monthEnd = new Date(Date.UTC(currentYear, currentMonth - i + 1, 1))
    const monthName = monthStart.toLocaleDateString('fr-FR', { month: 'short' })

    // Prorated revenue from reservations
    const revenue = (reservations || []).reduce((sum, r) => {
      const checkIn = new Date(r.check_in_date)
      const checkOut = new Date(r.check_out_date)
      return sum + prorateReservation(checkIn, checkOut, r.total_amount || 0, monthStart, monthEnd)
    }, 0)

    // Manual income transactions for this month
    const incomeFromTx = (incomeTransactions || [])
      .filter(t => {
        const d = new Date(t.date)
        return d >= monthStart && d < monthEnd
      })
      .reduce((sum, t) => sum + (t.equivalent_amount_default_currency || 0), 0)

    // Expenses from transactions (by transaction date)
    const expenses = (expenseTransactions || [])
      .filter(t => {
        const d = new Date(t.date)
        return d >= monthStart && d < monthEnd
      })
      .reduce((sum, t) => sum + (t.equivalent_amount_default_currency || 0), 0)

    monthlyRevenueData.push({
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      revenue: Math.round(revenue + incomeFromTx),
      expenses: Math.round(expenses)
    })
  }

  return {
    loftRevenue: loftRevenue.filter(l => l.revenue > 0 || l.expenses > 0),
    monthlyRevenue: monthlyRevenueData
  }
}
