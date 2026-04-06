import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient(true)

    // Get current user for audit
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Check role — only admin/manager/employee can delete
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    if (!['admin', 'manager', 'employee'].includes(role)) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Fetch reservation before deletion for audit trail
    const { data: reservation, error: fetchErr } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !reservation) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
    }

    // Write audit log before deletion
    await supabase.from('audit_logs').insert({
      table_name: 'reservations',
      record_id: id,
      action: 'DELETE',
      user_id: user.id,
      user_email: user.email,
      old_values: reservation,
      timestamp: new Date().toISOString(),
    })

    // Delete the reservation
    const { error: deleteErr } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 })
    }

    // Free up the blocked dates in loft_availability
    await supabase
      .from('loft_availability')
      .delete()
      .eq('loft_id', reservation.loft_id)
      .gte('date', reservation.check_in_date)
      .lt('date', reservation.check_out_date)
      .eq('blocked_reason', 'booked')

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE reservation]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
