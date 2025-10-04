import { createClient } from '@supabase/supabase-js';
import { AuditAccessLog } from '../permissions/audit-permissions';

/**
 * Service for managing audit access logs in the database
 */
export class AuditAccessService {
  private static supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  /**
   * Save audit access log to database
   */
  static async saveAuditAccessLog(logEntry: Omit<AuditAccessLog, 'id' | 'timestamp'>): Promise<AuditAccessLog | null> {
    try {
      const auditAccessLog: AuditAccessLog = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        ...logEntry
      };

      const { data, error } = await this.supabase
        .from('audit_access_logs')
        .insert([{
          id: auditAccessLog.id,
          user_id: auditAccessLog.userId,
          user_email: auditAccessLog.userEmail,
          action: auditAccessLog.action,
          entity_type: auditAccessLog.entityType,
          entity_id: auditAccessLog.entityId,
          timestamp: auditAccessLog.timestamp.toISOString(),
          ip_address: auditAccessLog.ipAddress,
          user_agent: auditAccessLog.userAgent,
          success: auditAccessLog.success,
          reason: auditAccessLog.reason
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving audit access log:', error);
        return null;
      }

      return auditAccessLog;
    } catch (error) {
      console.error('Error in saveAuditAccessLog:', error);
      return null;
    }
  }

  /**
   * Get audit access logs with filtering
   */
  static async getAuditAccessLogs(filters: {
    userId?: string;
    action?: string;
    success?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<AuditAccessLog[]> {
    try {
      let query = this.supabase
        .from('audit_access_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.success !== undefined) {
        query = query.eq('success', filters.success);
      }

      if (filters.dateFrom) {
        query = query.gte('timestamp', filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        query = query.lte('timestamp', filters.dateTo.toISOString());
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit access logs:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.user_email,
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        timestamp: new Date(row.timestamp),
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        success: row.success,
        reason: row.reason
      }));
    } catch (error) {
      console.error('Error in getAuditAccessLogs:', error);
      return [];
    }
  }

  /**
   * Get failed audit access attempts for security monitoring
   */
  static async getFailedAccessAttempts(
    timeWindowHours: number = 24,
    limit: number = 100
  ): Promise<AuditAccessLog[]> {
    const dateFrom = new Date();
    dateFrom.setHours(dateFrom.getHours() - timeWindowHours);

    return this.getAuditAccessLogs({
      success: false,
      dateFrom,
      limit
    });
  }

  /**
   * Get audit access statistics
   */
  static async getAuditAccessStats(dateFrom?: Date, dateTo?: Date): Promise<{
    totalAccess: number;
    successfulAccess: number;
    failedAccess: number;
    uniqueUsers: number;
    actionBreakdown: Record<string, number>;
  }> {
    try {
      let query = this.supabase
        .from('audit_access_logs')
        .select('user_id, action, success');

      if (dateFrom) {
        query = query.gte('timestamp', dateFrom.toISOString());
      }

      if (dateTo) {
        query = query.lte('timestamp', dateTo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit access stats:', error);
        return {
          totalAccess: 0,
          successfulAccess: 0,
          failedAccess: 0,
          uniqueUsers: 0,
          actionBreakdown: {}
        };
      }

      const logs = data || [];
      const uniqueUsers = new Set(logs.map(log => log.user_id)).size;
      const successfulAccess = logs.filter(log => log.success).length;
      const failedAccess = logs.filter(log => !log.success).length;
      
      const actionBreakdown: Record<string, number> = {};
      logs.forEach(log => {
        actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
      });

      return {
        totalAccess: logs.length,
        successfulAccess,
        failedAccess,
        uniqueUsers,
        actionBreakdown
      };
    } catch (error) {
      console.error('Error in getAuditAccessStats:', error);
      return {
        totalAccess: 0,
        successfulAccess: 0,
        failedAccess: 0,
        uniqueUsers: 0,
        actionBreakdown: {}
      };
    }
  }

  /**
   * Clean up old audit access logs
   */
  static async cleanupOldLogs(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await this.supabase
        .from('audit_access_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('Error cleaning up audit access logs:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in cleanupOldLogs:', error);
      return 0;
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  static async detectSuspiciousActivity(
    timeWindowMinutes: number = 60,
    maxFailedAttempts: number = 5
  ): Promise<{
    suspiciousUsers: Array<{
      userId: string;
      userEmail: string;
      failedAttempts: number;
      lastAttempt: Date;
    }>;
    suspiciousIPs: Array<{
      ipAddress: string;
      failedAttempts: number;
      lastAttempt: Date;
    }>;
  }> {
    try {
      const dateFrom = new Date();
      dateFrom.setMinutes(dateFrom.getMinutes() - timeWindowMinutes);

      const failedLogs = await this.getAuditAccessLogs({
        success: false,
        dateFrom
      });

      // Group by user
      const userAttempts: Record<string, { count: number; email: string; lastAttempt: Date }> = {};
      const ipAttempts: Record<string, { count: number; lastAttempt: Date }> = {};

      failedLogs.forEach(log => {
        // Track by user
        if (!userAttempts[log.userId]) {
          userAttempts[log.userId] = { count: 0, email: log.userEmail, lastAttempt: log.timestamp };
        }
        userAttempts[log.userId].count++;
        if (log.timestamp > userAttempts[log.userId].lastAttempt) {
          userAttempts[log.userId].lastAttempt = log.timestamp;
        }

        // Track by IP
        if (log.ipAddress) {
          if (!ipAttempts[log.ipAddress]) {
            ipAttempts[log.ipAddress] = { count: 0, lastAttempt: log.timestamp };
          }
          ipAttempts[log.ipAddress].count++;
          if (log.timestamp > ipAttempts[log.ipAddress].lastAttempt) {
            ipAttempts[log.ipAddress].lastAttempt = log.timestamp;
          }
        }
      });

      const suspiciousUsers = Object.entries(userAttempts)
        .filter(([_, data]) => data.count >= maxFailedAttempts)
        .map(([userId, data]) => ({
          userId,
          userEmail: data.email,
          failedAttempts: data.count,
          lastAttempt: data.lastAttempt
        }));

      const suspiciousIPs = Object.entries(ipAttempts)
        .filter(([_, data]) => data.count >= maxFailedAttempts)
        .map(([ipAddress, data]) => ({
          ipAddress,
          failedAttempts: data.count,
          lastAttempt: data.lastAttempt
        }));

      return { suspiciousUsers, suspiciousIPs };
    } catch (error) {
      console.error('Error in detectSuspiciousActivity:', error);
      return { suspiciousUsers: [], suspiciousIPs: [] };
    }
  }
}