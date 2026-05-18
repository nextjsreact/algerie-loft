import { createClient } from '@/lib/supabase/server';
import type {
  AirbnbReservationInput,
  AirbnbReservationParsed,
  AirbnbReservationStaging,
  AirbnbSyncType,
  ValidationError,
  AirbnbSyncMetrics,
  AirbnbSyncError,
  AirbnbSyncWarning,
} from '@/lib/types/airbnb';
import { translateAirbnbStatus } from '@/lib/utils/airbnb-status-translator';

/**
 * Service de synchronisation Airbnb
 * Gère la validation, le mapping, la réconciliation et la détection de conflits
 */
export class AirbnbSyncService {
  private supabase: Awaited<ReturnType<typeof createClient>>;
  private syncBatchId: string;
  private syncType: AirbnbSyncType;
  private metrics: AirbnbSyncMetrics;
  private errors: AirbnbSyncError[];
  private warnings: AirbnbSyncWarning[];

  private constructor(
    supabase: Awaited<ReturnType<typeof createClient>>,
    syncBatchId: string,
    syncType: AirbnbSyncType
  ) {
    this.supabase = supabase;
    this.syncBatchId = syncBatchId;
    this.syncType = syncType;
    this.metrics = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      conflicts: 0,
    };
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Créer une instance du service (factory method)
   */
  static async create(syncBatchId: string, syncType: AirbnbSyncType): Promise<AirbnbSyncService> {
    const supabase = await createClient(true); // useServiceRole = true
    return new AirbnbSyncService(supabase, syncBatchId, syncType);
  }

  /**
   * Traite une liste de réservations Airbnb
   */
  async processReservations(reservations: AirbnbReservationInput[]): Promise<void> {
    for (const reservation of reservations) {
      try {
        await this.processReservation(reservation);
        this.metrics.processed++;
      } catch (error) {
        console.error(`[Airbnb Sync] Error processing reservation ${reservation.id}:`, error);
        this.errors.push({
          reservation_id: reservation.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          details: error,
        });
        this.metrics.failed++;
      }
    }
  }

  /**
   * Traite une réservation individuelle
   */
  private async processReservation(input: AirbnbReservationInput): Promise<void> {
    // 1. Parser et valider les données
    const parsed = this.parseReservation(input);
    const validationErrors = this.validateReservation(parsed);

    if (validationErrors.length > 0) {
      await this.insertStaging(input, parsed, 'invalid', validationErrors);
      this.errors.push({
        reservation_id: input.id,
        error: 'Validation failed',
        details: validationErrors,
      });
      this.metrics.failed++;
      return;
    }

    // 2. Mapper listing_id → loft_id
    const loftId = await this.mapListingIdToLoftId(parsed.listing_id);

    if (!loftId) {
      await this.insertStaging(input, parsed, 'valid', [], 'failed');
      this.warnings.push({
        reservation_id: input.id,
        warning: `Listing ID ${parsed.listing_id} not mapped to any loft`,
        details: { listing_id: parsed.listing_id },
      });
      this.metrics.skipped++;
      return;
    }

    // 3. Insérer dans staging avec mapping réussi
    const stagingId = await this.insertStaging(input, parsed, 'valid', [], 'mapped', loftId);

    // 4. Réconcilier avec la table reservations
    const { action, reservationId } = await this.reconcileReservation(parsed, loftId);

    // 5. Mettre à jour le staging avec le résultat de la réconciliation
    await this.updateStagingReconciliation(stagingId, action, reservationId);

    // 6. Détecter les conflits
    if (action === 'create' || action === 'update') {
      const conflicts = await this.detectConflicts(loftId, parsed.check_in_date, parsed.check_out_date, reservationId);
      if (conflicts > 0) {
        this.metrics.conflicts += conflicts;
      }
    }

    // 7. Mettre à jour les métriques
    if (action === 'create') {
      this.metrics.created++;
    } else if (action === 'update') {
      this.metrics.updated++;
    } else {
      this.metrics.skipped++;
    }
  }

  /**
   * Parse une réservation du format français vers le format DB
   */
  private parseReservation(input: AirbnbReservationInput): AirbnbReservationParsed {
    return {
      airbnb_id: input.id,
      listing_id: input.listing_id,
      guest_name: input.voyageur,
      guest_count: input.nb_voyageurs,
      check_in_date: input.date_arrivee,
      check_out_date: input.date_depart,
      nights: input.nb_nuits,
      base_price: input.base_price || 0,
      cleaning_fee: input.cleaning_fee || 0,
      service_fee: input.service_fee || 0,
      taxes: input.taxes || 0,
      total_amount: input.montant_total,
      currency_code: input.devise,
      status: translateAirbnbStatus(input.statut),
      guest_email: input.guest_email || undefined,
      guest_phone: input.guest_phone || undefined,
      guest_nationality: input.guest_nationality || undefined,
      special_requests: input.special_requests || undefined,
    };
  }

