import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient(true)

    const { data, error } = await supabase
      .from('reservation_payments')
      .select('id, amount, payment_method, currency, status, transaction_id, processor_response, processed_at, created_at')
      .eq('reservation_id', id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Also get reservation total
    const { data: reservation } = await supabase
      .from('reservations')
      .select('total_amount, guest_name, check_in_date, check_out_date')
      .eq('id', id)
      .single()

    const totalPaid = (data || []).reduce((s, p) => s + Number(p.amount), 0)
    const totalDue = Number(reservation?.total_amount || 0)
    const balance = totalDue - totalPaid

    return NextResponse.json({
      payments: data || [],
      summary: {
        total_due: totalDue,
        total_paid: totalPaid,
        balance,
        is_fully_paid: balance <= 0,
      }
    })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifie' }, { status: 401 })

    const body = await request.json()
    const { amount, payment_method, reference, payment_date, notes, currency } = body

    if (!amount || !payment_method) {
      return NextResponse.json({ error: 'Montant et mode de paiement requis' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('reservation_payments')
      .insert({
        reservation_id: id,
        amount: Number(amount),
        payment_method,
        currency: currency || 'DZD',
        status: 'completed',
        transaction_id: reference || null,
        processor_response: notes || null,
        processed_at: new Date(payment_date || new Date()).toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, payment: data })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reservationId } = await params
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) return NextResponse.json({ error: 'paymentId requis' }, { status: 400 })

    const supabase = await createClient(true)
    const { error } = await supabase
      .from('reservation_payments')
      .delete()
      .eq('id', paymentId)
      .eq('reservation_id', reservationId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
