import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { check_in_date, check_out_date, base_price, cleaning_fee, service_fee, taxes, total_amount } = body

    if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 })
    if (!check_in_date || !check_out_date) return NextResponse.json({ error: 'Dates requises' }, { status: 400 })

    const checkIn = new Date(check_in_date)
    const checkOut = new Date(check_out_date)
    if (checkOut <= checkIn) return NextResponse.json({ error: 'La date de départ doit être après la date d\'arrivée' }, { status: 400 })

    const supabase = await createClient(true)

    // Get current reservation
    const { data: current, error: fetchErr } = await supabase
      .from('reservations')
      .select('loft_id, status, check_in_date, check_out_date')
      .eq('id', id)
      .single()

    if (fetchErr || !current) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    if (current.status === 'cancelled') return NextResponse.json({ error: 'Impossible de modifier une réservation annulée' }, { status: 400 })

    // Check availability for new dates (excluding current reservation)
    const { data: conflicts } = await supabase
      .from('reservations')
      .select('id')
      .eq('loft_id', current.loft_id)
      .neq('id', id)
      .in('status', ['confirmed', 'pending'])
      .or(`and(check_in_date.lt.${check_out_date},check_out_date.gt.${check_in_date})`)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'Ces dates sont déjà réservées pour ce loft' }, { status: 409 })
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

    const { data: updated, error: updateErr } = await supabase
      .from('reservations')
      .update({
        check_in_date,
        check_out_date,
        nights,
        base_price: base_price ?? null,
        cleaning_fee: cleaning_fee ?? 0,
        service_fee: service_fee ?? 0,
        taxes: taxes ?? 0,
        total_amount: total_amount ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, lofts:loft_id(id, name)')
      .single()

    if (updateErr) {
      console.error('[PATCH reservation]', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, reservation: updated })
  } catch (err) {
    console.error('[PATCH reservation] unexpected:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
