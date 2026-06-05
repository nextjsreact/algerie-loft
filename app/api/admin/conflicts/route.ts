/**
 * API Route: /api/admin/conflicts
 *
 * GET    : Liste les conflits de reservations avec filtres
 * PATCH  : Met a jour le statut d'un conflit (resolve / acknowledge / false_positive)
 *
 * Auth: cookie de session Next.js (server-side) → service role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const severity = searchParams.get('severity');
    const loftId = searchParams.get('loft_id');
    const limit = parseInt(searchParams.get('limit') || '100');

    // 1. Recuperer les conflits
    let query = supabase
      .from('airbnb_conflicts')
      .select(`
        id, loft_id, reservation_1_id, reservation_2_id,
        overlap_start, overlap_end, overlap_nights,
        severity, status, resolution_notes, resolved_at, resolved_by,
        notification_sent, created_at, updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status !== 'all') query = query.eq('status', status);
    if (severity && severity !== 'all') query = query.eq('severity', severity);
    if (loftId && loftId !== 'all') query = query.eq('loft_id', loftId);

    const { data: conflicts, error: confError } = await query;
    if (confError) {
      return NextResponse.json({ error: confError.message }, { status: 500 });
    }

    // 2. Recuperer les reservations concernees (2 par conflit, en une requete via IN)
    const allResIds = new Set<string>();
    conflicts?.forEach((c) => {
      allResIds.add(c.reservation_1_id);
      allResIds.add(c.reservation_2_id);
    });
    let reservationsMap = new Map<string, any>();
    if (allResIds.size > 0) {
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, status, source, matched_via, total_amount, currency_code, airbnb_confirmation_code, special_requests, payment_status')
        .in('id', Array.from(allResIds));
      reservations?.forEach((r) => reservationsMap.set(r.id, r));
    }

    // 3. Recuperer les lofts concernes
    const loftIds = new Set(conflicts?.map((c) => c.loft_id) || []);
    let loftsMap = new Map<string, any>();
    if (loftIds.size > 0) {
      const { data: lofts } = await supabase
        .from('lofts')
        .select('id, name, airbnb_listing_id')
        .in('id', Array.from(loftIds));
      lofts?.forEach((l) => loftsMap.set(l.id, l));
    }

    // 4. Joindre le tout
    const enriched = (conflicts || []).map((c) => ({
      ...c,
      loft: loftsMap.get(c.loft_id) || null,
      reservation_1: reservationsMap.get(c.reservation_1_id) || null,
      reservation_2: reservationsMap.get(c.reservation_2_id) || null,
    }));

    // 5. Stats
    const stats = {
      total: enriched.length,
      by_status: {
        open: enriched.filter((c) => c.status === 'open').length,
        acknowledged: enriched.filter((c) => c.status === 'acknowledged').length,
        resolved: enriched.filter((c) => c.status === 'resolved').length,
        false_positive: enriched.filter((c) => c.status === 'false_positive').length,
      },
      by_severity: {
        critical: enriched.filter((c) => c.severity === 'critical').length,
        warning: enriched.filter((c) => c.severity === 'warning').length,
        info: enriched.filter((c) => c.severity === 'info').length,
      },
    };

    return NextResponse.json({ conflicts: enriched, stats });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient(true);
    const body = await request.json();
    const { conflict_id, status, resolution_notes } = body;

    if (!conflict_id || !status) {
      return NextResponse.json(
        { error: 'conflict_id et status requis' },
        { status: 400 },
      );
    }
    if (!['open', 'acknowledged', 'resolved', 'false_positive'].includes(status)) {
      return NextResponse.json(
        { error: 'status invalide' },
        { status: 400 },
      );
    }

    const update: Record<string, any> = { status };
    if (status === 'resolved' || status === 'false_positive') {
      update.resolved_at = new Date().toISOString();
      if (resolution_notes) update.resolution_notes = resolution_notes;
    }

    const { data, error } = await supabase
      .from('airbnb_conflicts')
      .update(update)
      .eq('id', conflict_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, conflict: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}
