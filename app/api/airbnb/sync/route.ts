import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { AirbnbSyncService } from '@/lib/services/airbnb-sync-service';
import type { AirbnbSyncRequest, AirbnbSyncResponse } from '@/lib/types/airbnb';

// ============================================================================
// VALIDATION SCHEMA (Zod)
// ============================================================================

const ReservationSchema = z.object({
  id: z.string().min(1, 'Reservation ID is required'),
  listing_id: z.string().min(1, 'Listing ID is required'),
  statut: z.string().min(1, 'Status is required'),
  voyageur: z.string().min(1, 'Guest name is required'),
  nb_voyageurs: z.number().int().positive('Guest count must be positive'),
  date_arrivee: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-in date format (expected YYYY-MM-DD)'),
  date_depart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid check-out date format (expected YYYY-MM-DD)'),
  nb_nuits: z.number().int().positive('Nights must be positive'),
  montant_total: z.number().nonnegative('Total amount must be >= 0'),
  devise: z.string().length(3, 'Currency code must be 3 characters'),
  base_price: z.number().nonnegative().optional(),
  cleaning_fee: z.number().nonnegative().optional(),
  service_fee: z.number().nonnegative().optional(),
  taxes: z.number().nonnegative().optional(),
  guest_email: z.string().email().optional().or(z.literal('')),
  guest_phone: z.string().optional(),
  guest_nationality: z.string().length(2).optional().or(z.literal('')),
  special_requests: z.string().optional(),
});

const SyncMetadataSchema = z.object({
  sync_type: z.enum(['ical_watcher', 'targeted', 'full', 'manual']),
  timestamp: z.string().datetime(),
  script_version: z.string().min(1),
});

const SyncRequestSchema = z.object({
  reservations: z.array(ReservationSchema).min(1, 'At least one reservation is required').max(100, 'Maximum 100 reservations per request'),
  sync_metadata: SyncMetadataSchema,
});

// ============================================================================
// RATE LIMITING (Simple in-memory implementation)
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

