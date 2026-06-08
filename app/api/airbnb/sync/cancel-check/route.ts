import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Authentification
    const authHeader = request.headers.get('authorization') || '';
    const apiKey = process.env.AIRBNB_API_SECRET;
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const listingId = body.listing_id;
    if (!listingId) {
      return NextResponse.json({ error: 'listing_id requis' }, { status: 400 });
    }

    const supabase = await createClient(true); // useServiceRole = true

    // Résoudre le loft_id
    const { data: lofts } = await supabase
      .from('lofts')
      .select('id, name')
      .eq('airbnb_listing_id', String(listingId))
      .limit(1);

    if (!lofts || lofts.length === 0) {
      return NextResponse.json({ cancelled_count: 0, message: 'Loft non trouvé' });
    }

    const loftId = lofts[0].id;
    const loftName = lofts[0].name || '';

    // Chercher les réservations Airbnb actives (avec confirmation code)
    const { data: activeReservations } = await supabase
      .from('reservations')
      .select('id, guest_name, guest_count, check_in_date, check_out_date, airbnb_confirmation_code')
      .eq('loft_id', loftId)
      .in('status', ['confirmed', 'pending'])
      .not('airbnb_confirmation_code', 'is', null);

    if (!activeReservations || activeReservations.length === 0) {
      return NextResponse.json({ cancelled_count: 0, message: 'Aucune résa active avec confirmation_code' });
    }

    const now = new Date().toISOString();
    let cancelledCount = 0;

    for (const r of activeReservations) {
      // Mettre à jour le statut
      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          cancelled_at: now,
          cancellation_reason: 'Annulée par le voyageur sur Airbnb',
          updated_at: now,
        })
        .eq('id', r.id);

      if (updateError) {
        console.error(`[Cancel Check] Erreur update ${r.id}: ${updateError.message}`);
        continue;
      }

      cancelledCount++;

      // Créer la notification
      const { error: notifError } = await supabase
        .from('airbnb_notifications')
        .insert({
          reservation_id: r.id,
          loft_id: loftId,
          type: 'cancelled',
          title: `Réservation annulée - ${loftName || '?'}`,
          message: `${r.guest_name || '?'} (${r.check_in_date || '?'} → ${r.check_out_date || '?'})`,
          metadata: {
            guest_name: r.guest_name || '',
            guest_count: r.guest_count || 0,
            check_in_date: r.check_in_date,
            check_out_date: r.check_out_date,
            listing_id: listingId,
            detected_by: 'cancel_check',
          },
        });

      if (notifError) {
        console.error(`[Cancel Check] Erreur notification ${r.id}: ${notifError.message}`);
      }
    }

    return NextResponse.json({ cancelled_count: cancelledCount });
  } catch (error) {
    console.error('[Cancel Check] Erreur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
