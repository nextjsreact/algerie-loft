/**
 * Tests pour iCal Fetcher
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchAndParseICal,
  fetchMultipleICals,
  validateICalUrl,
  type PartialReservation,
} from '../icalFetcher';

// Mock fetch global
global.fetch = vi.fn();

describe('iCalFetcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAndParseICal', () => {
    it('devrait parser un iCal valide avec des réservations', async () => {
      const mockICalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airbnb Inc//Hosting Calendar 0.8.8//EN
BEGIN:VEVENT
UID:reservation-123456
DTSTART;VALUE=DATE:20260601
DTEND;VALUE=DATE:20260605
SUMMARY:Airbnb (Not available)
END:VEVENT
BEGIN:VEVENT
UID:reservation-789012
DTSTART;VALUE=DATE:20260610
DTEND;VALUE=DATE:20260615
SUMMARY:Airbnb (Reserved)
END:VEVENT
END:VCALENDAR`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockICalContent,
      });

      const result = await fetchAndParseICal('https://airbnb.com/calendar/ical/test.ics');

      expect(result.success).toBe(true);
      expect(result.reservations).toHaveLength(2);
      expect(result.reservations[0]).toMatchObject({
        external_id: 'reservation-123456',
        check_in_date: new Date(2026, 5, 1), // Juin = mois 5 (0-indexed)
        check_out_date: new Date(2026, 5, 5),
        summary: 'Airbnb (Not available)',
      });
    });

    it('devrait gérer un iCal vide (sans réservations)', async () => {
      const mockICalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Airbnb Inc//Hosting Calendar 0.8.8//EN
END:VCALENDAR`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockICalContent,
      });

      const result = await fetchAndParseICal('https://airbnb.com/calendar/ical/test.ics');

      expect(result.success).toBe(true);
      expect(result.reservations).toHaveLength(0);
    });

    it('devrait gérer une URL invalide', async () => {
      const result = await fetchAndParseICal('invalid-url');

      expect(result.success).toBe(false);
      expect(result.error).toBe('URL iCal invalide');
    });

    it('devrait gérer une erreur HTTP 404', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await fetchAndParseICal('https://airbnb.com/calendar/ical/notfound.ics');

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });

    it('devrait retry sur erreur réseau', async () => {
      // Premier appel échoue
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      // Deuxième appel réussit
      const mockICalContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-123
DTSTART;VALUE=DATE:20260601
DTEND;VALUE=DATE:20260605
END:VEVENT
END:VCALENDAR`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockICalContent,
      });

      const result = await fetchAndParseICal(
        'https://airbnb.com/calendar/ical/test.ics',
        { retries: 2, retryDelay: 100 }
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('devrait échouer après tous les retries', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await fetchAndParseICal(
        'https://airbnb.com/calendar/ical/test.ics',
        { retries: 2, retryDelay: 100 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Échec après 2 tentatives');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('devrait gérer un timeout', async () => {
      (global.fetch as any).mockImplementationOnce(() => 
        new Promise((resolve) => setTimeout(resolve, 5000))
      );

      const result = await fetchAndParseICal(
        'https://airbnb.com/calendar/ical/test.ics',
        { timeout: 100, retries: 1 }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
    });

    it('devrait valider que check_in < check_out', async () => {
      const mockICalContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:invalid-dates
DTSTART;VALUE=DATE:20260610
DTEND;VALUE=DATE:20260605
END:VEVENT
END:VCALENDAR`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockICalContent,
      });

      const result = await fetchAndParseICal('https://airbnb.com/calendar/ical/test.ics');

      expect(result.success).toBe(true);
      expect(result.reservations).toHaveLength(0); // Réservation invalide ignorée
    });

    it('devrait parser des dates au format YYYYMMDDTHHMMSSZ', async () => {
      const mockICalContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-datetime
DTSTART:20260601T140000Z
DTEND:20260605T100000Z
END:VEVENT
END:VCALENDAR`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockICalContent,
      });

      const result = await fetchAndParseICal('https://airbnb.com/calendar/ical/test.ics');

      expect(result.success).toBe(true);
      expect(result.reservations).toHaveLength(1);
      expect(result.reservations[0].check_in_date).toBeInstanceOf(Date);
    });
  });

  describe('fetchMultipleICals', () => {
    it('devrait récupérer plusieurs iCals en parallèle', async () => {
      const mockICalContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-123
DTSTART;VALUE=DATE:20260601
DTEND;VALUE=DATE:20260605
END:VEVENT
END:VCALENDAR`;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => mockICalContent,
      });

      const urls = [
        'https://airbnb.com/calendar/ical/1.ics',
        'https://airbnb.com/calendar/ical/2.ics',
        'https://airbnb.com/calendar/ical/3.ics',
      ];

      const results = await fetchMultipleICals(urls);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('devrait gérer des succès et échecs mixtes', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR',
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR',
        });

      const urls = [
        'https://airbnb.com/calendar/ical/1.ics',
        'https://airbnb.com/calendar/ical/2.ics',
        'https://airbnb.com/calendar/ical/3.ics',
      ];

      const results = await fetchMultipleICals(urls);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);
    });
  });

  describe('validateICalUrl', () => {
    it('devrait retourner true pour une URL valide', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR',
      });

      const isValid = await validateICalUrl('https://airbnb.com/calendar/ical/test.ics');

      expect(isValid).toBe(true);
    });

    it('devrait retourner false pour une URL invalide', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const isValid = await validateICalUrl('https://airbnb.com/calendar/ical/notfound.ics');

      expect(isValid).toBe(false);
    });

    it('devrait retourner false en cas d\'erreur', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const isValid = await validateICalUrl('https://airbnb.com/calendar/ical/test.ics');

      expect(isValid).toBe(false);
    });
  });

  describe('Round-trip property', () => {
    it('devrait maintenir l\'intégrité des données après parsing', async () => {
      const mockICalContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:test-roundtrip
DTSTART;VALUE=DATE:20260601
DTEND;VALUE=DATE:20260605
SUMMARY:Test Reservation
END:VEVENT
END:VCALENDAR`;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => mockICalContent,
      });

      const result = await fetchAndParseICal('https://airbnb.com/calendar/ical/test.ics');

      expect(result.success).toBe(true);
      const reservation = result.reservations[0];
      
      // Vérifier que les dates sont cohérentes
      expect(reservation.check_in_date.getTime()).toBeLessThan(
        reservation.check_out_date.getTime()
      );
      
      // Vérifier que l'UID est préservé
      expect(reservation.external_id).toBe('test-roundtrip');
      
      // Vérifier que le summary est préservé
      expect(reservation.summary).toBe('Test Reservation');
    });
  });
});
