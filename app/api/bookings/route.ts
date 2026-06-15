import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSession } from '@/lib/auth'

// GET /api/bookings - Get bookings (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const loftId = searchParams.get('loft_id')
    const status = searchParams.get('status')

    const supabase = await createClient(true)

    // Récupérer les bookings
    let bookingsQuery = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })

    // Filtrer par loft si spécifié
    if (loftId) {
      bookingsQuery = bookingsQuery.eq('loft_id', loftId)
    }

    // Filtrer par statut si spécifié
    if (status) {
      bookingsQuery = bookingsQuery.eq('status', status)
    }

    const { data: bookingsData, error: bookingsError } = await bookingsQuery

    if (bookingsError) {
      console.error('[API Bookings GET] Error fetching bookings:', bookingsError)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des réservations', details: bookingsError.message },
        { status: 500 }
      )
    }

    // Récupérer les lofts
    const { data: loftsData } = await supabase
      .from('lofts')
      .select('id, name, address')

    // Récupérer les profils
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, email')

    // Combiner les données et transformer pour le calendrier
    const bookings = (bookingsData || []).map(booking => {
      const loft = loftsData?.find(l => l.id === booking.loft_id)
      const profile = profilesData?.find(p => p.id === booking.client_id)
      
      return {
        ...booking,
        // Ajouter les champs attendus par le calendrier
        check_in_date: booking.check_in,
        check_out_date: booking.check_out,
        guest_name: profile?.full_name || profile?.email || 'Client',
        guest_email: profile?.email,
        total_amount: booking.total_price,
        nights: Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24)),
        lofts: loft,
        profiles: profile
      }
    })

    return NextResponse.json({ 
      success: true, 
      bookings,
      reservations: bookings // Alias pour compatibilité avec le calendrier
    })

  } catch (error) {
    console.error('[API Bookings GET] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      loft_id,
      check_in,
      check_out,
      guests,
      message,
      total_price
    } = body

    // Validation
    if (!loft_id || !check_in || !check_out) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const supabase = await createClient(true)

    // Vérifier que le loft existe et est disponible
    const { data: loft, error: loftError } = await supabase
      .from('lofts')
      .select('id, name, status')
      .eq('id', loft_id)
      .single()

    if (loftError || !loft) {
      return NextResponse.json(
        { error: 'Loft non trouvé' },
        { status: 404 }
      )
    }

    if (loft.status !== 'available') {
      return NextResponse.json(
        { error: 'Loft non disponible' },
        { status: 400 }
      )
    }

    // Vérifier les conflits de dates (bookings existants)
    const { data: conflictBookings, error: conflictBookError } = await supabase
      .from('bookings')
      .select('id')
      .eq('loft_id', loft_id)
      .in('status', ['confirmed', 'pending'])
      .lt('check_in', check_out)
      .gt('check_out', check_in)

    if (conflictBookError) {
      console.error('[API Bookings] Conflict check error:', conflictBookError)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des conflits' },
        { status: 500 }
      )
    }

    if (conflictBookings && conflictBookings.length > 0) {
      return NextResponse.json(
        { error: 'Ce loft est déjà réservé pour ces dates' },
        { status: 409 }
      )
    }

    // Vérifier les conflits avec les réservations employés
    const { data: conflictResvs, error: conflictResvError } = await supabase
      .from('reservations')
      .select('id')
      .eq('loft_id', loft_id)
      .in('status', ['confirmed', 'pending'])
      .lt('check_in_date', check_out)
      .gt('check_out_date', check_in)

    if (conflictResvError) {
      console.error('[API Bookings] Conflict check error (reservations):', conflictResvError)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des conflits' },
        { status: 500 }
      )
    }

    if (conflictResvs && conflictResvs.length > 0) {
      return NextResponse.json(
        { error: 'Ce loft est déjà réservé pour ces dates' },
        { status: 409 }
      )
    }

    // Créer la réservation
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        loft_id,
        client_id: session.user.id,
        check_in: check_in,
        check_out: check_out,
        guests: guests || 1,
        special_requests: message || null,
        total_price: total_price || 0,
        status: 'pending'
      })
      .select()
      .single()

    if (bookingError) {
      console.error('[API Bookings] Error creating booking:', bookingError)
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation', details: bookingError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      booking 
    })

  } catch (error) {
    console.error('[API Bookings] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
