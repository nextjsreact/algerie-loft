/**
 * Loft Data Service
 * Provides loft data from database or fallback to mock data
 * Handles RLS issues gracefully for development environments
 */

import { createClient } from '@/lib/supabase/client';
import { getTestLoftsForSeeding } from '@/lib/data/test-lofts';

export interface LoftSearchParams {
  check_in?: string;
  check_out?: string;
  guests?: number;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface Loft {
  id: string;
  name: string;
  address: string;
  price_per_night: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  description: string;
  images: string[];
  status: string;
  is_published: boolean;
}

export class LoftDataService {
  private supabase = createClient();
  private mockLofts: Loft[] | null = null;

  /**
   * Get mock lofts from localStorage or test data
   */
  private getMockLofts(): Loft[] {
    if (this.mockLofts) {
      return this.mockLofts;
    }

    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mock_lofts');
      if (stored) {
        try {
          this.mockLofts = JSON.parse(stored);
          return this.mockLofts!;
        } catch (error) {
          console.warn('Failed to parse stored mock lofts:', error);
        }
      }
    }

    // Fallback to test data
    const testLofts = getTestLoftsForSeeding();
    this.mockLofts = testLofts.map(loft => ({
      id: loft.id,
      name: loft.name,
      address: loft.address,
      price_per_night: loft.price_per_night,
      max_guests: loft.max_guests,
      bedrooms: loft.bedrooms,
      bathrooms: loft.bathrooms,
      amenities: loft.amenities,
      description: loft.description,
      images: loft.images || [],
      status: 'available',
      is_published: true
    }));

    return this.mockLofts;
  }

  /**
   * Search for lofts with filters
   */
  async searchLofts(params: LoftSearchParams = {}): Promise<Loft[]> {
    try {
      // Try database first
      let query = this.supabase
        .from('lofts')
        .select('*')
        .eq('is_published', true)
        .eq('status', 'available');

      if (params.guests) {
        query = query.gte('max_guests', params.guests);
      }

      if (params.minPrice) {
        query = query.gte('price_per_night', params.minPrice);
      }

      if (params.maxPrice) {
        query = query.lte('price_per_night', params.maxPrice);
      }

      if (params.location) {
        query = query.ilike('address', `%${params.location}%`);
      }

      const { data: lofts, error } = await query.limit(20);

      if (!error && lofts && lofts.length > 0) {
        return lofts;
      }

      // If database fails or returns no results, use mock data
      console.warn('Database query failed or returned no results, using mock data');
      return this.filterMockLofts(params);

    } catch (error) {
      console.warn('Database error, falling back to mock data:', error);
      return this.filterMockLofts(params);
    }
  }

  /**
   * Get a specific loft by ID
   */
  async getLoftById(id: string): Promise<Loft | null> {
    try {
      // Try database first
      const { data: loft, error } = await this.supabase
        .from('lofts')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && loft) {
        return loft;
      }

      // Fallback to mock data
      const mockLofts = this.getMockLofts();
      return mockLofts.find(loft => loft.id === id) || null;

    } catch (error) {
      console.warn('Database error, checking mock data:', error);
      const mockLofts = this.getMockLofts();
      return mockLofts.find(loft => loft.id === id) || null;
    }
  }

  /**
   * Get all lofts
   */
  async getAllLofts(): Promise<Loft[]> {
    try {
      // Try database first
      const { data: lofts, error } = await this.supabase
        .from('lofts')
        .select('*')
        .eq('is_published', true)
        .order('name');

      if (!error && lofts && lofts.length > 0) {
        return lofts;
      }

      // Fallback to mock data
      return this.getMockLofts();

    } catch (error) {
      console.warn('Database error, using mock data:', error);
      return this.getMockLofts();
    }
  }

  /**
   * Filter mock lofts based on search parameters
   */
  private filterMockLofts(params: LoftSearchParams): Loft[] {
    let lofts = this.getMockLofts();

    if (params.guests) {
      lofts = lofts.filter(loft => loft.max_guests >= params.guests!);
    }

    if (params.minPrice) {
      lofts = lofts.filter(loft => loft.price_per_night >= params.minPrice!);
    }

    if (params.maxPrice) {
      lofts = lofts.filter(loft => loft.price_per_night <= params.maxPrice!);
    }

    if (params.location) {
      const location = params.location.toLowerCase();
      lofts = lofts.filter(loft => 
        loft.address.toLowerCase().includes(location) ||
        loft.name.toLowerCase().includes(location)
      );
    }

    return lofts.slice(0, 20); // Limit results
  }

  /**
   * Check if a loft exists
   */
  async loftExists(id: string): Promise<boolean> {
    const loft = await this.getLoftById(id);
    return loft !== null;
  }

  /**
   * Get loft count
   */
  async getLoftCount(): Promise<number> {
    try {
      // Try database first
      const { count, error } = await this.supabase
        .from('lofts')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);

      if (!error && count !== null) {
        return count;
      }

      // Fallback to mock data
      return this.getMockLofts().length;

    } catch (error) {
      console.warn('Database error, using mock data count:', error);
      return this.getMockLofts().length;
    }
  }
}

// Export singleton instance
export const loftDataService = new LoftDataService();