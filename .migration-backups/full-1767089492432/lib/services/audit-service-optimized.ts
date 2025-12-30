import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import type { AuditLog, AuditFilters, AuditAction, AuditableTable } from '@/lib/types'

/**
 * Interface for performance metrics
 */
interface PerformanceMetrics {
  metricName: string;
  metricValue: string;
  status: 'OK' | 'WARNING' | 'CRITICAL';
  recommendation: string;
}

/**
 * Interface for query performance analysis
 */
interface QueryPerformanceStats {
  indexName: string;
  indexScans: number;
  tuplesRead: number;
  tuplesFetched: number;
  avgTuplesPerScan: number;
}

/**
 * Optimized Audit Service with enhanced performance features
 * Provides high-performance methods for audit operations with large datasets
 */
export class OptimizedAuditService {
  
  /**
   * Get audit logs using optimized database function with advanced filtering
   * @param filters - Filtering criteria for audit logs
   * @param page - Page number (1-based)
   * @param limit - Number of records per page
   * @returns Promise containing logs array and total count
   */
  static async getAuditLogsOptimized(
    filters: AuditFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: AuditLog[]; total: number; queryTime: number }> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching audit logs with optimized query', { filters, page, limit });
      
      const supabase = await createClient();
      const offset = (page - 1) * limit;

