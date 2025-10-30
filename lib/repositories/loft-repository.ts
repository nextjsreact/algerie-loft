/**
 * Enhanced Loft Repository
 * 
 * Provides unified data access layer for lofts with automatic fallback
 * from database to test data. Ensures consistency between search results
 * and reservation capabilities.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  TestLoft, 
  getAllTestLofts, 
  getTestLoftById, 
  filterTestLofts,
  isTestLoftId 
} from '@/lib/data/test-lofts';

export interface LoftSearchOptions {
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  amenities?: string[];
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
  status?: string;
}

export interface ClientLoftView {
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
  // Metadata for tracking data source
  source: 'database' | 'test_data';
}

export interface LoftSearchResult {
  lofts: ClientLoftView[];
  total: number;
  source: 'database' | 'test_data' | 'mixed';
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoftExistenceResult {
  loft: TestLoft | null;
  source: 'database' | 'test_data';
  exists: boolean;
}

/**
 * Enhanced Loft Repository Class
 * 
 * Provides unified access to loft data with automatic fallback mechanisms.
 * Handles both database and test data sources seamlessly.
 */
export class LoftRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Search for lofts with automatic fallback to test data
   * @param options Search and filtering options
   * @returns Promise with search results and metadata
   */
  async searchLofts(options: LoftSearchOptions = {}): Promise<LoftSearchResult> {
    const { page = 1, limit = 12 } = options;

    try {
      // First try to get lofts from database
      const databaseLofts = await this.getDatabaseLofts(options);
      
      if (databaseLofts.length > 0) {
        // Database has lofts, use them
        const total = await this.getDatabaseLoftsCount(options);
        const totalPages = Math.ceil(total / limit);

        return {
          lofts: databaseLofts.map(loft => this.mapDatabaseLoftToClientView(loft)),
          total,
          source: 'database',
          pagination: { page, limit, totalPages }
        };
      }

      // Database is empty, fall back to test data
      console.log('Database lofts table appears empty, using test data');
      const testLofts = this.getTestDataLofts(options);
      const total = testLofts.length;
      
      // Apply pagination to test data
      const startIndex = (page - 1) * limit;
      const paginatedLofts = testLofts.slice(startIndex, startIndex + limit);
      const totalPages = Math.ceil(total / limit);

      return {
        lofts: paginatedLofts.map(loft => this.mapTestLoftToClientView(loft)),
        total,
        source: 'test_data',
        pagination: { page, limit, totalPages }
      };

    } catch (error) {
      console.error('Error in searchLofts, falling back to test data:', error);
      
      // On any error, fall back to test data
      const testLofts = this.getTestDataLofts(options);
      const total = testLofts.length;
      
      const startIndex = (page - 1) * limit;
      const paginatedLofts = testLofts.slice(startIndex, startIndex + limit);
      const totalPages = Math.ceil(total / limit);

      return {
        lofts: paginatedLofts.map(loft => this.mapTestLoftToClientView(loft)),
        total,
        source: 'test_data',
        pagination: { page, limit, totalPages }
      };
    }
  }

  /**
   * Get a specific loft by ID with fallback mechanism
   * @param id The loft ID to search for
   * @returns Promise with loft data and source information
   */
  async getLoftById(id: string): Promise<LoftExistenceResult> {
    try {
      // First try database
      const { data: databaseLoft, error } = await this.supabase
        .from('lofts')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && databaseLoft) {
        return {
          loft: this.mapDatabaseLoftToTestLoft(databaseLoft),
          source: 'database',
          exists: true
        };
      }

      // Not found in database, check test data
      const testLoft = getTestLoftById(id);
      if (testLoft) {
        return {
          loft: testLoft,
          source: 'test_data',
          exists: true
        };
      }

      // Not found anywhere
      return {
        loft: null,
        source: 'database',
        exists: false
      };

    } catch (error) {
      console.error('Error in getLoftById, checking test data:', error);
      
      // On error, check test data
      const testLoft = getTestLoftById(id);
      return {
        loft: testLoft,
        source: 'test_data',
        exists: testLoft !== null
      };
    }
  }

  /**
   * Verify if a loft exists (for reservation validation)
   * @param id The loft ID to verify
   * @returns Promise<boolean> - true if loft exists in either database or test data
   */
  async verifyLoftExists(id: string): Promise<boolean> {
    const result = await this.getLoftById(id);
    return result.exists;
  }

  /**
   * Get lofts from database with filtering and pagination
   * @param options Search options
   * @returns Promise with array of database loft records
   */
  private async getDatabaseLofts(options: LoftSearchOptions): Promise<any[]> {
    let query = this.supabase
      .from('lofts')
      .select('*')
      .eq('is_published', true);

    // Apply filters
    if (options.guests) {
      query = query.gte('max_guests', options.guests);
    }

    if (options.minPrice) {
      query = query.gte('price_per_night', options.minPrice);
    }

    if (options.maxPrice) {
      query = query.lte('price_per_night', options.maxPrice);
    }

    if (options.location) {
      query = query.or(`name.ilike.%${options.location}%,address.ilike.%${options.location}%`);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    } else {
      // Default to available lofts only
      query = query.eq('status', 'available');
    }

    // Apply sorting
    if (options.sortBy) {
      const column = options.sortBy === 'rating' ? 'average_rating' : 
                    options.sortBy === 'price' ? 'price_per_night' : 'name';
      const ascending = options.sortOrder === 'asc';
      query = query.order(column, { ascending });
    } else {
      // Default sort by rating descending
      query = query.order('average_rating', { ascending: false });
    }

    // Apply pagination
    if (options.page && options.limit) {
      const from = (options.page - 1) * options.limit;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get total count of lofts in database matching criteria
   * @param options Search options
   * @returns Promise<number> - total count
   */
  private async getDatabaseLoftsCount(options: LoftSearchOptions): Promise<number> {
    let query = this.supabase
      .from('lofts')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    // Apply same filters as search
    if (options.guests) {
      query = query.gte('max_guests', options.guests);
    }

    if (options.minPrice) {
      query = query.gte('price_per_night', options.minPrice);
    }

    if (options.maxPrice) {
      query = query.lte('price_per_night', options.maxPrice);
    }

    if (options.location) {
      query = query.or(`name.ilike.%${options.location}%,address.ilike.%${options.location}%`);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    } else {
      query = query.eq('status', 'available');
    }

    const { count, error } = await query;

    if (error) {
      console.error('Database count query error:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get filtered test data lofts
   * @param options Search options
   * @returns Array of filtered test lofts
   */
  private getTestDataLofts(options: LoftSearchOptions): TestLoft[] {
    const criteria = {
      guests: options.guests,
      minPrice: options.minPrice,
      maxPrice: options.maxPrice,
      location: options.location,
      amenities: options.amenities,
      status: options.status || 'available'
    };

    let lofts = filterTestLofts(criteria);

    // Apply sorting
    if (options.sortBy) {
      lofts.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (options.sortBy) {
          case 'price':
            aValue = a.price_per_night;
            bValue = b.price_per_night;
            break;
          case 'rating':
            aValue = a.average_rating;
            bValue = b.average_rating;
            break;
          case 'name':
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
        }

        if (options.sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });
    } else {
      // Default sort by rating descending
      lofts.sort((a, b) => b.average_rating - a.average_rating);
    }

    return lofts;
  }

  /**
   * Map database loft record to client view format
   * @param dbLoft Database loft record
   * @returns ClientLoftView object
   */
  private mapDatabaseLoftToClientView(dbLoft: any): ClientLoftView {
    return {
      id: dbLoft.id,
      name: dbLoft.name,
      description: dbLoft.description || '',
      address: dbLoft.address,
      price_per_night: dbLoft.price_per_night || 0,
      max_guests: dbLoft.max_guests || 1,
      bedrooms: dbLoft.bedrooms || 1,
      bathrooms: dbLoft.bathrooms || 1,
      amenities: Array.isArray(dbLoft.amenities) ? dbLoft.amenities : [],
      cleaning_fee: dbLoft.cleaning_fee || 0,
      tax_rate: dbLoft.tax_rate || 19,
      status: dbLoft.status || 'available',
      is_published: dbLoft.is_published || false,
      average_rating: dbLoft.average_rating || 0,
      review_count: dbLoft.review_count || 0,
      area_sqm: dbLoft.area_sqm,
      minimum_stay: dbLoft.minimum_stay || 1,
      maximum_stay: dbLoft.maximum_stay,
      check_in_time: dbLoft.check_in_time,
      check_out_time: dbLoft.check_out_time,
      cancellation_policy: dbLoft.cancellation_policy,
      house_rules: dbLoft.house_rules,
      source: 'database'
    };
  }

  /**
   * Map test loft to client view format
   * @param testLoft Test loft object
   * @returns ClientLoftView object
   */
  private mapTestLoftToClientView(testLoft: TestLoft): ClientLoftView {
    return {
      id: testLoft.id,
      name: testLoft.name,
      description: testLoft.description,
      address: testLoft.address,
      price_per_night: testLoft.price_per_night,
      max_guests: testLoft.max_guests,
      bedrooms: testLoft.bedrooms,
      bathrooms: testLoft.bathrooms,
      amenities: testLoft.amenities,
      cleaning_fee: testLoft.cleaning_fee,
      tax_rate: testLoft.tax_rate,
      status: testLoft.status,
      is_published: testLoft.is_published,
      average_rating: testLoft.average_rating,
      review_count: testLoft.review_count,
      area_sqm: testLoft.area_sqm,
      minimum_stay: testLoft.minimum_stay,
      maximum_stay: testLoft.maximum_stay,
      check_in_time: testLoft.check_in_time,
      check_out_time: testLoft.check_out_time,
      cancellation_policy: testLoft.cancellation_policy,
      house_rules: testLoft.house_rules,
      source: 'test_data'
    };
  }

  /**
   * Map database loft to TestLoft format (for consistency)
   * @param dbLoft Database loft record
   * @returns TestLoft object
   */
  private mapDatabaseLoftToTestLoft(dbLoft: any): TestLoft {
    return {
      id: dbLoft.id,
      name: dbLoft.name,
      description: dbLoft.description || '',
      address: dbLoft.address,
      price_per_night: dbLoft.price_per_night || 0,
      max_guests: dbLoft.max_guests || 1,
      bedrooms: dbLoft.bedrooms || 1,
      bathrooms: dbLoft.bathrooms || 1,
      amenities: Array.isArray(dbLoft.amenities) ? dbLoft.amenities : [],
      cleaning_fee: dbLoft.cleaning_fee || 0,
      tax_rate: dbLoft.tax_rate || 19,
      status: dbLoft.status || 'available',
      is_published: dbLoft.is_published || false,
      average_rating: dbLoft.average_rating || 0,
      review_count: dbLoft.review_count || 0,
      area_sqm: dbLoft.area_sqm,
      minimum_stay: dbLoft.minimum_stay || 1,
      maximum_stay: dbLoft.maximum_stay,
      check_in_time: dbLoft.check_in_time,
      check_out_time: dbLoft.check_out_time,
      cancellation_policy: dbLoft.cancellation_policy,
      house_rules: dbLoft.house_rules,
      created_at: dbLoft.created_at,
      updated_at: dbLoft.updated_at
    };
  }

  /**
   * Check if the database has any lofts (for debugging/monitoring)
   * @returns Promise<boolean> - true if database has lofts
   */
  async hasDatabaseLofts(): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('lofts')
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        console.error('Error checking database lofts:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error in hasDatabaseLofts:', error);
      return false;
    }
  }

  /**
   * Get data source statistics (for monitoring/debugging)
   * @returns Promise with data source information
   */
  async getDataSourceStats(): Promise<{
    database_count: number;
    test_data_count: number;
    primary_source: 'database' | 'test_data';
  }> {
    try {
      const { count: dbCount } = await this.supabase
        .from('lofts')
        .select('*', { count: 'exact', head: true });

      const testDataCount = getAllTestLofts().length;
      const databaseCount = dbCount || 0;

      return {
        database_count: databaseCount,
        test_data_count: testDataCount,
        primary_source: databaseCount > 0 ? 'database' : 'test_data'
      };
    } catch (error) {
      console.error('Error getting data source stats:', error);
      return {
        database_count: 0,
        test_data_count: getAllTestLofts().length,
        primary_source: 'test_data'
      };
    }
  }
}

/**
 * Factory function to create a LoftRepository instance
 * @param supabase Supabase client instance
 * @returns LoftRepository instance
 */
export function createLoftRepository(supabase: SupabaseClient): LoftRepository {
  return new LoftRepository(supabase);
}

/**
 * Utility function to validate loft ID format
 * @param id The loft ID to validate
 * @returns boolean - true if ID format is valid
 */
export function isValidLoftId(id: string): boolean {
  // Check if it's a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}