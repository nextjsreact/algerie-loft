/**
 * API Route: /api/admin/reservations-provenance
 *
 * GET : Liste toutes les reservations avec leur provenance (source / matched_via)
 *      et les details du loft, avec filtres avances.
 *
 * Auth: service role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(true);
    const { searchParams } = new URL(request.url);

    const source = searchParams.get('source');                // manual | airbnb_scraper | all
    const loftId = searchParams.get('loft_id');
    const status = searchParams.get('status');
    const matchedVia = searchParams.get('matched_via');      // airbnb_id | fuzzy_manual | none
    const dateFrom = searchParams.get('date_from');          // YYYY-MM-DD (check_in_date >=)
    const dateTo = searchParams.get('date_to');              // YYYY-MM-DD (check_in_date <=)
    const search = searchParams.get('search');               // recherche dans guest_name
    const limit = parseInt(searchParams.get('limit') || '200');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('reservations')
      .select(`
        id, guest_name, guest_email, guest_phone, guest_count,
        check_in_date, check_out_date, nights,
        base_price, cleaning_fee, service_fee, taxes, total_amount, currency_code,
        status, payment_status, special_requests,
        airbnb_confirmation_code, source, matched_via,
        loft_id, last_manual_edit_at, synced_at, created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (source && source !== 'all') query = query.eq('source', source);
    if (loftId && loftId !== 'all') query = query.eq('loft_id', loftId);
    if (status && status !== 'all') query = query.eq('status', status);
    if (matchedVia && matchedVia !== 'all') query = query.eq('matched_via', matchedVia);
    if (dateFrom) query = query.gte('check_in_date', dateFrom);
    if (dateTo) query = query.lte('check_in_date', dateTo);
    if (search) query = query.ilike('guest_name', `%${search}%`);

    const { data: reservations, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Charger les lofts concernes en 1 requete
    const loftIds = new Set(reservations?.map((r) => r.loft_id).filter(Boolean) || []);
    let loftsMap = new Map<string, any>();
    if (loftIds.size > 0) {
      const { data: lofts } = await supabase
        .from('lofts')
        .select('id, name, airbnb_listing_id')
        .in('id', Array.from(loftIds));
      lofts?.forEach((l) => loftsMap.set(l.id, l));
    }

    const enriched = (reservations || []).map((r) => ({
      ...r,
      loft: loftsMap.get(r.loft_id) || null,
    }));

    // Stats par source / matched_via
    const stats = {
      total: enriched.length,
      by_source: {
        airbnb_scraper: enriched.filter((r) => r.source === 'airbnb_scraper').length,
        manual: enriched.filter((r) => r.source === 'manual').length,
        other: enriched.filter((r) => r.source !== 'airbnb_scraper' && r.source !== 'manual').length,
      },
      by_matched_via: {
        airbnb_id: enriched.filter((r) => r.matched_via === 'airbnb_id').length,
        fuzzy_manual: enriched.filter((r) => r.matched_via === 'fuzzy_manual').length,
        none: enriched.filter((r) => r.matched_via === 'none' || !r.matched_via).length,
      },
      with_manual_edit: enriched.filter((r) => r.last_manual_edit_at).length,
    };

    return NextResponse.json({ reservations: enriched, stats });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}
