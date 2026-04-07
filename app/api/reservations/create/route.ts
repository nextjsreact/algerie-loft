import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      loft_id, guest_name, guest_email, guest_phone, guest_nationality,
      guest_count, check_in_date, check_out_date, special_requests,
      customer_id, base_price, cleaning_fee, service_fee, taxes, total_amount,
      currency_code, currency_ratio, price_per_night_input,
    } = body

    // Basic validation — only phone is required for guest info
    if (!loft_id || !guest_phone || !check_in_date || !check_out_date) {
      return NextResponse.json({ error: "Champs obligatoires manquants (loft, téléphone, dates)" }, { status: 400 })
    }

    const checkIn = new Date(check_in_date)
    const checkOut = new Date(check_out_date)
    if (checkOut <= checkIn) {
      return NextResponse.json({ error: "La date de départ doit être après la date d'arrivée" }, { status: 400 })
    }

    const supabase = await createClient(true) // service role to bypass RLS

    // Check availability
    const { data: available, error: availError } = await supabase
      .rpc('check_loft_availability', {
        p_loft_id: loft_id,
        p_check_in: check_in_date,
        p_check_out: check_out_date,
      })

    if (availError) {
      console.error('Availability check error:', availError)
      return NextResponse.json({ error: "Erreur lors de la vérification de disponibilité" }, { status: 500 })
    }

    if (!available) {
      return NextResponse.json({ error: "Les dates sélectionnées ne sont pas disponibles" }, { status: 400 })
    }

    // Find or create customer
    let resolvedCustomerId = customer_id

    if (!resolvedCustomerId) {
      // Try to find existing customer by email or phone
      if (guest_email) {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('email', guest_email)
          .single()
        if (existing) resolvedCustomerId = existing.id
      }

      if (!resolvedCustomerId && guest_phone) {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', guest_phone)
          .single()
        if (existing) resolvedCustomerId = existing.id
      }

      // Create new customer if not found
      if (!resolvedCustomerId) {
        const nameParts = (guest_name || '').split(' ')
        const first_name = nameParts[0] || 'Invité'
        const last_name = nameParts.slice(1).join(' ') || ''

        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            id: randomUUID(),
            first_name,
            last_name,
            email: guest_email || null,
            phone: guest_phone || null,
            status: 'active',
          })
          .select('id')
          .single()

        if (customerError) {
          console.error('Error creating customer:', customerError)
          // Don't fail the reservation if customer creation fails
        } else {
          resolvedCustomerId = newCustomer.id
        }
      }
    }

    // Create reservation
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .insert({
        loft_id,
        guest_id: resolvedCustomerId || null,
        guest_name: guest_name || '',
        guest_email: guest_email || '',
        guest_phone: guest_phone || null,
        guest_nationality: guest_nationality || '',
        guest_count: guest_count || 1,
        check_in_date,
        check_out_date,
        special_requests: special_requests || null,
        base_price: base_price || 0,
        cleaning_fee: cleaning_fee || 0,
        service_fee: service_fee || 0,
        taxes: taxes || 0,
        total_amount: total_amount || 0,
        status: 'pending',
        payment_status: 'pending',
        currency_code: currency_code || 'DZD',
        currency_ratio: currency_ratio || 1,
        price_per_night_input: price_per_night_input || null,
      })
      .select('*, lofts:loft_id(id, name, address, price_per_night)')
      .single()

    if (reservationError) {
      console.error('Error creating reservation:', reservationError)
      return NextResponse.json({ error: reservationError.message }, { status: 500 })
    }

    revalidatePath('/reservations')

    // Notify all staff (admin/manager/executive/member) about the new client reservation
    try {
      const { data: staffProfiles } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'manager', 'executive', 'member'])

      if (staffProfiles && staffProfiles.length > 0) {
        const loftName = (reservation as any).lofts?.name || 'Appartement'
        const guestDisplay = guest_name || guest_phone || 'Client'
        const nights = Math.ceil((new Date(check_out_date).getTime() - new Date(check_in_date).getTime()) / 86400000)

        const notifRows = staffProfiles.map((p: { id: string }) => ({
          user_id: p.id,
          title_key: '🔔 Nouvelle demande de réservation',
          message_key: `${guestDisplay} • ${loftName} • ${check_in_date} → ${check_out_date} (${nights} nuit${nights > 1 ? 's' : ''}) • ${(total_amount || 0).toLocaleString('fr-DZ')} DA`,
          type: 'info' as const,
          link: '/fr/reservations?tab=list',
          is_read: false,
          created_at: new Date().toISOString(),
        }))

        await supabase.from('notifications').insert(notifRows)
      }
    } catch (notifErr) {
      // Don't fail the reservation if notification fails
      console.error('Notification error (non-blocking):', notifErr)
    }

    return NextResponse.json({ success: true, data: reservation })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("Error in POST /api/reservations/create:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
