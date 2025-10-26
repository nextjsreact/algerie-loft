/**
 * Database query optimization utilities for multi-role booking system
 * Provides optimized queries for search, booking, and partner operations
 */

import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';

export interface QueryPerformanceMetrics {
  queryTime: number;
  resultCount: number;
  cacheHit: boolean;
  optimizationApplied: string[];
}

export interface SearchFilters {
  dates?: { checkIn: string; checkOut: string };
  location?: string;
  priceRange?: { min: number; max: number };
  amenities?: string[];
  guests?: number;
  page?: number;
  limit?: number;
}

export interface BookingQueryOptions {
  includePartner?: boolean;
  includeLoft?: boolean;
  includeMessages?: boolean;
  dateRange?: { start: string; end: string };
}

/**
 * Optimized loft search query with performance monitoring
 */
export async function optimizedLoftSearch(
  filters: SearchFilters
): Promise<{ data: any[]; metrics: QueryPerformanceMetrics }> {
  const startTime = Date.now();
  const optimizations: string[] = [];
  
  try {
    const supabase = await createClient();
    
    // Build optimized query with selective fields
    let query = supabase
      .from('lofts')
      .select(`
        id,
        name,
        address,
        price_per_night,
        images,
        amenities,
        max_guests,
        partner_id,
        is_published,
        created_at
      `)
      .eq('is_published', true);

    // Apply filters with optimizations
    if (filters.location) {
      query = query.ilike('address', `%${filters.location}%`);
      optimizations.push('location_filter');
    }

    if (filters.priceRange) {
      query = query
        .gte('price_per_night', filters.priceRange.min)
        .lte('price_per_night', filters.priceRange.max);
      optimizations.push('price_range_filter');
    }

    if (filters.guests) {
      query = query.gte('max_guests', filters.guests);
      optimizations.push('guest_capacity_filter');
    }

    if (filters.amenities && filters.amenities.length > 0) {
      query = query.contains('amenities', filters.amenities);
      optimizations.push('amenities_filter');
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 50); // Cap at 50 for performance
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query.range(from, to);
    optimizations.push('pagination');

    // Order by relevance (price for now, can be enhanced)
    query = query.order('price_per_night', { ascending: true });
    optimizations.push('relevance_ordering');

    const { data, error } = await query;

    if (error) {
      logger.error('Optimized loft search failed', { error, filters });
      throw error;
    }

    // If date filters are provided, check availability
    let availableLofts = data || [];
    if (filters.dates && availableLofts.length > 0) {
      availableLofts = await filterByAvailability(
        availableLofts,
        filters.dates.checkIn,
        filters.dates.checkOut
      );
      optimizations.push('availability_check');
    }

    const queryTime = Date.now() - startTime;
    
    const metrics: QueryPerformanceMetrics = {
      queryTime,
      resultCount: availableLofts.length,
      cacheHit: false, // Will be enhanced with Redis
      optimizationApplied: optimizations
    };

    // Log performance metrics
    if (queryTime > 2000) {
      logger.warn('Slow loft search query', { queryTime, filters, optimizations });
    }

    return { data: availableLofts, metrics };
  } catch (error) {
    const queryTime = Date.now() - startTime;
    logger.error('Loft search optimization failed', { error, queryTime, filters });
    throw error;
  }
}

/**
 * Optimized booking queries for different user roles
 */
export async function optimizedBookingQuery(
  userId: string,
  userRole: 'client' | 'partner' | 'admin',
  options: BookingQueryOptions = {}
): Promise<{ data: any[]; metrics: QueryPerformanceMetrics }> {
  const startTime = Date.now();
  const optimizations: string[] = [];
  
  try {
    const supabase = await createClient();
    
    // Base query with selective fields
    let selectFields = `
      id,
      loft_id,
      client_id,
      partner_id,
      check_in,
      check_out,
      guests,
      total_price,
      status,
      payment_status,
      created_at,
      updated_at
    `;

    // Add related data based on options
    if (options.includeLoft) {
      selectFields += `,
        lofts:loft_id (
          id,
          name,
          address,
          images
        )
      `;
      optimizations.push('loft_join');
    }

    if (options.includePartner && userRole === 'client') {
      selectFields += `,
        partner:partner_id (
          id,
          full_name,
          email
        )
      `;
      optimizations.push('partner_join');
    }

    let query = supabase
      .from('bookings')
      .select(selectFields);

    // Apply role-based filters
    switch (userRole) {
      case 'client':
        query = query.eq('client_id', userId);
        optimizations.push('client_filter');
        break;
      case 'partner':
        query = query.eq('partner_id', userId);
        optimizations.push('partner_filter');
        break;
      case 'admin':
        // No filter for admin - can see all
        optimizations.push('admin_access');
        break;
    }

    // Apply date range filter if provided
    if (options.dateRange) {
      query = query
        .gte('check_in', options.dateRange.start)
        .lte('check_out', options.dateRange.end);
      optimizations.push('date_range_filter');
    }

    // Order by most recent first
    query = query.order('created_at', { ascending: false });
    optimizations.push('chronological_ordering');

    const { data, error } = await query;

    if (error) {
      logger.error('Optimized booking query failed', { error, userId, userRole, options });
      throw error;
    }

    const queryTime = Date.now() - startTime;
    
    const metrics: QueryPerformanceMetrics = {
      queryTime,
      resultCount: data?.length || 0,
      cacheHit: false,
      optimizationApplied: optimizations
    };

    // Log performance metrics
    if (queryTime > 1500) {
      logger.warn('Slow booking query', { queryTime, userId, userRole, optimizations });
    }

    return { data: data || [], metrics };
  } catch (error) {
    const queryTime = Date.now() - startTime;
    logger.error('Booking query optimization failed', { error, queryTime, userId, userRole });
    throw error;
  }
}

