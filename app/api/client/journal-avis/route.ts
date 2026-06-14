import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { detectUserRole } from '@/lib/auth/role-detection'

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

    const adminSupabase = await createClient(true)

    // ─── Notifications ─────────────────────────────────────────────
    let notifications: any[] = []
    try {
      const { data, error } = await adminSupabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (!error) {
        notifications = (data || []).filter((notification: any) => {
          const title = `${notification.title || ''} ${notification.title_key || ''}`.toLowerCase()
          const message = `${notification.message || ''} ${notification.message_key || ''} ${JSON.stringify(notification.message_payload || {})}`.toLowerCase()
          return !title.includes('mock') && !message.includes('mock') && !title.includes('version optimisée')
        })
      }
    } catch { /* ignore */ }

    // ─── Airbnb notifications ────────────────────────────────────
    let airbnbNotifications: any[] = []
    try {
      const { data } = await supabase
        .from('airbnb_reservations')
        .select('id, type, title, message, is_read, created_at, metadata, loft_id, reservation_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      airbnbNotifications = (data || []).map((n: any) => ({
        id: n.id,
        type: n.type || 'new',
        title: n.title || '',
        message: n.message || '',
        is_read: n.is_read || false,
        created_at: n.created_at,
        metadata: n.metadata,
        lofts: null,
        reservations: null,
      }))
    } catch { /* ignore */ }

    // ─── Bookings (plats, sans relations) ───────────────────────
    let bookings: any[] = []
    try {
      const { data } = await adminSupabase
        .from('bookings')
        .select('id, loft_id, check_in, check_out, guests, total_price, status, payment_status, booking_reference, created_at')
        .eq('client_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      bookings = (data || []).map((b: any) => ({
        id: b.id,
        loft_id: b.loft_id,
        check_in: b.check_in,
        check_out: b.check_out,
        guests: b.guests,
        total_price: b.total_price,
        status: b.status,
        payment_status: b.payment_status,
        booking_reference: b.booking_reference,
        created_at: b.created_at,
        loft_name: null,
        loft_address: null,
      }))
    } catch { /* ignore */ }

    // ─── Lofts (pour enrichir les bookings) ───────────────────────
    const loftIds = [...new Set(bookings.map((b: any) => b.loft_id).filter(Boolean))]
    let loftsMap: Record<string, { name: string | null; address: string | null }> = {}
    if (loftIds.length > 0) {
      try {
        const { data: loftsData } = await adminSupabase
          .from('lofts')
          .select('id, name, address')
          .in('id', loftIds)
        for (const l of loftsData || []) {
          loftsMap[l.id] = { name: l.name || null, address: l.address || null }
        }
      } catch { /* ignore */ }
    }
    bookings = bookings.map((b: any) => ({
      ...b,
      loft_name: loftsMap[b.loft_id]?.name || null,
      loft_address: loftsMap[b.loft_id]?.address || null,
    }))

    const bookingIds = bookings.map((b: any) => b.id).filter(Boolean)
    const normalizedBookings = bookings
      .map((b: any) => ({
        id: b.id,
        loft_id: b.loft_id,
        checkInKey: b.check_in ? String(b.check_in).slice(0, 10) : null,
        checkOutKey: b.check_out ? String(b.check_out).slice(0, 10) : null,
      }))
      .filter((b: any) => b.loft_id && b.checkInKey && b.checkOutKey)

    // ─── Reviews (plats, sans relations nested) ─────────────────
    let reviews: any[] = []
    try {
      let query = adminSupabase
        .from('loft_reviews')
        .select('id, booking_id, loft_id, rating, review_text, created_at, is_published, response_text, response_date, client_id')
        .order('created_at', { ascending: false })

      if (bookingIds.length > 0) {
        query = query.or(`booking_id.in.(${bookingIds.join(',')}),client_id.eq.${userId}`)
      } else {
        query = query.eq('client_id', userId)
      }

      const { data: reviewsData, error } = await query
      if (error) {
        console.error('[journal-avis] reviews error:', error.message)
      } else {
        reviews = (reviewsData || []).filter((r: any) => {
          if (r.booking_id && bookingIds.includes(r.booking_id)) return true
          if (r.client_id === userId) return true

          const checkInKey = r.booking_check_in ? String(r.booking_check_in).slice(0, 10) : null
          const checkOutKey = r.booking_check_out ? String(r.booking_check_out).slice(0, 10) : null
          return normalizedBookings.some((booking: any) => (
            booking.loft_id === r.loft_id &&
            booking.checkInKey === checkInKey &&
            booking.checkOutKey === checkOutKey
          ))
        }).map((r: any) => ({
          id: r.id,
          booking_id: r.booking_id,
          rating: r.rating,
          review_text: r.review_text,
          created_at: r.created_at,
          is_published: r.is_published,
          response_text: r.response_text,
          response_date: r.response_date,
          loft_id: r.loft_id,
          loft_name: loftsMap[r.loft_id]?.name || null,
          loft_address: loftsMap[r.loft_id]?.address || null,
          booking_check_in: bookings.find((b: any) => b.id === r.booking_id)?.check_in || null,
          booking_check_out: bookings.find((b: any) => b.id === r.booking_id)?.check_out || null,
        }))
      }
    } catch (err) {
      console.error('[journal-avis] reviews exception:', err)
    }

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
