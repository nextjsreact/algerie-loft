/**
 * Conflict Detector - Détecte les chevauchements de réservations
 * 
 * Ce module détecte automatiquement les conflits de dates entre réservations
 * pour éviter les doubles réservations.
 */

import { isBefore, isAfter, max, min } from 'date-fns';
import type { AirbnbBooking } from '../repositories/bookingRepository';
import { getAlertService } from '../services/alertService';

/**
 * Interface pour un conflit détecté
 */
export interface BookingConflict {
  id?: string;
  loft_id: string;
  booking_id_1: string;
  booking_id_2: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'active' | 'resolved' | 'ignored';
  overlap_start: Date;
  overlap_end: Date;
  details?: {
    booking_1_source?: string;
    booking_2_source?: string;
    booking_1_status?: string;
    booking_2_status?: string;
    overlap_days?: number;
  };
  created_at?: Date;
  resolved_at?: Date;
}

/**
 * Résultat de la détection de conflits
 */
export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: BookingConflict[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

/**
 * Vérifie si deux réservations se chevauchent
 * 
 * Logique: (new_checkin < existing_checkout) AND (new_checkout > existing_checkin)
 * 
 * @param booking1 - Première réservation
 * @param booking2 - Deuxième réservation
 * @returns true si les réservations se chevauchent
 */
export function doBookingsOverlap(
  booking1: Pick<AirbnbBooking, 'check_in_date' | 'check_out_date'>,
  booking2: Pick<AirbnbBooking, 'check_in_date' | 'check_out_date'>
): boolean {
  return (
    isBefore(booking1.check_in_date, booking2.check_out_date) &&
    isAfter(booking1.check_out_date, booking2.check_in_date)
  );
}

/**
 * Calcule la période de chevauchement entre deux réservations
 * 
 * @param booking1 - Première réservation
 * @param booking2 - Deuxième réservation
 * @returns Dates de début et fin du chevauchement, ou null si pas de chevauchement
 */
export function calculateOverlap(
  booking1: Pick<AirbnbBooking, 'check_in_date' | 'check_out_date'>,
  booking2: Pick<AirbnbBooking, 'check_in_date' | 'check_out_date'>
): { start: Date; end: Date } | null {
  if (!doBookingsOverlap(booking1, booking2)) {
    return null;
  }

  const overlapStart = max([booking1.check_in_date, booking2.check_in_date]);
  const overlapEnd = min([booking1.check_out_date, booking2.check_out_date]);

  return {
    start: overlapStart,
    end: overlapEnd,
  };
}

/**
 * Calcule le nombre de jours de chevauchement
 */
export function calculateOverlapDays(
  booking1: Pick<AirbnbBooking, 'check_in_date' | 'check_out_date'>,
  booking2: Pick<AirbnbBooking, 'check_in_date' | 'check_out_date'>
): number {
  const overlap = calculateOverlap(booking1, booking2);
  if (!overlap) return 0;

  const diffTime = overlap.end.getTime() - overlap.start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Détermine la sévérité d'un conflit
 * 
 * - critical: Les deux réservations sont confirmées ou checked_in
 * - warning: Une réservation est pending
 * - info: Une réservation est cancelled
 */
export function determineConflictSeverity(
  booking1: Pick<AirbnbBooking, 'status'>,
  booking2: Pick<AirbnbBooking, 'status'>
): 'info' | 'warning' | 'critical' {
  const confirmedStatuses = ['confirmed', 'checked_in'];
  const pendingStatuses = ['pending'];
  const cancelledStatuses = ['cancelled', 'checked_out'];

  // Si l'une est annulée, c'est juste informatif
  if (
    cancelledStatuses.includes(booking1.status) ||
    cancelledStatuses.includes(booking2.status)
  ) {
    return 'info';
  }

  // Si l'une est en attente, c'est un warning
  if (
    pendingStatuses.includes(booking1.status) ||
    pendingStatuses.includes(booking2.status)
  ) {
    return 'warning';
  }

  // Si les deux sont confirmées, c'est critique
  if (
    confirmedStatuses.includes(booking1.status) &&
    confirmedStatuses.includes(booking2.status)
  ) {
    return 'critical';
  }

  return 'warning';
}

/**
 * Détecte les conflits entre une nouvelle réservation et des réservations existantes
 * 
 * @param newBooking - Nouvelle réservation à vérifier
 * @param existingBookings - Réservations existantes pour le même loft
 * @returns Résultat de la détection avec liste des conflits
 */
export function detectConflicts(
  newBooking: AirbnbBooking,
  existingBookings: AirbnbBooking[]
): ConflictDetectionResult {
  const conflicts: BookingConflict[] = [];

  for (const existing of existingBookings) {
    // Skip si c'est la même réservation
    if (existing.id === newBooking.id) {
      continue;
    }

    // Skip si pas de chevauchement
    if (!doBookingsOverlap(newBooking, existing)) {
      continue;
    }

    // Calculer le chevauchement
    const overlap = calculateOverlap(newBooking, existing);
    if (!overlap) continue;

    // Déterminer la sévérité
    const severity = determineConflictSeverity(newBooking, existing);

    // Créer le conflit
    const conflict: BookingConflict = {
      loft_id: newBooking.loft_id,
      booking_id_1: newBooking.id!,
      booking_id_2: existing.id!,
      severity,
      status: 'active',
      overlap_start: overlap.start,
      overlap_end: overlap.end,
      details: {
        booking_1_source: newBooking.source,
        booking_2_source: existing.source,
        booking_1_status: newBooking.status,
        booking_2_status: existing.status,
        overlap_days: calculateOverlapDays(newBooking, existing),
      },
    };

    conflicts.push(conflict);
  }

  // Compter par sévérité
  const criticalCount = conflicts.filter(c => c.severity === 'critical').length;
  const warningCount = conflicts.filter(c => c.severity === 'warning').length;
  const infoCount = conflicts.filter(c => c.severity === 'info').length;

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    criticalCount,
    warningCount,
    infoCount,
  };
}

/**
 * Détecte tous les conflits dans un ensemble de réservations
 * Utile pour vérifier l'intégrité globale
 * 
 * @param bookings - Liste de toutes les réservations à vérifier
 * @returns Résultat de la détection avec tous les conflits trouvés
 */
export function detectAllConflicts(
  bookings: AirbnbBooking[]
): ConflictDetectionResult {
  const allConflicts: BookingConflict[] = [];
  const processedPairs = new Set<string>();

  // Grouper par loft_id
  const bookingsByLoft = new Map<string, AirbnbBooking[]>();
  for (const booking of bookings) {
    if (!bookingsByLoft.has(booking.loft_id)) {
      bookingsByLoft.set(booking.loft_id, []);
    }
    bookingsByLoft.get(booking.loft_id)!.push(booking);
  }

  // Vérifier les conflits pour chaque loft
  for (const [loft_id, loftBookings] of bookingsByLoft) {
    for (let i = 0; i < loftBookings.length; i++) {
      for (let j = i + 1; j < loftBookings.length; j++) {
        const booking1 = loftBookings[i];
        const booking2 = loftBookings[j];

        // Créer une clé unique pour cette paire
        const pairKey = [booking1.id, booking2.id].sort().join('-');
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        // Vérifier le chevauchement
        if (!doBookingsOverlap(booking1, booking2)) continue;

        const overlap = calculateOverlap(booking1, booking2);
        if (!overlap) continue;

        const severity = determineConflictSeverity(booking1, booking2);

        allConflicts.push({
          loft_id,
          booking_id_1: booking1.id!,
          booking_id_2: booking2.id!,
          severity,
          status: 'active',
          overlap_start: overlap.start,
          overlap_end: overlap.end,
          details: {
            booking_1_source: booking1.source,
            booking_2_source: booking2.source,
            booking_1_status: booking1.status,
            booking_2_status: booking2.status,
            overlap_days: calculateOverlapDays(booking1, booking2),
          },
        });
      }
    }
  }

  const criticalCount = allConflicts.filter(c => c.severity === 'critical').length;
  const warningCount = allConflicts.filter(c => c.severity === 'warning').length;
  const infoCount = allConflicts.filter(c => c.severity === 'info').length;

  return {
    hasConflicts: allConflicts.length > 0,
    conflicts: allConflicts,
    criticalCount,
    warningCount,
    infoCount,
  };
}

/**
 * Réévalue les conflits après l'annulation d'une réservation
 * Marque les conflits impliquant cette réservation comme résolus
 * 
 * @param cancelledBookingId - ID de la réservation annulée
 * @param existingConflicts - Conflits existants
 * @returns Conflits mis à jour
 */
export function reevaluateConflictsAfterCancellation(
  cancelledBookingId: string,
  existingConflicts: BookingConflict[]
): BookingConflict[] {
  return existingConflicts.map(conflict => {
    if (
      conflict.booking_id_1 === cancelledBookingId ||
      conflict.booking_id_2 === cancelledBookingId
    ) {
      return {
        ...conflict,
        status: 'resolved' as const,
        severity: 'info' as const,
        resolved_at: new Date(),
      };
    }
    return conflict;
  });
}

/**
 * Filtre les conflits par sévérité
 */
export function filterConflictsBySeverity(
  conflicts: BookingConflict[],
  severity: 'info' | 'warning' | 'critical'
): BookingConflict[] {
  return conflicts.filter(c => c.severity === severity);
}

/**
 * Filtre les conflits actifs uniquement
 */
export function getActiveConflicts(conflicts: BookingConflict[]): BookingConflict[] {
  return conflicts.filter(c => c.status === 'active');
}

/**
 * Obtient les conflits critiques actifs (nécessitent une action immédiate)
 */
export function getCriticalActiveConflicts(conflicts: BookingConflict[]): BookingConflict[] {
  return conflicts.filter(c => c.severity === 'critical' && c.status === 'active');
}

/**
 * Envoie des alertes pour les conflits détectés
 * 
 * @param conflicts - Liste des conflits à notifier
 * @param loftNames - Map des loft_id vers les noms de lofts
 * @param bookings - Map des booking_id vers les réservations complètes
 * @returns Résultat de l'envoi d'alertes
 */
export async function sendConflictAlerts(
  conflicts: BookingConflict[],
  loftNames: Map<string, string>,
  bookings: Map<string, AirbnbBooking>
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const alertService = getAlertService();
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;

  // Ne notifier que les conflits critiques actifs
  const criticalConflicts = getCriticalActiveConflicts(conflicts);

  if (criticalConflicts.length === 0) {
    console.log('✅ Aucun conflit critique à notifier');
    return { sent: 0, failed: 0, errors: [] };
  }

  console.log(`📧 Envoi d'alertes pour ${criticalConflicts.length} conflit(s) critique(s)...`);

  // Préparer les conflits pour l'envoi
  const conflictsToSend = criticalConflicts.map(conflict => {
    const booking1 = bookings.get(conflict.booking_id_1);
    const booking2 = bookings.get(conflict.booking_id_2);

    return {
      id: conflict.id || '',
      loft_id: conflict.loft_id,
      loft_name: loftNames.get(conflict.loft_id) || `Loft ${conflict.loft_id}`,
      booking1_id: conflict.booking_id_1,
      booking2_id: conflict.booking_id_2,
      booking1_guest: booking1?.guest_name,
      booking2_guest: booking2?.guest_name,
      overlap_start: conflict.overlap_start,
      overlap_end: conflict.overlap_end,
      severity: conflict.severity,
      created_at: conflict.created_at || new Date(),
    };
  });

  try {
    // Envoyer en batch (tous les conflits en un seul email)
    const result = await alertService.sendBatchConflictAlert(conflictsToSend);

    if (result.success) {
      sent = conflictsToSend.length;
      console.log(`✅ Alerte envoyée avec succès (${result.attempts} tentative(s))`);
    } else {
      failed = conflictsToSend.length;
      const errorMsg = `Échec d'envoi d'alerte: ${result.error}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  } catch (error) {
    failed = conflictsToSend.length;
    const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
    errors.push(errorMsg);
    console.error(`❌ Erreur lors de l'envoi d'alertes:`, error);
  }

  return { sent, failed, errors };
}

/**
 * Détecte les conflits et envoie des alertes automatiquement
 * 
 * Version tout-en-un qui combine détection et notification
 * 
 * @param newBooking - Nouvelle réservation à vérifier
 * @param existingBookings - Réservations existantes pour le même loft
 * @param loftName - Nom du loft (pour l'alerte)
 * @returns Résultat de la détection avec statut d'envoi d'alerte
 */
export async function detectConflictsAndAlert(
  newBooking: AirbnbBooking,
  existingBookings: AirbnbBooking[],
  loftName: string
): Promise<ConflictDetectionResult & { alertSent: boolean; alertError?: string }> {
  // Détecter les conflits
  const result = detectConflicts(newBooking, existingBookings);

  // Si pas de conflits critiques, pas besoin d'alerte
  if (result.criticalCount === 0) {
    return { ...result, alertSent: false };
  }

  // Préparer les maps pour l'envoi d'alertes
  const loftNames = new Map([[newBooking.loft_id, loftName]]);
  const bookingsMap = new Map<string, AirbnbBooking>();
  bookingsMap.set(newBooking.id!, newBooking);
  existingBookings.forEach(b => {
    if (b.id) bookingsMap.set(b.id, b);
  });

  // Envoyer les alertes
  const alertResult = await sendConflictAlerts(result.conflicts, loftNames, bookingsMap);

  return {
    ...result,
    alertSent: alertResult.sent > 0,
    alertError: alertResult.errors.length > 0 ? alertResult.errors.join('; ') : undefined,
  };
}
