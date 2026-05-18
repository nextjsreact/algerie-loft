/**
 * Integration Tests: Sync Pipeline
 * 
 * Tests end-to-end du pipeline de synchronisation complet
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { fetchAndParseICal } from '@/lib/sync/icalFetcher';
import { processBatch } from '@/lib/sync/batchProcessor';
import { detectConflicts } from '@/lib/sync/conflictDetector';
import type { AirbnbBooking } from '@/lib/repositories/bookingRepository';

describe('Sync Pipeline Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('iCal Sync Pipeline', () => {
    it('should fetch, parse, and process iCal data', async () => {
      // Mock iCal data
      const mockICalUrl = 'https://example.com/calendar.ics';
      const mockICalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airbnb Inc//Hosting Calendar//EN
BEGIN:VEVENT
UID:booking-123
DTSTART:20260601
DTEND:20260605
SUMMARY:Reserved
END:VEVENT
END:VCALENDAR`;

      // Mock fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockICalData),
        } as Response)
      ) as jest.Mock;

      // Test: Fetch and parse iCal
      const reservations = await fetchAndParseICal(mockICalUrl);

      expect(reservations).toHaveLength(1);
      expect(reservations[0]).toMatchObject({
        check_in_date: expect.any(Date),
        check_out_date: expect.any(Date),
        source: 'airbnb_ical',
      });

      // Verify dates
      const reservation = reservations[0];
      expect(reservation.check_in_date.getFullYear()).toBe(2026);
      expect(reservation.check_in_date.getMonth()).toBe(5); // June (0-indexed)
      expect(reservation.check_in_date.getDate()).toBe(1);
    });

    it('should handle batch processing of multiple properties', async () => {
      const mockProperties = Array.from({ length: 25 }, (_, i) => ({
        id: `loft-${i}`,
        ical_url: `https://example.com/calendar-${i}.ics`,
      }));

      let processedCount = 0;
      const processor = async (property: typeof mockProperties[0]) => {
        processedCount++;
        return { success: true, property_id: property.id };
      };

      // Test: Process in batches of 20
      const result = await processBatch(mockProperties, 20, processor, {
        continueOnError: true,
        timeout: 25000,
      });

      expect(processedCount).toBe(25);
      expect(result.totalProcessed).toBe(25);
      expect(result.batches).toBe(2); // 20 + 5
      expect(result.errors).toBe(0);
    });
  });

  describe('Conflict Detection Pipeline', () => {
    it('should detect overlapping reservations', () => {
      const newBooking: AirbnbBooking = {
        id: 'booking-1',
        loft_id: 'loft-123',
        check_in_date: new Date('2026-06-01'),
        check_out_date: new Date('2026-06-05'),
        status: 'confirmed',
        source: 'airbnb_ical',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const existingBookings: AirbnbBooking[] = [
        {
          id: 'booking-2',
          loft_id: 'loft-123',
          check_in_date: new Date('2026-06-03'),
          check_out_date: new Date('2026-06-07'),
          status: 'confirmed',
          source: 'airbnb_csv',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Test: Detect conflicts
      const result = detectConflicts(newBooking, existingBookings);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.criticalCount).toBe(1);
      expect(result.conflicts[0]).toMatchObject({
        loft_id: 'loft-123',
        severity: 'critical',
        status: 'active',
      });
    });

    it('should not detect conflicts for non-overlapping reservations', () => {
      const newBooking: AirbnbBooking = {
        id: 'booking-1',
        loft_id: 'loft-123',
        check_in_date: new Date('2026-06-01'),
        check_out_date: new Date('2026-06-05'),
        status: 'confirmed',
        source: 'airbnb_ical',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const existingBookings: AirbnbBooking[] = [
        {
          id: 'booking-2',
          loft_id: 'loft-123',
          check_in_date: new Date('2026-06-10'),
          check_out_date: new Date('2026-06-15'),
          status: 'confirmed',
          source: 'airbnb_csv',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Test: No conflicts
      const result = detectConflicts(newBooking, existingBookings);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
      expect(result.criticalCount).toBe(0);
    });

    it('should handle cancelled reservations as info conflicts', () => {
      const newBooking: AirbnbBooking = {
        id: 'booking-1',
        loft_id: 'loft-123',
        check_in_date: new Date('2026-06-01'),
        check_out_date: new Date('2026-06-05'),
        status: 'confirmed',
        source: 'airbnb_ical',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const existingBookings: AirbnbBooking[] = [
        {
          id: 'booking-2',
          loft_id: 'loft-123',
          check_in_date: new Date('2026-06-03'),
          check_out_date: new Date('2026-06-07'),
          status: 'cancelled',
          source: 'airbnb_csv',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Test: Info conflict (cancelled)
      const result = detectConflicts(newBooking, existingBookings);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].severity).toBe('info');
      expect(result.criticalCount).toBe(0);
      expect(result.infoCount).toBe(1);
    });
  });

  describe('End-to-End Pipeline', () => {
    it('should complete full sync cycle without errors', async () => {
      // Mock data
      const mockICalData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:booking-123
DTSTART:20260601
DTEND:20260605
SUMMARY:Reserved
END:VEVENT
END:VCALENDAR`;

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockICalData),
        } as Response)
      ) as jest.Mock;

      // Step 1: Fetch iCal
      const reservations = await fetchAndParseICal('https://example.com/calendar.ics');
      expect(reservations).toHaveLength(1);

      // Step 2: Process (mock repository)
      const processedReservations = reservations.map(r => ({
        ...r,
        id: 'generated-id',
        loft_id: 'loft-123',
      })) as AirbnbBooking[];

      // Step 3: Detect conflicts
      const result = detectConflicts(processedReservations[0], []);
      expect(result.hasConflicts).toBe(false);

      // Success
      expect(processedReservations).toHaveLength(1);
    });
  });
});
