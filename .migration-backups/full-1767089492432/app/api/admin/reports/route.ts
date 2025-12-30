import { NextRequest, NextResponse } from 'next/server'
import { requireRoleAPI } from '@/lib/auth'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const session = await requireRoleAPI(['admin', 'manager', 'executive'])
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'financial'
    const period = searchParams.get('period') || 'monthly'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let dateFilter = ''
    if (startDate && endDate) {
      dateFilter = `AND created_at BETWEEN '${startDate}' AND '${endDate}'`
    }

    switch (reportType) {
      case 'financial':
        return await generateFinancialReport(supabase, period, dateFilter)
      
      case 'users':
        return await generateUserActivityReport(supabase, period, dateFilter)
      
      case 'analytics':
        return await generatePlatformAnalytics(supabase, period, dateFilter)
      
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateFinancialReport(supabase: any, period: string, dateFilter: string) {
  try {
    // Get booking statistics
    const { data: bookingStats, error: bookingError } = await supabase
      .rpc('get_booking_financial_stats', { 
        period_type: period,
        start_date: dateFilter ? dateFilter.split("'")[1] : null,
        end_date: dateFilter ? dateFilter.split("'")[3] : null
      })

    if (bookingError) {
      console.error('Error fetching booking stats:', bookingError)
    }

    // Get transaction data
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select(`
        amount,
        type,
        created_at,
        lofts (
          id,
          name
        )
      `)
      .gte('created_at', dateFilter ? dateFilter.split("'")[1] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .lte('created_at', dateFilter ? dateFilter.split("'")[3] : new Date().toISOString())

    if (transactionError) {
      console.error('Error fetching transactions:', transactionError)
    }

    // Calculate financial metrics
    const totalRevenue = transactions?.reduce((sum, t) => t.type === 'booking' ? sum + t.amount : sum, 0) || 0
    const totalRefunds = Math.abs(transactions?.reduce((sum, t) => t.type === 'refund' ? sum + t.amount : sum, 0) || 0)
    const platformFees = totalRevenue * 0.15 // Assuming 15% platform fee
    const partnerEarnings = totalRevenue - platformFees

    // Get dispute count
    const { count: disputeCount } = await supabase
      .from('booking_disputes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateFilter ? dateFilter.split("'")[1] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Calculate growth rate (mock calculation)
    const growthRate = Math.random() * 20 - 5 // Random between -5% and 15%

    const report = {
      period: `${period} report`,
      totalRevenue,
      totalBookings: bookingStats?.total_bookings || 0,
      averageBookingValue: bookingStats?.average_booking_value || 0,
      partnerEarnings,
      platformFees,
      refunds: totalRefunds,
      disputes: disputeCount || 0,
      growthRate,
      bookingTrends: await getBookingTrends(supabase, period, dateFilter)
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating financial report:', error)
    return NextResponse.json({ error: 'Failed to generate financial report' }, { status: 500 })
  }
}

async function generateUserActivityReport(supabase: any, period: string, dateFilter: string) {
  try {
    // Get user statistics
    const { data: userStats, error: userError } = await supabase
      .rpc('get_user_management_stats')

    if (userError) {
      console.error('Error fetching user stats:', userError)
    }

    // Get new users in period
    const { count: newUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', dateFilter ? dateFilter.split("'")[1] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Get users who made bookings in period
    const { count: bookingUsers } = await supabase
      .from('bookings')
      .select('client_id', { count: 'exact', head: true })
      .gte('created_at', dateFilter ? dateFilter.split("'")[1] : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Calculate retention rate (mock calculation)
    const retentionRate = 75 + Math.random() * 15 // Random between 75% and 90%

    const report = {
      period: `${period} report`,
      newUsers: newUsers || 0,
      activeUsers: userStats?.active_users || 0,
      bookingUsers: bookingUsers || 0,
      retentionRate,
      usersByRole: {
        clients: userStats?.client_users || 0,
        partners: userStats?.partner_users || 0,
        employees: userStats?.employee_users || 0
      },
      userGrowth: await getUserGrowthTrends(supabase, period)
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating user activity report:', error)
    return NextResponse.json({ error: 'Failed to generate user activity report' }, { status: 500 })
  }
}

async function generatePlatformAnalytics(supabase: any, period: string, dateFilter: string) {
  try {
    // Get property statistics
    const { count: totalProperties } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })

    const { count: activeProperties } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get top performing properties
    const { data: topProperties, error: topPropertiesError } = await supabase
      .from('lofts')
      .select(`
        id,
        name,
        bookings (
          id,
          total_price,
          created_at
        )
      `)
      .limit(5)

    if (topPropertiesError) {
      console.error('Error fetching top properties:', topPropertiesError)
    }

    // Process top properties data
    const topPerformingProperties = topProperties?.map(loft => {
      const bookings = loft.bookings || []
      const revenue = bookings.reduce((sum: number, booking: any) => sum + (booking.total_price || 0), 0)
      return {
        id: loft.id,
        name: loft.name,
        bookings: bookings.length,
        revenue,
        rating: 4.5 + Math.random() * 0.5 // Mock rating between 4.5 and 5.0
      }
    }).sort((a, b) => b.revenue - a.revenue) || []

    // Calculate average occupancy (mock calculation)
    const averageOccupancy = 65 + Math.random() * 20 // Random between 65% and 85%

    const report = {
      totalProperties: totalProperties || 0,
      activeProperties: activeProperties || 0,
      averageOccupancy,
      topPerformingProperties,
      bookingTrends: await getBookingTrends(supabase, period, dateFilter),
      userGrowth: await getUserGrowthTrends(supabase, period)
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating platform analytics:', error)
    return NextResponse.json({ error: 'Failed to generate platform analytics' }, { status: 500 })
  }
}

async function getBookingTrends(supabase: any, period: string, dateFilter: string) {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('created_at, total_price')
      .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 6 months
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching booking trends:', error)
      return []
    }

    // Group by month
    const monthlyData: { [key: string]: { bookings: number, revenue: number } } = {}
    
    bookings?.forEach(booking => {
      const month = new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short' })
      if (!monthlyData[month]) {
        monthlyData[month] = { bookings: 0, revenue: 0 }
      }
      monthlyData[month].bookings += 1
      monthlyData[month].revenue += booking.total_price || 0
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      bookings: data.bookings,
      revenue: data.revenue
    }))
  } catch (error) {
    console.error('Error calculating booking trends:', error)
    return []
  }
}

async function getUserGrowthTrends(supabase: any, period: string) {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('created_at, role')
      .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 6 months
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching user growth trends:', error)
      return []
    }

    // Group by month
    const monthlyData: { [key: string]: { clients: number, partners: number } } = {}
    
    users?.forEach(user => {
      const month = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short' })
      if (!monthlyData[month]) {
        monthlyData[month] = { clients: 0, partners: 0 }
      }
      if (user.role === 'client') {
        monthlyData[month].clients += 1
      } else if (user.role === 'partner') {
        monthlyData[month].partners += 1
      }
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      clients: data.clients,
      partners: data.partners
    }))
  } catch (error) {
    console.error('Error calculating user growth trends:', error)
    return []
  }
}