/**
 * Optimized partner dashboard query
 */
export async function optimizedPartnerDashboard(
  partnerId: string
): Promise<{ data: any; metrics: QueryPerformanceMetrics }> {
  const startTime = Date.now();
  const optimizations: string[] = [];
  
  try {
    const supabase = await createClient();
    
    // Get partner properties with aggregated data
    const { data: properties, error: propertiesError } = await supabase
      .from('lofts')
      .select(`
        id,
        name,
        price_per_night,
        is_published,
        created_at
      `)
      .eq('partner_id', partnerId)
      .eq('is_published', true);

    if (propertiesError) throw propertiesError;
    optimizations.push('properties_query');

    // Get recent bookings
    const { data: recentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        loft_id,
        check_in,
        check_out,
        total_price,
        status,
        created_at,
        lofts:loft_id (name)
      `)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (bookingsError) throw bookingsError;
    optimizations.push('recent_bookings_query');

    // Calculate dashboard metrics
    const totalProperties = properties?.length || 0;
    const activeBookings = recentBookings?.filter(b => 
      b.status === 'confirmed' && new Date(b.check_in) > new Date()
    ).length || 0;
    
    const monthlyEarnings = recentBookings?.reduce((sum, booking) => {
      const bookingDate = new Date(booking.created_at);
      const currentMonth = new Date();
      if (bookingDate.getMonth() === currentMonth.getMonth() && 
          bookingDate.getFullYear() === currentMonth.getFullYear()) {
        return sum + (booking.total_price || 0);
      }
      return sum;
    }, 0) || 0;

    optimizations.push('metrics_calculation');

    const dashboardData = {
      overview: {
        totalProperties,
        activeBookings,
        monthlyEarnings,
        occupancyRate: totalProperties > 0 ? (activeBookings / totalProperties) * 100 : 0
      },
      recentBookings: recentBookings || [],
      properties: properties || []
    };

    const queryTime = Date.now() - startTime;
    
    const metrics: QueryPerformanceMetrics = {
      queryTime,
      resultCount: totalProperties + (recentBookings?.length || 0),
      cacheHit: false,
      optimizationApplied: optimizations
    };

    // Log performance metrics
    if (queryTime > 1000) {
      logger.warn('Slow partner dashboard query', { queryTime, partnerId, optimizations });
    }

    return { data: dashboardData, metrics };
  } catch (error) {
    const queryTime = Date.now() - startTime;
    logger.error('Partner dashboard optimization failed', { error, queryTime, partnerId });
    throw error;
  }
}

/**
 * Helper function to filter lofts by availability
 */
async function filterByAvailability(
  lofts: any[],
  checkIn: string,
  checkOut: string
): Promise<any[]> {
  if (!lofts.length) return lofts;
  
  const supabase = await createClient();
  const loftIds = lofts.map(loft => loft.id);
  
  // Check for conflicting bookings
  const { data: conflictingBookings } = await supabase
    .from('bookings')
    .select('loft_id')
    .in('loft_id', loftIds)
    .in('status', ['confirmed', 'pending'])
    .or(`check_in.lte.${checkOut},check_out.gte.${checkIn}`);
  
  const unavailableLoftIds = new Set(
    conflictingBookings?.map(booking => booking.loft_id) || []
  );
  
  return lofts.filter(loft => !unavailableLoftIds.has(loft.id));
}

/**
 * Query performance analyzer
 */
export class QueryPerformanceAnalyzer {
  private static metrics: Map<string, QueryPerformanceMetrics[]> = new Map();
  
  static recordMetrics(queryType: string, metrics: QueryPerformanceMetrics) {
    if (!this.metrics.has(queryType)) {
      this.metrics.set(queryType, []);
    }
    
    const queryMetrics = this.metrics.get(queryType)!;
    queryMetrics.push(metrics);
    
    // Keep only last 100 metrics per query type
    if (queryMetrics.length > 100) {
      queryMetrics.shift();
    }
  }
  
  static getAveragePerformance(queryType: string): {
    avgQueryTime: number;
    avgResultCount: number;
    cacheHitRate: number;
  } | null {
    const queryMetrics = this.metrics.get(queryType);
    if (!queryMetrics || queryMetrics.length === 0) return null;
    
    const avgQueryTime = queryMetrics.reduce((sum, m) => sum + m.queryTime, 0) / queryMetrics.length;
    const avgResultCount = queryMetrics.reduce((sum, m) => sum + m.resultCount, 0) / queryMetrics.length;
    const cacheHitRate = queryMetrics.filter(m => m.cacheHit).length / queryMetrics.length * 100;
    
    return { avgQueryTime, avgResultCount, cacheHitRate };
  }
  
  static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [queryType, metrics] of this.metrics.entries()) {
      result[queryType] = this.getAveragePerformance(queryType);
    }
    
    return result;
  }
}