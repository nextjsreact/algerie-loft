/**
 * Database Optimization for Multi-Role Booking System
 * 
 * Optimized queries, caching strategies, and performance monitoring
 */

import { createClient } from '@/utils/supabase/server';
import { Redis } from 'ioredis';

// Redis client for caching (optional - falls back to in-memory cache)
let redis: Redis | null = null;
try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
  }
} catch (error) {
  console.warn('Redis not available, using in-memory cache');
}

// In-memory cache fallback
const memoryCache = new Map<string, { data: any; expires: number }>();

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  
  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  // Optimized loft search with caching and indexing
  async searchLofts(params: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    location?: string;
    priceRange?: { min: number; max: number };
    amenities?: string[];
    limit?: number;
    offset?: number;
  }) {
    const cacheKey = `loft_search:${JSON.stringify(params)}`;
    
    // Try cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = await createClient();
    
    // Build optimized query with proper indexing
    let query = supabase
      .from('lofts')
      .select(`
        id,
        name,
        address,
        description,
        price_per_night,
        amenities,
        images,
        owner_id,
        profiles!lofts_owner_id_fkey(full_name),
        loft_availability!left(date, is_available, price_override)
      `)
      .eq('is_published', true);

    // Apply filters with proper indexing
    if (params.location) {
      query = query.ilike('address', `%${params.location}%`);
    }

    if (params.priceRange) {
      query = query
        .gte('price_per_night', params.priceRange.min)
        .lte('price_per_night', params.priceRange.max);
    }

    if (params.amenities && params.amenities.length > 0) {
      query = query.contains('amenities', params.amenities);
    }

    // Apply pagination
    if (params.limit) {
      query = query.limit(params.limit);
    }
    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data: lofts, error } = await query;

    if (error) {
      throw new Error(`Search error: ${error.message}`);
    }

    // Filter by availability if dates provided
    let availableLofts = lofts || [];
    if (params.checkIn && params.checkOut) {
      availableLofts = await this.filterByAvailability(
        availableLofts,
        params.checkIn,
        params.checkOut
      );
    }

    // Cache results for 5 minutes
    await this.setCache(cacheKey, availableLofts, 300);

    return availableLofts;
  }

  // Optimized availability checking
  private async filterByAvailability(lofts: any[], checkIn: string, checkOut: string) {
    const supabase = await createClient();
    
    // Get all bookings that conflict with the requested dates
    const { data: conflictingBookings } = await supabase
      .from('bookings')
      .select('loft_id')
      .in('loft_id', lofts.map(l => l.id))
      .in('status', ['confirmed', 'pending'])
      .or(`and(check_in.lte.${checkOut},check_out.gte.${checkIn})`);

    const unavailableLoftIds = new Set(
      conflictingBookings?.map(b => b.loft_id) || []
    );

    return lofts.filter(loft => !unavailableLoftIds.has(loft.id));
  }

  // Optimized partner dashboard data
  async getPartnerDashboardData(partnerId: string) {
    const cacheKey = `partner_dashboard:${partnerId}`;
    
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = await createClient();

    // Use a single query with aggregations for better performance
    const { data, error } = await supabase.rpc('get_partner_dashboard_data', {
      partner_id: partnerId
    });

    if (error) {
      // Fallback to individual queries if RPC function doesn't exist
      return this.getPartnerDashboardDataFallback(partnerId);
    }

    // Cache for 2 minutes
    await this.setCache(cacheKey, data, 120);
    return data;
  }

  private async getPartnerDashboardDataFallback(partnerId: string) {
    const supabase = await createClient();

    // Parallel queries for better performance
    const [propertiesResult, bookingsResult, earningsResult] = await Promise.all([
      supabase
        .from('lofts')
        .select('id, name, is_published')
        .eq('owner_id', partnerId),
      
      supabase
        .from('bookings')
        .select('id, status, total_price, check_in, check_out')
        .eq('partner_id', partnerId)
        .gte('check_in', new Date().toISOString().split('T')[0]),
      
      supabase
        .from('bookings')
        .select('total_price')
        .eq('partner_id', partnerId)
        .eq('status', 'confirmed')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    const properties = propertiesResult.data || [];
    const bookings = bookingsResult.data || [];
    const earnings = earningsResult.data || [];

    return {
      totalProperties: properties.length,
      publishedProperties: properties.filter(p => p.is_published).length,
      activeBookings: bookings.filter(b => b.status === 'confirmed').length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      monthlyEarnings: earnings.reduce((sum, e) => sum + (e.total_price || 0), 0),
      recentBookings: bookings.slice(0, 5),
      occupancyRate: this.calculateOccupancyRate(bookings)
    };
  }

  private calculateOccupancyRate(bookings: any[]): number {
    if (bookings.length === 0) return 0;
    
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const totalNights = confirmedBookings.reduce((sum, booking) => {
      const checkIn = new Date(booking.check_in);
      const checkOut = new Date(booking.check_out);
      return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);
    
    const daysInMonth = 30;
    return Math.min((totalNights / daysInMonth) * 100, 100);
  }

  // Optimized booking creation with conflict checking
  async createBookingOptimized(bookingData: {
    loft_id: string;
    client_id: string;
    partner_id: string;
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
  }) {
    const supabase = await createClient();

    // Use a transaction-like approach with conflict checking
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('loft_id', bookingData.loft_id)
      .in('status', ['confirmed', 'pending'])
      .or(`and(check_in.lte.${bookingData.check_out},check_out.gte.${bookingData.check_in})`);

    if (existingBookings && existingBookings.length > 0) {
      throw new Error('BOOKING_CONFLICT');
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      throw new Error(`Booking creation failed: ${error.message}`);
    }

    // Invalidate related caches
    await this.invalidateCache(`partner_dashboard:${bookingData.partner_id}`);
    await this.invalidateCache(`client_bookings:${bookingData.client_id}`);

    return booking;
  }

  // Cache management
  private async getFromCache(key: string): Promise<any | null> {
    try {
      if (redis) {
        const cached = await redis.get(key);
        return cached ? JSON.parse(cached) : null;
      } else {
        const cached = memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.data;
        }
        memoryCache.delete(key);
        return null;
      }
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  private async setCache(key: string, data: any, ttlSeconds: number): Promise<void> {
    try {
      if (redis) {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
      } else {
        memoryCache.set(key, {
          data,
          expires: Date.now() + (ttlSeconds * 1000)
        });
      }
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  private async invalidateCache(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
      } else {
        memoryCache.delete(key);
      }
    } catch (error) {
      console.warn('Cache invalidation error:', error);
    }
  }

  // Clear expired entries from memory cache
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
      if (value.expires <= now) {
        memoryCache.delete(key);
      }
    }
  }
}

// Database functions for better performance (to be created in Supabase)
export const DATABASE_FUNCTIONS = {
  // Partner dashboard aggregation function
  GET_PARTNER_DASHBOARD_DATA: `
    CREATE OR REPLACE FUNCTION get_partner_dashboard_data(partner_id UUID)
    RETURNS JSON AS $$
    DECLARE
      result JSON;
    BEGIN
      SELECT json_build_object(
        'totalProperties', (
          SELECT COUNT(*) FROM lofts WHERE owner_id = partner_id
        ),
        'publishedProperties', (
          SELECT COUNT(*) FROM lofts WHERE owner_id = partner_id AND is_published = true
        ),
        'activeBookings', (
          SELECT COUNT(*) FROM bookings 
          WHERE partner_id = get_partner_dashboard_data.partner_id 
          AND status = 'confirmed'
          AND check_in >= CURRENT_DATE
        ),
        'pendingBookings', (
          SELECT COUNT(*) FROM bookings 
          WHERE partner_id = get_partner_dashboard_data.partner_id 
          AND status = 'pending'
        ),
        'monthlyEarnings', (
          SELECT COALESCE(SUM(total_price), 0) FROM bookings 
          WHERE partner_id = get_partner_dashboard_data.partner_id 
          AND status = 'confirmed'
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        ),
        'recentBookings', (
          SELECT json_agg(
            json_build_object(
              'id', id,
              'check_in', check_in,
              'check_out', check_out,
              'total_price', total_price,
              'status', status
            )
          ) FROM (
            SELECT * FROM bookings 
            WHERE partner_id = get_partner_dashboard_data.partner_id 
            ORDER BY created_at DESC 
            LIMIT 5
          ) recent
        )
      ) INTO result;
      
      RETURN result;
    END;
    $$ LANGUAGE plpgsql;
  `,

  // Optimized search function with availability checking
  SEARCH_AVAILABLE_LOFTS: `
    CREATE OR REPLACE FUNCTION search_available_lofts(
      check_in_date DATE DEFAULT NULL,
      check_out_date DATE DEFAULT NULL,
      guest_count INTEGER DEFAULT 1,
      location_filter TEXT DEFAULT NULL,
      min_price DECIMAL DEFAULT NULL,
      max_price DECIMAL DEFAULT NULL,
      required_amenities TEXT[] DEFAULT NULL,
      result_limit INTEGER DEFAULT 20,
      result_offset INTEGER DEFAULT 0
    )
    RETURNS TABLE (
      id UUID,
      name TEXT,
      address TEXT,
      description TEXT,
      price_per_night DECIMAL,
      amenities TEXT[],
      images TEXT[],
      owner_name TEXT,
      is_available BOOLEAN
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        l.id,
        l.name,
        l.address,
        l.description,
        l.price_per_night,
        l.amenities,
        l.images,
        p.full_name as owner_name,
        CASE 
          WHEN check_in_date IS NULL OR check_out_date IS NULL THEN true
          ELSE NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.loft_id = l.id
            AND b.status IN ('confirmed', 'pending')
            AND b.check_in <= check_out_date
            AND b.check_out >= check_in_date
          )
        END as is_available
      FROM lofts l
      JOIN profiles p ON l.owner_id = p.id
      WHERE l.is_published = true
        AND (location_filter IS NULL OR l.address ILIKE '%' || location_filter || '%')
        AND (min_price IS NULL OR l.price_per_night >= min_price)
        AND (max_price IS NULL OR l.price_per_night <= max_price)
        AND (required_amenities IS NULL OR l.amenities @> required_amenities)
      ORDER BY l.created_at DESC
      LIMIT result_limit
      OFFSET result_offset;
    END;
    $$ LANGUAGE plpgsql;
  `
};

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Array<{
    operation: string;
    duration: number;
    timestamp: number;
    success: boolean;
  }> = [];

  static recordOperation(operation: string, duration: number, success: boolean = true) {
    this.metrics.push({
      operation,
      duration,
      timestamp: Date.now(),
      success
    });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  static getMetrics(operation?: string, timeWindow?: number) {
    let filteredMetrics = this.metrics;

    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === operation);
    }

    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= cutoff);
    }

    return {
      totalOperations: filteredMetrics.length,
      averageDuration: filteredMetrics.reduce((sum, m) => sum + m.duration, 0) / filteredMetrics.length || 0,
      successRate: (filteredMetrics.filter(m => m.success).length / filteredMetrics.length) * 100 || 0,
      operationsPerSecond: timeWindow ? filteredMetrics.length / (timeWindow / 1000) : 0
    };
  }
}

// Middleware for automatic performance monitoring
export function withPerformanceMonitoring<T extends (...args: any[]) => Promise<any>>(
  operation: string,
  fn: T
): T {
  return (async (...args: any[]) => {
    const start = Date.now();
    let success = true;
    
    try {
      const result = await fn(...args);
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = Date.now() - start;
      PerformanceMonitor.recordOperation(operation, duration, success);
    }
  }) as T;
}