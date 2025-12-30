import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'


// GET /api/admin/lofts/[id]/financial-summary - Get financial summary for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = params

    // Verify property exists
    const { data: property, error: propertyError } = await supabase
      .from('lofts')
      .select('id, name, partner_id')
      .eq('id', id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Get revenue from completed reservations
    const { data: completedReservations, error: revenueError } = await supabase
      .from('reservations')
      .select('total_amount, currency, status, check_out')
      .eq('loft_id', id)
      .in('status', ['completed', 'checked_out'])

    if (revenueError) {
      console.error('Error fetching revenue data:', revenueError)
    }

    // Get pending payments from confirmed/active reservations
    const { data: pendingReservations, error: pendingError } = await supabase
      .from('reservations')
      .select('total_amount, currency, status, payment_status')
      .eq('loft_id', id)
      .in('status', ['confirmed', 'checked_in', 'pending'])

    if (pendingError) {
      console.error('Error fetching pending payments:', pendingError)
    }

    // Get outstanding bills/transactions
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('amount, type, status, created_at')
      .eq('loft_id', id)
      .eq('status', 'pending')

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError)
    }

    // Calculate financial summary
    const totalRevenue = completedReservations?.reduce((sum, reservation) => {
      return sum + (reservation.total_amount || 0)
    }, 0) || 0

    const pendingPayments = pendingReservations?.reduce((sum, reservation) => {
      // Only count if payment is not completed
      if (reservation.payment_status !== 'completed') {
        return sum + (reservation.total_amount || 0)
      }
      return sum
    }, 0) || 0

    const outstandingBills = transactions?.reduce((sum, transaction) => {
      if (transaction.type === 'expense' && transaction.status === 'pending') {
        return sum + (transaction.amount || 0)
      }
      return sum
    }, 0) || 0

    // Get last transaction date
    const lastTransactionDate = transactions && transactions.length > 0
      ? transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : null

    // Get recent financial activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentActivity, error: activityError } = await supabase
      .from('transactions')
      .select('amount, type, created_at, description')
      .eq('loft_id', id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    if (activityError) {
      console.error('Error fetching recent activity:', activityError)
    }

    // Calculate monthly revenue trend (last 6 months)
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString()
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString()

      const monthRevenue = completedReservations?.filter(r => 
        r.check_out >= monthStart && r.check_out <= monthEnd
      ).reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0

      monthlyRevenue.push({
        month: date.toISOString().slice(0, 7), // YYYY-MM format
        revenue: monthRevenue
      })
    }

    const financialSummary = {
      total_revenue: totalRevenue,
      pending_payments: pendingPayments,
      outstanding_bills: outstandingBills,
      last_transaction_date: lastTransactionDate,
      recent_activity: recentActivity || [],
      monthly_revenue: monthlyRevenue,
      summary: {
        has_financial_obligations: pendingPayments > 0 || outstandingBills > 0,
        net_position: totalRevenue - outstandingBills,
        risk_level: pendingPayments > 10000 || outstandingBills > 5000 ? 'high' : 
                   pendingPayments > 5000 || outstandingBills > 2000 ? 'medium' : 'low'
      }
    }

    return NextResponse.json({
      success: true,
      property: {
        id: property.id,
        name: property.name,
        partner_id: property.partner_id
      },
      financial: financialSummary
    })

  } catch (error) {
    console.error('Property financial summary API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}