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

    // For now, return mock data since we haven't created the disputes table yet
    // In a real implementation, you would query the booking_disputes table
    const mockDisputes = [
      {
        id: '1',
        booking_id: 'booking-1',
        reporter_id: 'user-1',
        reported_id: 'user-2',
        type: 'property',
        status: 'open',
        priority: 'high',
        title: 'Propriété non conforme à la description',
        description: 'Le loft ne correspond pas aux photos et à la description. Plusieurs équipements annoncés sont manquants.',
        resolution: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        booking: {
          id: 'booking-1',
          loft_name: 'Loft Moderne Centre-Ville',
          check_in: '2024-01-15',
          check_out: '2024-01-20',
          total_price: 450
        },
        reporter: {
          full_name: 'Marie Dubois',
          email: 'marie.dubois@email.com',
          role: 'client'
        },
        reported: {
          full_name: 'Jean Martin',
          email: 'jean.martin@email.com',
          role: 'partner'
        }
      },
      {
        id: '2',
        booking_id: 'booking-2',
        reporter_id: 'user-3',
        reported_id: 'user-4',
        type: 'payment',
        status: 'investigating',
        priority: 'urgent',
        title: 'Problème de remboursement',
        description: 'Le remboursement promis suite à l\'annulation n\'a pas été effectué après 10 jours.',
        resolution: null,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        booking: {
          id: 'booking-2',
          loft_name: 'Studio Cosy Montmartre',
          check_in: '2024-01-10',
          check_out: '2024-01-12',
          total_price: 180
        },
        reporter: {
          full_name: 'Sophie Laurent',
          email: 'sophie.laurent@email.com',
          role: 'client'
        },
        reported: {
          full_name: 'Pierre Durand',
          email: 'pierre.durand@email.com',
          role: 'partner'
        }
      },
      {
        id: '3',
        booking_id: 'booking-3',
        reporter_id: 'user-5',
        reported_id: 'user-6',
        type: 'behavior',
        status: 'resolved',
        priority: 'medium',
        title: 'Comportement inapproprié du client',
        description: 'Le client a causé des dégâts dans l\'appartement et a été irrespectueux.',
        resolution: 'Après investigation, des frais de réparation ont été prélevés sur la caution du client. Le partenaire a été dédommagé.',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        booking: {
          id: 'booking-3',
          loft_name: 'Appartement Familial Bastille',
          check_in: '2024-01-05',
          check_out: '2024-01-08',
          total_price: 320
        },
        reporter: {
          full_name: 'Claire Moreau',
          email: 'claire.moreau@email.com',
          role: 'partner'
        },
        reported: {
          full_name: 'Thomas Petit',
          email: 'thomas.petit@email.com',
          role: 'client'
        }
      }
    ]

    /* In a real implementation, you would use this query:
    const { data: disputes, error } = await supabase
      .from('booking_disputes')
      .select(`
        id,
        booking_id,
        reporter_id,
        reported_id,
        type,
        status,
        priority,
        title,
        description,
        resolution,
        created_at,
        updated_at,
        bookings(
          id,
          lofts(name),
          check_in,
          check_out,
          total_price
        ),
        reporter:profiles!booking_disputes_reporter_id_fkey(full_name, email, role),
        reported:profiles!booking_disputes_reported_id_fkey(full_name, email, role)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }
    */

    return NextResponse.json({ disputes: mockDisputes })

  } catch (error) {
    console.error('Error fetching disputes:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des litiges' },
      { status: 500 }
    )
  }
}