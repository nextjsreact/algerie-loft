import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { detectUserRole } from '@/lib/auth/role-detection'

function normalizeDate(value: string | null | undefined) {
  if (!value) return null
  const raw = String(value)
  const dateOnly = raw.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return dateOnly
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function GET() {
  try {
    const supabase = await createClient()

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

    // Notifications — utilise le service role pour bypass RLS
    const adminSupabase = await createClient(true)
    let notifications: any[] = []
    try {
      const { data, error, count } = await adminSupabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) {
        console.error('[journal-avis] notifs error:', error.message, JSON.stringify(error))
      } else {
        notifications = (data || []).filter((notification: any) => {
          const title = `${notification.title || ''} ${notification.title_key || ''}`.toLowerCase()
          const message = `${notification.message || ''} ${notification.message_key || ''} ${JSON.stringify(notification.message_payload || {})}`.toLowerCase()
          return !title.includes('mock') && !message.includes('mock') && !title.includes('version optimisée')
        })
        console.log('[journal-avis] notifs count:', count)
      }
    } catch (err) {
      console.error('[journal-avis] notifs exception:', err)
    }

    const { data: airbnbData, error: airbnbError } = await adminSupabase
      .from('airbnb_notifications')
      .select(`
        id, reservation_id, loft_id, type, title, message, is_read, created_at, metadata
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

    if (airbnbError) {
      console.error('[journal-avis] airbnb notifications error:', airbnbError.message, JSON.stringify(airbnbError))
    }

    // Bookings — récupérés EN PREMIER pour pouvoir chercher les avis par booking_id
    let bookings: any[] = []
    try {
      const { data: bookingsData, error: bookingsError } = await adminSupabase
        .from('bookings')
        .select(`
          id, loft_id, check_in, check_out, check_in_date, check_out_date, guests, total_price,
          status, payment_status, booking_reference, created_at,
          loft:lofts ( name, address )
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (bookingsError) {
        console.error('[journal-avis] bookings error:', bookingsError.message)
      } else {
        bookings = (bookingsData || []).map((b: any) => {
          const checkIn = b.check_in || b.check_in_date || null
          const checkOut = b.check_out || b.check_out_date || null

          return ({
            id: b.id,
            loft_id: b.loft_id,
            loft_name: b.loft?.name || null,
            loft_address: b.loft?.address || null,
            check_in: checkIn,
            check_out: checkOut,
            guests: b.guests,
            total_price: b.total_price,
            status: b.status,
            payment_status: b.payment_status,
            booking_reference: b.booking_reference,
            created_at: b.created_at || null,
          })
        })
      }
    } catch (err) {
      console.error('[journal-avis] bookings exception:', err)
    }

    // Reviews — récupérés directement par séjour affiché, indépendamment du booking_id
    let reviews: any[] = []
    try {
      const normalizedBookings = bookings
        .map((b: any) => ({
          id: b.id,
          loft_id: b.loft_id,
          checkInKey: normalizeDate(b.check_in),
          checkOutKey: normalizeDate(b.check_out),
        }))
        .filter((b: any) => b.loft_id && b.checkInKey && b.checkOutKey)

      const reviewLoftIds = Array.from(new Set(normalizedBookings.map((b: any) => b.loft_id)))
      const bookingIds = normalizedBookings.map((b: any) => b.id).filter(Boolean)
      let reviewsData: any[] = []

      if (reviewLoftIds.length > 0) {
        let query = adminSupabase
          .from('loft_reviews')
          .select(`
            id, booking_id, rating, review_text, created_at,
            is_published, response_text, response_date, loft_id, client_id,
            booking:booking_id ( check_in, check_out, check_in_date, check_out_date ),
            loft:loft_id ( name, address )
          `)
          .in('loft_id', reviewLoftIds)
          .order('created_at', { ascending: false })

        if (bookingIds.length > 0) {
          query = query.or(`booking_id.in.(${bookingIds.join(',')}),client_id.eq.${userId}`)
        } else {
          query = query.eq('client_id', userId)
        }

        const { data, error } = await query

        if (error) {
          console.error('[journal-avis] reviews error:', error.message, JSON.stringify(error))
        } else {
          reviewsData = (data || []).filter((review: any) => {
            if (review.booking_id && bookingIds.includes(review.booking_id)) return true
            if (review.client_id === userId) return true

            const reviewLoftId = review.loft_id
            const reviewCheckIn = review.booking?.check_in || review.booking?.check_in_date
            const reviewCheckOut = review.booking?.check_out || review.booking?.check_out_date
            const reviewCheckInKey = normalizeDate(reviewCheckIn)
            const reviewCheckOutKey = normalizeDate(reviewCheckOut)

            return normalizedBookings.some((booking: any) => (
              booking.loft_id === reviewLoftId &&
              booking.checkInKey === reviewCheckInKey &&
              booking.checkOutKey === reviewCheckOutKey
            ))
          })
        }
      }

      reviews = reviewsData.map((r: any) => ({
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
        booking_check_in: r.booking?.check_in || r.booking?.check_in_date || null,
        booking_check_out: r.booking?.check_out || r.booking?.check_out_date || null,
      }))

      console.log('[journal-avis] reviews count:', reviews.length, 'via stay keys:', normalizedBookings.length)
    } catch (err) {
      console.error('[journal-avis] reviews exception:', err)
    }

    return NextResponse.json({
      user: { id: userId, email: user.email, full_name, role },
      notifications: notifications || [],
      airbnbNotifications,
      reviews,
      bookings,
      journalEntries: (notifications || []).length + airbnbNotifications.length,
      reviewEntries: reviews.length,
    })
  } catch (error) {
    console.error('[journal-avis] GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
