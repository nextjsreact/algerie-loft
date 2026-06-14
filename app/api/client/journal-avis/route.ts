import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { detectUserRole } from '@/lib/auth/role-detection'

export async function GET() {
  try {
    const supabase = await createClient()
    const supabaseAdmin = await createClient(true)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userId = user.id
    const role = await detectUserRole(userId, user.email)

    let full_name = user.user_metadata?.full_name || user.email?.split('@')[0] || null
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
      if (profile?.full_name) full_name = profile.full_name
    } catch { /* ignore */ }

    // Notifications — service role pour bypasser RLS
    const { data: notifications } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: airbnbData } = await supabase
      .from('airbnb_reservations')
      .select(`
        id, type, title, message, is_read, created_at, metadata,
        lofts:loft_id ( id, name ),
        reservations:id ( id, guest_name )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    const airbnbNotifications = (airbnbData || []).map((n: any) => ({
      id: n.id,
      type: n.type || 'new',
      title: n.title || '',
      message: n.message || '',
      is_read: n.is_read || false,
      created_at: n.created_at,
      metadata: n.metadata,
      lofts: n.lofts || null,
      reservations: n.reservations || null,
    }))

    // Reviews
    const { data: reviewsData } = await supabase
      .from('loft_reviews')
      .select(`
        id, booking_id, rating, review_text, created_at,
        is_published, response_text, response_date, loft_id,
        booking:booking_id ( check_in, check_out ),
        loft:loft_id ( name, address )
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false })

    const reviews = (reviewsData || []).map((r: any) => ({
      id: r.id,
      booking_id: r.booking_id,
      rating: r.rating,
      review_text: r.review_text,
      created_at: r.created_at,
      is_published: r.is_published,
      response_text: r.response_text,
      response_date: r.response_date,
      loft_id: r.loft_id,
      loft_name: r.loft?.name || null,
      loft_address: r.loft?.address || null,
      booking_check_in: r.booking?.check_in || null,
      booking_check_out: r.booking?.check_out || null,
    }))

    // Bookings
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select(`
        id, loft_id, check_in, check_out, guests, total_price,
        status, payment_status, booking_reference, created_at,
        loft:lofts ( name, address )
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    const bookings = (bookingsData || []).map((b: any) => ({
      id: b.id,
      loft_id: b.loft_id,
      loft_name: b.loft?.name || null,
      loft_address: b.loft?.address || null,
      check_in: b.check_in,
      check_out: b.check_out,
      guests: b.guests,
      total_price: b.total_price,
      status: b.status,
      payment_status: b.payment_status,
      booking_reference: b.booking_reference,
      created_at: b.created_at,
    }))

    return NextResponse.json({
      user: { id: userId, email: user.email, full_name, role },
      notifications: notifications || [],
      airbnbNotifications,
      reviews,
      bookings,
    })
  } catch (error) {
    console.error('[journal-avis] GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