  /**
   * Valide une réservation parsée
   */
  private validateReservation(parsed: AirbnbReservationParsed): ValidationError[] {
    const errors: ValidationError[] = [];

    // Vérifier les montants
    if (parsed.total_amount < 0) {
      errors.push({ field: 'total_amount', message: 'Total amount must be >= 0', value: parsed.total_amount });
    }
    if (parsed.base_price < 0) {
      errors.push({ field: 'base_price', message: 'Base price must be >= 0', value: parsed.base_price });
    }

    // Vérifier les dates
    const checkIn = new Date(parsed.check_in_date);
    const checkOut = new Date(parsed.check_out_date);
    if (checkIn >= checkOut) {
      errors.push({
        field: 'dates',
        message: 'Check-in date must be before check-out date',
        value: { check_in: parsed.check_in_date, check_out: parsed.check_out_date },
      });
    }

    // Vérifier le nombre de voyageurs
    if (parsed.guest_count <= 0) {
      errors.push({ field: 'guest_count', message: 'Guest count must be > 0', value: parsed.guest_count });
    }

    // Vérifier le nombre de nuits
    if (parsed.nights <= 0) {
      errors.push({ field: 'nights', message: 'Nights must be > 0', value: parsed.nights });
    }

    // Vérifier l'email si présent
    if (parsed.guest_email && !this.isValidEmail(parsed.guest_email)) {
      errors.push({ field: 'guest_email', message: 'Invalid email format', value: parsed.guest_email });
    }

    return errors;
  }

  /**
   * Valide un email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Mappe un listing_id Airbnb vers un loft_id
   */
  private async mapListingIdToLoftId(listingId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('lofts')
      .select('id')
      .eq('airbnb_listing_id', listingId)
      .single();

    if (error || !data) {
      console.warn(`[Airbnb Sync] Listing ID ${listingId} not found in lofts table`);
      return null;
    }

    return data.id;
  }

