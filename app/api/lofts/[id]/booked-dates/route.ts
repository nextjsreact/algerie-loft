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

    let query = supabase
      .from('reservations')
      .select('check_in_date, check_out_date, status')
      .eq('loft_id', id)
      .in('status', ['confirmed', 'pending'])

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Return ranges — client will expand them into individual dates
    const ranges = (data || []).map((r: any) => ({
      from: r.check_in_date,
      to: r.check_out_date, // exclusive (checkout day is free)
    }))

    return NextResponse.json({ ranges })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
