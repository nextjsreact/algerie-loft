import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import type { AuditLog, AuditFilters, AuditAction, AuditableTable } from '@/lib/types'

/**
 * Interface for audit access logging
 */
interface AuditAccessLog {
  id: string;
  accessedByUserId: string;
  accessedByEmail: string;
  accessType: 'VIEW' | 'EXPORT' | 'SEARCH' | 'FILTER';
  tableName?: string;
  recordId?: string;
  filtersApplied?: Record<string, any>;
  recordsAccessed: number;
  accessTimestamp: string;
}

/**
 * Interface for audit integrity check results
 */
interface AuditIntegrityResult {
  totalLogs: number;
  validLogs: number;
  invalidLogs: number;
  integrityPercentage: number;
}

/**
 * Interface for retention status
 */
interface RetentionStatus {
  tableName: string;
  totalLogs: number;
  logsToArchive: number;
  logsToDelete: number;
  oldestLogDate?: string;
  newestLogDate?: string;
}

/**
 * Service class for managing audit operations
 * Provides methods for retrieving and filtering audit logs
 */
export class AuditService {
  /**
   * Retrieve audit logs with filtering and pagination
   * @param filters - Filtering criteria for audit logs
   * @param page - Page number (1-based)
   * @param limit - Number of records per page
   * @returns Promise containing logs array and total count
   */
  static async getAuditLogs(
    filters: AuditFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      logger.info('Fetching audit logs', { filters, page, limit });
      
      const supabase = await createClient();
      
      // Log audit access for security monitoring (optional)
      try {
        await this.logAuditAccess('VIEW', filters.tableName, filters.recordId, filters);
      } catch (error) {
        // Ignore logging errors to not break the main functionality
        logger.warn('Failed to log audit access', error);
      }
      const offset = (page - 1) * limit;

      // Use RPC function to access audit logs from audit schema
      const { data: rpcResult, error } = await supabase.rpc('get_all_audit_logs', {
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        logger.error('Failed to fetch audit logs via RPC', error, { filters, page, limit });
        throw new Error(`Failed to fetch audit logs: ${error.message}`);
      }

      let logs: AuditLog[] = [];
      let total = 0;

      if (rpcResult && rpcResult.success) {
        const data = rpcResult.data || [];
        total = rpcResult.count || 0;
        
        // Transform data to match AuditLog interface
        logs = data.map((row: any) => ({
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
          userAgent: row.user_agent,
          integrityHash: row.integrity_hash
        }));
      } else {
        logger.error('RPC function returned error', rpcResult?.error, { filters, page, limit });
        throw new Error(`RPC function error: ${rpcResult?.error || 'Unknown error'}`);
      }
      
      // Update access log with actual records accessed (optional)
      try {
        await this.updateAuditAccessCount(logs.length);
      } catch (error) {
        // Ignore logging errors to not break the main functionality
        logger.warn('Failed to update audit access count', error);
      }

      logger.info('Audit logs fetched successfully', { 
        count: logs.length, 
        total,
        filters 
      });

      return {
        logs,
        total
      };

    } catch (error) {
      logger.error('Error in getAuditLogs', error, { filters, page, limit });
      throw error;
    }
  }

