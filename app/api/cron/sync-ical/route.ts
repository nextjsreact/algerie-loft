/**
 * API Route: Cron Sync iCal
 * 
 * Endpoint déclenché par Vercel Cron toutes les 30 minutes.
 * Synchronise les calendriers iCal Airbnb pour tous les lofts actifs.
 * 
 * POST /api/cron/sync-ical
 * Headers: Authorization: Bearer {CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAndParseICal } from '@/lib/sync/icalFetcher';
import { processBatch } from '@/lib/sync/batchProcessor';
import { BookingRepository } from '@/lib/repositories/bookingRepository';
import { detectConflicts } from '@/lib/sync/conflictDetector';

// Types
interface PropertySyncConfig {
  id: string;
  loft_id: string;
  ical_url_airbnb: string;
  is_active: boolean;
}

interface SyncMetrics {
  properties_synced: number;
  bookings_created: number;
  bookings_updated: number;
  conflicts_detected: number;
  errors_count: number;
}

/**
 * Valide le token CRON_SECRET
 */
function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return false;
  }

  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  return token === cronSecret;
}

/**
 * Récupère les configurations de sync actives
 */
async function getActiveSyncConfigs(supabase: any): Promise<PropertySyncConfig[]> {
  const { data, error } = await supabase
    .from('property_sync_config')
    .select('id, loft_id, ical_url_airbnb, is_active')
    .eq('is_active', true)
    .not('ical_url_airbnb', 'is', null);

  if (error) {
    console.error('Error fetching sync configs:', error);
    return [];
  }

  return data || [];
}

/**
 * Synchronise un loft (fetch iCal + store bookings + detect conflicts)
 */