  /**
   * Insère une réservation dans la table staging
   */
  private async insertStaging(
    input: AirbnbReservationInput,
    parsed: AirbnbReservationParsed,
    validationStatus: 'valid' | 'invalid',
    validationErrors: ValidationError[],
    mappingStatus: 'pending' | 'mapped' | 'failed' = 'pending',
    loftId?: string
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('airbnb_reservations_staging')
      .insert({
        airbnb_id: parsed.airbnb_id,
        listing_id: parsed.listing_id,
        raw_data: input,
        guest_name: parsed.guest_name,
        guest_count: parsed.guest_count,
        check_in_date: parsed.check_in_date,
        check_out_date: parsed.check_out_date,
        nights: parsed.nights,
        base_price: parsed.base_price,
        cleaning_fee: parsed.cleaning_fee,
        service_fee: parsed.service_fee,
        taxes: parsed.taxes,
        total_amount: parsed.total_amount,
        currency_code: parsed.currency_code,
        status: parsed.status,
        guest_email: parsed.guest_email,
        guest_phone: parsed.guest_phone,
        guest_nationality: parsed.guest_nationality,
        special_requests: parsed.special_requests,
        loft_id: loftId,
        mapping_status: mappingStatus,
        validation_status: validationStatus,
        validation_errors: validationErrors.length > 0 ? validationErrors : null,
        sync_type: this.syncType,
        sync_batch_id: this.syncBatchId,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to insert staging: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Réconcilie une réservation avec la table reservations
   */
  private async reconcileReservation(
    parsed: AirbnbReservationParsed,
    loftId: string
  ): Promise<{ action: 'create' | 'update' | 'skip'; reservationId: string | null }> {
    // Vérifier si la réservation existe déjà
    const { data: existing, error } = await this.supabase
      .from('reservations')
      .select('id, status, total_amount')
      .eq('airbnb_confirmation_code', parsed.airbnb_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw new Error(`Failed to check existing reservation: ${error.message}`);
    }

    if (existing) {
      // Réservation existe → UPDATE
      const { error: updateError } = await this.supabase
        .from('reservations')
        .update({
          loft_id: loftId,
          check_in_date: parsed.check_in_date,
          check_out_date: parsed.check_out_date,
          guest_name: parsed.guest_name,
          guest_count: parsed.guest_count,
          // nights est calculé automatiquement par la DB (colonne GENERATED)
          base_price: parsed.base_price,
          cleaning_fee: parsed.cleaning_fee,
          service_fee: parsed.service_fee,
          taxes: parsed.taxes,
          total_amount: parsed.total_amount,
          currency_code: parsed.currency_code,
          status: parsed.status,
          guest_email: parsed.guest_email || null,
          guest_phone: parsed.guest_phone || 'N/A',
          guest_nationality: parsed.guest_nationality || null,
          special_requests: parsed.special_requests || null,
          source: 'airbnb_scraper',
          synced_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        throw new Error(`Failed to update reservation: ${updateError.message}`);
      }

      return { action: 'update', reservationId: existing.id };
    } else {
      // Réservation n'existe pas → CREATE
      const { data: newReservation, error: insertError } = await this.supabase
        .from('reservations')
        .insert({
          loft_id: loftId,
          check_in_date: parsed.check_in_date,
          check_out_date: parsed.check_out_date,
          guest_name: parsed.guest_name,
          guest_count: parsed.guest_count,
          // nights est calculé automatiquement par la DB (colonne GENERATED)
          base_price: parsed.base_price,
          cleaning_fee: parsed.cleaning_fee,
          service_fee: parsed.service_fee,
          taxes: parsed.taxes,
          total_amount: parsed.total_amount,
          currency_code: parsed.currency_code,
          status: parsed.status,
          guest_email: parsed.guest_email || null,
          guest_phone: parsed.guest_phone || 'N/A',
          guest_nationality: parsed.guest_nationality || null,
          special_requests: parsed.special_requests || null,
          airbnb_confirmation_code: parsed.airbnb_id,
          source: 'airbnb_scraper',
          synced_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Failed to create reservation: ${insertError.message}`);
      }

      return { action: 'create', reservationId: newReservation.id };
    }
  }

  /**
   * Met à jour le statut de réconciliation dans staging
   */
  private async updateStagingReconciliation(
    stagingId: string,
    action: 'create' | 'update' | 'skip',
    reservationId: string | null
  ): Promise<void> {
    const status = action === 'skip' ? 'skipped' : action === 'create' ? 'created' : 'updated';

    const { error } = await this.supabase
      .from('airbnb_reservations_staging')
      .update({
        reservation_id: reservationId,
        reconciliation_status: status,
        reconciliation_action: action,
        processed_at: new Date().toISOString(),
      })
      .eq('id', stagingId);

    if (error) {
      console.error(`[Airbnb Sync] Failed to update staging reconciliation:`, error);
    }
  }

  /**
   * Détecte les conflits de réservation
   */
  private async detectConflicts(
    loftId: string,
    checkIn: string,
    checkOut: string,
    excludeReservationId: string | null
  ): Promise<number> {
    // Chercher les réservations qui se chevauchent
    let query = this.supabase
      .from('reservations')
      .select('id, check_in_date, check_out_date')
      .eq('loft_id', loftId)
      .in('status', ['confirmed', 'pending'])
      .lt('check_in_date', checkOut)
      .gt('check_out_date', checkIn);

    if (excludeReservationId) {
      query = query.neq('id', excludeReservationId);
    }

    const { data: conflicts, error } = await query;

    if (error) {
      console.error(`[Airbnb Sync] Failed to detect conflicts:`, error);
      return 0;
    }

    if (!conflicts || conflicts.length === 0) {
      return 0;
    }

    // Insérer les conflits dans la table airbnb_conflicts
    for (const conflict of conflicts) {
      const overlapStart = new Date(Math.max(new Date(checkIn).getTime(), new Date(conflict.check_in_date).getTime()));
      const overlapEnd = new Date(Math.min(new Date(checkOut).getTime(), new Date(conflict.check_out_date).getTime()));
      const overlapNights = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));

      await this.supabase.from('airbnb_conflicts').insert({
        loft_id: loftId,
        reservation_1_id: excludeReservationId,
        reservation_2_id: conflict.id,
        overlap_start: overlapStart.toISOString().split('T')[0],
        overlap_end: overlapEnd.toISOString().split('T')[0],
        overlap_nights: overlapNights,
        severity: 'critical',
        status: 'open',
        notification_sent: false,
      });
    }

    return conflicts.length;
  }

  /**
   * Retourne les métriques de synchronisation
   */
  getMetrics(): AirbnbSyncMetrics {
    return this.metrics;
  }

  /**
   * Retourne les erreurs de synchronisation
   */
  getErrors(): AirbnbSyncError[] {
    return this.errors;
  }

  /**
   * Retourne les avertissements de synchronisation
   */
  getWarnings(): AirbnbSyncWarning[] {
    return this.warnings;
  }
}
