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

    // Get recent activity from audit logs or create mock data
    // In a real implementation, you would have an audit_logs table
    const activities = [
      {
        id: '1',
        type: 'user_registration',
        description: 'Nouvel utilisateur client inscrit',
        user_name: 'Marie Dubois',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        status: 'completed'
      },
      {
        id: '2',
        type: 'partner_verification',
        description: 'Demande de partenariat soumise',
        user_name: 'Jean Martin',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        status: 'pending'
      },
      {
        id: '3',
        type: 'booking_created',
        description: 'Nouvelle réservation confirmée',
        user_name: 'Sophie Laurent',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        status: 'completed'
      },
      {
        id: '4',
        type: 'user_registration',
        description: 'Nouvel utilisateur partenaire inscrit',
        user_name: 'Pierre Durand',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        status: 'completed'
      },
      {
        id: '5',
        type: 'booking_created',
        description: 'Nouvelle réservation en attente',
        user_name: 'Claire Moreau',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        status: 'pending'
      }
    ]

    // In a real implementation, you would query actual data like this:
    /*
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        created_at,
        status,
        profiles!bookings_client_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: recentUsers } = await supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: recentPartners } = await supabase
      .from('partner_profiles')
      .select(`
        id,
        created_at,
        verification_status,
        profiles(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    */

    return NextResponse.json({ activities })

  } catch (error) {
    console.error('Error fetching admin activity:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement de l\'activité' },
      { status: 500 }
    )
  }
}