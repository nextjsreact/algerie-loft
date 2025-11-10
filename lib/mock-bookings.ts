// Mock bookings data for development/testing when API fails

export const mockBookings = [
  {
    id: 'mock-1',
    booking_reference: 'BK123456',
    check_in: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    check_out: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    guests: 2,
    total_price: 125000,
    status: 'confirmed' as const,
    payment_status: 'paid' as const,
    loft: {
      id: 'loft-1',
      name: 'Loft Moderne Hydra',
      address: 'Rue des Frères Bouadou, Hydra, Alger',
      price_per_night: 25000,
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop']
    }
  },
  {
    id: 'mock-2',
    booking_reference: 'BK789012',
    check_in: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    check_out: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    guests: 4,
    total_price: 135000,
    status: 'confirmed' as const,
    payment_status: 'paid' as const,
    loft: {
      id: 'loft-2',
      name: 'Penthouse Luxury Oran',
      address: 'Centre-ville, Oran',
      price_per_night: 45000,
      images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop']
    }
  },
  {
    id: 'mock-3',
    booking_reference: 'BK345678',
    check_in: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    check_out: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    guests: 2,
    total_price: 90000,
    status: 'completed' as const,
    payment_status: 'paid' as const,
    loft: {
      id: 'loft-3',
      name: 'Loft Artistique Constantine',
      address: 'Centre historique, Constantine',
      price_per_night: 18000,
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop']
    }
  }
]

export function getMockBookings() {
  console.log('⚠️ Using mock bookings data')
  return mockBookings
}
