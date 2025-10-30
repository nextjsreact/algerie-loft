import { ReservationService } from '@/lib/services/reservation-service';
import { emailNotificationService } from '@/lib/services/email-notification-service';
import { createClient } from '@/utils/supabase/server';

// Mock the dependencies
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn()
}));

jest.mock('@/lib/services/email-notification-service', () => ({
  emailNotificationService: {
    sendEmailNotification: jest.fn()
  }
}));

describe('ReservationService', () => {
  let service: ReservationService;
  let mockSupabase: any;
  let mockQuery: any;

  // Mock data for testing
  const mockLoft = {
    id: 'loft-123',
    status: 'available',
    name: 'Test Loft',
    address: '123 Test Street'
  };

  const mockCustomer = {
    id: 'customer-123',
    full_name: 'John Doe',
    email: 'john@example.com'
  };

  // Use future dates for testing
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 5);

  const mockReservationRequest = {
    loft_id: 'loft-123',
    customer_id: 'customer-123',
    check_in_date: tomorrow.toISOString().split('T')[0],
    check_out_date: dayAfterTomorrow.toISOString().split('T')[0],
    guest_info: {
      primary_guest: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      },
      total_guests: 2,
      adults: 2,
      children: 0,
      infants: 0
    },
    pricing: {
      base_price: 400,
      nights: 4,
      nightly_rate: 100,
      cleaning_fee: 50,
      service_fee: 48,
      taxes: 94.62,
      total_amount: 592.62,
      currency: 'DZD',
      breakdown: [
        { date: tomorrow.toISOString().split('T')[0], rate: 100, type: 'base' },
        { date: new Date(tomorrow.getTime() + 86400000).toISOString().split('T')[0], rate: 100, type: 'base' },
        { date: new Date(tomorrow.getTime() + 172800000).toISOString().split('T')[0], rate: 100, type: 'base' },
        { date: new Date(tomorrow.getTime() + 259200000).toISOString().split('T')[0], rate: 100, type: 'base' }
      ]
    },
    terms_accepted: true,
    booking_source: 'website'
  };

  const mockReservation = {
    id: 'reservation-123',
    ...mockReservationRequest,
    status: 'pending',
    payment_status: 'pending',
    confirmation_code: 'ABC12345',
    booking_reference: 'LA24001234',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(() => {
    // Setup mock Supabase client with proper chaining
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis()
    };
    
    mockSupabase = {
      from: jest.fn().mockReturnValue(mockQuery),
      rpc: jest.fn()
    };
    
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    service = new ReservationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReservation', () => {
    it('should create a reservation successfully', async () => {
      // Mock loft validation
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

      // Mock conflict check (no conflicts)
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          gt: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      // Mock reservation lock creation
      mockSupabase.rpc.mockResolvedValueOnce({ data: 'lock-123', error: null });

      // Mock reservation creation
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        insert: jest.fn().mockReturnValue({
          ...mockQuery,
          select: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: mockReservation, error: null })
          })
        })
      });

      // Mock lock release
      mockSupabase.rpc.mockResolvedValueOnce({ error: null });

      // Mock reservation with relations for email
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({
              data: {
                ...mockReservation,
                loft: mockLoft,
                customer: mockCustomer
              },
              error: null
            })
          })
        })
      });

      // Mock audit log insertion
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await service.createReservation(mockReservationRequest);

      expect(result).toEqual(mockReservation);
      expect(emailNotificationService.sendEmailNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockCustomer.email,
          template_key: 'reservation_confirmation'
        })
      );
    });

    it('should throw error when loft is not found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: null, error: 'Not found' })
          })
        })
      });

      await expect(service.createReservation(mockReservationRequest))
        .rejects.toThrow('Loft not found');
    });

    it('should throw error when loft is not available', async () => {
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

      await expect(service.createReservation(mockReservationRequest))
        .rejects.toThrow('Loft is not available for booking');
    });

    it('should throw error when dates conflict with existing reservation', async () => {
      // Mock loft validation
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

      // Mock conflict check (has conflicts)
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          gt: jest.fn().mockResolvedValue({ data: [{ id: 'existing-reservation' }], error: null })
        })
      });

      await expect(service.createReservation(mockReservationRequest))
        .rejects.toThrow('Loft is not available for the selected dates');
    });

    it('should validate required fields', async () => {
      const invalidRequest = { ...mockReservationRequest, loft_id: '' };

      await expect(service.createReservation(invalidRequest))
        .rejects.toThrow('Loft ID is required');
    });

    it('should validate terms acceptance', async () => {
      const invalidRequest = { ...mockReservationRequest, terms_accepted: false };

      await expect(service.createReservation(invalidRequest))
        .rejects.toThrow('Terms and conditions must be accepted');
    });

    it('should validate date range', async () => {
      const invalidRequest = {
        ...mockReservationRequest,
        check_in_date: dayAfterTomorrow.toISOString().split('T')[0],
        check_out_date: tomorrow.toISOString().split('T')[0] // Check-out before check-in
      };

      await expect(service.createReservation(invalidRequest))
        .rejects.toThrow('Check-out date must be after check-in date');
    });

    it('should validate past dates', async () => {
      const invalidRequest = {
        ...mockReservationRequest,
        check_in_date: '2020-01-01',
        check_out_date: '2020-01-05'
      };

      await expect(service.createReservation(invalidRequest))
        .rejects.toThrow('Check-in date cannot be in the past');
    });
  });

  describe('getReservations', () => {
    it('should fetch reservations with filters and pagination', async () => {
      const mockReservations = [mockReservation];
      
      mockSupabase.from.mockReturnValue({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockReservations,
            count: 1,
            error: null
          })
        })
      });

      const result = await service.getReservations({
        customer_id: 'customer-123',
        status: 'pending',
        page: 1,
        limit: 20
      });

      expect(result.reservations).toEqual(mockReservations);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should handle empty results', async () => {
      mockSupabase.from.mockReturnValue({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [],
            count: 0,
            error: null
          })
        })
      });

      const result = await service.getReservations();

      expect(result.reservations).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getReservationById', () => {
    it('should fetch reservation by ID', async () => {
      mockSupabase.from.mockReturnValue({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: mockReservation, error: null })
          })
        })
      });

      const result = await service.getReservationById('reservation-123');

      expect(result).toEqual(mockReservation);
    });

    it('should return null when reservation not found', async () => {
      mockSupabase.from.mockReturnValue({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      const result = await service.getReservationById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateReservation', () => {
    it('should update reservation successfully', async () => {
      const updates = { status: 'confirmed' as const };
      const updatedReservation = { ...mockReservation, status: 'confirmed' };

      // Mock get current reservation
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: mockReservation, error: null })
          })
        })
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        update: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            select: jest.fn().mockReturnValue({
              ...mockQuery,
              single: jest.fn().mockResolvedValue({ data: updatedReservation, error: null })
            })
          })
        })
      });

      // Mock reservation with relations for email
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({
              data: {
                ...updatedReservation,
                loft: mockLoft,
                customer: mockCustomer
              },
              error: null
            })
          })
        })
      });

      // Mock audit log insertion
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await service.updateReservation('reservation-123', updates, 'user-123');

      expect(result.status).toBe('confirmed');
      expect(emailNotificationService.sendEmailNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          template_key: 'reservation_confirmed'
        })
      );
    });

    it('should throw error when reservation not found', async () => {
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      await expect(service.updateReservation('nonexistent', { status: 'confirmed' }))
        .rejects.toThrow('Reservation not found');
    });
  });

  describe('cancelReservation', () => {
    it('should cancel reservation successfully', async () => {
      const cancelledReservation = {
        ...mockReservation,
        status: 'cancelled',
        cancellation_reason: 'Customer request'
      };

      // Mock get current reservation
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: mockReservation, error: null })
          })
        })
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        update: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            select: jest.fn().mockReturnValue({
              ...mockQuery,
              single: jest.fn().mockResolvedValue({ data: cancelledReservation, error: null })
            })
          })
        })
      });

      // Mock reservation with relations for cancellation email
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({
              data: {
                ...cancelledReservation,
                loft: mockLoft,
                customer: mockCustomer
              },
              error: null
            })
          })
        })
      });

      // Mock audit log insertion
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await service.cancelReservation(
        'reservation-123',
        'Customer request',
        'user-123'
      );

      expect(result.status).toBe('cancelled');
      expect(result.cancellation_reason).toBe('Customer request');
      expect(emailNotificationService.sendEmailNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          template_key: 'reservation_cancellation'
        })
      );
    });
  });

  describe('confirmReservation', () => {
    it('should confirm reservation successfully', async () => {
      const confirmedReservation = { ...mockReservation, status: 'confirmed' };

      // Mock get current reservation
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: mockReservation, error: null })
          })
        })
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        update: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            select: jest.fn().mockReturnValue({
              ...mockQuery,
              single: jest.fn().mockResolvedValue({ data: confirmedReservation, error: null })
            })
          })
        })
      });

      // Mock reservation with relations for email
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({
              data: {
                ...confirmedReservation,
                loft: mockLoft,
                customer: mockCustomer
              },
              error: null
            })
          })
        })
      });

      // Mock audit log insertion
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      const result = await service.confirmReservation('reservation-123', 'admin-123');

      expect(result.status).toBe('confirmed');
      expect(emailNotificationService.sendEmailNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          template_key: 'reservation_confirmed'
        })
      );
    });
  });

  describe('getUserReservations', () => {
    it('should fetch user reservations', async () => {
      const mockReservations = [mockReservation];
      
      mockSupabase.from.mockReturnValue({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockReservations,
            count: 1,
            error: null
          })
        })
      });

      const result = await service.getUserReservations('customer-123');

      expect(result.reservations).toEqual(mockReservations);
      expect(result.total).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      });

      await expect(service.getReservations())
        .rejects.toThrow('Failed to fetch reservations: Database connection failed');
    });

    it('should handle email notification failures gracefully', async () => {
      // Mock successful reservation creation
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

      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          lt: jest.fn().mockReturnThis(),
          gt: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      mockSupabase.rpc.mockResolvedValueOnce({ data: 'lock-123', error: null });

      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        insert: jest.fn().mockReturnValue({
          ...mockQuery,
          select: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: mockReservation, error: null })
          })
        })
      });

      mockSupabase.rpc.mockResolvedValueOnce({ error: null });

      // Mock email notification failure
      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        select: jest.fn().mockReturnValue({
          ...mockQuery,
          eq: jest.fn().mockReturnValue({
            ...mockQuery,
            single: jest.fn().mockResolvedValue({ data: null, error: 'Not found' })
          })
        })
      });

      mockSupabase.from.mockReturnValueOnce({
        ...mockQuery,
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      // Should still succeed even if email fails
      const result = await service.createReservation(mockReservationRequest);
      expect(result).toEqual(mockReservation);
    });
  });
});