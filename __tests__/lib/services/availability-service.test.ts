import { AvailabilityService, DateRange, PricingBreakdown, AvailabilityResult } from '@/lib/services/availability-service';
import { createClient } from '@/utils/supabase/client';

// Mock the Supabase client
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn()
}));

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let mockSupabase: any;
  let mockQuery: any;

  // Mock data for testing
  const mockLoft = {
    id: 'loft-123',
    minimum_stay: 2,
    maximum_stay: 14,
    status: 'available',
    price_per_night: 100,
    cleaning_fee: 50,
    tax_rate: 0.19
  };

  // Use future dates for testing
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 5);

  const validDateRange: DateRange = {
    checkIn: tomorrow.toISOString().split('T')[0],
    checkOut: dayAfterTomorrow.toISOString().split('T')[0]
  };

  beforeEach(() => {
    // Setup mock Supabase client with proper chaining
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    };
    
    mockSupabase = {
      from: jest.fn().mockReturnValue(mockQuery),
      rpc: jest.fn()
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    service = new AvailabilityService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAvailability', () => {
    it('should return available when loft is available for the date range', async () => {
      // Mock loft data - first call to get loft details
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: mockLoft, error: null })
          })
        })
      });
      
      // Mock no unavailable dates - second call
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      // Mock no conflicting reservations - third call
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          or: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      // Mock no active locks - fourth call
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          or: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await service.checkAvailability('loft-123', validDateRange);

      expect(result.isAvailable).toBe(true);
      expect(result.unavailableDates).toEqual([]);
      expect(result.minimumStay).toBe(2);
      expect(result.maximumStay).toBe(14);
    });

    it('should return unavailable when loft status is not available', async () => {
      const unavailableLoft = { ...mockLoft, status: 'maintenance' };
      
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: unavailableLoft, error: null })
          })
        })
      });

      const result = await service.checkAvailability('loft-123', validDateRange);

      expect(result.isAvailable).toBe(false);
      expect(result.restrictions).toContainEqual({
        type: 'blocked_dates',
        message: 'Loft is currently not available for booking'
      });
    });

    it('should return restrictions when stay is shorter than minimum', async () => {
      mockQuery.single.mockResolvedValue({ data: mockLoft, error: null });
      
      const shortStayRange: DateRange = {
        checkIn: tomorrow.toISOString().split('T')[0],
        checkOut: tomorrow.toISOString().split('T')[0].replace(/(\d{4}-\d{2}-\d{2})/, (match, date) => {
          const d = new Date(date);
          d.setDate(d.getDate() + 1);
          return d.toISOString().split('T')[0];
        }) // Only 1 night
      };

      // Mock empty responses for other checks
      mockSupabase.from.mockReturnValue({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          gt: jest.fn().mockReturnThis(),
          or: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await service.checkAvailability('loft-123', shortStayRange);

      expect(result.isAvailable).toBe(false);
      expect(result.restrictions).toContainEqual({
        type: 'minimum_stay',
        message: 'Minimum stay is 2 night(s)'
      });
    });

    it('should throw error for invalid date range', async () => {
      const invalidRange: DateRange = {
        checkIn: '2024-12-05',
        checkOut: '2024-12-01' // Check-out before check-in
      };

      await expect(service.checkAvailability('loft-123', invalidRange))
        .rejects.toThrow('Check-out date must be after check-in date');
    });

    it('should throw error for past dates', async () => {
      const pastRange: DateRange = {
        checkIn: '2020-01-01',
        checkOut: '2020-01-05'
      };

      await expect(service.checkAvailability('loft-123', pastRange))
        .rejects.toThrow('Check-in date cannot be in the past');
    });
  });

  describe('calculatePricing', () => {
    it('should calculate correct pricing breakdown', async () => {
      // Mock loft data
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: mockLoft, error: null })
          })
        })
      });
      
      // Mock no price overrides
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await service.calculatePricing('loft-123', validDateRange);

      const expectedNights = 4;
      const expectedSubtotal = 100 * expectedNights; // 400
      const expectedServiceFee = expectedSubtotal * 0.12; // 48
      const expectedTaxableAmount = expectedSubtotal + expectedServiceFee + 50; // 498
      const expectedTaxes = expectedTaxableAmount * 0.19; // 94.62
      const expectedTotal = expectedTaxableAmount + expectedTaxes; // 592.62

      expect(result.nights).toBe(expectedNights);
      expect(result.subtotal).toBe(expectedSubtotal);
      expect(result.serviceFee).toBe(expectedServiceFee);
      expect(result.cleaningFee).toBe(50);
      expect(result.taxes).toBeCloseTo(expectedTaxes, 2);
      expect(result.total).toBeCloseTo(expectedTotal, 2);
      expect(result.currency).toBe('EUR');
    });

    it('should handle price overrides correctly', async () => {
      mockQuery.single.mockResolvedValue({ data: mockLoft, error: null });
      
      // Mock price overrides for some dates
      const priceOverrides = [
        { date: '2024-12-02', price_override: 150 },
        { date: '2024-12-03', price_override: 120 }
      ];
      
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lt: jest.fn().mockResolvedValue({ data: priceOverrides, error: null })
        })
      });

      const result = await service.calculatePricing('loft-123', validDateRange);

      // Expected: 100 (Dec 1) + 150 (Dec 2) + 120 (Dec 3) + 100 (Dec 4) = 470
      expect(result.subtotal).toBe(470);
      expect(result.priceOverrides).toHaveLength(2);
      expect(result.priceOverrides![0]).toEqual({
        date: '2024-12-02',
        originalPrice: 100,
        overridePrice: 150,
        reason: 'Seasonal pricing'
      });
    });

    it('should throw error when loft is not found', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: 'Not found' });

      await expect(service.calculatePricing('invalid-loft', validDateRange))
        .rejects.toThrow('Loft not found');
    });
  });

  describe('lockReservation', () => {
    it('should create reservation lock when dates are available', async () => {
      // Mock availability check to return available
      jest.spyOn(service, 'checkAvailability').mockResolvedValue({
        isAvailable: true,
        unavailableDates: [],
        minimumStay: 2
      });

      const mockLockId = 'lock-123';
      mockQuery.single.mockResolvedValue({ data: { id: mockLockId }, error: null });

      const lockId = await service.lockReservation('loft-123', validDateRange, 'user-123');

      expect(lockId).toBe(mockLockId);
      expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
        loft_id: 'loft-123',
        check_in: validDateRange.checkIn,
        check_out: validDateRange.checkOut,
        user_id: 'user-123'
      }));
    });

    it('should throw error when dates are not available', async () => {
      jest.spyOn(service, 'checkAvailability').mockResolvedValue({
        isAvailable: false,
        unavailableDates: ['2024-12-02'],
        minimumStay: 2
      });

      await expect(service.lockReservation('loft-123', validDateRange))
        .rejects.toThrow('Selected dates are no longer available');
    });
  });

  describe('releaseReservationLock', () => {
    it('should delete reservation lock', async () => {
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        delete: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      await service.releaseReservationLock('lock-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('reservation_locks');
    });

    it('should throw error when deletion fails', async () => {
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        delete: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockResolvedValue({ error: 'Deletion failed' })
        })
      });

      await expect(service.releaseReservationLock('lock-123'))
        .rejects.toThrow('Failed to release reservation lock');
    });
  });

  describe('updateAvailability', () => {
    it('should update availability for multiple dates', async () => {
      const updates = [
        {
          loftId: 'loft-123',
          date: '2024-12-01',
          isAvailable: false,
          blockedReason: 'Maintenance'
        },
        {
          loftId: 'loft-123',
          date: '2024-12-02',
          isAvailable: true,
          priceOverride: 150
        }
      ];

      mockQuery.upsert.mockResolvedValue({ error: null });

      await service.updateAvailability(updates);

      expect(mockQuery.upsert).toHaveBeenCalledTimes(2);
    });

    it('should throw error when update fails', async () => {
      const updates = [{
        loftId: 'loft-123',
        date: '2024-12-01',
        isAvailable: false
      }];

      mockQuery.upsert.mockResolvedValue({ error: 'Update failed' });

      await expect(service.updateAvailability(updates))
        .rejects.toThrow('Failed to update availability for 2024-12-01');
    });
  });

  describe('getAvailabilityCalendar', () => {
    it('should return availability calendar for date range', async () => {
      const availabilityData = [
        { date: '2024-12-01', is_available: true },
        { date: '2024-12-02', is_available: false },
        { date: '2024-12-03', is_available: true }
      ];

      mockSupabase.from.mockReturnValue({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({ data: availabilityData, error: null })
        })
      });

      const calendar = await service.getAvailabilityCalendar('loft-123', '2024-12-01', '2024-12-03');

      expect(calendar['2024-12-01']).toBe(true);
      expect(calendar['2024-12-02']).toBe(false);
      expect(calendar['2024-12-03']).toBe(true);
    });
  });

  describe('synchronizeAvailability', () => {
    it('should synchronize availability with confirmed reservations', async () => {
      const reservations = [
        { check_in: '2024-12-01', check_out: '2024-12-03' },
        { check_in: '2024-12-05', check_out: '2024-12-07' }
      ];

      // Mock cleanup expired locks
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        delete: jest.fn().mockReturnValue({
          ...mockQuery,
          lt: jest.fn().mockResolvedValue({ error: null })
        })
      });

      // Mock fetch reservations
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis().mockResolvedValue({ data: reservations, error: null })
        })
      });

      // Mock updateAvailability
      jest.spyOn(service, 'updateAvailability').mockResolvedValue();

      await service.synchronizeAvailability('loft-123');

      expect(service.updateAvailability).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            loftId: 'loft-123',
            isAvailable: false,
            blockedReason: 'Reserved'
          })
        ])
      );
    });
  });

  describe('date validation and helper methods', () => {
    it('should validate date formats correctly', async () => {
      const invalidDateRange: DateRange = {
        checkIn: 'invalid-date',
        checkOut: '2024-12-05'
      };

      await expect(service.checkAvailability('loft-123', invalidDateRange))
        .rejects.toThrow('Invalid date format');
    });

    it('should reject bookings too far in the future', async () => {
      const farFutureDate = new Date();
      farFutureDate.setFullYear(farFutureDate.getFullYear() + 3); // 3 years in future
      const farFutureEndDate = new Date(farFutureDate);
      farFutureEndDate.setDate(farFutureEndDate.getDate() + 4);
      
      const farFutureRange: DateRange = {
        checkIn: farFutureDate.toISOString().split('T')[0],
        checkOut: farFutureEndDate.toISOString().split('T')[0]
      };

      await expect(service.checkAvailability('loft-123', farFutureRange))
        .rejects.toThrow('Booking date is too far in the future');
    });
  });
});