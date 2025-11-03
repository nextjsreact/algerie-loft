import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { action } = await request.json()
    
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

    const bookingId = params.id

    // Get current booking details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (fetchError || !booking) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 })
    }

    switch (action) {
      case 'confirm':
        if (booking.status !== 'pending') {
          return NextResponse.json({ error: 'Seules les réservations en attente peuvent être confirmées' }, { status: 400 })
        }

        const { error: confirmError } = await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)

        if (confirmError) throw confirmError

        // TODO: Send confirmation notification to client and partner
        break

      case 'cancel':
        if (['cancelled', 'completed'].includes(booking.status)) {
          return NextResponse.json({ error: 'Cette réservation ne peut pas être annulée' }, { status: 400 })
        }

        const { error: cancelError } = await supabase
          .from('bookings')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)

        if (cancelError) throw cancelError

        // TODO: Send cancellation notification to client and partner
        break

      case 'refund':
        if (booking.payment_status !== 'paid') {
          return NextResponse.json({ error: 'Seules les réservations payées peuvent être remboursées' }, { status: 400 })
        }

        if (booking.status !== 'cancelled') {
          return NextResponse.json({ error: 'La réservation doit être annulée avant remboursement' }, { status: 400 })
        }

        const { error: refundError } = await supabase
          .from('bookings')
          .update({ 
            payment_status: 'refunded',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)

        if (refundError) throw refundError

        // TODO: Process actual refund through payment provider
        // TODO: Send refund notification to client
        break

      default:
        return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de la réservation' },
      { status: 500 }
    )
  }
}