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

    // Si c'est une réservation Airbnb, nettoyer les données liées avant suppression
    // (au cas où les contraintes ON DELETE CASCADE ne sont pas encore appliquées)
    if (reservation.source === 'airbnb_scraper' || reservation.airbnb_confirmation_code) {
      // Supprimer les notifications Airbnb liées (si ON DELETE CASCADE pas encore actif)
      await supabase
        .from('airbnb_notifications')
        .delete()
        .eq('reservation_id', id)
        .then(() => {}) // Ignore errors - cascade will handle it
        .catch(() => {})

      // Supprimer les conflits liés (si ON DELETE CASCADE pas encore actif)
      await supabase
        .from('airbnb_conflicts')
        .delete()
        .or(`reservation_1_id.eq.${id},reservation_2_id.eq.${id}`)
        .then(() => {}) // Ignore errors - cascade will handle it
        .catch(() => {})

      // Mettre à NULL la référence dans staging (si ON DELETE SET NULL pas encore actif)
      await supabase
        .from('airbnb_reservations_staging')
        .update({ reservation_id: null })
        .eq('reservation_id', id)
        .then(() => {}) // Ignore errors - cascade will handle it
        .catch(() => {})
    }

    // Delete the reservation
    const { error: deleteErr } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)

    if (deleteErr) {
      console.error('[DELETE reservation] Error:', deleteErr)
      return NextResponse.json({ 
        error: 'Erreur lors de la suppression',
        details: deleteErr.message 
      }, { status: 500 })
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
