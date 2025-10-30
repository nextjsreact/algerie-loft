/**
 * Shared Test Data Store for Loft Algerie
 * 
 * This module provides centralized test loft data that is used consistently
 * across the application when the database is empty or in test environments.
 * It ensures data consistency between search results and reservation capabilities.
 */

export interface TestLoft {
  id: string;
  name: string;
  description: string;
  address: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  cleaning_fee: number;
  tax_rate: number;
  status: 'available' | 'unavailable' | 'maintenance';
  is_published: boolean;
  average_rating: number;
  review_count: number;
  area_sqm?: number;
  minimum_stay: number;
  maximum_stay?: number;
  check_in_time?: string;
  check_out_time?: string;
  cancellation_policy?: string;
  house_rules?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Centralized test loft data - these IDs must match exactly with what's used
 * in the search API and reservation system to prevent foreign key violations
 */
export const TEST_LOFTS: TestLoft[] = [
  {
    id: '4b5c6d7e-8f9a-1b2c-3d4e-5f6789abcdef',
    name: 'Loft Moderne Centre-ville Alger',
    description: 'Un magnifique loft moderne situé au cœur d\'Alger, parfait pour les voyageurs d\'affaires et les touristes. Entièrement équipé avec tout le confort moderne.',
    address: 'Rue Didouche Mourad, Alger Centre, Alger',
    price_per_night: 8500,
    max_guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ['WiFi', 'Climatisation', 'Cuisine équipée', 'TV', 'Parking'],
    cleaning_fee: 2000,
    tax_rate: 19,
    status: 'available',
    is_published: true,
    average_rating: 4.5,
    review_count: 23,
    area_sqm: 85,
    minimum_stay: 1,
    maximum_stay: 30,
    check_in_time: '15:00',
    check_out_time: '11:00',
    cancellation_policy: 'Annulation gratuite jusqu\'à 24h avant l\'arrivée',
    house_rules: 'Non-fumeur, Pas d\'animaux, Respect du voisinage'
  },
  {
    id: '5c6d7e8f-9a1b-2c3d-4e5f-6789abcdef01',
    name: 'Studio Élégant Hydra',
    description: 'Studio élégant dans le quartier résidentiel d\'Hydra. Calme et bien situé, idéal pour un séjour relaxant à Alger.',
    address: 'Chemin des Glycines, Hydra, Alger',
    price_per_night: 6000,
    max_guests: 2,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['WiFi', 'Climatisation', 'Kitchenette', 'Balcon', 'Sécurité 24h'],
    cleaning_fee: 1500,
    tax_rate: 19,
    status: 'available',
    is_published: true,
    average_rating: 4.2,
    review_count: 18,
    area_sqm: 45,
    minimum_stay: 2,
    maximum_stay: 14,
    check_in_time: '16:00',
    check_out_time: '10:00',
    cancellation_policy: 'Annulation gratuite jusqu\'à 48h avant l\'arrivée',
    house_rules: 'Non-fumeur, Pas d\'animaux'
  },
  {
    id: '6d7e8f9a-1b2c-3d4e-5f67-89abcdef0123',
    name: 'Appartement Familial Bab Ezzouar',
    description: 'Spacieux appartement familial proche de l\'aéroport et du centre commercial. Parfait pour les familles et les groupes.',
    address: 'Cité 1200 Logements, Bab Ezzouar, Alger',
    price_per_night: 12000,
    max_guests: 6,
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['WiFi', 'Climatisation', 'Cuisine complète', 'Lave-linge', 'Parking privé', 'Jardin'],
    cleaning_fee: 3000,
    tax_rate: 19,
    status: 'available',
    is_published: true,
    average_rating: 4.7,
    review_count: 31,
    area_sqm: 120,
    minimum_stay: 1,
    maximum_stay: 21,
    check_in_time: '14:00',
    check_out_time: '12:00',
    cancellation_policy: 'Annulation gratuite jusqu\'à 7 jours avant l\'arrivée',
    house_rules: 'Animaux acceptés avec supplément, Non-fumeur'
  },
  {
    id: '7e8f9a1b-2c3d-4e5f-6789-abcdef012345',
    name: 'Penthouse Vue Mer Sidi Fredj',
    description: 'Penthouse luxueux avec vue panoramique sur la mer. Terrasse privée, piscine et accès direct à la plage.',
    address: 'Résidence Marina, Sidi Fredj, Alger',
    price_per_night: 18000,
    max_guests: 8,
    bedrooms: 4,
    bathrooms: 3,
    amenities: ['WiFi', 'Climatisation', 'Cuisine de luxe', 'Piscine privée', 'Terrasse', 'Vue mer', 'Parking'],
    cleaning_fee: 4000,
    tax_rate: 19,
    status: 'available',
    is_published: true,
    average_rating: 4.9,
    review_count: 42,
    area_sqm: 200,
    minimum_stay: 3,
    maximum_stay: 14,
    check_in_time: '15:00',
    check_out_time: '11:00',
    cancellation_policy: 'Annulation gratuite jusqu\'à 14 jours avant l\'arrivée',
    house_rules: 'Non-fumeur, Pas d\'animaux, Pas de fêtes'
  },
  {
    id: '8f9a1b2c-3d4e-5f67-89ab-cdef01234567',
    name: 'Loft Artistique Casbah',
    description: 'Loft unique dans un bâtiment historique de la Casbah, alliant charme traditionnel et confort moderne.',
    address: 'Rue des Martyrs, Casbah, Alger',
    price_per_night: 7500,
    max_guests: 3,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['WiFi', 'Climatisation', 'Cuisine équipée', 'Décoration authentique', 'Vue Casbah'],
    cleaning_fee: 1800,
    tax_rate: 19,
    status: 'available',
    is_published: true,
    average_rating: 4.3,
    review_count: 27,
    area_sqm: 65,
    minimum_stay: 2,
    maximum_stay: 10,
    check_in_time: '16:00',
    check_out_time: '10:00',
    cancellation_policy: 'Annulation gratuite jusqu\'à 48h avant l\'arrivée',
    house_rules: 'Non-fumeur, Respect du patrimoine historique'
  }
];

/**
 * Get a test loft by its ID
 * @param id The loft ID to search for
 * @returns The test loft or null if not found
 */
export function getTestLoftById(id: string): TestLoft | null {
  return TEST_LOFTS.find(loft => loft.id === id) || null;
}

/**
 * Get all test lofts
 * @returns Array of all test lofts
 */
export function getAllTestLofts(): TestLoft[] {
  return [...TEST_LOFTS];
}

/**
 * Get test lofts formatted for database seeding (without timestamps)
 * @returns Array of test lofts ready for database insertion
 */
export function getTestLoftsForSeeding(): Omit<TestLoft, 'created_at' | 'updated_at'>[] {
  return TEST_LOFTS.map(loft => {
    const { created_at, updated_at, ...seedingLoft } = loft;
    return seedingLoft;
  });
}

/**
 * Filter test lofts by various criteria
 * @param criteria Filtering criteria
 * @returns Filtered array of test lofts
 */
export function filterTestLofts(criteria: {
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  amenities?: string[];
  status?: string;
}): TestLoft[] {
  return TEST_LOFTS.filter(loft => {
    // Filter by guest capacity
    if (criteria.guests && loft.max_guests < criteria.guests) {
      return false;
    }

    // Filter by price range
    if (criteria.minPrice && loft.price_per_night < criteria.minPrice) {
      return false;
    }
    if (criteria.maxPrice && loft.price_per_night > criteria.maxPrice) {
      return false;
    }

    // Filter by location (case-insensitive partial match)
    if (criteria.location) {
      const locationLower = criteria.location.toLowerCase();
      if (!loft.address.toLowerCase().includes(locationLower) && 
          !loft.name.toLowerCase().includes(locationLower)) {
        return false;
      }
    }

    // Filter by amenities (loft must have all requested amenities)
    if (criteria.amenities && criteria.amenities.length > 0) {
      const hasAllAmenities = criteria.amenities.every(amenity =>
        loft.amenities.some(loftAmenity => 
          loftAmenity.toLowerCase().includes(amenity.toLowerCase())
        )
      );
      if (!hasAllAmenities) {
        return false;
      }
    }

    // Filter by status
    if (criteria.status && loft.status !== criteria.status) {
      return false;
    }

    return true;
  });
}

/**
 * Get test loft IDs as an array (useful for validation)
 * @returns Array of all test loft IDs
 */
export function getTestLoftIds(): string[] {
  return TEST_LOFTS.map(loft => loft.id);
}

/**
 * Check if a loft ID exists in test data
 * @param id The loft ID to check
 * @returns True if the ID exists in test data
 */
export function isTestLoftId(id: string): boolean {
  return TEST_LOFTS.some(loft => loft.id === id);
}