import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import type { AuditLog, AuditFilters } from '@/lib/types'

/**
 * Interface for retention policy configuration
 */
export interface RetentionPolicy {
  id: string;
  tableName: string;
  retentionDays: number;
  archiveAfterDays: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface for retention status
 */
export interface RetentionStatus {
  tableName: string;
  totalLogs: number;
  logsToArchive: number;
  logsToDelete: number;
  oldestLogDate?: string;
  newestLogDate?: string;
  retentionDays: number;
  archiveAfterDays: number;
  policyEnabled: boolean;
}

/**
 * Interface for archive operation
 */
export interface ArchiveOperation {
  id: string;
  operationType: 'ARCHIVE' | 'RESTORE' | 'DELETE' | 'CLEANUP';
  tableName?: string;
  recordsAffected: number;
  operationStart: string;
  operationEnd?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  errorMessage?: string;
  performedBy?: string;
  batchSize?: number;
  totalBatches?: number;
  completedBatches: number;
  progressPercentage: number;
}

/**
 * Interface for archive results
 */
export interface ArchiveResult {
  tableName: string;
  archivedCount: number;
  archiveDate: string;
}

/**
 * Interface for cleanup results
 */
export interface CleanupResult {
  tableName: string;
  deletedCount: number;
  cleanupDate: string;
}

/**
 * Service class for managing audit log archiving and retention
 * Provides methods for archiving old logs, managing retention policies, and accessing archived data
 */
export class AuditArchivingService {

  /**
   * Get retention status for all audited tables
   * @returns Promise containing retention status for each table
   */
  static async getRetentionStatus(): Promise<RetentionStatus[]> {
    try {
      logger.info('Fetching audit retention status');
      
      const supabase = await createClient();
      
      const { data, error } = await supabase.rpc('get_retention_status');

      if (error) {
        logger.error('Failed to fetch retention status', error);
        throw new Error(`Failed to fetch retention status: ${error.message}`);
      }

      const retentionStatus: RetentionStatus[] = (data || []).map((row: any) => ({
        tableName: row.table_name,
        totalLogs: row.total_logs,
        logsToArchive: row.logs_to_archive,
        logsToDelete: row.logs_to_delete,
        oldestLogDate: row.oldest_log_date,
        newestLogDate: row.newest_log_date,
        retentionDays: row.retention_days,
        archiveAfterDays: row.archive_after_days,
        policyEnabled: row.policy_enabled
      }));

      logger.info('Retention status fetched successfully', { 
        tablesCount: retentionStatus.length 
      });

      return retentionStatus;

    } catch (error) {
      logger.error('Error in getRetentionStatus', error);
      throw error;
    }
  }

  /**
   * Archive old audit logs based on retention policies
   * @param tableName - Optional specific table to archive
   * @param batchSize - Number of records to process in each batch
   * @returns Promise containing archive results
   */
  static async archiveOldAuditLogs(
    tableName?: string,
    batchSize: number = 1000
  ): Promise<ArchiveResult[]> {
    try {
      logger.info('Archiving old audit logs', { tableName, batchSize });
      
      const supabase = await createClient();
      
      const { data, error } = await supabase.rpc('archive_old_audit_logs', {
        p_table_name: tableName || null,
        p_batch_size: batchSize
      });

      if (error) {
        logger.error('Failed to archive audit logs', error, { tableName, batchSize });
        throw new Error(`Failed to archive audit logs: ${error.message}`);
      }

      const results: ArchiveResult[] = (data || []).map((row: any) => ({
        tableName: row.table_name,
        archivedCount: row.archived_count,
        archiveDate: row.archive_date
      }));

      logger.info('Audit logs archived successfully', { 
        resultsCount: results.length,
        totalArchived: results.reduce((sum, r) => sum + r.archivedCount, 0)
      });

      return results;

    } catch (error) {
      logger.error('Error in archiveOldAuditLogs', error, { tableName, batchSize });
      throw error;
    }
  }

