// Enhanced Loft service for client reservation system

import { createClient } from '@/utils/supabase/client';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface LoftSelectionItem {
  id: string;
  name: string;
  address: string;
}

export interface LoftSelectionResponse {
  lofts: LoftSelectionItem[];
  total: number;
}

export interface SearchCriteria {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  sortBy?: 'price' | 'rating' | 'distance' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface LoftSearchResult {
  id: string;
  name: string;
  description?: string;
  address: string;
  price_per_night: number;
  status: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  area_sqm?: number;
  minimum_stay: number;
  cleaning_fee: number;
  average_rating: number;
  review_count: number;
  primary_photo_url?: string;
  amenity_names: string[];
}

export interface LoftDetails extends LoftSearchResult {
  maximum_stay?: number;
  check_in_time?: string;
  check_out_time?: string;
  tax_rate: number;
  cancellation_policy?: string;
  house_rules?: string;
  owner_name?: string;
  zone_name?: string;
  photos: LoftPhoto[];
  amenities: LoftAmenity[];
  recent_reviews: LoftReview[];
}

export interface LoftPhoto {
  id: string;
  url: string;
  alt_text?: string;
  order_index: number;
  is_primary: boolean;
}

export interface LoftAmenity {
  id: string;
  name: string;
  category: string;
  icon?: string;
  description?: string;
}

export interface LoftReview {
  id: string;
  rating: number;
  review_text?: string;
  client_name?: string;
  created_at: string;
  response_text?: string;
  response_date?: string;
}

export interface SearchResponse {
  lofts: LoftSearchResult[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: SearchCriteria;
}

// =====================================================
// LOFT SERVICE CLASS
// =====================================================

export class LoftService {
  private supabase = createClient();

  /**
   * Search lofts with filtering and sorting capabilities
   */
  async searchLofts(criteria: SearchCriteria, page = 1, limit = 12): Promise<SearchResponse> {
    try {
      const offset = (page - 1) * limit;
      
      // Call the database search function
      const { data: lofts, error } = await this.supabase.rpc('search_available_lofts', {
        p_check_in: criteria.checkIn || null,
        p_check_out: criteria.checkOut || null,
        p_location: criteria.location || null,
        p_min_price: criteria.minPrice || null,
        p_max_price: criteria.maxPrice || null,
        p_guests: criteria.guests || 1,
        p_amenities: criteria.amenities || null,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('Search lofts error:', error);
        throw new Error('Failed to search lofts');
      }

      // Apply sorting if specified
      const sortedLofts = this.applySorting(lofts || [], criteria.sortBy, criteria.sortOrder);

      // Get total count for pagination
      const { count: totalCount } = await this.supabase
        .from('lofts')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .eq('status', 'available');

      return {
        lofts: sortedLofts,
        total: totalCount || 0,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil((totalCount || 0) / limit)
        },
        filters: criteria
      };
    } catch (error) {
      console.error('Error searching lofts:', error);
      throw error;
    }
  }

  /**
   * Get detailed loft information by ID
   */
  async getLoftById(id: string): Promise<LoftDetails | null> {
    try {
      const { data: loftData, error } = await this.supabase.rpc('get_loft_details', {
        p_loft_id: id
      });

      if (error) {
        console.error('Get loft details error:', error);
        throw new Error('Failed to get loft details');
      }

      if (!loftData || loftData.length === 0) {
        return null;
      }

      const loft = loftData[0];
      
      return {
        id: loft.id,
        name: loft.name,
        description: loft.description,
        address: loft.address,
        price_per_night: loft.price_per_night,
        status: loft.status,
        max_guests: loft.max_guests,
        bedrooms: loft.bedrooms,
        bathrooms: loft.bathrooms,
        area_sqm: loft.area_sqm,
        minimum_stay: loft.minimum_stay,
        maximum_stay: loft.maximum_stay,
        check_in_time: loft.check_in_time,
        check_out_time: loft.check_out_time,
        cleaning_fee: loft.cleaning_fee,
        tax_rate: loft.tax_rate,
        cancellation_policy: loft.cancellation_policy,
        house_rules: loft.house_rules,
        average_rating: loft.average_rating,
        review_count: loft.review_count,
        owner_name: loft.owner_name,
        zone_name: loft.zone_name,
        photos: loft.photos || [],
        amenities: loft.amenities || [],
        recent_reviews: loft.recent_reviews || [],
        amenity_names: []
      };
    } catch (error) {
      console.error('Error getting loft by ID:', error);
      throw error;
    }
  }

