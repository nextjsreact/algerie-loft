import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { loft_id, check_in, check_out, guests, message, total_price } = body

    // Validation
    if (!loft_id || !check_in || !check_out || !guests) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Vérifier que le loft existe et est disponible
    const { data: loft } = await supabase
      .from('lofts')
      .select('*')
      .eq('id', loft_id)
      .single()

    if (!loft || loft.status !== 'available') {
      return NextResponse.json(
        { error: 'Loft non disponible' },
        { status: 400 }
      )
    }

    // Créer la réservation
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        loft_id,
        client_id: session.user.id,
        check_in_date: check_in,
        check_out_date: check_out,
        number_of_guests: guests,
        special_requests: message,
        total_price,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Booking creation error:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ booking }, { status: 201 })
  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