  /**
   * Clean up old audit logs (permanent deletion) based on retention policies
   * @param tableName - Optional specific table to clean up
   * @param batchSize - Number of records to process in each batch
   * @returns Promise containing cleanup results
   */
  static async cleanupOldAuditLogs(
    tableName?: string,
    batchSize: number = 1000
  ): Promise<CleanupResult[]> {
    try {
      logger.info('Cleaning up old audit logs', { tableName, batchSize });
      
      const supabase = await createClient();
      
      const { data, error } = await supabase.rpc('cleanup_old_audit_logs', {
        p_table_name: tableName || null,
        p_batch_size: batchSize
      });

      if (error) {
        logger.error('Failed to cleanup audit logs', error, { tableName, batchSize });
        throw new Error(`Failed to cleanup audit logs: ${error.message}`);
      }

      const results: CleanupResult[] = (data || []).map((row: any) => ({
        tableName: row.table_name,
        deletedCount: row.deleted_count,
        cleanupDate: row.cleanup_date
      }));

      logger.info('Audit logs cleaned up successfully', { 
        resultsCount: results.length,
        totalDeleted: results.reduce((sum, r) => sum + r.deletedCount, 0)
      });

      return results;

    } catch (error) {
      logger.error('Error in cleanupOldAuditLogs', error, { tableName, batchSize });
      throw error;
    }
  }

  /**
   * Search archived audit logs
   * @param filters - Filtering criteria for archived logs
   * @param page - Page number (1-based)
   * @param limit - Number of records per page
   * @returns Promise containing archived logs array and total count
   */
  static async searchArchivedLogs(
    filters: AuditFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      logger.info('Searching archived audit logs', { filters, page, limit });
      
      const supabase = await createClient();
      const offset = (page - 1) * limit;

      // Get archived logs using the database function
      const { data, error } = await supabase.rpc('search_archived_logs', {
        p_table_name: filters.tableName || null,
        p_record_id: filters.recordId || null,
        p_user_id: filters.userId || null,
        p_action: filters.action || null,
        p_date_from: filters.dateFrom || null,
        p_date_to: filters.dateTo || null,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        logger.error('Failed to search archived logs', error, { filters, page, limit });
        throw new Error(`Failed to search archived logs: ${error.message}`);
      }

      // Transform data to match AuditLog interface
      const logs: AuditLog[] = (data || []).map((row: any) => ({
        id: row.id,
        tableName: row.table_name,
        recordId: row.record_id,
        action: row.action,
        userId: row.user_id,
        userEmail: row.user_email,
        timestamp: row.timestamp,
        oldValues: row.old_values,
        newValues: row.new_values,
        changedFields: row.changed_fields || [],
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        isArchived: true,
        archivedAt: row.archived_at
      }));

      // Get total count with a separate query
      const { count: totalCount, error: countError } = await supabase
        .from('audit_logs_archived')
        .select('id', { count: 'exact', head: true })
        .eq('table_name', filters.tableName || '')
        .eq('record_id', filters.recordId || '')
        .eq('user_id', filters.userId || '')
        .eq('action', filters.action || '');

      if (countError) {
        logger.warn('Failed to get archived logs count', countError);
      }

      const total = totalCount || logs.length;

      logger.info('Archived audit logs searched successfully', { 
        count: logs.length, 
        total,
        filters 
      });

      return {
        logs,
        total
      };

    } catch (error) {
      logger.error('Error in searchArchivedLogs', error, { filters, page, limit });
      throw error;
    }
  }

  /**
   * Get complete audit history for an entity (active + archived)
   * @param tableName - Name of the table (entity type)
   * @param recordId - ID of the specific record
   * @param limit - Maximum number of records to return
   * @param offset - Number of records to skip
   * @returns Promise containing complete audit history
   */
  static async getCompleteAuditHistory(
    tableName: string,
    recordId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLog[]> {
    try {
      logger.info('Fetching complete audit history', { tableName, recordId, limit, offset });
      
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_complete_audit_history', {
        p_table_name: tableName,
        p_record_id: recordId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        logger.error('Failed to fetch complete audit history', error, { 
          tableName, 
          recordId, 
          limit, 
          offset 
        });
        throw new Error(`Failed to fetch complete audit history: ${error.message}`);
      }

      // Transform data to match AuditLog interface
      const logs: AuditLog[] = (data || []).map((row: any) => ({
        id: row.id,
        tableName: row.table_name,
        recordId: row.record_id,
        action: row.action,
        userId: row.user_id,
        userEmail: row.user_email,
        timestamp: row.timestamp,
        oldValues: row.old_values,
        newValues: row.new_values,
        changedFields: row.changed_fields || [],
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        isArchived: row.is_archived
      }));

      logger.info('Complete audit history fetched successfully', { 
        tableName, 
        recordId, 
        count: logs.length,
        archivedCount: logs.filter(log => log.isArchived).length,
        activeCount: logs.filter(log => !log.isArchived).length
      });

      return logs;

    } catch (error) {
      logger.error('Error in getCompleteAuditHistory', error, { 
        tableName, 
        recordId, 
        limit, 
        offset 
      });
      throw error;
    }
  }