  /**
   * Retrieve audit history for a specific entity
   * @param tableName - Name of the table (entity type)
   * @param recordId - ID of the specific record
   * @returns Promise containing array of audit logs for the entity
   */
  static async getEntityAuditHistory(
    tableName: string,
    recordId: string
  ): Promise<AuditLog[]> {
    try {
      logger.info('Fetching entity audit history', { tableName, recordId });
      
      const supabase = await createClient();
      
      // Log audit access for security monitoring (optional)
      try {
        await this.logAuditAccess('VIEW', tableName, recordId);
      } catch (error) {
        // Ignore logging errors to not break the main functionality
        logger.warn('Failed to log audit access', error);
      }

      // Use simple RPC function to access audit logs from audit schema
      const { data: rpcResult, error } = await supabase.rpc('get_audit_logs_for_entity', {
        p_table_name: tableName,
        p_record_id: recordId,
        p_limit: 1000
      });

      if (error) {
        logger.error('Failed to fetch entity audit history', error, { tableName, recordId });
        throw new Error(`Failed to fetch entity audit history: ${error.message}`);
      }

      let data = [];
      if (rpcResult && rpcResult.success) {
        data = rpcResult.data || [];
      } else if (rpcResult && !rpcResult.success) {
        logger.error('RPC function returned error', rpcResult.error, { tableName, recordId });
        throw new Error(`RPC function error: ${rpcResult.error}`);
      }

      // Transform data to match AuditLog interface
      const logs: AuditLog[] = (data || []).map(row => ({
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
        userAgent: row.user_agent,
        integrityHash: row.integrity_hash
      }));
      
      // Update access log with actual records accessed (optional)
      try {
        await this.updateAuditAccessCount(logs.length);
      } catch (error) {
        // Ignore logging errors to not break the main functionality
        logger.warn('Failed to update audit access count', error);
      }

      logger.info('Entity audit history fetched successfully', { 
        tableName, 
        recordId, 
        count: logs.length 
      });

      // Enrichir les données avec les noms des relations
      const enrichedLogs = await this.enrichAuditLogsWithRelationNames(logs);

      return enrichedLogs;

    } catch (error) {
      logger.error('Error in getEntityAuditHistory', error, { tableName, recordId });
      throw error;
    }
  }

  /**
   * Export audit logs with enhanced options
   * @param filters - Filtering criteria for export
   * @param options - Export options including format and field selection
   * @returns Promise containing export data
   */
  static async exportAuditLogs(
    filters: AuditFilters = {},
    options: {
      format?: 'csv' | 'json';
      fields?: string[];
      includeValues?: boolean;
      batchSize?: number;
    } = {}
  ): Promise<{
    data: string;
    totalRecords: number;
    format: string;
  }> {
    try {
      const { 
        format = 'csv', 
        fields = [], 
        includeValues = false,
        batchSize = 1000
      } = options;

      logger.info('Exporting audit logs with enhanced options', { 
        filters, 
        format, 
        fields, 
        includeValues,
        batchSize 
      });

      // Get all matching logs for export (using streaming approach for large datasets)
      const allLogs: AuditLog[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { logs, total } = await this.getAuditLogs(filters, page, batchSize);
        allLogs.push(...logs);
        
        hasMore = allLogs.length < total;
        page++;
        
        // Safety check to prevent infinite loops
        if (page > 100) {
          logger.warn('Export reached maximum page limit', { page, totalLogs: allLogs.length });
          break;
        }
      }

      if (format === 'json') {
        return {
          data: JSON.stringify(this.formatLogsForExport(allLogs, fields, includeValues), null, 2),
          totalRecords: allLogs.length,
          format: 'json'
        };
      }

      // Default to CSV format
      const csvContent = this.generateCSV(allLogs, fields, includeValues);
      
      logger.info('Audit logs exported successfully', { 
        filters, 
        format,
        recordCount: allLogs.length 
      });

      return {
        data: csvContent,
        totalRecords: allLogs.length,
        format: 'csv'
      };

    } catch (error) {
      logger.error('Error in exportAuditLogs', error, { filters, options });
      throw error;
    }
  }

