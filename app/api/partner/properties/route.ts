import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuthAPI()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 10
    const includePerformance = searchParams.get('include_performance') === 'true'
    const page = Number(searchParams.get('page')) || 1
    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase
      .from('lofts')
      .select(`
        id,
        name,
        address,
        price_per_night,
        status,
        created_at,
        updated_at
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by partner if user is a partner
    if (session.user.role === 'partner') {
      // Get partner profile first
      const { data: partnerProfile } = await supabase
        .from('partner_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single()

      if (partnerProfile) {
        query = query.eq('owner_id', session.user.id)
      } else {
        return NextResponse.json({ properties: [] })
      }
    } else if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { data: properties, error } = await query

    if (error) {
      console.error('Error fetching properties:', error)
      return NextResponse.json(
        { error: 'Failed to fetch properties' },
        { status: 500 }
      )
    }

    let processedProperties = properties || []

    // Add performance data if requested
    if (includePerformance && processedProperties.length > 0) {
      processedProperties = await Promise.all(
        processedProperties.map(async (property) => {
          try {
            // Get bookings for this property in the last 30 days
            const { data: bookings } = await supabase
              .from('bookings')
              .select('id, total_price, created_at, status')
              .eq('loft_id', property.id)
              .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

            // Get reviews for this property
            const { data: reviews } = await supabase
              .from('loft_reviews')
              .select('rating')
              .eq('loft_id', property.id)

            // Calculate metrics
            const confirmedBookings = bookings?.filter(b => b.status === 'confirmed') || []
            const monthlyRevenue = confirmedBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0)
            const bookingsThisMonth = confirmedBookings.length
            
            // Calculate occupancy rate (simplified)
            const totalDaysInMonth = 30
            const bookedDays = confirmedBookings.length * 2 // Assume average 2 days per booking
            const occupancyRate = Math.min(Math.round((bookedDays / totalDaysInMonth) * 100), 100)

            // Calculate average rating
            const ratings = reviews?.map(r => r.rating) || []
            const averageRating = ratings.length > 0 
              ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
              : 0

            return {
              ...property,
              occupancyRate,
              monthlyRevenue,
              rating: averageRating,
              bookingsThisMonth,
              lastUpdated: new Date().toISOString()
            }
          } catch (err) {
            console.error(`Error calculating performance for property ${property.id}:`, err)
            return {
              ...property,
              occupancyRate: 0,
              monthlyRevenue: 0,
              rating: 0,
              bookingsThisMonth: 0,
              lastUpdated: new Date().toISOString()
            }
          }
        })
      )
    }

    return NextResponse.json({
      properties: processedProperties,
      pagination: {
        page,
        limit,
        hasMore: processedProperties.length === limit
      }
    })

  } catch (error) {
    console.error('Error in properties API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}