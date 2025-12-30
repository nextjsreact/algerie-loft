import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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

    // Get system statistics
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed'])

    // Calculate platform revenue (sum of commission from paid bookings)
    const { data: revenueData } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('payment_status', 'paid')

    const totalRevenue = revenueData?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0
    const platformRevenue = Math.round(totalRevenue * 0.1) // Assuming 10% commission

    // Mock data for system metrics that would come from monitoring systems
    const mockStats = {
      total_users: totalUsers || 0,
      active_bookings: activeBookings || 0,
      platform_revenue: platformRevenue,
      storage_usage_gb: Math.round(Math.random() * 100 + 50), // Mock: 50-150 GB
      api_calls_today: Math.round(Math.random() * 10000 + 5000), // Mock: 5000-15000 calls
      error_rate_percent: Math.round((Math.random() * 3 + 0.5) * 100) / 100 // Mock: 0.5-3.5%
    }

    return NextResponse.json({ stats: mockStats })

  } catch (error) {
    console.error('Error fetching system stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des statistiques système' },
      { status: 500 }
    )
  }
}