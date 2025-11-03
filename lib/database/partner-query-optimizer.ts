/**
 * Partner Query Optimizer
 * 
 * Provides optimized database queries for partner operations
 * with proper indexing, query planning, and performance monitoring.
 */

import { createReadOnlyClient } from '@/utils/supabase/server';
import { PartnerCacheService } from '@/lib/services/partner-cache-service';
import { PartnerProfile, PartnerDashboardStats, PartnerPropertyView, PartnerReservationSummary } from '@/types/partner';

interface QueryPerformanceMetrics {
  query_name: string;
  execution_time: number;
  rows_returned: number;
  cache_hit: boolean;
  timestamp: string;
}

export class PartnerQueryOptimizer {
  private static performanceMetrics: QueryPerformanceMetrics[] = [];
  private static readonly MAX_METRICS = 1000;

  /**
   * Log query performance metrics
   */
  private static logPerformance(
    queryName: string,
    executionTime: number,
    rowsReturned: number,
    cacheHit: boolean = false
  ): void {
    const metric: QueryPerformanceMetrics = {
      query_name: queryName,
      execution_time: executionTime,
      rows_returned: rowsReturned,
      cache_hit: cacheHit,
      timestamp: new Date().toISOString()
    };

    this.performanceMetrics.unshift(metric);
    
    if (this.performanceMetrics.length > this.MAX_METRICS) {
      this.performanceMetrics = this.performanceMetrics.slice(0, this.MAX_METRICS);
    }

    // Log slow queries
    if (executionTime > 1000 && !cacheHit) {
      console.warn(`[PARTNER QUERY] Slow query detected: ${queryName} took ${executionTime}ms`);
    }
  }

