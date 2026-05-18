/**
 * Tests pour ReservationMatcher
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReservationMatcher, MatchResult } from '../reservationMatcher';
import { BookingRepository, AirbnbBooking } from '../../repositories/bookingRepository';
import { CompleteReservation } from '../csvParser';
import { addDays, subDays } from 'date-fns';

// Mock du repository
const createMockRepository = () => {
  const mockRepo = {
    findByLoftAndDates: vi.fn(),
    getBookingsByDateRange: vi.fn(),
    enrichBooking: vi.fn(),
    createBooking: vi.fn(),
  } as any;

  return mockRepo as BookingRepository;
};

// Mock de Supabase
const createMockSupabase = (lofts: Array<{ id: string; name: string }>) => {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: lofts,
        error: null,
      })),
    })),
  };
};

describe('ReservationMatcher', () => {
  let matcher: ReservationMatcher;
  let mockRepo: BookingRepository;
  let mockSupabase: any;

  beforeEach(() => {
    mockRepo = createMockRepository();
    matcher = new ReservationMatcher(mockRepo);

    // Setup mock lofts
    mockSupabase = createMockSupabase([
      { id: 'loft-1', name: 'Loft Alger Centre' },
      { id: 'loft-2', name: 'Loft Oran Plage' },
      { id: 'loft-3', name: 'Loft Constantine' },
    ]);
  });

  describe('loadLoftMapping', () => {
    it('devrait charger le mapping des lofts', async () => {
      await matcher.loadLoftMapping(mockSupabase);

      expect(mockSupabase.from).toHaveBeenCalledWith('lofts');
    });

    it('devrait normaliser les noms de lofts (casse, accents)', async () => {
      const supabase = createMockSupabase([
        { id: 'loft-1', name: 'Loft Algér Centrë' },
      ]);

      await matcher.loadLoftMapping(supabase);

      const csvEntry: CompleteReservation = {
        listing_name: 'LOFT ALGER CENTRE', // Différente casse, sans accents
        confirmation_code: 'ABC123',
        guest_name: 'John Doe',
        check_in_date: new Date('2026-06-01'),
        check_out_date: new Date('2026-06-05'),
        nights: 4,
        guests: 2,
        status: 'confirmed',
        amount: 400,
        currency: 'EUR',
      };

      const result = await matcher.matchCSVEntry(csvEntry);

      // Devrait trouver le loft malgré les différences de casse/accents
      expect(result.loft_id).toBe('loft-1');
    });

    it('devrait gérer les erreurs de chargement', async () => {
      const errorSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            data: null,
            error: { message: 'Connection error' },
          })),
        })),
      };

      await expect(matcher.loadLoftMapping(errorSupabase)).rejects.toThrow();
    });
  });

  describe('matchCSVEntry - Exact Match', () => {
    beforeEach(async () => {
      await matcher.loadLoftMapping(mockSupabase);
    });

    it('devrait trouver un exact match', async () => {
      const checkIn = new Date('2026-06-01');
      const checkOut = new Date('2026-06-05');

      const existingBooking: AirbnbBooking = {
        id: 'booking-1',
        loft_id: 'loft-1',
        source: 'airbnb_ical',
        status: 'confirmed',
        check_in_date: checkIn,
        check_out_date: checkOut,
        is_complete: false,
        csv_only_flag: false,
      };

      vi.mocked(mockRepo.findByLoftAndDates).mockResolvedValue(existingBooking);

      const csvEntry: CompleteReservation = {
        listing_name: 'Loft Alger Centre',
        confirmation_code: 'ABC123',
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        check_in_date: checkIn,
        check_out_date: checkOut,
        nights: 4,
        guests: 2,
        status: 'confirmed',
        amount: 400,
        currency: 'EUR',
      };

      const result = await matcher.matchCSVEntry(csvEntry);

      expect(result.type).toBe('exact');
      expect(result.confidence).toBe(100);
      expect(result.ical_booking).toEqual(existingBooking);
      expect(result.loft_id).toBe('loft-1');
    });

    it('devrait retourner none si loft non trouvé', async () => {
      const csvEntry: CompleteReservation = {
        listing_name: 'Loft Inconnu',
        confirmation_code: 'ABC123',
        guest_name: 'John Doe',
        check_in_date: new Date('2026-06-01'),
        check_out_date: new Date('2026-06-05'),
        nights: 4,
        guests: 2,
        status: 'confirmed',
        amount: 400,
        currency: 'EUR',
      };

      const result = await matcher.matchCSVEntry(csvEntry);

      expect(result.type).toBe('none');
      expect(result.confidence).toBe(0);
      expect(result.reason).toContain('Loft non trouvé');
    });
  });

  describe('matchCSVEntry - Fuzzy Match', () => {
    beforeEach(async () => {
      await matcher.loadLoftMapping(mockSupabase);
    });

    it('devrait trouver un fuzzy match avec check_in +1 jour', async () => {
      const icalCheckIn = new Date('2026-06-01');
      const icalCheckOut = new Date('2026-06-05');
      const csvCheckIn = addDays(icalCheckIn, 1); // +1 jour
      const csvCheckOut = icalCheckOut; // Identique

      const existingBooking: AirbnbBooking = {
        id: 'booking-1',
        loft_id: 'loft-1',
        source: 'airbnb_ical',
        status: 'confirmed',
        check_in_date: icalCheckIn,
        check_out_date: icalCheckOut,
        is_complete: false,
        csv_only_flag: false,
      };

      vi.mocked(mockRepo.findByLoftAndDates).mockResolvedValue(null);
      vi.mocked(mockRepo.getBookingsByDateRange).mockResolvedValue([existingBooking]);

      const csvEntry: CompleteReservation = {
        listing_name: 'Loft Alger Centre',
        confirmation_code: 'ABC123',
        guest_name: 'John Doe',
        check_in_date: csvCheckIn,
        check_out_date: csvCheckOut,
        nights: 4,
        guests: 2,
        status: 'confirmed',
        amount: 400,
        currency: 'EUR',
      };

      const result = await matcher.matchCSVEntry(csvEntry, {
        allow_fuzzy_match: true,
        fuzzy_tolerance_days: 1,
      });

      expect(result.type).toBe('fuzzy');
      expect(result.confidence).toBeGreaterThan(60);
      expect(result.ical_booking).toEqual(existingBooking);
    });

    it('devrait trouver un fuzzy match avec check_out -1 jour', async () => {
      const icalCheckIn = new Date('2026-06-01');
      const icalCheckOut = new Date('2026-06-05');
      const csvCheckIn = icalCheckIn; // Identique
      const csvCheckOut = subDays(icalCheckOut, 1); // -1 jour

      const existingBooking: AirbnbBooking = {
        id: 'booking-1',
        loft_id: 'loft-1',
        source: 'airbnb_ical',
        status: 'confirmed',
        check_in_date: icalCheckIn,
        check_out_date: icalCheckOut,
        is_complete: false,
        csv_only_flag: false,
      };

      vi.mocked(mockRepo.findByLoftAndDates).mockResolvedValue(null);
      vi.mocked(mockRepo.getBookingsByDateRange).mockResolvedValue([existingBooking]);

      const csvEntry: CompleteReservation = {
        listing_name: 'Loft Alger Centre',
        confirmation_code: 'ABC123',
        guest_name: 'John Doe',
        check_in_date: csvCheckIn,
        check_out_date: csvCheckOut,
        nights: 3,
        guests: 2,
        status: 'confirmed',
        amount: 300,
        currency: 'EUR',
      };

      const result = await matcher.matchCSVEntry(csvEntry, {
        allow_fuzzy_match: true,
        fuzzy_tolerance_days: 1,
      });

      expect(result.type).toBe('fuzzy');
      expect(result.confidence).toBeGreaterThan(60);
    });

    it('devrait retourner none si différence > tolérance', async () => {
      const icalCheckIn = new Date('2026-06-01');
      const icalCheckOut = new Date('2026-06-05');
      const csvCheckIn = addDays(icalCheckIn, 3); // +3 jours (> tolérance)
      const csvCheckOut = addDays(icalCheckOut, 3);

      const existingBooking: AirbnbBooking = {
        id: 'booking-1',
        loft_id: 'loft-1',
        source: 'airbnb_ical',
        status: 'confirmed',
        check_in_date: icalCheckIn,
        check_out_date: icalCheckOut,
        is_complete: false,
        csv_only_flag: false,
      };

      vi.mocked(mockRepo.findByLoftAndDates).mockResolvedValue(null);
      vi.mocked(mockRepo.getBookingsByDateRange).mockResolvedValue([existingBooking]);

      const csvEntry: CompleteReservation = {
        listing_name: 'Loft Alger Centre',
        confirmation_code: 'ABC123',
        guest_name: 'John Doe',
        check_in_date: csvCheckIn,
        check_out_date: csvCheckOut,
        nights: 4,
        guests: 2,
        status: 'confirmed',
        amount: 400,
        currency: 'EUR',
      };

      const result = await matcher.matchCSVEntry(csvEntry, {
        allow_fuzzy_match: true,
        fuzzy_tolerance_days: 1,
      });

      expect(result.type).toBe('none');
    });

    it('devrait choisir le meilleur match si plusieurs candidats', async () => {
      const icalCheckIn = new Date('2026-06-01');
      const icalCheckOut = new Date('2026-06-05');

      const booking1: AirbnbBooking = {
        id: 'booking-1',
        loft_id: 'loft-1',
        source: 'airbnb_ical',
        status: 'confirmed',
        check_in_date: addDays(icalCheckIn, 1), // +1 jour
        check_out_date: icalCheckOut,
        is_complete: false,
        csv_only_flag: false,
      };

      const booking2: AirbnbBooking = {
        id: 'booking-2',
        loft_id: 'loft-1',
        source: 'airbnb_ical',
        status: 'confirmed',
        check_in_date: icalCheckIn, // Exact
        check_out_date: addDays(icalCheckOut, 1), // +1 jour
        is_complete: false,
        csv_only_flag: false,
      };

      vi.mocked(mockRepo.findByLoftAndDates).mockResolvedValue(null);
      vi.mocked(mockRepo.getBookingsByDateRange).mockResolvedValue([booking1, booking2]);

      const csvEntry: CompleteReservation = {
        listing_name: 'Loft Alger Centre',
        confirmation_code: 'ABC123',
        guest_name: 'John Doe',
        check_in_date: icalCheckIn,
        check_out_date: icalCheckOut,
        nights: 4,
        guests: 2,
        status: 'confirmed',
        amount: 400,
        currency: 'EUR',
      };

      const result = await matcher.matchCSVEntry(csvEntry, {
        allow_fuzzy_match: true,
        fuzzy_tolerance_days: 1,
      });

      expect(result.type).toBe('fuzzy');
      // Devrait choisir booking2 (check_in exact)
      expect(result.ical_booking?.id).toBe('booking-2');
    });
  });

  describe('enrichPartialReservation', () => {
    it('devrait enrichir une réservation iCal avec les détails CSV', async () => {
      const matchResult: MatchResult = {
        type: 'exact',
        confidence: 100,
        ical_booking: {
          id: 'booking-1',
          loft_id: 'loft-1',
          source: 'airbnb_ical',
          status: 'confirmed',
          check_in_date: new Date('2026-06-01'),
          check_out_date: new Date('2026-06-05'),
          is_complete: false,
          csv_only_flag: false,
        },
        csv_entry: {
          listing_name: 'Loft Alger Centre',
          confirmation_code: 'ABC123',
          guest_name: 'John Doe',
          guest_email: 'john@example.com',
          guest_phone: '+33612345678',
          check_in_date: new Date('2026-06-01'),
          check_out_date: new Date('2026-06-05'),
          nights: 4,
          guests: 2,
          status: 'confirmed',
          amount: 400,
          currency: 'EUR',
        },
        loft_id: 'loft-1',
      };

      vi.mocked(mockRepo.enrichBooking).mockResolvedValue({
        success: true,
        booking: matchResult.ical_booking,
      });

      const result = await matcher.enrichPartialReservation(matchResult);

      expect(result.success).toBe(true);
      expect(mockRepo.enrichBooking).toHaveBeenCalledWith('booking-1', {
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        guest_phone: '+33612345678',
        amount: 400,
        currency: 'EUR',
        external_id: 'ABC123',
      });
    });

    it('devrait échouer si pas de réservation iCal', async () => {
      const matchResult: MatchResult = {
        type: 'none',
        confidence: 0,
        csv_entry: {
          listing_name: 'Loft Alger Centre',
          confirmation_code: 'ABC123',
          guest_name: 'John Doe',
          check_in_date: new Date('2026-06-01'),
          check_out_date: new Date('2026-06-05'),
          nights: 4,
          guests: 2,
          status: 'confirmed',
          amount: 400,
          currency: 'EUR',
        },
      };

      const result = await matcher.enrichPartialReservation(matchResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Pas de réservation iCal');
    });
  });

  describe('createFromCSV', () => {
    it('devrait créer une nouvelle réservation depuis CSV', async () => {
      const csvEntry: CompleteReservation = {
        listing_name: 'Loft Alger Centre',
        confirmation_code: 'ABC123',
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        check_in_date: new Date('2026-06-01'),
        check_out_date: new Date('2026-06-05'),
        nights: 4,
        guests: 2,
        status: 'confirmed',
        amount: 400,
        currency: 'EUR',
      };

      const createdBooking: AirbnbBooking = {
        id: 'booking-new',
        loft_id: 'loft-1',
        source: 'airbnb_csv',
        external_id: 'ABC123',
        status: 'confirmed',
        check_in_date: csvEntry.check_in_date,
        check_out_date: csvEntry.check_out_date,
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        amount: 400,
        currency: 'EUR',
        is_complete: true,
        csv_only_flag: true,
      };

      vi.mocked(mockRepo.createBooking).mockResolvedValue({
        success: true,
        booking: createdBooking,
      });

      const result = await matcher.createFromCSV(csvEntry, 'loft-1');

      expect(result.success).toBe(true);
      expect(result.booking?.csv_only_flag).toBe(true);
      expect(result.booking?.source).toBe('airbnb_csv');
    });
  });

  describe('matchCSVEntries - Batch', () => {
    beforeEach(async () => {
      await matcher.loadLoftMapping(mockSupabase);
    });

    it('devrait matcher plusieurs entrées CSV', async () => {
      const csvEntries: CompleteReservation[] = [
        {
          listing_name: 'Loft Alger Centre',
          confirmation_code: 'ABC123',
          guest_name: 'John Doe',
          check_in_date: new Date('2026-06-01'),
          check_out_date: new Date('2026-06-05'),
          nights: 4,
          guests: 2,
          status: 'confirmed',
          amount: 400,
          currency: 'EUR',
        },
        {
          listing_name: 'Loft Oran Plage',
          confirmation_code: 'DEF456',
          guest_name: 'Jane Smith',
          check_in_date: new Date('2026-06-10'),
          check_out_date: new Date('2026-06-15'),
          nights: 5,
          guests: 3,
          status: 'confirmed',
          amount: 500,
          currency: 'EUR',
        },
      ];

      // Mock: première entrée = exact match, deuxième = no match
      vi.mocked(mockRepo.findByLoftAndDates)
        .mockResolvedValueOnce({
          id: 'booking-1',
          loft_id: 'loft-1',
          source: 'airbnb_ical',
          status: 'confirmed',
          check_in_date: new Date('2026-06-01'),
          check_out_date: new Date('2026-06-05'),
          is_complete: false,
          csv_only_flag: false,
        })
        .mockResolvedValueOnce(null);

      vi.mocked(mockRepo.getBookingsByDateRange).mockResolvedValue([]);

      const report = await matcher.matchCSVEntries(csvEntries);

      expect(report.total_csv_entries).toBe(2);
      expect(report.exact_matches).toBe(1);
      expect(report.no_matches).toBe(1);
      expect(report.matches).toHaveLength(2);
    });
  });

  describe('processMatchingReport', () => {
    beforeEach(async () => {
      await matcher.loadLoftMapping(mockSupabase);
    });

    it('devrait enrichir les matches et créer les no-matches', async () => {
      const report = {
        total_csv_entries: 2,
        exact_matches: 1,
        fuzzy_matches: 0,
        no_matches: 1,
        errors: 0,
        matches: [
          {
            type: 'exact' as const,
            confidence: 100,
            ical_booking: {
              id: 'booking-1',
              loft_id: 'loft-1',
              source: 'airbnb_ical' as const,
              status: 'confirmed' as const,
              check_in_date: new Date('2026-06-01'),
              check_out_date: new Date('2026-06-05'),
              is_complete: false,
              csv_only_flag: false,
            },
            csv_entry: {
              listing_name: 'Loft Alger Centre',
              confirmation_code: 'ABC123',
              guest_name: 'John Doe',
              check_in_date: new Date('2026-06-01'),
              check_out_date: new Date('2026-06-05'),
              nights: 4,
              guests: 2,
              status: 'confirmed',
              amount: 400,
              currency: 'EUR',
            },
            loft_id: 'loft-1',
          },
          {
            type: 'none' as const,
            confidence: 0,
            csv_entry: {
              listing_name: 'Loft Oran Plage',
              confirmation_code: 'DEF456',
              guest_name: 'Jane Smith',
              check_in_date: new Date('2026-06-10'),
              check_out_date: new Date('2026-06-15'),
              nights: 5,
              guests: 3,
              status: 'confirmed',
              amount: 500,
              currency: 'EUR',
            },
            loft_id: 'loft-2',
          },
        ],
        error_details: [],
      };

      vi.mocked(mockRepo.enrichBooking).mockResolvedValue({ success: true });
      vi.mocked(mockRepo.createBooking).mockResolvedValue({
        success: true,
        booking: {} as any,
      });

      const result = await matcher.processMatchingReport(report);

      expect(result.enriched).toBe(1);
      expect(result.created).toBe(1);
      expect(result.errors).toBe(0);
    });
  });
});
