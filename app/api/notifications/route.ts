import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // For demo purposes, return mock notifications
    // In a real implementation, you would query a notifications table
    const mockNotifications = [
      {
        id: '1',
        type: 'booking',
        title: 'Nouvelle réservation',
        message: 'Vous avez reçu une nouvelle réservation pour votre loft moderne.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
        read: false,
        priority: 'high',
        actionUrl: '/partner/bookings',
        actionLabel: 'Voir la réservation'
      },
      {
        id: '2',
        type: 'payment',
        title: 'Paiement reçu',
        message: 'Un paiement de 250€ a été traité avec succès.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
        read: false,
        priority: 'medium',
        actionUrl: '/partner/earnings',
        actionLabel: 'Voir les revenus'
      },
      {
        id: '3',
        type: 'review',
        title: 'Nouvel avis client',
        message: 'Marie D. a laissé un avis 5 étoiles pour votre propriété !',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
        read: true,
        priority: 'low',
        actionUrl: '/partner/reviews',
        actionLabel: 'Voir l\'avis'
      },
      {
        id: '4',
        type: 'message',
        title: 'Nouveau message',
        message: 'Un client vous a envoyé un message concernant sa réservation.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago
        read: true,
        priority: 'medium',
        actionUrl: '/partner/messages',
        actionLabel: 'Répondre'
      },
      {
        id: '5',
        type: 'system',
        title: 'Mise à jour système',
        message: 'De nouvelles fonctionnalités sont disponibles dans votre dashboard.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        read: true,
        priority: 'low',
        actionUrl: '/partner/dashboard',
        actionLabel: 'Découvrir'
      }
    ]

    return NextResponse.json({ notifications: mockNotifications })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { type, title, message, priority = 'medium', actionUrl, actionLabel } = await request.json()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // In a real implementation, you would insert into notifications table
    const newNotification = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      priority,
      actionUrl,
      actionLabel
    }

    // Here you would also trigger real-time notification via WebSocket
    console.log('New notification created:', newNotification)

    return NextResponse.json({ notification: newNotification })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la notification' },
      { status: 500 }
    )
  }
}