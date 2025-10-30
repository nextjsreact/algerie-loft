import { Reservation } from '@/lib/services/reservation-service';

/**
 * Create test reservation data for development
 */
export function createTestReservations(): Reservation[] {
  return [
    {
      id: 'res_1761750802743_fk2abpr8b',
      customer_id: 'test-customer-1',
      loft_id: '4b5c6d7e-8f9a-1b2c-3d4e-5f6789abcdef',
      check_in_date: '2025-11-15',
      check_out_date: '2025-11-18',
      nights: 3,
      guest_info: {
        primary_guest: {
          first_name: 'Ahmed',
          last_name: 'Benali',
          email: 'ahmed.benali@email.com',
          phone: '+213 555 123 456',
          nationality: 'Algérie'
        },
        total_guests: 2,
        adults: 2,
        children: 0,
        infants: 0
      },
      pricing: {
        base_price: 25500,
        nights: 3,
        nightly_rate: 8500,
        cleaning_fee: 1500,
        service_fee: 1050,
        taxes: 2550,
        total_amount: 28050,
        currency: 'DZD',
        breakdown: [
          { date: '2025-11-15', rate: 8500, type: 'base' },
          { date: '2025-11-16', rate: 8500, type: 'base' },
          { date: '2025-11-17', rate: 8500, type: 'base' }
        ]
      },
      special_requests: 'Arrivée tardive prévue vers 22h',
      status: 'confirmed',
      payment_status: 'paid',
      confirmation_code: 'AL8K9M2P',
      booking_reference: 'LA25001234',
      communication_preferences: {
        email: true,
        sms: true,
        whatsapp: false
      },
      terms_accepted: true,
      terms_accepted_at: '2024-10-29T14:30:00Z',
      terms_version: '1.0',
      created_at: '2024-10-29T14:30:00Z',
      updated_at: '2024-10-29T14:30:00Z',
      created_by: 'test-customer-1',
      updated_by: 'test-customer-1',
      booking_source: 'website',
      loft_name: 'Loft Test Centre-ville',
      loft_location: { address: '15 Rue Didouche Mourad, Alger Centre' }
    },
    {
      id: 'res_1761753298419_suzy9niuo',
      customer_id: 'test-customer-1',
      loft_id: '4b5c6d7e-8f9a-1b2c-3d4e-5f6789abcdef',
      check_in_date: '2025-11-15',
      check_out_date: '2025-11-18',
      nights: 3,
      guest_info: {
        primary_guest: {
          first_name: 'Sarah',
          last_name: 'Mansouri',
          email: 'sarah.mansouri@email.com',
          phone: '+213 666 789 012',
          nationality: 'Algérie'
        },
        total_guests: 2,
        adults: 2,
        children: 0,
        infants: 0
      },
      pricing: {
        base_price: 25500,
        nights: 3,
        nightly_rate: 8500,
        cleaning_fee: 1500,
        service_fee: 1050,
        taxes: 2550,
        total_amount: 28050,
        currency: 'DZD',
        breakdown: [
          { date: '2025-11-15', rate: 8500, type: 'base' },
          { date: '2025-11-16', rate: 8500, type: 'base' },
          { date: '2025-11-17', rate: 8500, type: 'base' }
        ]
      },
      special_requests: 'Chambre avec vue sur mer si possible',
      status: 'pending',
      payment_status: 'pending',
      confirmation_code: 'BM7N3Q5R',
      booking_reference: 'LA25001235',
      communication_preferences: {
        email: true,
        sms: false,
        whatsapp: true
      },
      terms_accepted: true,
      terms_accepted_at: '2024-10-29T15:45:00Z',
      terms_version: '1.0',
      created_at: '2024-10-29T15:45:00Z',
      updated_at: '2024-10-29T15:45:00Z',
      created_by: 'test-customer-1',
      updated_by: 'test-customer-1',
      booking_source: 'website',
      loft_name: 'Loft Test Centre-ville',
      loft_location: { address: '15 Rue Didouche Mourad, Alger Centre' }
    }
  ];
}

/**
 * Initialize test data in localStorage if not already present
 */
export function initializeTestData(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const existingReservations = localStorage.getItem('reservations');
    if (!existingReservations) {
      const testReservations = createTestReservations();
      localStorage.setItem('reservations', JSON.stringify(testReservations));
      console.log('✅ Test reservation data initialized');
    }
  } catch (error) {
    console.error('Error initializing test data:', error);
  }
}

/**
 * Clear all test data
 */
export function clearTestData(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem('reservations');
    console.log('🗑️ Test data cleared');
  } catch (error) {
    console.error('Error clearing test data:', error);
  }
}