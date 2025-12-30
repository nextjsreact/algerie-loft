import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { requireAuthAPI } from '@/lib/auth'
import { PartnerDataIsolation } from '@/lib/security/partner-data-isolation'

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

    const supabase = await createClient()

    // Get partner profile - check partner_profiles table for multi-role support
    const { data: partnerProfile, error: profileError } = await supabase
      .from('partner_profiles')
      .select('id, verification_status')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !partnerProfile) {
      return NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 403 }
      )
    }

    if (partnerProfile.verification_status !== 'verified') {
      return NextResponse.json(
        { error: 'Partner account not verified' },
        { status: 403 }
      )
    }

    const partnerId = partnerProfile.id

    // Get properties count with data isolation
    const propertiesResult = await PartnerDataIsolation.getPartnerProperties(
      partnerId,
      {},
      supabase
    )

    if (!propertiesResult.success) {
      return NextResponse.json(
        { error: propertiesResult.error || 'Failed to fetch properties' },
        { status: 500 }
      )
    }

    const properties = propertiesResult.data || []
    const totalProperties = properties.length
    const activeProperties = properties.filter(p => p.status === 'available').length

    // Get reservations with data isolation
    const reservationsResult = await PartnerDataIsolation.getPartnerReservations(
      partnerId,
      {},
      supabase
    )

    if (!reservationsResult.success) {
      return NextResponse.json(
        { error: reservationsResult.error || 'Failed to fetch reservations' },
        { status: 500 }
      )
    }

    const reservations = reservationsResult.data || []
    const totalBookings = reservations.length

    // Get upcoming bookings count
    const today = new Date().toISOString().split('T')[0]
    const upcomingBookings = reservations.filter(
      r => r.check_in >= today && r.status !== 'cancelled'
    ).length

    // Get monthly earnings (current month)
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split('T')[0]
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0]

    const monthlyReservationsResult = await PartnerDataIsolation.getPartnerReservations(
      partnerId,
      {
        startDate: firstDayOfMonth,
        endDate: lastDayOfMonth
      },
      supabase
    )

    const monthlyReservations = monthlyReservationsResult.data || []
    const monthlyEarnings = monthlyReservations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => sum + (r.total_price || 0), 0)

    // Calculate occupancy rate (simplified)
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const totalPossibleNights = (totalProperties || 0) * daysInMonth
    
    const totalOccupiedNights = monthlyReservations
      .filter(r => r.status !== 'cancelled')
      .reduce((sum, r) => {
        const checkIn = new Date(r.check_in)
        const checkOut = new Date(r.check_out)
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return sum + nights
      }, 0)

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