/**
 * API Route: Manual CSV Import
 * 
 * Permet aux admins d'uploader manuellement un fichier CSV Airbnb
 * pour enrichir les réservations existantes ou en créer de nouvelles.
 * 
 * POST /api/import/csv
 * - Authentification: JWT token (admin uniquement)
 * - Content-Type: multipart/form-data
 * - Body: { file: File }
 * - Max size: 5MB
 * - Max reservations: 1000
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseAirbnbCSV, validateCSVFormat } from '@/lib/sync/csvParser';
import { createReservationMatcher } from '@/lib/sync/reservationMatcher';
import { createBookingRepository } from '@/lib/repositories/bookingRepository';

/**
 * Vérifie que l'utilisateur est authentifié et admin
 */
async function verifyAdmin(request: NextRequest): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Token manquant' };
    }

    const token = authHeader.substring(7);

    // Créer un client Supabase avec le token utilisateur
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

    // Vérifier l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { valid: false, error: 'Token invalide' };
    }

    // Vérifier le rôle admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { valid: false, error: 'Profil non trouvé' };
    }

    if (profile.role !== 'admin' && profile.role !== 'superuser') {
      return { valid: false, error: 'Accès refusé: admin requis' };
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
 * Extrait le fichier CSV depuis la requête multipart
 */
async function extractCSVFile(request: NextRequest): Promise<{
  success: boolean;
  content?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return { success: false, error: 'Aucun fichier fourni' };
    }

    // Vérifier le type de fichier
    if (!file.name.endsWith('.csv')) {
      return { success: false, error: 'Le fichier doit être un CSV' };
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'Fichier trop volumineux (max 5MB)' };
    }

    // Lire le contenu
    const content = await file.text();

    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Fichier vide' };
    }

    return {
      success: true,
      content,
      filename: file.name,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur de lecture du fichier',
    };
  }
}

/**
 * POST /api/import/csv
 * Upload et traite un fichier CSV Airbnb
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Vérifier l'authentification admin
    const authResult = await verifyAdmin(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // 2. Extraire le fichier CSV
    const fileResult = await extractCSVFile(request);
    if (!fileResult.success) {
      return NextResponse.json(
        { error: fileResult.error },
        { status: 400 }
      );
    }

    const csvContent = fileResult.content!;
    const filename = fileResult.filename!;

    // 3. Valider le format CSV
    const validation = validateCSVFormat(csvContent);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Format CSV invalide',
          details: validation.error,
        },
        { status: 400 }
      );
    }

    // 4. Parser le CSV
    const parseResult = parseAirbnbCSV(csvContent);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'Erreur de parsing CSV',
          total_lines: parseResult.total_lines,
          parsed_lines: parseResult.parsed_lines,
          errors: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // Vérifier la limite de 1000 réservations
    if (parseResult.reservations.length > 1000) {
      return NextResponse.json(
        {
          error: 'Trop de réservations',
          details: `Le fichier contient ${parseResult.reservations.length} réservations (max: 1000)`,
        },
        { status: 400 }
      );
    }

    // 5. Créer le repository et le matcher
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const repository = createBookingRepository({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });

    const matcher = createReservationMatcher(repository);

    // 6. Charger le mapping des lofts
    await matcher.loadLoftMapping(supabase);

    // 7. Matcher les entrées CSV avec les réservations iCal
    const matchingReport = await matcher.matchCSVEntries(parseResult.reservations, {
      allow_fuzzy_match: true,
      fuzzy_tolerance_days: 1,
      require_both_dates_fuzzy: true,
    });

    // 8. Traiter le rapport de matching (enrichir + créer)
    const processResult = await matcher.processMatchingReport(matchingReport);

    // 9. Logger l'import dans sync_logs
    const duration = Date.now() - startTime;

    const { error: logError } = await supabase
      .from('airbnb_sync_logs')
      .insert({
        sync_type: 'csv_manual',
        status: processResult.errors > 0 ? 'partial_success' : 'success',
        properties_synced: matchingReport.total_csv_entries,
        bookings_created: processResult.created,
        bookings_updated: processResult.enriched,
        conflicts_detected: 0,
        errors_count: processResult.errors,
        duration_ms: duration,
        metadata: {
          filename,
          user_id: authResult.userId,
          exact_matches: matchingReport.exact_matches,
          fuzzy_matches: matchingReport.fuzzy_matches,
          no_matches: matchingReport.no_matches,
          parse_errors: parseResult.errors.length,
        },
      });

    if (logError) {
      console.error('Erreur lors du logging:', logError);
    }

    // 10. Retourner les métriques
    return NextResponse.json({
      success: true,
      filename,
      duration_ms: duration,
      parsing: {
        total_lines: parseResult.total_lines,
        parsed_lines: parseResult.parsed_lines,
        parse_errors: parseResult.errors.length,
      },
      matching: {
        total_entries: matchingReport.total_csv_entries,
        exact_matches: matchingReport.exact_matches,
        fuzzy_matches: matchingReport.fuzzy_matches,
        no_matches: matchingReport.no_matches,
      },
      processing: {
        enriched: processResult.enriched,
        created: processResult.created,
        errors: processResult.errors,
      },
      error_details: [
        ...parseResult.errors.map(e => ({
          type: 'parse',
          line: e.line,
          error: e.error,
        })),
        ...processResult.error_details.map(e => ({
          type: 'process',
          listing: e.match.csv_entry.listing_name,
          error: e.error,
        })),
      ],
    });
  } catch (error) {
    console.error('Erreur lors de l\'import CSV:', error);

    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/import/csv
 * Retourne les derniers imports CSV (historique)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authResult = await verifyAdmin(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Récupérer les derniers imports CSV
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('airbnb_sync_logs')
      .select('*')
      .eq('sync_type', 'csv_manual')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imports: data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}