async function syncLoft(
  config: PropertySyncConfig,
  bookingRepo: BookingRepository,
  supabase: any
): Promise<{
  success: boolean;
  bookings_created: number;
  bookings_updated: number;
  conflicts_detected: number;
  error?: string;
}> {
  try {
    // 1. Fetch et parse iCal
    const icalResult = await fetchAndParseICal(config.ical_url_airbnb, {
      timeout: 10000,
      retries: 3,
      retryDelay: 2000,
    });

    if (!icalResult.success) {
      // Mettre à jour le statut de sync
      await supabase
        .from('property_sync_config')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'error',
        })
        .eq('id', config.id);

      return {
        success: false,
        bookings_created: 0,
        bookings_updated: 0,
        conflicts_detected: 0,
        error: icalResult.error,
      };
    }

    let bookings_created = 0;
    let bookings_updated = 0;
    let conflicts_detected = 0;

    // 2. Pour chaque réservation iCal
    for (const reservation of icalResult.reservations) {
      // Vérifier si la réservation existe déjà (même loft, mêmes dates)
      const existing = await bookingRepo.findByLoftAndDates(
        config.loft_id,
        reservation.check_in_date,
        reservation.check_out_date
      );

      if (existing) {
        // Réservation existe déjà, skip (ou update si nécessaire)
        bookings_updated++;
        continue;
      }

      // Créer la nouvelle réservation (Partial_Reservation)
      const createResult = await bookingRepo.createBooking({
        loft_id: config.loft_id,
        source: 'airbnb_ical',
        external_id: reservation.external_id,
        status: 'confirmed',
        check_in_date: reservation.check_in_date,
        check_out_date: reservation.check_out_date,
        is_complete: false,
        csv_only_flag: false,
        raw_data: {
          summary: reservation.summary,
          raw_ical: reservation.raw_ical,
        },
      });

      if (createResult.success && createResult.booking) {
        bookings_created++;

        // 3. Détecter les conflits pour cette nouvelle réservation
        const existingBookings = await bookingRepo.getBookings({
          loft_id: config.loft_id,
          date_from: reservation.check_in_date,
          date_to: reservation.check_out_date,
        });

        const conflictResult = detectConflicts(
          createResult.booking,
          existingBookings.filter(b => b.id !== createResult.booking!.id)
        );

        if (conflictResult.hasConflicts) {
          // Créer les enregistrements de conflits
          for (const conflict of conflictResult.conflicts) {
            await supabase.from('airbnb_conflicts').insert({
              loft_id: conflict.loft_id,
              booking_id_1: conflict.booking_id_1,
              booking_id_2: conflict.booking_id_2,
              severity: conflict.severity,
              status: conflict.status,
              overlap_start: conflict.overlap_start.toISOString().split('T')[0],
              overlap_end: conflict.overlap_end.toISOString().split('T')[0],
              details: conflict.details,
            });
          }

          conflicts_detected += conflictResult.conflicts.length;
        }
      } else if (createResult.isDuplicate) {
        // Duplicate détecté par la contrainte unique, c'est OK
        bookings_updated++;
      }
    }

    // Mettre à jour le statut de sync
    await supabase
      .from('property_sync_config')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
      })
      .eq('id', config.id);

    return {
      success: true,
      bookings_created,
      bookings_updated,
      conflicts_detected,
    };
  } catch (error) {
    console.error(`Error syncing loft ${config.loft_id}:`, error);

    // Mettre à jour le statut de sync
    await supabase
      .from('property_sync_config')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'error',
      })
      .eq('id', config.id);

    return {
      success: false,
      bookings_created: 0,
      bookings_updated: 0,
      conflicts_detected: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * POST /api/cron/sync-ical
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Valider le token CRON_SECRET
    if (!validateCronSecret(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Initialiser Supabase avec service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const bookingRepo = new BookingRepository({ supabaseClient: supabase });

    // 3. Récupérer les configurations de sync actives
    const configs = await getActiveSyncConfigs(supabase);

    if (configs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active sync configurations found',
        metrics: {
          properties_synced: 0,
          bookings_created: 0,
          bookings_updated: 0,
          conflicts_detected: 0,
          errors_count: 0,
        },
      });
    }

    // 4. Traiter en batches (20 lofts par batch, 25s max par batch)
    const batchResult = await processBatch(
      configs,
      async (config) => syncLoft(config, bookingRepo, supabase),
      {
        batchSize: 20,
        maxBatchDuration: 25000,
        continueOnError: true,
      }
    );

    // 5. Calculer les métriques globales
    const metrics: SyncMetrics = {
      properties_synced: batchResult.totalProcessed,
      bookings_created: 0,
      bookings_updated: 0,
      conflicts_detected: 0,
      errors_count: batchResult.totalErrors,
    };

    for (const batch of batchResult.batches) {
      for (const result of batch.results) {
        metrics.bookings_created += result.bookings_created;
        metrics.bookings_updated += result.bookings_updated;
        metrics.conflicts_detected += result.conflicts_detected;
      }
    }

    const duration = Date.now() - startTime;

    // 6. Créer un log de sync
    await supabase.from('airbnb_sync_logs').insert({
      sync_type: 'ical_auto',
      status: batchResult.success ? 'success' : 'partial',
      severity: batchResult.totalErrors > 0 ? 'warning' : 'info',
      properties_synced: metrics.properties_synced,
      bookings_created: metrics.bookings_created,
      bookings_updated: metrics.bookings_updated,
      conflicts_detected: metrics.conflicts_detected,
      errors_count: metrics.errors_count,
      duration_ms: duration,
      error_details: batchResult.batches
        .filter(b => !b.success)
        .map(b => ({
          batchIndex: b.batchIndex,
          errors: b.errors,
        })),
    });

    // 7. Retourner le résultat
    return NextResponse.json({
      success: batchResult.success,
      metrics,
      duration_ms: duration,
      batches_processed: batchResult.batches.length,
    });
  } catch (error) {
    console.error('Cron sync error:', error);

    const duration = Date.now() - startTime;

    // Log l'erreur
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase.from('airbnb_sync_logs').insert({
          sync_type: 'ical_auto',
          status: 'error',
          severity: 'error',
          properties_synced: 0,
          bookings_created: 0,
          bookings_updated: 0,
          conflicts_detected: 0,
          errors_count: 1,
          duration_ms: duration,
          error_details: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          },
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Désactiver le cache pour les cron jobs
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
