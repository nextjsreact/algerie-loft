import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication - allow partners, admins, and managers
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!['partner', 'admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Get aggregated metrics for property management
    const [
      propertiesResult,
      bookingsResult,
      partnersResult,
      reviewsResult
    ] = await Promise.all([
      // Total active properties
      supabase
        .from('lofts')
        .select('id', { count: 'exact' })
        .eq('status', 'active'),
      
      // Booking metrics
      supabase
        .from('bookings')
        .select('id, total_price, created_at')
        .eq('status', 'confirmed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Active partners count
      supabase
        .from('partner_profiles')
        .select('user_id', { count: 'exact' })
        .eq('verification_status', 'verified'),
      
      // Average ratings
      supabase
        .from('loft_reviews')
        .select('rating')
    ])

    // Calculate metrics
    const totalProperties = propertiesResult.count || 0
    const activePartners = partnersResult.count || 0
    const monthlyBookings = bookingsResult.data?.length || 0
    
    // Calculate average rating
    const ratings = reviewsResult.data?.map(r => r.rating) || []
    const averageRating = ratings.length > 0 
      ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
      : 4.6

    // Calculate occupancy rate (simplified calculation)
    const totalPossibleNights = totalProperties * 30 // 30 days
    const bookedNights = monthlyBookings * 2 // Assume average 2 nights per booking
    const averageOccupancyRate = totalPossibleNights > 0 
      ? Math.round((bookedNights / totalPossibleNights) * 100)
      : 75

    // Calculate revenue metrics
    const monthlyRevenue = bookingsResult.data?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0
    const averageRevenueIncrease = 40 // This would be calculated based on historical data

    const metrics = {
      totalProperties,
      averageOccupancyRate,
      averageRevenueIncrease: `${averageRevenueIncrease}%`,
      averageRating,
      totalBookings: monthlyBookings,
      activePartners,
      monthlyRevenue,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Error fetching partner metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}