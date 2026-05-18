/**
 * API Route: Bookings Calendar
 * 
 * Récupère toutes les réservations pour le calendrier unifié.
 * 
 * GET /api/bookings/calendar
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Vérifie que l'utilisateur est authentifié
 */
async function verifyAuth(request: NextRequest): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Token manquant' };
    }

    const token = authHeader.substring(7);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { valid: false, error: 'Token invalide' };
    }

    return { valid: true, userId: user.id };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Erreur d\'authentification',
    };
  }
}

/**
 * GET /api/bookings/calendar
 * Récupère toutes les réservations avec les infos des lofts
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const loftId = searchParams.get('loft_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Construire la requête
    let query = supabase
      .from('airbnb_bookings')
      .select(`
        id,
        loft_id,
        source,
        external_id,
        status,
        check_in_date,
        check_out_date,
        guest_name,
        guest_email,
        guest_phone,
        amount,
        currency,
        is_complete,
        csv_only_flag
      `)
      .order('check_in_date', { ascending: true });

    // Filtres
    if (loftId) {
      query = query.eq('loft_id', loftId);
    }

    if (startDate) {
      query = query.gte('check_out_date', startDate);
    }

    if (endDate) {
      query = query.lte('check_in_date', endDate);
    }

    const { data: bookings, error: bookingsError } = await query;

    if (bookingsError) {
      return NextResponse.json(
        { error: bookingsError.message },
        { status: 500 }
      );
    }

    // Récupérer les infos des lofts
    const loftIds = [...new Set(bookings?.map(b => b.loft_id) || [])];
    
    const { data: lofts, error: loftsError } = await supabase
      .from('lofts')
      .select('id, name')
      .in('id', loftIds);

    if (loftsError) {
      return NextResponse.json(
        { error: loftsError.message },
        { status: 500 }
      );
    }

    // Créer un map des lofts
    const loftMap = new Map(lofts?.map(l => [l.id, l.name]) || []);

    // Récupérer les conflits
    const { data: conflicts } = await supabase
      .from('airbnb_conflicts')
      .select('booking1_id, booking2_id')
      .eq('status', 'active');

    // Créer un set des IDs de réservations en conflit
    const conflictIds = new Set<string>();
    conflicts?.forEach(c => {
      conflictIds.add(c.booking1_id);
      conflictIds.add(c.booking2_id);
    });

    // Combiner les données
    const reservations = bookings?.map(booking => ({
      id: booking.id,
      loft_id: booking.loft_id,
      loft_name: loftMap.get(booking.loft_id) || 'Unknown',
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      guest_phone: booking.guest_phone,
      amount: booking.amount,
      currency: booking.currency,
      status: booking.status,
      source: booking.source,
      is_complete: booking.is_complete,
      has_conflict: conflictIds.has(booking.id),
      external_id: booking.external_id,
    })) || [];

    return NextResponse.json({
      success: true,
      reservations,
      total: reservations.length,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des réservations:', error);
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
