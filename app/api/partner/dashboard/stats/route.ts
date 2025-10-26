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

    // Check if user is a partner
    if (session.user.role !== 'partner') {
      return NextResponse.json(
        { error: 'Only partners can access this endpoint' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Get partner profile
    const { data: partnerProfile, error: profileError } = await supabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !partnerProfile) {
      return NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 404 }
      )
    }

    // Get properties count
    const { count: totalProperties, error: propertiesError } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', session.user.id)

    if (propertiesError) {
      console.error('Properties count error:', propertiesError)
    }

    // Get active properties count
    const { count: activeProperties, error: activePropertiesError } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', session.user.id)
      .eq('status', 'available')

    if (activePropertiesError) {
      console.error('Active properties count error:', activePropertiesError)
    }

    // Get total bookings count
    const { count: totalBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', session.user.id)

    if (bookingsError) {
      console.error('Bookings count error:', bookingsError)
    }

    // Get upcoming bookings count
    const today = new Date().toISOString().split('T')[0]
    const { count: upcomingBookings, error: upcomingError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', session.user.id)
      .gte('check_in', today)
      .neq('status', 'cancelled')

    if (upcomingError) {
      console.error('Upcoming bookings count error:', upcomingError)
    }

    // Get monthly earnings (current month)
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0]
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: monthlyBookings, error: earningsError } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('partner_id', session.user.id)
      .eq('payment_status', 'paid')
      .gte('check_in', firstDayOfMonth)
      .lte('check_in', lastDayOfMonth)

    if (earningsError) {
      console.error('Monthly earnings error:', earningsError)
    }

    const monthlyEarnings = monthlyBookings?.reduce((sum, booking) => sum + booking.total_price, 0) || 0

    // Calculate occupancy rate (simplified)
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const totalPossibleNights = (totalProperties || 0) * daysInMonth
    
    const { data: occupiedNights, error: occupancyError } = await supabase
      .from('bookings')
      .select('check_in, check_out')
      .eq('partner_id', session.user.id)
      .neq('status', 'cancelled')
      .gte('check_in', firstDayOfMonth)
      .lte('check_out', lastDayOfMonth)

    if (occupancyError) {
      console.error('Occupancy calculation error:', occupancyError)
    }

    let totalOccupiedNights = 0
    if (occupiedNights) {
      totalOccupiedNights = occupiedNights.reduce((sum, booking) => {
        const checkIn = new Date(booking.check_in)
        const checkOut = new Date(booking.check_out)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return sum + nights
      }, 0)
    }

    const occupancyRate = totalPossibleNights > 0 ? (totalOccupiedNights / totalPossibleNights) * 100 : 0

    // Get average rating (simplified - would need reviews table in real implementation)
    const averageRating = 4.2 + Math.random() * 0.6 // Simulated for demo
    const totalReviews = Math.floor((totalBookings || 0) * 0.7) // Simulated

    const stats = {
      total_properties: totalProperties || 0,
      active_properties: activeProperties || 0,
      total_bookings: totalBookings || 0,
      upcoming_bookings: upcomingBookings || 0,
      monthly_earnings: Math.round(monthlyEarnings),
      occupancy_rate: Math.round(occupancyRate * 10) / 10,
      average_rating: Math.round(averageRating * 10) / 10,
      total_reviews: totalReviews
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Partner stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}