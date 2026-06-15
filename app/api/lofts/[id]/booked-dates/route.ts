import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Returns all booked date ranges for a loft (confirmed + pending reservations).
 * Used by the reservation form calendar to show unavailable dates.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    // Optional: exclude a reservation ID (for edit mode)
    const excludeId = searchParams.get('exclude') || null

    const supabase = await createClient(true)

    // 1. Réservations employés (reservations table)
    let resvQuery = supabase
      .from('reservations')
      .select('check_in_date, check_out_date, status')
      .eq('loft_id', id)
      .in('status', ['confirmed', 'pending'])

    if (excludeId) {
      resvQuery = resvQuery.neq('id', excludeId)
    }

    const { data: reservations, error: resvError } = await resvQuery
    if (resvError) return NextResponse.json({ error: resvError.message }, { status: 500 })

    // 2. Réservations client (bookings table)
    let bookQuery = supabase
      .from('bookings')
      .select('check_in, check_out, status')
      .eq('loft_id', id)
      .in('status', ['confirmed', 'pending'])

    const { data: bookings, error: bookError } = await bookQuery
    if (bookError) return NextResponse.json({ error: bookError.message }, { status: 500 })

    // 3. Dates bloquées manuellement (loft_availability.is_available = false)
    const { data: blockedDates, error: blockError } = await supabase
      .from('loft_availability')
      .select('date')
      .eq('loft_id', id)
      .eq('is_available', false)

    if (blockError) return NextResponse.json({ error: blockError.message }, { status: 500 })

    // Ranges des réservations (reservations)
    const reservationRanges = (reservations || []).map((r: any) => ({
      from: r.check_in_date,
      to: r.check_out_date,
    }))

    // Ranges des bookings (clients)
    const bookingRanges = (bookings || []).map((b: any) => ({
      from: b.check_in,
      to: b.check_out,
    }))

    // Chaque jour bloqué devient un range d'un jour (from = date, to = date+1)
    const blockedRanges = (blockedDates || []).map((b: any) => {
      const d = new Date(b.date)
      d.setDate(d.getDate() + 1)
      return { from: b.date, to: d.toISOString().split('T')[0] }
    })

    const ranges = [...reservationRanges, ...bookingRanges, ...blockedRanges]

    return NextResponse.json({ ranges })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
