import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and partner role
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Allow partners, admins, and clients to access (multi-role support)
    const allowedRoles = ['partner', 'admin', 'client'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Access denied - partner, admin, or client role required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const months = Number(searchParams.get('months')) || 6

    const supabase = await createClient()
    const partnerId = session.user.id

    // Get partner's lofts
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id')
      .eq('owner_id', partnerId)

    if (loftsError) {
      console.error('Error fetching partner lofts:', loftsError)
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      )
    }

    const loftIds = lofts?.map(loft => loft.id) || []

    if (loftIds.length === 0) {
      return NextResponse.json({
        success: true,
        earnings: []
      })
    }

    // Get earnings data for the last N months
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('total_price, payment_status, created_at')
      .in('loft_id', loftIds)
      .eq('payment_status', 'paid')
      .gte('created_at', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (bookingsError) {
      console.error('Error fetching earnings data:', bookingsError)
      return NextResponse.json(
        { error: 'Failed to fetch earnings data' },
        { status: 500 }
      )
    }

    // Group earnings by month
    const earningsByMonth: { [key: string]: { earnings: number; bookings: number } } = {}
    
    bookings?.forEach(booking => {
      const date = new Date(booking.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!earningsByMonth[monthKey]) {
        earningsByMonth[monthKey] = { earnings: 0, bookings: 0 }
      }
      
      earningsByMonth[monthKey].earnings += booking.total_price || 0
      earningsByMonth[monthKey].bookings += 1
    })

    // Convert to array format for charts
    const earnings = Object.entries(earningsByMonth)
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-')
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        return {
          month: monthNames[parseInt(month) - 1],
          earnings: data.earnings,
          bookings: data.bookings
        }
      })
      .slice(-months) // Get last N months

    return NextResponse.json({
      success: true,
      earnings
    })

  } catch (error) {
    console.error('Partner earnings API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}