  /**
   * Get loft photos by loft ID
   */
  async getLoftPhotos(loftId: string): Promise<LoftPhoto[]> {
    try {
      const { data: photos, error } = await this.supabase
        .from('loft_photos')
        .select('id, url, alt_text, order_index, is_primary')
        .eq('loft_id', loftId)
        .order('order_index');

      if (error) {
        console.error('Get loft photos error:', error);
        throw new Error('Failed to get loft photos');
      }

      return photos || [];
    } catch (error) {
      console.error('Error getting loft photos:', error);
      throw error;
    }
  }

  /**
   * Get loft amenities by loft ID
   */
  async getLoftAmenities(loftId: string): Promise<LoftAmenity[]> {
    try {
      const { data: amenities, error } = await this.supabase
        .from('loft_amenity_relations')
        .select(`
          loft_amenities (
            id,
            name,
            category,
            icon,
            description
          )
        `)
        .eq('loft_id', loftId);

      if (error) {
        console.error('Get loft amenities error:', error);
        throw new Error('Failed to get loft amenities');
      }

      return amenities?.map(item => item.loft_amenities).filter(Boolean) || [];
    } catch (error) {
      console.error('Error getting loft amenities:', error);
      throw error;
    }
  }

  /**
   * Get all available amenities for filtering
   */
  async getAllAmenities(): Promise<LoftAmenity[]> {
    try {
      const { data: amenities, error } = await this.supabase
        .from('loft_amenities')
        .select('id, name, category, icon, description')
        .order('category, name');

      if (error) {
        console.error('Get all amenities error:', error);
        throw new Error('Failed to get amenities');
      }

      return amenities || [];
    } catch (error) {
      console.error('Error getting all amenities:', error);
      throw error;
    }
  }

  /**
   * Check loft availability for date range
   */
  async checkAvailability(loftId: string, checkIn: string, checkOut: string): Promise<boolean> {
    try {
      const { data: unavailableDates, error } = await this.supabase
        .from('loft_availability')
        .select('date')
        .eq('loft_id', loftId)
        .eq('is_available', false)
        .gte('date', checkIn)
        .lt('date', checkOut);

      if (error) {
        console.error('Check availability error:', error);
        throw new Error('Failed to check availability');
      }

      // If there are any unavailable dates in the range, return false
      return !unavailableDates || unavailableDates.length === 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  /**
   * Get loft reviews with pagination
   */
  async getLoftReviews(loftId: string, page = 1, limit = 10): Promise<{ reviews: LoftReview[], total: number }> {
    try {
      const offset = (page - 1) * limit;

      const { data: reviews, error } = await this.supabase
        .from('loft_reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          response_text,
          response_date,
          profiles!loft_reviews_client_id_fkey (
            full_name
          )
        `)
        .eq('loft_id', loftId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Get loft reviews error:', error);
        throw new Error('Failed to get loft reviews');
      }

      const { count: totalCount } = await this.supabase
        .from('loft_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('loft_id', loftId)
        .eq('is_published', true);

      const formattedReviews: LoftReview[] = (reviews || []).map(review => ({
        id: review.id,
        rating: review.rating,
        review_text: review.review_text,
        client_name: review.profiles?.full_name || 'Anonymous',
        created_at: review.created_at,
        response_text: review.response_text,
        response_date: review.response_date
      }));

      return {
        reviews: formattedReviews,
        total: totalCount || 0
      };
    } catch (error) {
      console.error('Error getting loft reviews:', error);
      throw error;
    }
  }

  /**
   * Apply sorting to loft search results
   */
  private applySorting(lofts: LoftSearchResult[], sortBy?: string, sortOrder = 'asc'): LoftSearchResult[] {
    if (!sortBy) return lofts;

    return [...lofts].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'price':
          comparison = a.price_per_night - b.price_per_night;
          break;
        case 'rating':
          comparison = a.average_rating - b.average_rating;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          return 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }
}

// =====================================================
// LEGACY FUNCTIONS (for backward compatibility)
// =====================================================

/**
 * Fetch lofts for selection in task forms
 * @param search Optional search term to filter lofts by name or address
 * @returns Promise with lofts data
 */
export async function fetchLoftsForSelection(search?: string): Promise<LoftSelectionResponse> {
  try {
    const url = new URL('/api/lofts/selection', window.location.origin);
    
    if (search && search.trim()) {
      url.searchParams.set('search', search.trim());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching lofts for selection:', error);
    throw error;
  }
}

/**
 * Get a formatted display name for a loft (name + address)
 * @param loft The loft selection item
 * @returns Formatted display string
 */
export function formatLoftDisplayName(loft: LoftSelectionItem): string {
  return `${loft.name} - ${loft.address}`;
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

export const loftService = new LoftService();