      // Use optimized database function for better performance
      const { data, error } = await supabase.rpc('search_audit_logs_optimized', {
        p_table_name: filters.tableName || null,
        p_user_id: filters.userId || null,
        p_action: filters.action || null,
        p_date_from: filters.dateFrom || null,
        p_date_to: filters.dateTo || null,
        p_search_text: filters.search || null,
        p_changed_field: null, // Can be extended for field-specific searches
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        logger.error('Failed to fetch optimized audit logs', error, { filters, page, limit });
        throw new Error(`Failed to fetch audit logs: ${error.message}`);
      }

      // Transform data to match AuditLog interface
      const logs: AuditLog[] = (data || []).map((row: any) => ({
        id: row.id,
        tableName: row.table_name,
        recordId: row.record_id,
        action: row.action as AuditAction,
        userId: row.user_id,
        userEmail: row.user_email,
        timestamp: row.timestamp,
        oldValues: row.old_values,
        newValues: row.new_values,
        changedFields: row.changed_fields || [],
        ipAddress: row.ip_address,
        userAgent: row.user_agent
      }));

      // Get total count from first row (if available)
      const total = data && data.length > 0 ? data[0].total_count || data.length : 0;
      const queryTime = Date.now() - startTime;

      logger.info('Optimized audit logs fetched successfully', { 
        count: logs.length, 
        total,
        queryTime: `${queryTime}ms`,
        filters 
      });

      return {
        logs,
        total,
        queryTime
      };

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('Error in getAuditLogsOptimized', error, { 
        filters, 
        page, 
        limit, 
        queryTime: `${queryTime}ms` 
      });
      throw error;
    }
  }

  /**
   * Get entity audit history using optimized database function
   * @param tableName - Name of the table (entity type)
   * @param recordId - ID of the specific record
   * @param limit - Maximum number of records to return
   * @param offset - Number of records to skip
   * @returns Promise containing array of audit logs for the entity
   */
  static async getEntityAuditHistoryOptimized(
    tableName: string,
    recordId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ logs: AuditLog[]; queryTime: number }> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching entity audit history with optimization', { 
        tableName, 
        recordId, 
        limit, 
        offset 
      });
      
      const supabase = await createClient();

      // Use optimized database function
      const { data, error } = await supabase.rpc('get_entity_audit_history_optimized', {
        p_table_name: tableName,
        p_record_id: recordId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        logger.error('Failed to fetch optimized entity audit history', error, { 
          tableName, 
          recordId, 
          limit, 
          offset 
        });
        throw new Error(`Failed to fetch entity audit history: ${error.message}`);
      }

      // Transform data to match AuditLog interface
      const logs: AuditLog[] = (data || []).map((row: any) => ({
        id: row.id,
        tableName: tableName,
        recordId: recordId,
        action: row.action as AuditAction,
        userId: row.user_id,
        userEmail: row.user_email,
        timestamp: row.timestamp,
        oldValues: row.old_values,
        newValues: row.new_values,
        changedFields: row.changed_fields || [],
        ipAddress: row.ip_address,
        userAgent: row.user_agent
      }));

      const queryTime = Date.now() - startTime;

      logger.info('Optimized entity audit history fetched successfully', { 
        tableName, 
        recordId, 
        count: logs.length,
        queryTime: `${queryTime}ms`
      });

      return {
        logs,
        queryTime
      };

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('Error in getEntityAuditHistoryOptimized', error, { 
        tableName, 
        recordId, 
        limit, 
        offset,
        queryTime: `${queryTime}ms`
      });
      throw error;
    }
  }

  /**
   * Get audit statistics using optimized database function
   * @param tableName - Optional specific table to analyze
   * @param days - Number of days to analyze (default: 30)
   * @returns Promise containing comprehensive audit statistics
   */
  static async getAuditStatisticsOptimized(
    tableName?: string,
    days: number = 30
  ): Promise<{
    statistics: Array<{
      tableName: string;
      totalLogs: number;
      insertCount: number;
      updateCount: number;
      deleteCount: number;
      uniqueUsers: number;
      latestActivity: string;
      avgDailyActivity: number;
    }>;
    queryTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching optimized audit statistics', { tableName, days });
      
      const supabase = await createClient();

      // Use optimized database function
      const { data, error } = await supabase.rpc('get_audit_statistics_optimized', {
        p_table_name: tableName || null,
        p_days: days
      });

      if (error) {
        logger.error('Failed to fetch optimized audit statistics', error, { tableName, days });
        throw new Error(`Failed to fetch audit statistics: ${error.message}`);
      }

      const statistics = (data || []).map((row: any) => ({
        tableName: row.table_name,
        totalLogs: row.total_logs,
        insertCount: row.insert_count,
        updateCount: row.update_count,
        deleteCount: row.delete_count,
        uniqueUsers: row.unique_users,
        latestActivity: row.latest_activity,
        avgDailyActivity: row.avg_daily_activity
      }));

      const queryTime = Date.now() - startTime;

      logger.info('Optimized audit statistics fetched successfully', { 
        tableName, 
        days,
        statisticsCount: statistics.length,
        queryTime: `${queryTime}ms`
      });

      return {
        statistics,
        queryTime
      };

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('Error in getAuditStatisticsOptimized', error, { 
        tableName, 
        days,
        queryTime: `${queryTime}ms`
      });
      throw error;
    }
  }

  /**
   * Analyze audit system performance and get recommendations
   * @returns Promise containing performance analysis and recommendations
   */
  static async analyzePerformance(): Promise<{
    analysis: Array<{
      analysisType: string;
      tableName: string;
      recommendation: string;
      currentValue: string;
      suggestedAction: string;
    }>;
    queryTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      logger.info('Analyzing audit system performance');
      
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('analyze_performance');

      if (error) {
        logger.error('Failed to analyze performance', error);
        throw new Error(`Failed to analyze performance: ${error.message}`);
      }

      const analysis = (data || []).map((row: any) => ({
        analysisType: row.analysis_type,
        tableName: row.table_name,
        recommendation: row.recommendation,
        currentValue: row.current_value,
        suggestedAction: row.suggested_action
      }));

      const queryTime = Date.now() - startTime;

      logger.info('Performance analysis completed', { 
        analysisCount: analysis.length,
        queryTime: `${queryTime}ms`
      });

      return {
        analysis,
        queryTime
      };

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('Error in analyzePerformance', error, { 
        queryTime: `${queryTime}ms`
      });
      throw error;
    }
  }

  /**
   * Get current performance metrics
   * @returns Promise containing current performance metrics
   */
  static async getPerformanceMetrics(): Promise<{
    metrics: PerformanceMetrics[];
    queryTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching performance metrics');
      
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_performance_metrics');

      if (error) {
        logger.error('Failed to fetch performance metrics', error);
        throw new Error(`Failed to fetch performance metrics: ${error.message}`);
      }

      const metrics: PerformanceMetrics[] = (data || []).map((row: any) => ({
        metricName: row.metric_name,
        metricValue: row.metric_value,
        status: row.status as 'OK' | 'WARNING' | 'CRITICAL',
        recommendation: row.recommendation
      }));

      const queryTime = Date.now() - startTime;

      logger.info('Performance metrics fetched successfully', { 
        metricsCount: metrics.length,
        queryTime: `${queryTime}ms`
      });

      return {
        metrics,
        queryTime
      };

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('Error in getPerformanceMetrics', error, { 
        queryTime: `${queryTime}ms`
      });
      throw error;
    }
  }

  /**
   * Get query performance statistics
   * @returns Promise containing query performance data
   */
  static async getQueryPerformanceStats(): Promise<{
    stats: QueryPerformanceStats[];
    queryTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      logger.info('Fetching query performance statistics');
      
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('query_performance_stats')
        .select('*')
        .order('index_scans', { ascending: false });

      if (error) {
        logger.error('Failed to fetch query performance stats', error);
        throw new Error(`Failed to fetch query performance stats: ${error.message}`);
      }

      const stats: QueryPerformanceStats[] = (data || []).map((row: any) => ({
        indexName: row.indexname,
        indexScans: row.index_scans,
        tuplesRead: row.tuples_read,
        tuplesFetched: row.tuples_fetched,
        avgTuplesPerScan: row.avg_tuples_per_scan
      }));

      const queryTime = Date.now() - startTime;

      logger.info('Query performance stats fetched successfully', { 
        statsCount: stats.length,
        queryTime: `${queryTime}ms`
      });

      return {
        stats,
        queryTime
      };

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('Error in getQueryPerformanceStats', error, { 
        queryTime: `${queryTime}ms`
      });
      throw error;
    }
  }

  /**
   * Rebuild audit indexes for optimal performance
   * @returns Promise containing rebuild results
   */
  static async rebuildIndexes(): Promise<{
    result: string;
    queryTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      logger.info('Rebuilding audit indexes');
      
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('rebuild_indexes');

      if (error) {
        logger.error('Failed to rebuild indexes', error);
        throw new Error(`Failed to rebuild indexes: ${error.message}`);
      }

      const queryTime = Date.now() - startTime;

      logger.info('Indexes rebuilt successfully', { 
        queryTime: `${queryTime}ms`
      });

      return {
        result: data || 'Indexes rebuilt successfully',
        queryTime
      };

    } catch (error) {
      const queryTime = Date.now() - startTime;
      logger.error('Error in rebuildIndexes', error, { 
        queryTime: `${queryTime}ms`
      });
      throw error;
    }
  }

  /**
   * Batch process audit logs for large dataset operations
   * @param filters - Filtering criteria
   * @param batchSize - Size of each batch
   * @param processor - Function to process each batch
   * @returns Promise containing batch processing results
   */
  static async batchProcessAuditLogs<T>(
    filters: AuditFilters,
    batchSize: number = 1000,
    processor: (logs: AuditLog[]) => Promise<T>
  ): Promise<{
    results: T[];
    totalProcessed: number;
    totalTime: number;
  }> {
    const startTime = Date.now();
    const results: T[] = [];
    let totalProcessed = 0;
    let page = 1;
    let hasMore = true;

    try {
      logger.info('Starting batch processing of audit logs', { 
        filters, 
        batchSize 
      });

      while (hasMore) {
        const { logs, total } = await this.getAuditLogsOptimized(filters, page, batchSize);
        
        if (logs.length === 0) {
          hasMore = false;
          break;
        }

        // Process current batch
        const batchResult = await processor(logs);
        results.push(batchResult);
        
        totalProcessed += logs.length;
        hasMore = totalProcessed < total;
        page++;

        // Log progress
        logger.info('Batch processed', { 
          page: page - 1, 
          batchSize: logs.length, 
          totalProcessed, 
          total 
        });

        // Safety check to prevent infinite loops
        if (page > 1000) {
          logger.warn('Batch processing reached maximum page limit', { page });
          break;
        }
      }

      const totalTime = Date.now() - startTime;

      logger.info('Batch processing completed', { 
        totalBatches: results.length,
        totalProcessed,
        totalTime: `${totalTime}ms`
      });

      return {
        results,
        totalProcessed,
        totalTime
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error('Error in batch processing', error, { 
        totalProcessed,
        totalTime: `${totalTime}ms`
      });
      throw error;
    }
  }

  /**
   * Stream audit logs for very large datasets
   * @param filters - Filtering criteria
   * @param onBatch - Callback function for each batch
   * @param batchSize - Size of each batch
   * @returns Promise containing streaming results
   */
  static async streamAuditLogs(
    filters: AuditFilters,
    onBatch: (logs: AuditLog[], batchInfo: { page: number; total: number }) => Promise<void>,
    batchSize: number = 1000
  ): Promise<{
    totalStreamed: number;
    totalTime: number;
  }> {
    const startTime = Date.now();
    let totalStreamed = 0;
    let page = 1;
    let hasMore = true;

    try {
      logger.info('Starting audit logs streaming', { filters, batchSize });

      while (hasMore) {
        const { logs, total } = await this.getAuditLogsOptimized(filters, page, batchSize);
        
        if (logs.length === 0) {
          hasMore = false;
          break;
        }

        // Call the batch handler
        await onBatch(logs, { page, total });
        
        totalStreamed += logs.length;
        hasMore = totalStreamed < total;
        page++;

        // Log progress
        logger.info('Batch streamed', { 
          page: page - 1, 
          batchSize: logs.length, 
          totalStreamed, 
          total 
        });

        // Safety check
        if (page > 1000) {
          logger.warn('Streaming reached maximum page limit', { page });
          break;
        }
      }

      const totalTime = Date.now() - startTime;

      logger.info('Audit logs streaming completed', { 
        totalStreamed,
        totalTime: `${totalTime}ms`
      });

      return {
        totalStreamed,
        totalTime
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error('Error in streaming audit logs', error, { 
        totalStreamed,
        totalTime: `${totalTime}ms`
      });
      throw error;
    }
  }
}