  /**
   * Restore archived logs back to active audit table
   * @param tableName - Name of the table
   * @param recordId - Optional specific record ID to restore
   * @param dateFrom - Optional start date for restoration
   * @param dateTo - Optional end date for restoration
   * @returns Promise containing restoration results
   */
  static async restoreArchivedLogs(
    tableName: string,
    recordId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{ restoredCount: number; restoreDate: string }> {
    try {
      logger.info('Restoring archived logs', { tableName, recordId, dateFrom, dateTo });
      
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('restore_archived_logs', {
        p_table_name: tableName,
        p_record_id: recordId || null,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null
      });

      if (error) {
        logger.error('Failed to restore archived logs', error, { 
          tableName, 
          recordId, 
          dateFrom, 
          dateTo 
        });
        throw new Error(`Failed to restore archived logs: ${error.message}`);
      }

      const result = data[0] || { restored_count: 0, restore_date: new Date().toISOString() };

      logger.info('Archived logs restored successfully', { 
        tableName,
        restoredCount: result.restored_count,
        restoreDate: result.restore_date
      });

      return {
        restoredCount: result.restored_count,
        restoreDate: result.restore_date
      };

    } catch (error) {
      logger.error('Error in restoreArchivedLogs', error, { 
        tableName, 
        recordId, 
        dateFrom, 
        dateTo 
      });
      throw error;
    }
  }

  /**
   * Get all retention policies
   * @returns Promise containing array of retention policies
   */
  static async getRetentionPolicies(): Promise<RetentionPolicy[]> {
    try {
      logger.info('Fetching retention policies');
      
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('retention_policies')
        .select('*')
        .order('table_name');

      if (error) {
        logger.error('Failed to fetch retention policies', error);
        throw new Error(`Failed to fetch retention policies: ${error.message}`);
      }

      const policies: RetentionPolicy[] = (data || []).map((row: any) => ({
        id: row.id,
        tableName: row.table_name,
        retentionDays: row.retention_days,
        archiveAfterDays: row.archive_after_days,
        enabled: row.enabled,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      logger.info('Retention policies fetched successfully', { 
        policiesCount: policies.length 
      });

      return policies;

    } catch (error) {
      logger.error('Error in getRetentionPolicies', error);
      throw error;
    }
  }

  /**
   * Update or create a retention policy
   * @param tableName - Name of the table
   * @param retentionDays - Number of days to retain logs
   * @param archiveAfterDays - Number of days after which to archive logs
   * @param enabled - Whether the policy is enabled
   * @returns Promise containing success status
   */
  static async updateRetentionPolicy(
    tableName: string,
    retentionDays: number,
    archiveAfterDays: number,
    enabled: boolean = true
  ): Promise<boolean> {
    try {
      logger.info('Updating retention policy', { 
        tableName, 
        retentionDays, 
        archiveAfterDays, 
        enabled 
      });
      
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('update_retention_policy', {
        p_table_name: tableName,
        p_retention_days: retentionDays,
        p_archive_after_days: archiveAfterDays,
        p_enabled: enabled
      });

      if (error) {
        logger.error('Failed to update retention policy', error, { 
          tableName, 
          retentionDays, 
          archiveAfterDays, 
          enabled 
        });
        throw new Error(`Failed to update retention policy: ${error.message}`);
      }

      logger.info('Retention policy updated successfully', { 
        tableName, 
        retentionDays, 
        archiveAfterDays, 
        enabled 
      });

      return data || true;

    } catch (error) {
      logger.error('Error in updateRetentionPolicy', error, { 
        tableName, 
        retentionDays, 
        archiveAfterDays, 
        enabled 
      });
      throw error;
    }
  }

  /**
   * Get archive operation status
   * @param operationId - Optional specific operation ID
   * @param limit - Maximum number of operations to return
   * @returns Promise containing archive operations
   */
  static async getArchiveOperations(
    operationId?: string,
    limit: number = 20
  ): Promise<ArchiveOperation[]> {
    try {
      logger.info('Fetching archive operations', { operationId, limit });
      
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_operation_status', {
        p_operation_id: operationId || null,
        p_limit: limit
      });

      if (error) {
        logger.error('Failed to fetch archive operations', error, { operationId, limit });
        throw new Error(`Failed to fetch archive operations: ${error.message}`);
      }

      const operations: ArchiveOperation[] = (data || []).map((row: any) => ({
        id: row.id,
        operationType: row.operation_type,
        tableName: row.table_name,
        recordsAffected: row.records_affected,
        operationStart: row.operation_start,
        operationEnd: row.operation_end,
        status: row.status,
        errorMessage: row.error_message,
        progressPercentage: row.progress_percentage || 0,
        completedBatches: 0, // Will be populated from separate query if needed
        batchSize: 0,
        totalBatches: 0
      }));

      logger.info('Archive operations fetched successfully', { 
        operationsCount: operations.length 
      });

      return operations;

    } catch (error) {
      logger.error('Error in getArchiveOperations', error, { operationId, limit });
      throw error;
    }
  }

  /**
   * Run daily archive maintenance
   * @returns Promise containing maintenance results
   */
  static async runDailyMaintenance(): Promise<string> {
    try {
      logger.info('Running daily archive maintenance');
      
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('daily_archive_maintenance');

      if (error) {
        logger.error('Failed to run daily maintenance', error);
        throw new Error(`Failed to run daily maintenance: ${error.message}`);
      }

      const result = data || 'Daily maintenance completed successfully';

      logger.info('Daily archive maintenance completed', { 
        resultLength: result.length 
      });

      return result;

    } catch (error) {
      logger.error('Error in runDailyMaintenance', error);
      throw error;
    }
  }

  /**
   * Get archive statistics
   * @returns Promise containing archive statistics
   */
  static async getArchiveStatistics(): Promise<{
    totalActiveLog: number;
    totalArchivedLogs: number;
    archiveSize: string;
    oldestArchivedLog?: string;
    newestArchivedLog?: string;
    tableBreakdown: Array<{
      tableName: string;
      activeCount: number;
      archivedCount: number;
    }>;
  }> {
    try {
      logger.info('Fetching archive statistics');
      
      const supabase = await createClient();

      // Get active logs count
      const { count: activeCount } = await supabase
        .from('audit_logs')
        .select('id', { count: 'exact', head: true });

      // Get archived logs count and details
      const { data: archivedData, count: archivedCount } = await supabase
        .from('audit_logs_archived')
        .select('timestamp, table_name', { count: 'exact' })
        .order('timestamp', { ascending: true })
        .limit(1);

      const { data: newestArchived } = await supabase
        .from('audit_logs_archived')
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1);

      // Get table breakdown
      const { data: tableBreakdown } = await supabase
        .from('audit_logs')
        .select('table_name')
        .then(async (activeResult) => {
          const { data: archivedResult } = await supabase
            .from('audit_logs_archived')
            .select('table_name');

          // Combine and group by table
          const breakdown: Record<string, { activeCount: number; archivedCount: number }> = {};
          
          (activeResult.data || []).forEach((row: any) => {
            if (!breakdown[row.table_name]) {
              breakdown[row.table_name] = { activeCount: 0, archivedCount: 0 };
            }
            breakdown[row.table_name].activeCount++;
          });

          (archivedResult.data || []).forEach((row: any) => {
            if (!breakdown[row.table_name]) {
              breakdown[row.table_name] = { activeCount: 0, archivedCount: 0 };
            }
            breakdown[row.table_name].archivedCount++;
          });

          return Object.entries(breakdown).map(([tableName, counts]) => ({
            tableName,
            activeCount: counts.activeCount,
            archivedCount: counts.archivedCount
          }));
        });

      const statistics = {
        totalActiveLog: activeCount || 0,
        totalArchivedLogs: archivedCount || 0,
        archiveSize: 'N/A', // Would need database-specific query for actual size
        oldestArchivedLog: archivedData?.[0]?.timestamp,
        newestArchivedLog: newestArchived?.[0]?.timestamp,
        tableBreakdown: tableBreakdown || []
      };

      logger.info('Archive statistics fetched successfully', statistics);

      return statistics;

    } catch (error) {
      logger.error('Error in getArchiveStatistics', error);
      throw error;
    }
  }
}