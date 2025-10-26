import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user and verify admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager', 'executive'].includes(profile.role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get clients count
    const { count: totalClients } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')

    // Get partners count
    const { count: totalPartners } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'partner')

    // Get pending partners count
    const { count: pendingPartners } = await supabase
      .from('partner_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'pending')

    // Get total properties count
    const { count: totalProperties } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })

    // Get active properties count
    const { count: activeProperties } = await supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)

    // Get total bookings count
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    // Get pending bookings count
    const { count: pendingBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get total revenue (sum of all paid bookings)
    const { data: revenueData } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('payment_status', 'paid')

    const totalRevenue = revenueData?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0

    // Get monthly revenue (current month)
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    
    const { data: monthlyRevenueData } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('payment_status', 'paid')
      .gte('created_at', firstDayOfMonth.toISOString())

    const monthlyRevenue = monthlyRevenueData?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0

    // Get disputes count (assuming we have a disputes table)
    const { count: disputesCount } = await supabase
      .from('booking_disputes')
      .select('*', { count: 'exact', head: true })
      .in('status', ['open', 'investigating'])

    // Calculate platform commission (assuming 10% commission rate)
    const platformCommission = totalRevenue * 0.1

    const stats = {
      total_users: totalUsers || 0,
      total_clients: totalClients || 0,
      total_partners: totalPartners || 0,
      pending_partners: pendingPartners || 0,
      total_properties: totalProperties || 0,
      active_properties: activeProperties || 0,
      total_bookings: totalBookings || 0,
      pending_bookings: pendingBookings || 0,
      total_revenue: Math.round(totalRevenue),
      monthly_revenue: Math.round(monthlyRevenue),
      disputes_count: disputesCount || 0,
      platform_commission: Math.round(platformCommission)
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des statistiques' },
      { status: 500 }
    )
  }
}