  /**
   * Execute query with performance monitoring
   */
  private static async executeQuery<T>(
    queryName: string,
    queryFn: () => Promise<{ data: T; error: any }>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;
      
      if (result.error) {
        throw new Error(`Query ${queryName} failed: ${result.error.message}`);
      }

      const rowsReturned = Array.isArray(result.data) ? result.data.length : 1;
      this.logPerformance(queryName, executionTime, rowsReturned);

      return result.data;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logPerformance(queryName, executionTime, 0);
      throw error;
    }
  }

  /**
   * Get optimized partner profile with caching
   */
  static async getPartnerProfile(partnerId: string): Promise<PartnerProfile | null> {
    // Check cache first
    const cached = PartnerCacheService.getCachedPartnerProfile(partnerId);
    if (cached) {
      this.logPerformance('get_partner_profile', 0, 1, true);
      return cached;
    }

    const supabase = await createReadOnlyClient();
    
    const profile = await this.executeQuery(
      'get_partner_profile',
      () => supabase
        .from('partners')
        .select(`
          id,
          user_id,
          business_name,
          business_type,
          tax_id,
          address,
          phone,
          verification_status,
          verification_documents,
          portfolio_description,
          admin_notes,
          approved_at,
          approved_by,
          rejected_at,
          rejected_by,
          rejection_reason,
          last_login_at,
          created_at,
          updated_at,
          bank_details
        `)
        .eq('id', partnerId)
        .single()
    );

    if (profile) {
      PartnerCacheService.cachePartnerProfile(partnerId, profile);
    }

    return profile;
  }

  /**
   * Get optimized partner dashboard statistics
   */
  static async getPartnerDashboardStats(partnerId: string): Promise<PartnerDashboardStats> {
    // Check cache first
    const cached = PartnerCacheService.getCachedDashboardStats(partnerId);
    if (cached) {
      this.logPerformance('get_partner_dashboard_stats', 0, 1, true);
      return cached;
    }

    const supabase = await createReadOnlyClient();
    
    // Use a single optimized query with aggregations
    const stats = await this.executeQuery(
      'get_partner_dashboard_stats',
      () => supabase.rpc('get_partner_dashboard_stats', { partner_id: partnerId })
    );

    if (stats) {
      PartnerCacheService.cacheDashboardStats(partnerId, stats);
    }

    return stats || {
      properties: { total: 0, available: 0, occupied: 0, maintenance: 0 },
      revenue: { current_month: 0, previous_month: 0, year_to_date: 0, currency: 'DZD' },
      reservations: { active: 0, upcoming: 0, completed_this_month: 0 },
      occupancy_rate: { current_month: 0, previous_month: 0 }
    };
  }

  /**
   * Get optimized partner properties list
   */
  static async getPartnerProperties(
    partnerId: string,
    filters?: {
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<PartnerPropertyView[]> {
    // Check cache first
    const cached = PartnerCacheService.getCachedPropertiesList(partnerId, filters);
    if (cached) {
      this.logPerformance('get_partner_properties', 0, cached.length, true);
      return cached;
    }

    const supabase = await createReadOnlyClient();
    
    let query = supabase
      .from('lofts')
      .select(`
        id,
        name,
        description,
        address,
        price_per_month,
        status,
        partner_id,
        created_at,
        updated_at,
        images,
        zone_area_id,
        max_guests,
        bedrooms,
        bathrooms,
        amenities
      `)
      .eq('partner_id', partnerId);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    // Order by most recently updated
    query = query.order('updated_at', { ascending: false });

    const properties = await this.executeQuery('get_partner_properties', () => query);

    // Transform to PartnerPropertyView format
    const propertyViews: PartnerPropertyView[] = properties.map(property => ({
      ...property,
      current_occupancy_status: property.status as 'available' | 'occupied' | 'maintenance',
      revenue_this_month: 0, // Will be populated by separate query if needed
      revenue_last_month: 0,
      total_reservations: 0,
      average_rating: 0,
      images: property.images || []
    }));

    if (propertyViews.length > 0) {
      PartnerCacheService.cachePropertiesList(partnerId, propertyViews, filters);
    }

    return propertyViews;
  }

  /**
   * Get optimized partner property details
   */
  static async getPartnerPropertyDetails(partnerId: string, loftId: string): Promise<PartnerPropertyView | null> {
    // Check cache first
    const cached = PartnerCacheService.getCachedPropertyDetails(partnerId, loftId);
    if (cached) {
      this.logPerformance('get_partner_property_details', 0, 1, true);
      return cached;
    }

    const supabase = await createReadOnlyClient();
    
    // Get property with additional computed fields
    const property = await this.executeQuery(
      'get_partner_property_details',
      () => supabase.rpc('get_partner_property_details', { 
        partner_id: partnerId, 
        loft_id: loftId 
      })
    );

    if (property) {
      PartnerCacheService.cachePropertyDetails(partnerId, loftId, property);
    }

    return property;
  }

  /**
   * Get optimized partner reservations
   */
  static async getPartnerReservations(
    partnerId: string,
    filters?: {
      status?: string;
      date_from?: string;
      date_to?: string;
      loft_id?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<PartnerReservationSummary[]> {
    // Check cache first
    const cached = PartnerCacheService.getCachedReservationsList(partnerId, filters);
    if (cached) {
      this.logPerformance('get_partner_reservations', 0, cached.length, true);
      return cached;
    }

    const supabase = await createReadOnlyClient();
    
    let query = supabase
      .from('reservations')
      .select(`
        id,
        loft_id,
        guest_name,
        guest_email,
        guest_phone,
        check_in,
        check_out,
        total_amount,
        currency,
        status,
        created_at,
        special_requests,
        admin_notes,
        lofts!inner(
          id,
          name,
          partner_id
        )
      `)
      .eq('lofts.partner_id', partnerId);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.date_from) {
      query = query.gte('check_in', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('check_out', filters.date_to);
    }

    if (filters?.loft_id) {
      query = query.eq('loft_id', filters.loft_id);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    // Order by most recent
    query = query.order('created_at', { ascending: false });

    const reservations = await this.executeQuery('get_partner_reservations', () => query);

    // Transform to PartnerReservationSummary format
    const reservationSummaries: PartnerReservationSummary[] = reservations.map(reservation => ({
      id: reservation.id,
      loft_id: reservation.loft_id,
      loft_name: reservation.lofts.name,
      guest_name: reservation.guest_name,
      guest_email: reservation.guest_email,
      guest_phone: reservation.guest_phone,
      check_in: reservation.check_in,
      check_out: reservation.check_out,
      total_amount: reservation.total_amount,
      currency: reservation.currency,
      status: reservation.status,
      created_at: reservation.created_at,
      special_requests: reservation.special_requests,
      admin_notes: reservation.admin_notes
    }));

    if (reservationSummaries.length > 0) {
      PartnerCacheService.cacheReservationsList(partnerId, reservationSummaries, filters);
    }

    return reservationSummaries;
  }

  /**
   * Get partner revenue reports with optimized aggregations
   */
  static async getPartnerRevenueReports(
    partnerId: string,
    dateRange: { from: string; to: string },
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<any> {
    // Check cache first
    const cached = PartnerCacheService.getCachedRevenueReports(partnerId, dateRange);
    if (cached) {
      this.logPerformance('get_partner_revenue_reports', 0, 1, true);
      return cached;
    }

    const supabase = await createReadOnlyClient();
    
    const reports = await this.executeQuery(
      'get_partner_revenue_reports',
      () => supabase.rpc('get_partner_revenue_reports', {
        partner_id: partnerId,
        date_from: dateRange.from,
        date_to: dateRange.to,
        group_by: groupBy
      })
    );

    if (reports) {
      PartnerCacheService.cacheRevenueReports(partnerId, dateRange, reports);
    }

    return reports;
  }

  /**
   * Batch load partner data for dashboard
   */
  static async batchLoadPartnerDashboard(partnerId: string): Promise<{
    profile: PartnerProfile | null;
    stats: PartnerDashboardStats;
    properties: PartnerPropertyView[];
    recentReservations: PartnerReservationSummary[];
  }> {
    const startTime = Date.now();

    try {
      // Execute all queries in parallel
      const [profile, stats, properties, recentReservations] = await Promise.all([
        this.getPartnerProfile(partnerId),
        this.getPartnerDashboardStats(partnerId),
        this.getPartnerProperties(partnerId, { limit: 10 }),
        this.getPartnerReservations(partnerId, { limit: 5 })
      ]);

      const executionTime = Date.now() - startTime;
      this.logPerformance('batch_load_partner_dashboard', executionTime, 1);

      return {
        profile,
        stats,
        properties,
        recentReservations
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logPerformance('batch_load_partner_dashboard', executionTime, 0);
      throw error;
    }
  }

  /**
   * Validate partner property ownership (optimized)
   */
  static async validatePartnerPropertyOwnership(partnerId: string, loftId: string): Promise<boolean> {
    const supabase = await createReadOnlyClient();
    
    const result = await this.executeQuery(
      'validate_partner_property_ownership',
      () => supabase
        .from('lofts')
        .select('id')
        .eq('id', loftId)
        .eq('partner_id', partnerId)
        .single()
    );

    return !!result;
  }

  /**
   * Get query performance metrics
   */
  static getPerformanceMetrics(queryName?: string): QueryPerformanceMetrics[] {
    if (queryName) {
      return this.performanceMetrics.filter(metric => metric.query_name === queryName);
    }
    return [...this.performanceMetrics];
  }

  /**
   * Get performance summary
   */
  static getPerformanceSummary(): {
    total_queries: number;
    avg_execution_time: number;
    cache_hit_rate: number;
    slow_queries: number;
    queries_by_name: Record<string, { count: number; avg_time: number; cache_hits: number }>;
  } {
    const metrics = this.performanceMetrics;
    const totalQueries = metrics.length;
    
    if (totalQueries === 0) {
      return {
        total_queries: 0,
        avg_execution_time: 0,
        cache_hit_rate: 0,
        slow_queries: 0,
        queries_by_name: {}
      };
    }

    const avgExecutionTime = metrics.reduce((sum, m) => sum + m.execution_time, 0) / totalQueries;
    const cacheHits = metrics.filter(m => m.cache_hit).length;
    const cacheHitRate = (cacheHits / totalQueries) * 100;
    const slowQueries = metrics.filter(m => m.execution_time > 1000 && !m.cache_hit).length;

    const queriesByName = metrics.reduce((acc, metric) => {
      if (!acc[metric.query_name]) {
        acc[metric.query_name] = { count: 0, total_time: 0, cache_hits: 0 };
      }
      acc[metric.query_name].count++;
      acc[metric.query_name].total_time += metric.execution_time;
      if (metric.cache_hit) {
        acc[metric.query_name].cache_hits++;
      }
      return acc;
    }, {} as Record<string, { count: number; total_time: number; cache_hits: number }>);

    const queriesSummary = Object.entries(queriesByName).reduce((acc, [name, data]) => {
      acc[name] = {
        count: data.count,
        avg_time: Math.round(data.total_time / data.count),
        cache_hits: data.cache_hits
      };
      return acc;
    }, {} as Record<string, { count: number; avg_time: number; cache_hits: number }>);

    return {
      total_queries: totalQueries,
      avg_execution_time: Math.round(avgExecutionTime),
      cache_hit_rate: Math.round(cacheHitRate * 100) / 100,
      slow_queries: slowQueries,
      queries_by_name: queriesSummary
    };
  }

  /**
   * Clear performance metrics
   */
  static clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
  }
}

// Database function creation scripts (to be run in Supabase)
export const PARTNER_OPTIMIZATION_FUNCTIONS = `
-- Function to get partner dashboard statistics
CREATE OR REPLACE FUNCTION get_partner_dashboard_stats(partner_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  properties_stats JSON;
  revenue_stats JSON;
  reservations_stats JSON;
  occupancy_stats JSON;
BEGIN
  -- Get properties statistics
  SELECT json_build_object(
    'total', COUNT(*),
    'available', COUNT(*) FILTER (WHERE status = 'available'),
    'occupied', COUNT(*) FILTER (WHERE status = 'occupied'),
    'maintenance', COUNT(*) FILTER (WHERE status = 'maintenance')
  ) INTO properties_stats
  FROM lofts
  WHERE lofts.partner_id = get_partner_dashboard_stats.partner_id;

  -- Get revenue statistics
  SELECT json_build_object(
    'current_month', COALESCE(SUM(total_amount) FILTER (WHERE 
      DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    ), 0),
    'previous_month', COALESCE(SUM(total_amount) FILTER (WHERE 
      DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    ), 0),
    'year_to_date', COALESCE(SUM(total_amount) FILTER (WHERE 
      DATE_TRUNC('year', created_at) = DATE_TRUNC('year', CURRENT_DATE)
    ), 0),
    'currency', 'DZD'
  ) INTO revenue_stats
  FROM reservations r
  JOIN lofts l ON r.loft_id = l.id
  WHERE l.partner_id = get_partner_dashboard_stats.partner_id
    AND r.status IN ('confirmed', 'completed');

  -- Get reservations statistics
  SELECT json_build_object(
    'active', COUNT(*) FILTER (WHERE status = 'confirmed' AND check_in <= CURRENT_DATE AND check_out >= CURRENT_DATE),
    'upcoming', COUNT(*) FILTER (WHERE status = 'confirmed' AND check_in > CURRENT_DATE),
    'completed_this_month', COUNT(*) FILTER (WHERE 
      status = 'completed' AND 
      DATE_TRUNC('month', check_out) = DATE_TRUNC('month', CURRENT_DATE)
    )
  ) INTO reservations_stats
  FROM reservations r
  JOIN lofts l ON r.loft_id = l.id
  WHERE l.partner_id = get_partner_dashboard_stats.partner_id;

  -- Calculate occupancy rates (simplified)
  SELECT json_build_object(
    'current_month', 0,
    'previous_month', 0
  ) INTO occupancy_stats;

  -- Combine all statistics
  SELECT json_build_object(
    'properties', properties_stats,
    'revenue', revenue_stats,
    'reservations', reservations_stats,
    'occupancy_rate', occupancy_stats
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get partner property details with computed fields
CREATE OR REPLACE FUNCTION get_partner_property_details(partner_id UUID, loft_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', l.id,
    'name', l.name,
    'description', l.description,
    'address', l.address,
    'price_per_month', l.price_per_month,
    'status', l.status,
    'partner_id', l.partner_id,
    'created_at', l.created_at,
    'updated_at', l.updated_at,
    'images', COALESCE(l.images, '[]'::json),
    'current_occupancy_status', l.status,
    'revenue_this_month', COALESCE((
      SELECT SUM(total_amount)
      FROM reservations r
      WHERE r.loft_id = l.id
        AND DATE_TRUNC('month', r.created_at) = DATE_TRUNC('month', CURRENT_DATE)
        AND r.status IN ('confirmed', 'completed')
    ), 0),
    'revenue_last_month', COALESCE((
      SELECT SUM(total_amount)
      FROM reservations r
      WHERE r.loft_id = l.id
        AND DATE_TRUNC('month', r.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND r.status IN ('confirmed', 'completed')
    ), 0),
    'total_reservations', COALESCE((
      SELECT COUNT(*)
      FROM reservations r
      WHERE r.loft_id = l.id
    ), 0),
    'average_rating', 0
  ) INTO result
  FROM lofts l
  WHERE l.id = get_partner_property_details.loft_id
    AND l.partner_id = get_partner_property_details.partner_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get partner revenue reports
CREATE OR REPLACE FUNCTION get_partner_revenue_reports(
  partner_id UUID,
  date_from DATE,
  date_to DATE,
  group_by TEXT DEFAULT 'month'
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- This is a simplified version - implement based on specific requirements
  SELECT json_build_object(
    'total_revenue', COALESCE(SUM(total_amount), 0),
    'total_reservations', COUNT(*),
    'average_booking_value', COALESCE(AVG(total_amount), 0),
    'period', json_build_object(
      'from', date_from,
      'to', date_to,
      'group_by', group_by
    )
  ) INTO result
  FROM reservations r
  JOIN lofts l ON r.loft_id = l.id
  WHERE l.partner_id = get_partner_revenue_reports.partner_id
    AND r.created_at::date BETWEEN date_from AND date_to
    AND r.status IN ('confirmed', 'completed');

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lofts_partner_id ON lofts(partner_id);
CREATE INDEX IF NOT EXISTS idx_lofts_partner_status ON lofts(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_lofts_partner_updated ON lofts(partner_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservations_loft_partner ON reservations(loft_id) 
  WHERE loft_id IN (SELECT id FROM lofts WHERE partner_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_reservations_status_dates ON reservations(status, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_created_month ON reservations(DATE_TRUNC('month', created_at));

CREATE INDEX IF NOT EXISTS idx_partners_verification_status ON partners(verification_status);
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
`;

// Export the optimizer for use in API routes
export default PartnerQueryOptimizer;