function checkRateLimit(apiKey: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(apiKey);

  if (!record || now > record.resetAt) {
    // Nouvelle fenêtre
    rateLimitMap.set(apiKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Limite atteinte
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  // Incrémenter le compteur
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetAt: record.resetAt };
}

// ============================================================================
// API ENDPOINT: POST /api/airbnb/sync
// ============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ========================================================================
    // 1. VÉRIFIER SI LA SYNCHRONISATION EST ACTIVÉE
    // ========================================================================
    const syncEnabled = process.env.AIRBNB_SYNC_ENABLED === 'true';
    if (!syncEnabled) {
      return NextResponse.json(
        { success: false, error: 'Airbnb synchronization is disabled' },
        { status: 503 }
      );
    }

    // ========================================================================
    // 2. AUTHENTIFICATION (API Key ou Requête Interne)
    // ========================================================================
    const authHeader = request.headers.get('authorization');
    const isInternalRequest = !authHeader; // Requête depuis l'interface admin
    
    let apiKey = 'internal';
    
    if (!isInternalRequest) {
      // Requête externe (script Python) - vérifier l'API Key
      if (!authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: 'Missing or invalid Authorization header' },
          { status: 401 }
        );
      }

      apiKey = authHeader.substring(7); // Remove "Bearer "
      const expectedApiKey = process.env.AIRBNB_API_SECRET;

      if (!expectedApiKey) {
        console.error('[Airbnb Sync] AIRBNB_API_SECRET not configured');
        return NextResponse.json(
          { success: false, error: 'Server configuration error' },
          { status: 500 }
        );
      }

      if (apiKey !== expectedApiKey) {
        console.warn('[Airbnb Sync] Invalid API key attempt');
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        );
      }
    } else {
      // Requête interne (interface admin) - pas besoin d'API Key
      console.log('[Airbnb Sync] Internal request from admin interface');
    }

    // ========================================================================
    // 3. RATE LIMITING
    // ========================================================================
    const rateLimit = checkRateLimit(apiKey);
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Try again in ${resetIn} seconds.` },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      );
    }

    // ========================================================================
    // 4. PARSER ET VALIDER LE PAYLOAD
    // ========================================================================
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const validation = SyncRequestSchema.safeParse(body);
    if (!validation.success) {
      console.error('[Airbnb Sync] Validation failed:', validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const syncRequest: AirbnbSyncRequest = validation.data;

    // ========================================================================
    // 5. GÉNÉRER UN SYNC_BATCH_ID
    // ========================================================================
    const syncBatchId = crypto.randomUUID();

    console.log(`[Airbnb Sync] Starting sync batch ${syncBatchId}`, {
      sync_type: syncRequest.sync_metadata.sync_type,
      reservations_count: syncRequest.reservations.length,
      script_version: syncRequest.sync_metadata.script_version,
    });

    // ========================================================================
    // 6. CRÉER UN LOG DE SYNCHRONISATION (status='started')
    // ========================================================================
    const supabase = await createClient(true); // useServiceRole = true
    const { error: logError } = await supabase.from('airbnb_sync_logs').insert({
      sync_type: syncRequest.sync_metadata.sync_type,
      sync_batch_id: syncBatchId,
      status: 'started',
      reservations_received: syncRequest.reservations.length,
      started_at: new Date().toISOString(),
      script_version: syncRequest.sync_metadata.script_version,
      triggered_by: 'api',
    });

    if (logError) {
      console.error('[Airbnb Sync] Failed to create sync log:', logError);
    }

    // ========================================================================
    // 7. TRAITER LES RÉSERVATIONS
    // ========================================================================
    const syncService = await AirbnbSyncService.create(syncBatchId, syncRequest.sync_metadata.sync_type);
    await syncService.processReservations(syncRequest.reservations);

    const metrics = syncService.getMetrics();
    const errors = syncService.getErrors();
    const warnings = syncService.getWarnings();

    // ========================================================================
    // 8. METTRE À JOUR LE LOG DE SYNCHRONISATION (status='success' ou 'partial')
    // ========================================================================
    const duration = Date.now() - startTime;
    const finalStatus = errors.length === 0 ? 'success' : metrics.created + metrics.updated > 0 ? 'partial' : 'failed';

    const { error: updateLogError } = await supabase
      .from('airbnb_sync_logs')
      .update({
        status: finalStatus,
        lofts_processed: new Set(syncRequest.reservations.map((r) => r.listing_id)).size,
        reservations_created: metrics.created,
        reservations_updated: metrics.updated,
        reservations_skipped: metrics.skipped,
        reservations_failed: metrics.failed,
        conflicts_detected: metrics.conflicts,
        errors: errors.length > 0 ? errors : null,
        warnings: warnings.length > 0 ? warnings : null,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
      })
      .eq('sync_batch_id', syncBatchId);

    if (updateLogError) {
      console.error('[Airbnb Sync] Failed to update sync log:', updateLogError);
    }

    // ========================================================================
    // 9. ENVOYER LA RÉPONSE
    // ========================================================================
    const response: AirbnbSyncResponse = {
      success: finalStatus !== 'failed',
      sync_batch_id: syncBatchId,
      metrics,
      errors,
      warnings,
    };

    console.log(`[Airbnb Sync] Completed sync batch ${syncBatchId}`, {
      status: finalStatus,
      duration_ms: duration,
      metrics,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetAt.toString(),
      },
    });
  } catch (error) {
    console.error('[Airbnb Sync] Unexpected error:', error);

    // Essayer de logger l'erreur dans la DB
    try {
      const supabase = await createClient(true);
      await supabase.from('airbnb_sync_logs').insert({
        sync_type: 'manual',
        sync_batch_id: crypto.randomUUID(),
        status: 'failed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        errors: [{ error: error instanceof Error ? error.message : 'Unknown error' }],
        triggered_by: 'api',
      });
    } catch (logError) {
      console.error('[Airbnb Sync] Failed to log error:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// MÉTHODES NON SUPPORTÉES
// ============================================================================

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to sync reservations.' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to sync reservations.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to sync reservations.' },
    { status: 405 }
  );
}
