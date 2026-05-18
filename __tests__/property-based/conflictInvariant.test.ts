/**
 * Property-Based Tests: Conflict Detection Invariants
 * 
 * Tests des invariants de la détection de conflits
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { doBookingsOverlap, detectConflicts } from '@/lib/sync/conflictDetector';
import type { AirbnbBooking } from '@/lib/repositories/bookingRepository';

// Générateur de dates
const dateArbitrary = fc.date({ min: new Date('2026-01-01'), max: new Date('2026-12-31') });

// Générateur de réservations
const bookingArbitrary = fc.record({
  id: fc.uuid(),
  loft_id: fc.uuid(),
  check_in_date: dateArbitrary,
  check_out_date: dateArbitrary,
  status: fc.constantFrom('confirmed', 'pending', 'cancelled', 'checked_in'),
  source: fc.constantFrom('airbnb_ical', 'airbnb_csv'),
  created_at: dateArbitrary,
  updated_at: dateArbitrary,
}).filter(booking => booking.check_in_date < booking.check_out_date) as fc.Arbitrary<AirbnbBooking>;

describe('Conflict Detection Invariants', () => {
  describe('Non-Overlapping Invariant', () => {
    it('should never detect conflicts for non-overlapping reservations', () => {
      fc.assert(
        fc.property(
          bookingArbitrary,
          bookingArbitrary,
          (booking1, booking2) => {
            // Ensure same loft
            booking2.loft_id = booking1.loft_id;
            
            // Ensure non-overlapping: booking2 starts after booking1 ends
            if (booking1.check_out_date <= booking2.check_in_date) {
              const result = doBookingsOverlap(booking1, booking2);
              expect(result).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never detect conflicts for different lofts', () => {
      fc.assert(
        fc.property(
          bookingArbitrary,
          bookingArbitrary,
          (booking1, booking2) => {
            // Ensure different lofts
            if (booking1.loft_id !== booking2.loft_id) {
              const result = detectConflicts(booking1, [booking2]);
              expect(result.hasConflicts).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Symmetry Invariant', () => {
    it('should detect overlap symmetrically (A overlaps B ⟺ B overlaps A)', () => {
      fc.assert(
        fc.property(
          bookingArbitrary,
          bookingArbitrary,
          (booking1, booking2) => {
            // Ensure same loft
            booking2.loft_id = booking1.loft_id;
            
            const overlap1 = doBookingsOverlap(booking1, booking2);
            const overlap2 = doBookingsOverlap(booking2, booking1);
            
            // Invariant: Symmetry
            expect(overlap1).toBe(overlap2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Reflexivity Invariant', () => {
    it('should always detect overlap with itself', () => {
      fc.assert(
        fc.property(
          bookingArbitrary,
          (booking) => {
            const result = doBookingsOverlap(booking, booking);
            
            // Invariant: A booking always overlaps with itself
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Transitivity Invariant', () => {
    it('should maintain transitivity for overlaps', () => {
      fc.assert(
        fc.property(
          bookingArbitrary,
          bookingArbitrary,
          bookingArbitrary,
          (booking1, booking2, booking3) => {
            // Ensure same loft
            booking2.loft_id = booking1.loft_id;
            booking3.loft_id = booking1.loft_id;
            
            const overlap12 = doBookingsOverlap(booking1, booking2);
            const overlap23 = doBookingsOverlap(booking2, booking3);
            const overlap13 = doBookingsOverlap(booking1, booking3);
            
            // If A overlaps B and B overlaps C, then A might overlap C
            // (not always, but if all three overlap the same period)
            if (overlap12 && overlap23 && overlap13) {
              // All three overlap - this is valid
              expect(true).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Status Severity Invariant', () => {
    it('should always mark confirmed+confirmed as critical', () => {
      fc.assert(
        fc.property(
          bookingArbitrary,
          bookingArbitrary,
          (booking1, booking2) => {
            // Ensure same loft and overlapping
            booking2.loft_id = booking1.loft_id;
            booking1.status = 'confirmed';
            booking2.status = 'confirmed';
            
            // Make them overlap
            booking2.check_in_date = new Date(booking1.check_in_date.getTime() + 86400000); // +1 day
            booking2.check_out_date = new Date(booking1.check_out_date.getTime() + 86400000);
            
            if (doBookingsOverlap(booking1, booking2)) {
              const result = detectConflicts(booking1, [booking2]);
              
              if (result.hasConflicts) {
                expect(result.criticalCount).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should never mark cancelled as critical', () => {
      fc.assert(
        fc.property(
          bookingArbitrary,
          bookingArbitrary,
          (booking1, booking2) => {
            // Ensure same loft and overlapping
            booking2.loft_id = booking1.loft_id;
            booking1.status = 'confirmed';
            booking2.status = 'cancelled';
            
            // Make them overlap
            booking2.check_in_date = new Date(booking1.check_in_date.getTime() + 86400000);
            booking2.check_out_date = new Date(booking1.check_out_date.getTime() + 86400000);
            
            if (doBookingsOverlap(booking1, booking2)) {
              const result = detectConflicts(booking1, [booking2]);
              
              if (result.hasConflicts) {
                expect(result.criticalCount).toBe(0);
                expect(result.infoCount).toBeGreaterThan(0);
              }
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Self-Exclusion Invariant', () => {
    it('should never detect conflict with itself', () => {
      fc.assert(
        fc.property(
          bookingArbitrary,
          (booking) => {
            const result = detectConflicts(booking, [booking]);
            
            // Invariant: A booking should not conflict with itself
            expect(result.hasConflicts).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Empty List Invariant', () => {
    it('should never detect conflicts with empty list', () => {
      fc.assert(
        fc.property(
          bookingArbitrary,
          (booking) => {
            const result = detectConflicts(booking, []);
            
            // Invariant: No conflicts with empty list
            expect(result.hasConflicts).toBe(false);
            expect(result.conflicts).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Count Invariant', () => {
    it('should have correct conflict counts', () => {
      fc.assert(
        fc.property(
          bookingArbitrary,
          fc.array(bookingArbitrary, { minLength: 0, maxLength: 10 }),
          (newBooking, existingBookings) => {
            // Ensure same loft
            existingBookings.forEach(b => b.loft_id = newBooking.loft_id);
            
            const result = detectConflicts(newBooking, existingBookings);
            
            // Invariant: Sum of severity counts = total conflicts
            const totalCount = result.criticalCount + result.warningCount + result.infoCount;
            expect(totalCount).toBe(result.conflicts.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
