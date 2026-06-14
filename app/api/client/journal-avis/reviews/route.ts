import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { booking_id, rating, review_text } = body

    if (!booking_id || !rating) {
      return NextResponse.json({ error: 'booking_id et rating requis' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'La note doit être entre 1 et 5' }, { status: 400 })
    }

    // Vérifier que la réservation appartient bien à l'utilisateur et est terminée
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, loft_id, status, check_out')
      .eq('id', booking_id)
      .eq('client_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    // Vérifier qu'un avis n'existe pas déjà
    const { data: existing } = await supabase
      .from('loft_reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Un avis existe déjà pour cette réservation' }, { status: 409 })
    }

    const { data: review, error: insertError } = await supabase
      .from('loft_reviews')
      .insert({
        booking_id,
        loft_id: booking.loft_id,
        client_id: user.id,
        rating,
        review_text: review_text || null,
        is_published: true,
      })
      .select(`
        id, booking_id, loft_id, rating, review_text, created_at,
        is_published, response_text, response_date,
        booking:booking_id ( check_in, check_out ),
        loft:loft_id ( name, address )
      `)
      .single()

    if (insertError) {
      console.error('[journal-avis/reviews] insert error:', insertError)
      return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 })
    }

    return NextResponse.json({
      id: review.id,
      booking_id: review.booking_id,
      rating: review.rating,
      review_text: review.review_text,
      created_at: review.created_at,
      is_published: review.is_published,
      response_text: review.response_text,
      response_date: review.response_date,
      loft_id: review.loft_id,
      loft_name: review.loft?.name || null,
      loft_address: review.loft?.address || null,
      booking_check_in: review.booking?.check_in || null,
      booking_check_out: review.booking?.check_out || null,
    })
  } catch (error) {
    console.error('[journal-avis/reviews] POST error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