  /**
   * Generate CSV content from audit logs
   * @param logs - Array of audit logs
   * @param selectedFields - Fields to include in export
   * @param includeValues - Whether to include old/new values
   * @returns CSV string
   */
  private static generateCSV(
    logs: AuditLog[], 
    selectedFields: string[] = [], 
    includeValues: boolean = false
  ): string {
    // Define all available fields
    const allFields = [
      'id',
      'tableName',
      'recordId',
      'action',
      'userId',
      'userEmail',
      'timestamp',
      'changedFields',
      'ipAddress',
      'userAgent'
    ];

    if (includeValues) {
      allFields.push('oldValues', 'newValues');
    }

    // Use selected fields or all fields if none specified
    const fieldsToExport = selectedFields.length > 0 ? selectedFields : allFields;

    // Generate headers
    const headers = fieldsToExport.map(field => {
      switch (field) {
        case 'tableName': return 'Table Name';
        case 'recordId': return 'Record ID';
        case 'userId': return 'User ID';
        case 'userEmail': return 'User Email';
        case 'changedFields': return 'Changed Fields';
        case 'ipAddress': return 'IP Address';
        case 'userAgent': return 'User Agent';
        case 'oldValues': return 'Old Values';
        case 'newValues': return 'New Values';
        default: return field.charAt(0).toUpperCase() + field.slice(1);
      }
    });

    // Generate CSV rows
    const csvRows = [
      headers.join(','),
      ...logs.map(log => 
        fieldsToExport.map(field => {
          let value = '';
          
          switch (field) {
            case 'id':
              value = log.id;
              break;
            case 'tableName':
              value = log.tableName;
              break;
            case 'recordId':
              value = log.recordId;
              break;
            case 'action':
              value = log.action;
              break;
            case 'userId':
              value = log.userId;
              break;
            case 'userEmail':
              value = log.userEmail;
              break;
            case 'timestamp':
              value = log.timestamp;
              break;
            case 'changedFields':
              value = log.changedFields.join(';');
              break;
            case 'ipAddress':
              value = log.ipAddress || '';
              break;
            case 'userAgent':
              value = log.userAgent || '';
              break;
            case 'oldValues':
              value = log.oldValues ? JSON.stringify(log.oldValues) : '';
              break;
            case 'newValues':
              value = log.newValues ? JSON.stringify(log.newValues) : '';
              break;
            default:
              value = '';
          }
          
          // Escape CSV values
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  /**
   * Format logs for JSON export
   * @param logs - Array of audit logs
   * @param selectedFields - Fields to include in export
   * @param includeValues - Whether to include old/new values
   * @returns Formatted logs array
   */
  private static formatLogsForExport(
    logs: AuditLog[], 
    selectedFields: string[] = [], 
    includeValues: boolean = false
  ): any[] {
    return logs.map(log => {
      const exportLog: any = {};

      const fieldsToInclude = selectedFields.length > 0 ? selectedFields : [
        'id', 'tableName', 'recordId', 'action', 'userId', 'userEmail', 
        'timestamp', 'changedFields', 'ipAddress', 'userAgent'
      ];

      fieldsToInclude.forEach(field => {
        if (field in log) {
          exportLog[field] = (log as any)[field];
        }
      });

      if (includeValues) {
        exportLog.oldValues = log.oldValues;
        exportLog.newValues = log.newValues;
      }

      return exportLog;
    });
  }

  /**
   * Get export progress for streaming large datasets
   * @param filters - Filtering criteria
   * @returns Promise containing total count for progress tracking
   */
  static async getExportProgress(filters: AuditFilters = {}): Promise<{ totalRecords: number }> {
    try {
      logger.info('Getting export progress', { filters });
      
      const supabase = await createClient();
      
      // Build count query with same filters as export
      let query = supabase
        .from('audit.audit_logs')
        .select('id', { count: 'exact', head: true });

      // Apply same filters as in getAuditLogs
      if (filters.tableName) {
        query = query.eq('table_name', filters.tableName);
      }
      
      if (filters.recordId) {
        query = query.eq('record_id', filters.recordId);
      }
      
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('timestamp', filters.dateTo);
      }

      if (filters.search) {
        query = query.or(`user_email.ilike.%${filters.search}%,action.ilike.%${filters.search}%,table_name.ilike.%${filters.search}%`);
      }

      const { count, error } = await query;

      if (error) {
        logger.error('Failed to get export progress', error, { filters });
        throw new Error(`Failed to get export progress: ${error.message}`);
      }

      return { totalRecords: count || 0 };

    } catch (error) {
      logger.error('Error in getExportProgress', error, { filters });
      throw error;
    }
  }

  /**
   * Get audit statistics for a specific table
   * @param tableName - Name of the table to get statistics for
   * @param days - Number of days to look back (default: 30)
   * @returns Promise containing audit statistics
   */
  static async getAuditStatistics(
    tableName?: string,
    days: number = 30
  ): Promise<{
    totalLogs: number;
    actionBreakdown: Record<AuditAction, number>;
    userActivity: Array<{ userId: string; userEmail: string; count: number }>;
    dailyActivity: Array<{ date: string; count: number }>;
  }> {
    try {
      logger.info('Fetching audit statistics', { tableName, days });
      
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);
      
      const filters: AuditFilters = {
        dateFrom: dateFrom.toISOString()
      };
      
      if (tableName) {
        filters.tableName = tableName;
      }

      const { logs } = await this.getAuditLogs(filters, 1, 10000);
      
      // Calculate statistics
      const totalLogs = logs.length;
      
      const actionBreakdown: Record<AuditAction, number> = {
        INSERT: 0,
        UPDATE: 0,
        DELETE: 0
      };
      
      const userActivityMap = new Map<string, { userEmail: string; count: number }>();
      const dailyActivityMap = new Map<string, number>();

      logs.forEach(log => {
        // Action breakdown
        actionBreakdown[log.action]++;
        
        // User activity
        const userKey = log.userId;
        if (userActivityMap.has(userKey)) {
          userActivityMap.get(userKey)!.count++;
        } else {
          userActivityMap.set(userKey, { userEmail: log.userEmail, count: 1 });
        }
        
        // Daily activity
        const date = new Date(log.timestamp).toISOString().split('T')[0];
        dailyActivityMap.set(date, (dailyActivityMap.get(date) || 0) + 1);
      });

      const userActivity = Array.from(userActivityMap.entries()).map(([userId, data]) => ({
        userId,
        userEmail: data.userEmail,
        count: data.count
      })).sort((a, b) => b.count - a.count);

      const dailyActivity = Array.from(dailyActivityMap.entries()).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      logger.info('Audit statistics calculated successfully', { 
        tableName, 
        days, 
        totalLogs,
        uniqueUsers: userActivity.length,
        uniqueDays: dailyActivity.length
      });

      return {
        totalLogs,
        actionBreakdown,
        userActivity,
        dailyActivity
      };

    } catch (error) {
      logger.error('Error in getAuditStatistics', error, { tableName, days });
      throw error;
    }
  }

  /**
   * Enrichir les logs d'audit avec les noms des relations
   * @param logs - Array of audit logs to enrich
   * @returns Promise containing enriched logs
   */
  private static async enrichAuditLogsWithRelationNames(logs: AuditLog[]): Promise<AuditLog[]> {
    try {
      const supabase = await createClient();
      
      // Collecter tous les IDs à résoudre
      const loftIds = new Set<string>();
      const currencyIds = new Set<string>();
      
      logs.forEach(log => {
        if (log.tableName === 'transactions') {
          // Collecter les loft_ids
          if (log.oldValues?.loft_id) {
            loftIds.add(log.oldValues.loft_id);
          }
          if (log.newValues?.loft_id) {
            loftIds.add(log.newValues.loft_id);
          }
          
          // Collecter les currency_ids
          if (log.oldValues?.currency_id) {
            currencyIds.add(log.oldValues.currency_id);
          }
          if (log.newValues?.currency_id) {
            currencyIds.add(log.newValues.currency_id);
          }
        }
      });

      // Récupérer les noms des lofts en une seule requête
      const loftNames = new Map<string, string>();
      if (loftIds.size > 0) {
        const { data: lofts, error } = await supabase
          .from('lofts')
          .select('id, name')
          .in('id', Array.from(loftIds));

        if (!error && lofts) {
          lofts.forEach(loft => {
            loftNames.set(loft.id, loft.name);
          });
        }
      }

      // Récupérer les codes des devises en une seule requête
      const currencyCodes = new Map<string, string>();
      if (currencyIds.size > 0) {
        const { data: currencies, error } = await supabase
          .from('currencies')
          .select('id, code, name')
          .in('id', Array.from(currencyIds));

        if (!error && currencies) {
          currencies.forEach(currency => {
            currencyCodes.set(currency.id, currency.code || currency.name);
          });
        }
      }

      // Enrichir les logs avec les noms des lofts
      const enrichedLogs = logs.map(log => {
        if (log.tableName === 'transactions') {
          const enrichedLog = { ...log };
          
          // Enrichir les anciennes valeurs
          if (enrichedLog.oldValues?.loft_id) {
            const loftName = loftNames.get(enrichedLog.oldValues.loft_id);
            if (loftName) {
              enrichedLog.oldValues = {
                ...enrichedLog.oldValues,
                loft_name: loftName
              };
            }
          }
          
          if (enrichedLog.oldValues?.currency_id) {
            const currencyCode = currencyCodes.get(enrichedLog.oldValues.currency_id);
            if (currencyCode) {
              enrichedLog.oldValues = {
                ...enrichedLog.oldValues,
                currency_code: currencyCode
              };
            }
          }
          
          // Enrichir les nouvelles valeurs
          if (enrichedLog.newValues?.loft_id) {
            const loftName = loftNames.get(enrichedLog.newValues.loft_id);
            if (loftName) {
              enrichedLog.newValues = {
                ...enrichedLog.newValues,
                loft_name: loftName
              };
            }
          }
          
          if (enrichedLog.newValues?.currency_id) {
            const currencyCode = currencyCodes.get(enrichedLog.newValues.currency_id);
            if (currencyCode) {
              enrichedLog.newValues = {
                ...enrichedLog.newValues,
                currency_code: currencyCode
              };
            }
          }
          
          return enrichedLog;
        }
        
        return log;
      });

      return enrichedLogs;

    } catch (error) {
      logger.error('Error enriching audit logs with relation names', error);
      // Retourner les logs originaux en cas d'erreur
      return logs;
    }
  }

  /**
   * Log audit access for security monitoring
   * @param accessType - Type of access (VIEW, EXPORT, SEARCH, FILTER)
   * @param tableName - Optional table name being accessed
   * @param recordId - Optional specific record ID being accessed
   * @param filters - Optional filters applied
   * @returns Promise containing access log ID
   */
  private static async logAuditAccess(
    accessType: 'VIEW' | 'EXPORT' | 'SEARCH' | 'FILTER',
    tableName?: string,
    recordId?: string,
    filters?: AuditFilters
  ): Promise<string | null> {
    try {
      // For now, just log to console until audit_access_logs table is created
      logger.info('Audit access logged', {
        accessType,
        tableName,
        recordId,
        filters,
        timestamp: new Date().toISOString()
      });
      
      return 'logged';
    } catch (error) {
      logger.warn('Error logging audit access', error);
      return null;
    }
  }

  /**
   * Update the records accessed count for the most recent access log
   * @param recordCount - Number of records accessed
   */
  private static async updateAuditAccessCount(recordCount: number): Promise<void> {
    try {
      // For now, just log to console until audit_access_logs table is created
      logger.info('Audit access count updated', {
        recordCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('Error updating audit access count', error);
    }
  }

  /**
   * Verify the integrity of audit logs
   * @param tableName - Optional table name to check
   * @param dateFrom - Optional start date for verification
   * @param dateTo - Optional end date for verification
   * @returns Promise containing integrity check results
   */
  static async verifyAuditIntegrity(
    tableName?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<AuditIntegrityResult> {
    try {
      logger.info('Verifying audit log integrity', { tableName, dateFrom, dateTo });
      
      const supabase = await createClient();
      
      const { data, error } = await supabase.rpc('verify_audit_logs_integrity', {
        p_table_name: tableName || null,
        p_date_from: dateFrom || null,
        p_date_to: dateTo || null
      });

      if (error) {
        logger.error('Failed to verify audit integrity', error);
        throw new Error(`Failed to verify audit integrity: ${error.message}`);
      }

      const result = data[0] || { 
        total_logs: 0, 
        valid_logs: 0, 
        invalid_logs: 0, 
        integrity_percentage: 0 
      };

      return {
        totalLogs: result.total_logs,
        validLogs: result.valid_logs,
        invalidLogs: result.invalid_logs,
        integrityPercentage: result.integrity_percentage
      };

    } catch (error) {
      logger.error('Error in verifyAuditIntegrity', error);
      throw error;
    }
  }

  /**
   * Get audit access logs for security monitoring
   * @param page - Page number (1-based)
   * @param limit - Number of records per page
   * @returns Promise containing access logs array and total count
   */
  static async getAuditAccessLogs(
    page: number = 1,
    limit: number = 50
  ): Promise<{ logs: AuditAccessLog[]; total: number }> {
    try {
      logger.info('Fetching audit access logs', { page, limit });
      
      const supabase = await createClient();
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('audit_access_logs')
        .select(`
          id,
          accessed_by_user_id,
          accessed_by_email,
          access_type,
          table_name,
          record_id,
          filters_applied,
          records_accessed,
          access_timestamp
        `, { count: 'exact' })
        .order('access_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Failed to fetch audit access logs', error);
        throw new Error(`Failed to fetch audit access logs: ${error.message}`);
      }

      const logs: AuditAccessLog[] = (data || []).map(row => ({
        id: row.id,
        accessedByUserId: row.accessed_by_user_id,
        accessedByEmail: row.accessed_by_email,
        accessType: row.access_type as 'VIEW' | 'EXPORT' | 'SEARCH' | 'FILTER',
        tableName: row.table_name,
        recordId: row.record_id,
        filtersApplied: row.filters_applied,
        recordsAccessed: row.records_accessed,
        accessTimestamp: row.access_timestamp
      }));

      return {
        logs,
        total: count || 0
      };

    } catch (error) {
      logger.error('Error in getAuditAccessLogs', error);
      throw error;
    }
  }

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

      return (data || []).map((row: any) => ({
        tableName: row.table_name,
        totalLogs: row.total_logs,
        logsToArchive: row.logs_to_archive,
        logsToDelete: row.logs_to_delete,
        oldestLogDate: row.oldest_log_date,
        newestLogDate: row.newest_log_date
      }));

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
  ): Promise<Array<{ tableName: string; archivedCount: number; archiveDate: string }>> {
    try {
      logger.info('Archiving old audit logs', { tableName, batchSize });
      
      const supabase = await createClient();
      
      const { data, error } = await supabase.rpc('archive_old_audit_logs', {
        p_table_name: tableName || null,
        p_batch_size: batchSize
      });

      if (error) {
        logger.error('Failed to archive audit logs', error);
        throw new Error(`Failed to archive audit logs: ${error.message}`);
      }

      return (data || []).map((row: any) => ({
        tableName: row.table_name,
        archivedCount: row.archived_count,
        archiveDate: row.archive_date
      }));

    } catch (error) {
      logger.error('Error in archiveOldAuditLogs', error);
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
  ): Promise<Array<{ tableName: string; deletedCount: number; cleanupDate: string }>> {
    try {
      logger.info('Cleaning up old audit logs', { tableName, batchSize });
      
      const supabase = await createClient();
      
      const { data, error } = await supabase.rpc('cleanup_old_audit_logs', {
        p_table_name: tableName || null,
        p_batch_size: batchSize
      });

      if (error) {
        logger.error('Failed to cleanup audit logs', error);
        throw new Error(`Failed to cleanup audit logs: ${error.message}`);
      }

      return (data || []).map((row: any) => ({
        tableName: row.table_name,
        deletedCount: row.deleted_count,
        cleanupDate: row.cleanup_date
      }));

    } catch (error) {
      logger.error('Error in cleanupOldAuditLogs', error);
      throw error;
    }
  }

  /**
   * Detect suspicious audit access patterns
   * @returns Promise containing suspicious activity reports
   */
  static async detectSuspiciousAccess(): Promise<Array<{
    userId: string;
    userEmail: string;
    suspiciousActivity: string;
    accessCount: number;
    firstAccess: string;
    lastAccess: string;
  }>> {
    try {
      logger.info('Detecting suspicious audit access patterns');
      
      const supabase = await createClient();
      
      const { data, error } = await supabase.rpc('detect_suspicious_access');

      if (error) {
        logger.error('Failed to detect suspicious access', error);
        throw new Error(`Failed to detect suspicious access: ${error.message}`);
      }

      return (data || []).map((row: any) => ({
        userId: row.user_id,
        userEmail: row.user_email,
        suspiciousActivity: row.suspicious_activity,
        accessCount: row.access_count,
        firstAccess: row.first_access,
        lastAccess: row.last_access
      }));

    } catch (error) {
      logger.error('Error in detectSuspiciousAccess', error);
      throw error;
    }
  }
}