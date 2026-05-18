/**
 * Tests pour Conflict Detector
 */

import { describe, it, expect } from 'vitest';
import {
  doBookingsOverlap,
  calculateOverlap,
  calculateOverlapDays,
  determineConflictSeverity,
  detectConflicts,
  detectAllConflicts,
  reevaluateConflictsAfterCancellation,
  getCriticalActiveConflicts,
} from '../conflictDetector';
import type { AirbnbBooking } from '../../repositories/bookingRepository';

// Helper pour créer une réservation de test
const createBooking = (
  id: string,
  checkIn: string,
  checkOut: string,
  overrides: Partial<AirbnbBooking> = {}
): AirbnbBooking => ({
  id,
  loft_id: 'loft-123',
  source: 'airbnb_ical',
  status: 'confirmed',
  check_in_date: new Date(checkIn),
  check_out_date: new Date(checkOut),
  is_complete: false,
  csv_only_flag: false,
  ...overrides,
});

describe('conflictDetector', () => {
  describe('doBookingsOverlap', () => {
    it('devrait détecter un chevauchement complet', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10');
      const booking2 = createBooking('2', '2026-06-05', '2026-06-08');

      expect(doBookingsOverlap(booking1, booking2)).toBe(true);
    });

    it('devrait détecter un chevauchement partiel (début)', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10');
      const booking2 = createBooking('2', '2026-05-28', '2026-06-05');

      expect(doBookingsOverlap(booking1, booking2)).toBe(true);
    });

    it('devrait détecter un chevauchement partiel (fin)', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10');
      const booking2 = createBooking('2', '2026-06-08', '2026-06-15');

      expect(doBookingsOverlap(booking1, booking2)).toBe(true);
    });

    it('ne devrait PAS détecter de chevauchement si les dates sont consécutives', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-05');
      const booking2 = createBooking('2', '2026-06-05', '2026-06-10');

      expect(doBookingsOverlap(booking1, booking2)).toBe(false);
    });

    it('ne devrait PAS détecter de chevauchement si les dates sont séparées', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-05');
      const booking2 = createBooking('2', '2026-06-10', '2026-06-15');

      expect(doBookingsOverlap(booking1, booking2)).toBe(false);
    });

    it('devrait être symétrique (ordre n\'importe pas)', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10');
      const booking2 = createBooking('2', '2026-06-05', '2026-06-08');

      expect(doBookingsOverlap(booking1, booking2)).toBe(
        doBookingsOverlap(booking2, booking1)
      );
    });
  });

  describe('calculateOverlap', () => {
    it('devrait calculer la période de chevauchement', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10');
      const booking2 = createBooking('2', '2026-06-05', '2026-06-08');

      const overlap = calculateOverlap(booking1, booking2);

      expect(overlap).not.toBeNull();
      expect(overlap!.start).toEqual(new Date('2026-06-05'));
      expect(overlap!.end).toEqual(new Date('2026-06-08'));
    });

    it('devrait retourner null si pas de chevauchement', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-05');
      const booking2 = createBooking('2', '2026-06-10', '2026-06-15');

      const overlap = calculateOverlap(booking1, booking2);

      expect(overlap).toBeNull();
    });

    it('devrait calculer le chevauchement pour des dates identiques', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10');
      const booking2 = createBooking('2', '2026-06-01', '2026-06-10');

      const overlap = calculateOverlap(booking1, booking2);

      expect(overlap).not.toBeNull();
      expect(overlap!.start).toEqual(new Date('2026-06-01'));
      expect(overlap!.end).toEqual(new Date('2026-06-10'));
    });
  });

  describe('calculateOverlapDays', () => {
    it('devrait calculer le nombre de jours de chevauchement', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10');
      const booking2 = createBooking('2', '2026-06-05', '2026-06-08');

      const days = calculateOverlapDays(booking1, booking2);

      expect(days).toBe(3); // 5, 6, 7 juin
    });

    it('devrait retourner 0 si pas de chevauchement', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-05');
      const booking2 = createBooking('2', '2026-06-10', '2026-06-15');

      const days = calculateOverlapDays(booking1, booking2);

      expect(days).toBe(0);
    });
  });

  describe('determineConflictSeverity', () => {
    it('devrait retourner "critical" si les deux sont confirmées', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10', { status: 'confirmed' });
      const booking2 = createBooking('2', '2026-06-05', '2026-06-08', { status: 'confirmed' });

      const severity = determineConflictSeverity(booking1, booking2);

      expect(severity).toBe('critical');
    });

    it('devrait retourner "critical" si les deux sont checked_in', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10', { status: 'checked_in' });
      const booking2 = createBooking('2', '2026-06-05', '2026-06-08', { status: 'checked_in' });

      const severity = determineConflictSeverity(booking1, booking2);

      expect(severity).toBe('critical');
    });

    it('devrait retourner "warning" si l\'une est pending', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10', { status: 'confirmed' });
      const booking2 = createBooking('2', '2026-06-05', '2026-06-08', { status: 'pending' });

      const severity = determineConflictSeverity(booking1, booking2);

      expect(severity).toBe('warning');
    });

    it('devrait retourner "info" si l\'une est cancelled', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10', { status: 'confirmed' });
      const booking2 = createBooking('2', '2026-06-05', '2026-06-08', { status: 'cancelled' });

      const severity = determineConflictSeverity(booking1, booking2);

      expect(severity).toBe('info');
    });

    it('devrait retourner "info" si l\'une est checked_out', () => {
      const booking1 = createBooking('1', '2026-06-01', '2026-06-10', { status: 'confirmed' });
      const booking2 = createBooking('2', '2026-06-05', '2026-06-08', { status: 'checked_out' });

      const severity = determineConflictSeverity(booking1, booking2);

      expect(severity).toBe('info');
    });
  });

  describe('detectConflicts', () => {
    it('devrait détecter un conflit avec une réservation existante', () => {
      const newBooking = createBooking('new', '2026-06-05', '2026-06-10');
      const existingBookings = [
        createBooking('1', '2026-06-01', '2026-06-08'),
        createBooking('2', '2026-06-15', '2026-06-20'),
      ];

      const result = detectConflicts(newBooking, existingBookings);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].booking_id_1).toBe('new');
      expect(result.conflicts[0].booking_id_2).toBe('1');
      expect(result.criticalCount).toBe(1);
    });

    it('ne devrait PAS détecter de conflit si pas de chevauchement', () => {
      const newBooking = createBooking('new', '2026-06-05', '2026-06-10');
      const existingBookings = [
        createBooking('1', '2026-06-01', '2026-06-05'),
        createBooking('2', '2026-06-10', '2026-06-15'),
      ];

      const result = detectConflicts(newBooking, existingBookings);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('devrait ignorer la même réservation (même ID)', () => {
      const newBooking = createBooking('same', '2026-06-05', '2026-06-10');
      const existingBookings = [
        createBooking('same', '2026-06-05', '2026-06-10'),
      ];

      const result = detectConflicts(newBooking, existingBookings);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('devrait détecter plusieurs conflits', () => {
      const newBooking = createBooking('new', '2026-06-05', '2026-06-15');
      const existingBookings = [
        createBooking('1', '2026-06-01', '2026-06-08'),
        createBooking('2', '2026-06-10', '2026-06-20'),
        createBooking('3', '2026-06-25', '2026-06-30'),
      ];

      const result = detectConflicts(newBooking, existingBookings);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(2); // Conflits avec 1 et 2
    });

    it('devrait compter correctement par sévérité', () => {
      const newBooking = createBooking('new', '2026-06-05', '2026-06-15', { status: 'confirmed' });
      const existingBookings = [
        createBooking('1', '2026-06-01', '2026-06-08', { status: 'confirmed' }), // critical
        createBooking('2', '2026-06-10', '2026-06-12', { status: 'pending' }), // warning
        createBooking('3', '2026-06-13', '2026-06-20', { status: 'cancelled' }), // info
      ];

      const result = detectConflicts(newBooking, existingBookings);

      expect(result.criticalCount).toBe(1);
      expect(result.warningCount).toBe(1);
      expect(result.infoCount).toBe(1);
    });

    it('devrait inclure les détails du conflit', () => {
      const newBooking = createBooking('new', '2026-06-05', '2026-06-10', { source: 'airbnb_csv' });
      const existingBookings = [
        createBooking('1', '2026-06-01', '2026-06-08', { source: 'airbnb_ical' }),
      ];

      const result = detectConflicts(newBooking, existingBookings);

      expect(result.conflicts[0].details).toMatchObject({
        booking_1_source: 'airbnb_csv',
        booking_2_source: 'airbnb_ical',
        booking_1_status: 'confirmed',
        booking_2_status: 'confirmed',
        overlap_days: expect.any(Number),
      });
    });
  });

  describe('detectAllConflicts', () => {
    it('devrait détecter tous les conflits dans un ensemble de réservations', () => {
      const bookings = [
        createBooking('1', '2026-06-01', '2026-06-10'),
        createBooking('2', '2026-06-05', '2026-06-08'), // Conflit avec 1
        createBooking('3', '2026-06-15', '2026-06-20'),
        createBooking('4', '2026-06-18', '2026-06-25'), // Conflit avec 3
      ];

      const result = detectAllConflicts(bookings);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(2);
    });

    it('devrait gérer plusieurs lofts séparément', () => {
      const bookings = [
        createBooking('1', '2026-06-01', '2026-06-10', { loft_id: 'loft-1' }),
        createBooking('2', '2026-06-05', '2026-06-08', { loft_id: 'loft-1' }), // Conflit loft-1
        createBooking('3', '2026-06-01', '2026-06-10', { loft_id: 'loft-2' }),
        createBooking('4', '2026-06-05', '2026-06-08', { loft_id: 'loft-2' }), // Conflit loft-2
      ];

      const result = detectAllConflicts(bookings);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(2);
      expect(result.conflicts[0].loft_id).not.toBe(result.conflicts[1].loft_id);
    });

    it('ne devrait PAS créer de doublons de conflits', () => {
      const bookings = [
        createBooking('1', '2026-06-01', '2026-06-10'),
        createBooking('2', '2026-06-05', '2026-06-08'),
      ];

      const result = detectAllConflicts(bookings);

      expect(result.conflicts).toHaveLength(1); // Pas de doublon
    });
  });

  describe('reevaluateConflictsAfterCancellation', () => {
    it('devrait marquer les conflits impliquant la réservation annulée comme résolus', () => {
      const conflicts = [
        {
          id: 'conflict-1',
          loft_id: 'loft-123',
          booking_id_1: 'booking-1',
          booking_id_2: 'booking-2',
          severity: 'critical' as const,
          status: 'active' as const,
          overlap_start: new Date('2026-06-05'),
          overlap_end: new Date('2026-06-08'),
        },
        {
          id: 'conflict-2',
          loft_id: 'loft-123',
          booking_id_1: 'booking-3',
          booking_id_2: 'booking-4',
          severity: 'critical' as const,
          status: 'active' as const,
          overlap_start: new Date('2026-06-10'),
          overlap_end: new Date('2026-06-12'),
        },
      ];

      const updated = reevaluateConflictsAfterCancellation('booking-2', conflicts);

      expect(updated[0].status).toBe('resolved');
      expect(updated[0].severity).toBe('info');
      expect(updated[0].resolved_at).toBeInstanceOf(Date);
      expect(updated[1].status).toBe('active'); // Non affecté
    });
  });

  describe('getCriticalActiveConflicts', () => {
    it('devrait filtrer uniquement les conflits critiques actifs', () => {
      const conflicts = [
        {
          id: '1',
          loft_id: 'loft-123',
          booking_id_1: 'b1',
          booking_id_2: 'b2',
          severity: 'critical' as const,
          status: 'active' as const,
          overlap_start: new Date(),
          overlap_end: new Date(),
        },
        {
          id: '2',
          loft_id: 'loft-123',
          booking_id_1: 'b3',
          booking_id_2: 'b4',
          severity: 'warning' as const,
          status: 'active' as const,
          overlap_start: new Date(),
          overlap_end: new Date(),
        },
        {
          id: '3',
          loft_id: 'loft-123',
          booking_id_1: 'b5',
          booking_id_2: 'b6',
          severity: 'critical' as const,
          status: 'resolved' as const,
          overlap_start: new Date(),
          overlap_end: new Date(),
        },
      ];

      const critical = getCriticalActiveConflicts(conflicts);

      expect(critical).toHaveLength(1);
      expect(critical[0].id).toBe('1');
    });
  });

  describe('Model-based testing - Non-overlapping cases', () => {
    it('ne devrait JAMAIS détecter de chevauchement pour des dates consécutives', () => {
      const testCases = [
        ['2026-06-01', '2026-06-05', '2026-06-05', '2026-06-10'],
        ['2026-06-10', '2026-06-15', '2026-06-15', '2026-06-20'],
        ['2026-06-20', '2026-06-25', '2026-06-25', '2026-06-30'],
      ];

      for (const [start1, end1, start2, end2] of testCases) {
        const booking1 = createBooking('1', start1, end1);
        const booking2 = createBooking('2', start2, end2);

        expect(doBookingsOverlap(booking1, booking2)).toBe(false);
      }
    });

    it('ne devrait JAMAIS détecter de chevauchement pour des dates séparées', () => {
      const testCases = [
        ['2026-06-01', '2026-06-05', '2026-06-10', '2026-06-15'],
        ['2026-06-01', '2026-06-05', '2026-06-20', '2026-06-25'],
        ['2026-06-10', '2026-06-12', '2026-06-20', '2026-06-30'],
      ];

      for (const [start1, end1, start2, end2] of testCases) {
        const booking1 = createBooking('1', start1, end1);
        const booking2 = createBooking('2', start2, end2);

        expect(doBookingsOverlap(booking1, booking2)).toBe(false);
      }
    });
  });
});
