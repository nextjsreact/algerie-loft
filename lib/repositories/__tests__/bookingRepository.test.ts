/**
 * Tests pour Booking Repository
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BookingRepository, type AirbnbBooking } from '../bookingRepository';
import { subDays, addDays } from 'date-fns';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
};

// Helper pour créer une réservation de test
const createTestBooking = (overrides: Partial<AirbnbBooking> = {}): Omit<AirbnbBooking, 'id'> => ({
  loft_id: 'loft-123',
  source: 'airbnb_ical',
  status: 'confirmed',
  check_in_date: new Date('2026-06-01'),
  check_out_date: new Date('2026-06-05'),
  is_complete: false,
  csv_only_flag: false,
  ...overrides,
});

describe('BookingRepository', () => {
  let repository: BookingRepository;
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock query builder
    mockQuery = {
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    mockSupabaseClient.from.mockReturnValue(mockQuery);

    repository = new BookingRepository({
      supabaseClient: mockSupabaseClient as any,
    });
  });

  describe('createBooking', () => {
    it('devrait créer une réservation valide', async () => {
      const booking = createTestBooking();
      const mockData = { id: 'booking-123', ...booking };

      mockQuery.single.mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const result = await repository.createBooking(booking);

      expect(result.success).toBe(true);
      expect(result.booking).toBeDefined();
      expect(result.booking?.id).toBe('booking-123');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('airbnb_bookings');
    });

    it('devrait rejeter une réservation sans loft_id', async () => {
      const booking = createTestBooking({ loft_id: '' as any });

      const result = await repository.createBooking(booking);

      expect(result.success).toBe(false);
      expect(result.error).toContain('loft_id');
    });

    it('devrait rejeter si check_in >= check_out', async () => {
      const booking = createTestBooking({
        check_in_date: new Date('2026-06-05'),
        check_out_date: new Date('2026-06-01'),
      });

      const result = await repository.createBooking(booking);

      expect(result.success).toBe(false);
      expect(result.error).toContain('check_in_date doit être avant check_out_date');
    });

    it('devrait rejeter si check_in est trop dans le passé', async () => {
      const booking = createTestBooking({
        check_in_date: subDays(new Date(), 35),
        check_out_date: subDays(new Date(), 30),
      });

      const result = await repository.createBooking(booking);

      expect(result.success).toBe(false);
      expect(result.error).toContain('30 jours dans le passé');
    });

    it('devrait gérer une erreur de contrainte unique (duplicate)', async () => {
      const booking = createTestBooking();

      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key' },
      });

      const result = await repository.createBooking(booking);

      expect(result.success).toBe(false);
      expect(result.isDuplicate).toBe(true);
      expect(result.error).toContain('existe déjà');
    });

    it('devrait valider le statut', async () => {
      const booking = createTestBooking({
        status: 'invalid_status' as any,
      });

      const result = await repository.createBooking(booking);

      expect(result.success).toBe(false);
      expect(result.error).toContain('status invalide');
    });

    it('devrait valider la source', async () => {
      const booking = createTestBooking({
        source: 'invalid_source' as any,
      });

      const result = await repository.createBooking(booking);

      expect(result.success).toBe(false);
      expect(result.error).toContain('source invalide');
    });
  });

  describe('updateBooking', () => {
    it('devrait mettre à jour une réservation', async () => {
      const updates = {
        guest_name: 'John Doe',
        guest_email: 'john@example.com',
        amount: 150.00,
        currency: 'EUR',
      };

      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'booking-123', ...updates },
        error: null,
      });

      const result = await repository.updateBooking('booking-123', updates);

      expect(result.success).toBe(true);
      expect(result.booking?.guest_name).toBe('John Doe');
      expect(mockQuery.update).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'booking-123');
    });

    it('devrait valider les dates lors de la mise à jour', async () => {
      const updates = {
        check_in_date: new Date('2026-06-05'),
        check_out_date: new Date('2026-06-01'),
      };

      const result = await repository.updateBooking('booking-123', updates);

      expect(result.success).toBe(false);
      expect(result.error).toContain('check_in_date doit être avant check_out_date');
    });

    it('devrait retourner une erreur si la réservation n\'existe pas', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await repository.updateBooking('nonexistent', { guest_name: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('non trouvée');
    });
  });

  describe('enrichBooking', () => {
    it('devrait enrichir une réservation partielle avec les détails CSV', async () => {
      const csvDetails = {
        guest_name: 'Jane Smith',
        guest_email: 'jane@example.com',
        guest_phone: '+33612345678',
        amount: 200.00,
        currency: 'EUR',
        external_id: 'AIRBNB-12345',
      };

      mockQuery.single.mockResolvedValueOnce({
        data: {
          id: 'booking-123',
          ...csvDetails,
          source: 'airbnb_csv',
          is_complete: true,
        },
        error: null,
      });

      const result = await repository.enrichBooking('booking-123', csvDetails);

      expect(result.success).toBe(true);
      expect(result.booking?.source).toBe('airbnb_csv');
      expect(result.booking?.is_complete).toBe(true);
      expect(result.booking?.guest_name).toBe('Jane Smith');
    });
  });

  describe('getBookingById', () => {
    it('devrait récupérer une réservation par ID', async () => {
      const mockData = {
        id: 'booking-123',
        loft_id: 'loft-123',
        check_in_date: '2026-06-01',
        check_out_date: '2026-06-05',
        source: 'airbnb_ical',
        status: 'confirmed',
        is_complete: false,
        csv_only_flag: false,
      };

      mockQuery.single.mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const booking = await repository.getBookingById('booking-123');

      expect(booking).toBeDefined();
      expect(booking?.id).toBe('booking-123');
      expect(booking?.check_in_date).toBeInstanceOf(Date);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'booking-123');
    });

    it('devrait retourner null si la réservation n\'existe pas', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const booking = await repository.getBookingById('nonexistent');

      expect(booking).toBeNull();
    });
  });

  describe('getBookings', () => {
    it('devrait récupérer toutes les réservations sans filtre', async () => {
      const mockData = [
        { id: '1', loft_id: 'loft-1', check_in_date: '2026-06-01', check_out_date: '2026-06-05', source: 'airbnb_ical', status: 'confirmed', is_complete: false, csv_only_flag: false },
        { id: '2', loft_id: 'loft-2', check_in_date: '2026-06-10', check_out_date: '2026-06-15', source: 'airbnb_csv', status: 'confirmed', is_complete: true, csv_only_flag: false },
      ];

      mockQuery.order.mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const bookings = await repository.getBookings();

      expect(bookings).toHaveLength(2);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('airbnb_bookings');
    });

    it('devrait filtrer par loft_id', async () => {
      mockQuery.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await repository.getBookings({ loft_id: 'loft-123' });

      expect(mockQuery.eq).toHaveBeenCalledWith('loft_id', 'loft-123');
    });

    it('devrait filtrer par plusieurs loft_ids', async () => {
      mockQuery.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await repository.getBookings({ loft_ids: ['loft-1', 'loft-2'] });

      expect(mockQuery.in).toHaveBeenCalledWith('loft_id', ['loft-1', 'loft-2']);
    });

    it('devrait filtrer par plage de dates', async () => {
      mockQuery.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await repository.getBookings({
        date_from: new Date('2026-06-01'),
        date_to: new Date('2026-06-30'),
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('check_out_date', '2026-06-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('check_in_date', '2026-06-30');
    });

    it('devrait filtrer par source', async () => {
      mockQuery.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await repository.getBookings({ source: 'airbnb_csv' });

      expect(mockQuery.eq).toHaveBeenCalledWith('source', 'airbnb_csv');
    });

    it('devrait filtrer par is_complete', async () => {
      mockQuery.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await repository.getBookings({ is_complete: true });

      expect(mockQuery.eq).toHaveBeenCalledWith('is_complete', true);
    });
  });

  describe('findByLoftAndDates', () => {
    it('devrait trouver une réservation par loft et dates exactes', async () => {
      const mockData = {
        id: 'booking-123',
        loft_id: 'loft-123',
        check_in_date: '2026-06-01',
        check_out_date: '2026-06-05',
        source: 'airbnb_ical',
        status: 'confirmed',
        is_complete: false,
        csv_only_flag: false,
      };

      mockQuery.single.mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const booking = await repository.findByLoftAndDates(
        'loft-123',
        new Date('2026-06-01'),
        new Date('2026-06-05')
      );

      expect(booking).toBeDefined();
      expect(booking?.id).toBe('booking-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('loft_id', 'loft-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('check_in_date', '2026-06-01');
      expect(mockQuery.eq).toHaveBeenCalledWith('check_out_date', '2026-06-05');
    });

    it('devrait retourner null si aucune correspondance', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const booking = await repository.findByLoftAndDates(
        'loft-123',
        new Date('2026-06-01'),
        new Date('2026-06-05')
      );

      expect(booking).toBeNull();
    });
  });

  describe('deleteBooking', () => {
    it('devrait supprimer une réservation', async () => {
      mockQuery.delete.mockResolvedValueOnce({
        error: null,
      });

      const result = await repository.deleteBooking('booking-123');

      expect(result.success).toBe(true);
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'booking-123');
    });

    it('devrait gérer les erreurs de suppression', async () => {
      mockQuery.delete.mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      });

      const result = await repository.deleteBooking('booking-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('countBookings', () => {
    it('devrait compter les réservations', async () => {
      mockQuery.select.mockResolvedValueOnce({
        count: 42,
        error: null,
      });

      const count = await repository.countBookings();

      expect(count).toBe(42);
    });

    it('devrait retourner 0 en cas d\'erreur', async () => {
      mockQuery.select.mockResolvedValueOnce({
        count: null,
        error: { message: 'Error' },
      });

      const count = await repository.countBookings();

      expect(count).toBe(0);
    });
  });

  describe('createBookingsBulk', () => {
    it('devrait créer plusieurs réservations', async () => {
      const bookings = [
        createTestBooking({ loft_id: 'loft-1' }),
        createTestBooking({ loft_id: 'loft-2' }),
        createTestBooking({ loft_id: 'loft-3' }),
      ];

      mockQuery.single
        .mockResolvedValueOnce({ data: { id: '1' }, error: null })
        .mockResolvedValueOnce({ data: { id: '2' }, error: null })
        .mockResolvedValueOnce({ data: { id: '3' }, error: null });

      const result = await repository.createBookingsBulk(bookings);

      expect(result.success).toBe(true);
      expect(result.created).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait gérer les erreurs partielles', async () => {
      const bookings = [
        createTestBooking({ loft_id: 'loft-1' }),
        createTestBooking({ loft_id: '' as any }), // Invalide
        createTestBooking({ loft_id: 'loft-3' }),
      ];

      mockQuery.single
        .mockResolvedValueOnce({ data: { id: '1' }, error: null })
        .mockResolvedValueOnce({ data: { id: '3' }, error: null });

      const result = await repository.createBookingsBulk(bookings);

      expect(result.success).toBe(false);
      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(1);
    });
  });

  describe('Invariant properties', () => {
    it('les dates converties devraient maintenir leur ordre', async () => {
      const booking = createTestBooking({
        check_in_date: new Date('2026-06-01'),
        check_out_date: new Date('2026-06-05'),
      });

      mockQuery.single.mockResolvedValueOnce({
        data: {
          id: 'booking-123',
          check_in_date: '2026-06-01',
          check_out_date: '2026-06-05',
        },
        error: null,
      });

      const result = await repository.createBooking(booking);

      expect(result.success).toBe(true);
      expect(result.booking!.check_in_date.getTime()).toBeLessThan(
        result.booking!.check_out_date.getTime()
      );
    });

    it('created_at devrait être préservé lors des updates', async () => {
      const originalCreatedAt = new Date('2026-01-01');

      mockQuery.single.mockResolvedValueOnce({
        data: {
          id: 'booking-123',
          created_at: originalCreatedAt.toISOString(),
          guest_name: 'Updated Name',
        },
        error: null,
      });

      const result = await repository.updateBooking('booking-123', {
        guest_name: 'Updated Name',
      });

      expect(result.success).toBe(true);
      // created_at ne devrait pas être dans les updates
      expect(mockQuery.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ created_at: expect.anything() })
      );
    });
  });
});
