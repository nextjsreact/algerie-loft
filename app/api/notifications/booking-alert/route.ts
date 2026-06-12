import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createNotification } from '@/app/actions/notifications'

export async function POST(req: NextRequest) {
  try {
    const { loft_name, guest_name, check_in, check_out, total, booking_id } = await req.json()

    const supabase = await createClient(true) // service role

    // Récupérer tous les admins et managers
    const { data: staff } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'manager'])

    if (!staff?.length) {
      return NextResponse.json({ ok: true, notified: 0 })
    }

    const link = booking_id ? `/fr/reservations/${booking_id}` : `/fr/reservations`

    // Envoyer une notification à chaque admin/manager
    await Promise.all(
      staff.map(member =>
        createNotification(
          member.id,
          '🔔 Nouvelle réservation client',
          `${guest_name} a demandé le loft "${loft_name}" du ${new Date(check_in).toLocaleDateString('fr-FR')} au ${new Date(check_out).toLocaleDateString('fr-FR')} — Total : ${total.toLocaleString('fr-FR')} DA`,
          'info',
          link,
          null
        )
      )
    )

    return NextResponse.json({ ok: true, notified: staff.length })
  } catch (error) {
    console.error('Booking alert notification error:', error)
    return NextResponse.json({ ok: false, error: 'Notification failed' }, { status: 500 })
  }
}
