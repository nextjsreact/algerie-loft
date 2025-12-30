import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import type { User, UserRole } from '@/lib/types'

/**
 * Audit permission levels
 */
export type AuditPermissionLevel = 'none' | 'own' | 'related' | 'all';

/**
 * Audit permission configuration
 */
export interface AuditPermissions {
  canViewAuditLogs: boolean;
  canViewOwnAuditLogs: boolean;
  canViewRelatedAuditLogs: boolean;
  canViewAllAuditLogs: boolean;
  canExportAuditLogs: boolean;
  canViewAuditAccessLogs: boolean;
  canManageRetention: boolean;
  canViewIntegrityReports: boolean;
  permissionLevel: AuditPermissionLevel;
}

/**
 * Utility class for managing audit permissions
 */
export class AuditPermissionManager {
  /**
   * Get audit permissions for a user based on their role
   * @param userRole - The user's role
   * @returns Audit permissions configuration
   */
  static getAuditPermissions(userRole: UserRole): AuditPermissions {
    switch (userRole) {
      case 'admin':
        return {
          canViewAuditLogs: true,
          canViewOwnAuditLogs: true,
          canViewRelatedAuditLogs: true,
          canViewAllAuditLogs: true,
          canExportAuditLogs: true,
          canViewAuditAccessLogs: true,
          canManageRetention: true,
          canViewIntegrityReports: true,
          permissionLevel: 'all'
        };

      case 'manager':
        return {
          canViewAuditLogs: true,
          canViewOwnAuditLogs: true,
          canViewRelatedAuditLogs: true,
          canViewAllAuditLogs: true,
          canExportAuditLogs: true,
          canViewAuditAccessLogs: false,
          canManageRetention: false,
          canViewIntegrityReports: true,
          permissionLevel: 'all'
        };

      case 'executive':
        return {
          canViewAuditLogs: true,
          canViewOwnAuditLogs: true,
          canViewRelatedAuditLogs: true,
          canViewAllAuditLogs: false,
          canExportAuditLogs: true,
          canViewAuditAccessLogs: false,
          canManageRetention: false,
          canViewIntegrityReports: false,
          permissionLevel: 'related'
        };

      case 'member':
        return {
          canViewAuditLogs: true,
          canViewOwnAuditLogs: true,
          canViewRelatedAuditLogs: true,
          canViewAllAuditLogs: false,
          canExportAuditLogs: false,
          canViewAuditAccessLogs: false,
          canManageRetention: false,
          canViewIntegrityReports: false,
          permissionLevel: 'related'
        };

      case 'guest':
      default:
        return {
          canViewAuditLogs: false,
          canViewOwnAuditLogs: false,
          canViewRelatedAuditLogs: false,
          canViewAllAuditLogs: false,
          canExportAuditLogs: false,
          canViewAuditAccessLogs: false,
          canManageRetention: false,
          canViewIntegrityReports: false,
          permissionLevel: 'none'
        };
    }
  }

  /**
   * Check if a user can view audit logs for a specific entity
   * @param userId - The user's ID
   * @param userRole - The user's role
   * @param tableName - The table name of the entity
   * @param recordId - The record ID of the entity
   * @returns Promise<boolean> indicating if access is allowed
   */
  static async canViewEntityAuditLogs(
    userId: string,
    userRole: UserRole,
    tableName: string,
    recordId: string
  ): Promise<boolean> {
    try {
      const permissions = this.getAuditPermissions(userRole);
      
      // No audit access at all
      if (!permissions.canViewAuditLogs) {
        return false;
      }

      // Admin and manager can view all audit logs
      if (permissions.canViewAllAuditLogs) {
        return true;
      }

      // Check entity-specific access based on table
      const supabase = await createClient();
      
      switch (tableName) {
        case 'transactions':
          return await this.canViewTransactionAudit(supabase, userId, userRole, recordId);
        
        case 'tasks':
          return await this.canViewTaskAudit(supabase, userId, userRole, recordId);
        
        case 'reservations':
          return await this.canViewReservationAudit(supabase, userId, userRole, recordId);
        
        case 'lofts':
          return await this.canViewLoftAudit(supabase, userId, userRole, recordId);
        
        default:
          logger.warn('Unknown table name for audit access check', { tableName, recordId });
          return false;
      }

    } catch (error) {
      logger.error('Error checking entity audit access', error, { userId, tableName, recordId });
      return false;
    }
  }

  /**
   * Check if user can view transaction audit logs
   */
  private static async canViewTransactionAudit(
    supabase: any,
    userId: string,
    userRole: UserRole,
    transactionId: string
  ): Promise<boolean> {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select(`
          id,
          loft_id,
          lofts!inner (
            id,
            owner_id
          )
        `)
        .eq('id', transactionId)
        .single();

      if (error || !transaction) {
        return false;
      }

      // User can view if they own the loft or have management access
      return transaction.lofts.owner_id === userId || 
             ['admin', 'manager'].includes(userRole);

    } catch (error) {
      logger.error('Error checking transaction audit access', error);
      return false;
    }
  }

  /**
   * Check if user can view task audit logs
   */
  private static async canViewTaskAudit(
    supabase: any,
    userId: string,
    userRole: UserRole,
    taskId: string
  ): Promise<boolean> {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .select('id, assigned_to, created_by')
        .eq('id', taskId)
        .single();

      if (error || !task) {
        return false;
      }

      // User can view if they are assigned to the task, created it, or have management access
      return task.assigned_to === userId || 
             task.created_by === userId || 
             ['admin', 'manager'].includes(userRole);

    } catch (error) {
      logger.error('Error checking task audit access', error);
      return false;
    }
  }

  /**
   * Check if user can view reservation audit logs
   */
  private static async canViewReservationAudit(
    supabase: any,
    userId: string,
    userRole: UserRole,
    reservationId: string
  ): Promise<boolean> {
    try {
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          id,
          customer_id,
          loft_id,
          lofts!inner (
            id,
            owner_id
          )
        `)
        .eq('id', reservationId)
        .single();

      if (error || !reservation) {
        return false;
      }

      // User can view if they made the reservation, own the loft, or have management access
      return reservation.customer_id === userId || 
             reservation.lofts.owner_id === userId || 
             ['admin', 'manager'].includes(userRole);

    } catch (error) {
      logger.error('Error checking reservation audit access', error);
      return false;
    }
  }

  /**
   * Check if user can view loft audit logs
   */
  private static async canViewLoftAudit(
    supabase: any,
    userId: string,
    userRole: UserRole,
    loftId: string
  ): Promise<boolean> {
    try {
      const { data: loft, error } = await supabase
        .from('lofts')
        .select('id, owner_id')
        .eq('id', loftId)
        .single();

      if (error || !loft) {
        return false;
      }

      // User can view if they own the loft or have management access
      return loft.owner_id === userId || 
             ['admin', 'manager'].includes(userRole);

    } catch (error) {
      logger.error('Error checking loft audit access', error);
      return false;
    }
  }

  /**
   * Log audit access attempt for security monitoring
   * @param userId - The user attempting access
   * @param userEmail - The user's email
   * @param userRole - The user's role
   * @param accessType - Type of audit access
   * @param tableName - The table being accessed
   * @param recordId - The record being accessed
   * @param accessGranted - Whether access was granted
   * @param reason - Reason for access decision
   * @param requestPath - API endpoint or page accessed
   * @param queryParameters - Query parameters used
   * @param responseSize - Number of records returned
   * @param accessDurationMs - Time taken to process request
   * @param ipAddress - User's IP address
   * @param userAgent - User's browser/client info
   * @param sessionId - Session identifier
   */
  static async logAuditAccessAttempt(
    userId: string,
    userEmail: string,
    userRole: UserRole,
    accessType: 'view_logs' | 'export_logs' | 'view_entity_history' | 'admin_dashboard',
    tableName?: string,
    recordId?: string,
    accessGranted: boolean = false,
    reason?: string,
    requestPath?: string,
    queryParameters?: Record<string, any>,
    responseSize?: number,
    accessDurationMs?: number,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string
  ): Promise<void> {
    try {
      const supabase = await createClient();
      
      // Log to application logger
      logger.info('Audit access attempt', {
        userId,
        userEmail,
        userRole,
        accessType,
        tableName,
        recordId,
        accessGranted,
        reason,
        requestPath,
        responseSize,
        accessDurationMs,
        timestamp: new Date().toISOString()
      });

      // Store in audit access logs table for security monitoring
      const { error } = await supabase.rpc('log_audit_access', {
        p_user_id: userId,
        p_user_email: userEmail,
        p_user_role: userRole,
        p_access_type: accessType,
        p_table_name: tableName || null,
        p_record_id: recordId || null,
        p_access_granted: accessGranted,
        p_access_reason: reason || null,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null,
        p_session_id: sessionId || null,
        p_request_path: requestPath || null,
        p_query_parameters: queryParameters ? JSON.stringify(queryParameters) : null,
        p_response_size: responseSize || null,
        p_access_duration_ms: accessDurationMs || null
      });

      if (error) {
        logger.error('Failed to log audit access to database', error);
      }
      
    } catch (error) {
      logger.error('Error logging audit access attempt', error);
    }
  }

  /**
   * Validate audit export permissions
   * @param userRole - The user's role
   * @param exportSize - Number of records being exported
   * @returns boolean indicating if export is allowed
   */
  static validateExportPermissions(userRole: UserRole, exportSize: number): boolean {
    const permissions = this.getAuditPermissions(userRole);
    
    if (!permissions.canExportAuditLogs) {
      return false;
    }

    // Implement export size limits based on role
    const exportLimits: Record<UserRole, number> = {
      admin: 100000,      // 100k records
      manager: 50000,     // 50k records
      executive: 10000,   // 10k records
      member: 1000,       // 1k records
      guest: 0            // No export
    };

    const limit = exportLimits[userRole] || 0;
    return exportSize <= limit;
  }

  /**
   * Get audit permission summary for a user
   * @param userId - The user's ID
   * @returns Promise containing user's audit permissions
   */
  static async getUserAuditPermissions(userId: string): Promise<AuditPermissions | null> {
    try {
      const supabase = await createClient();
      
      const { data: user, error } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .single();

      if (error || !user) {
        logger.error('Failed to get user for audit permissions', error);
        return null;
      }

      return this.getAuditPermissions(user.role as UserRole);

    } catch (error) {
      logger.error('Error getting user audit permissions', error);
      return null;
    }
  }

  /**
   * Check if user has administrative audit permissions
   * @param userRole - The user's role
   * @returns boolean indicating if user has admin audit access
   */
  static hasAdminAuditAccess(userRole: UserRole): boolean {
    return userRole === 'admin';
  }

  /**
   * Check if user can view entity audit history
   * @param userRole - The user's role
   * @param tableName - The table name of the entity
   * @param recordId - The record ID of the entity
   * @returns boolean indicating if user can view audit history
   */
  static canViewEntityAuditHistory(
    userRole: UserRole,
    tableName: string,
    recordId: string
  ): boolean {
    const permissions = this.getAuditPermissions(userRole);
    
    // No audit access at all
    if (!permissions.canViewAuditLogs) {
      return false;
    }

    // Admin and manager can view all audit logs
    if (permissions.canViewAllAuditLogs) {
      return true;
    }

    // For other roles, they can view audit history of entities they have access to
    // This is a simplified check - in a real implementation, you might want to
    // check entity-specific permissions (e.g., if user owns the transaction)
    return permissions.canViewRelatedAuditLogs;
  }

  /**
   * Check if user can manage audit retention policies
   * @param userRole - The user's role
   * @returns boolean indicating if user can manage retention
   */
  static canManageRetention(userRole: UserRole): boolean {
    const permissions = this.getAuditPermissions(userRole);
    return permissions.canManageRetention;
  }

  /**
   * Check if user can view audit access logs
   * @param userRole - The user's role
   * @returns boolean indicating if user can view access logs
   */
  static canViewAuditAccessLogs(userRole: UserRole): boolean {
    const permissions = this.getAuditPermissions(userRole);
    return permissions.canViewAuditAccessLogs;
  }

  /**
   * Check if user can export audit logs
   * @param userRole - The user's role
   * @returns boolean indicating if user can export audit logs
   */
  static canExportAuditLogs(userRole: UserRole): boolean {
    const permissions = this.getAuditPermissions(userRole);
    return permissions.canExportAuditLogs;
  }

  /**
   * Get audit access level for a user role
   * @param userRole - The user's role
   * @returns string representing the access level
   */
  static getAuditAccessLevel(userRole: UserRole): string {
    const permissions = this.getAuditPermissions(userRole);
    return permissions.permissionLevel;
  }

  /**
   * Check if user can access audit dashboard
   * @param userRole - The user's role
   * @returns boolean indicating if user can access audit dashboard
   */
  static canAccessAuditDashboard(userRole: UserRole): boolean {
    const permissions = this.getAuditPermissions(userRole);
    return permissions.canViewAuditLogs;
  }
}

/**
 * Middleware function to check audit permissions
 * @param requiredPermission - The required permission level
 * @returns Function that checks permissions
 */
export function requireAuditPermission(requiredPermission: keyof AuditPermissions) {
  return async (userId: string, userRole: UserRole): Promise<boolean> => {
    const permissions = AuditPermissionManager.getAuditPermissions(userRole);
    return permissions[requiredPermission] as boolean;
  };
}

/**
 * Helper function to check if audit tab should be visible
 * @param userRole - The user's role
 * @returns boolean indicating if audit tab should be shown
 */
export function shouldShowAuditTab(userRole: UserRole): boolean {
  const permissions = AuditPermissionManager.getAuditPermissions(userRole);
  return permissions.canViewAuditLogs;
}

/**
 * Audit integrity validation utilities
 */
export class AuditIntegrityManager {
  /**
   * Validate audit log integrity by checking for gaps or inconsistencies
   * @param tableName - The table to validate
   * @param recordId - Specific record to validate (optional)
   * @returns Promise with validation results
   */
  static async validateAuditIntegrity(
    tableName: string,
    recordId?: string
  ): Promise<{
    isValid: boolean;
    issues: string[];
    totalLogs: number;
    validatedAt: Date;
  }> {
    try {
      const supabase = await createClient();
      const issues: string[] = [];
      
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', tableName)
        .order('timestamp', { ascending: true });
      
      if (recordId) {
        query = query.eq('record_id', recordId);
      }
      
      const { data: logs, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (!logs || logs.length === 0) {
        return {
          isValid: true,
          issues: [],
          totalLogs: 0,
          validatedAt: new Date()
        };
      }
      
      // Check for chronological order
      for (let i = 1; i < logs.length; i++) {
        const prevLog = logs[i - 1];
        const currentLog = logs[i];
        
        if (new Date(prevLog.timestamp) > new Date(currentLog.timestamp)) {
          issues.push(`Chronological order violation: Log ${currentLog.id} has earlier timestamp than previous log`);
        }
      }
      
      // Check for missing CREATE operations
      const recordIds = [...new Set(logs.map(log => log.record_id))];
      for (const id of recordIds) {
        const recordLogs = logs.filter(log => log.record_id === id);
        const hasInsert = recordLogs.some(log => log.action === 'INSERT');
        
        if (!hasInsert && recordLogs.length > 0) {
          issues.push(`Missing INSERT audit log for record ${id}`);
        }
      }
      
      // Check for orphaned UPDATE/DELETE operations
      for (const log of logs) {
        if (log.action === 'UPDATE' || log.action === 'DELETE') {
          const recordLogs = logs.filter(l => l.record_id === log.record_id);
          const hasInsert = recordLogs.some(l => l.action === 'INSERT' && new Date(l.timestamp) < new Date(log.timestamp));
          
          if (!hasInsert) {
            issues.push(`${log.action} operation without preceding INSERT for record ${log.record_id}`);
          }
        }
      }
      
      // Check for invalid JSON in old_values/new_values
      for (const log of logs) {
        try {
          if (log.old_values && typeof log.old_values === 'string') {
            JSON.parse(log.old_values);
          }
          if (log.new_values && typeof log.new_values === 'string') {
            JSON.parse(log.new_values);
          }
        } catch (jsonError) {
          issues.push(`Invalid JSON in audit log ${log.id}`);
        }
      }
      
      return {
        isValid: issues.length === 0,
        issues,
        totalLogs: logs.length,
        validatedAt: new Date()
      };
      
    } catch (error) {
      logger.error('Error validating audit integrity', error);
      return {
        isValid: false,
        issues: [`Validation failed: ${error.message}`],
        totalLogs: 0,
        validatedAt: new Date()
      };
    }
  }
  
  /**
   * Generate audit integrity report for all tables
   * @returns Promise with comprehensive integrity report
   */
  static async generateIntegrityReport(): Promise<{
    overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    tables: Array<{
      tableName: string;
      status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
      totalLogs: number;
      issues: string[];
      lastAuditActivity: Date | null;
    }>;
    generatedAt: Date;
  }> {
    try {
      const supabase = await createClient();
      
      // Get all audited tables
      const { data: auditedTables, error } = await supabase
        .from('audit_logs')
        .select('table_name')
        .group('table_name');
      
      if (error) {
        throw error;
      }
      
      const tableNames = [...new Set(auditedTables?.map(t => t.table_name) || [])];
      const tableReports = [];
      
      for (const tableName of tableNames) {
        const integrity = await this.validateAuditIntegrity(tableName);
        
        // Get last audit activity
        const { data: lastActivity } = await supabase
          .from('audit_logs')
          .select('timestamp')
          .eq('table_name', tableName)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single();
        
        const status = integrity.issues.length === 0 ? 'HEALTHY' : 
                      integrity.issues.length <= 3 ? 'WARNING' : 'CRITICAL';
        
        tableReports.push({
          tableName,
          status,
          totalLogs: integrity.totalLogs,
          issues: integrity.issues,
          lastAuditActivity: lastActivity ? new Date(lastActivity.timestamp) : null
        });
      }
      
      // Determine overall status
      const criticalTables = tableReports.filter(t => t.status === 'CRITICAL').length;
      const warningTables = tableReports.filter(t => t.status === 'WARNING').length;
      
      const overallStatus = criticalTables > 0 ? 'CRITICAL' : 
                           warningTables > 0 ? 'WARNING' : 'HEALTHY';
      
      return {
        overallStatus,
        tables: tableReports,
        generatedAt: new Date()
      };
      
    } catch (error) {
      logger.error('Error generating audit integrity report', error);
      return {
        overallStatus: 'CRITICAL',
        tables: [],
        generatedAt: new Date()
      };
    }
  }
  
  /**
   * Check for suspicious audit patterns that might indicate tampering
   * @param days - Number of days to analyze
   * @returns Promise with suspicious activity report
   */
  static async detectSuspiciousActivity(days: number = 7): Promise<{
    suspiciousPatterns: Array<{
      type: string;
      description: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      details: any;
    }>;
    analyzedPeriod: { from: Date; to: Date };
    totalLogsAnalyzed: number;
  }> {
    try {
      const supabase = await createClient();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('timestamp', fromDate.toISOString())
        .order('timestamp', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      const suspiciousPatterns = [];
      
      // Pattern 1: Unusual bulk operations
      const userOperations = new Map();
      logs?.forEach(log => {
        const key = `${log.user_id}_${log.action}_${new Date(log.timestamp).toDateString()}`;
        userOperations.set(key, (userOperations.get(key) || 0) + 1);
      });
      
      for (const [key, count] of userOperations.entries()) {
        if (count > 100) { // More than 100 operations of same type per day
          const [userId, action, date] = key.split('_');
          suspiciousPatterns.push({
            type: 'BULK_OPERATIONS',
            description: `User performed ${count} ${action} operations on ${date}`,
            severity: count > 500 ? 'HIGH' : 'MEDIUM',
            details: { userId, action, date, count }
          });
        }
      }
      
      // Pattern 2: Operations outside business hours
      const businessHourViolations = logs?.filter(log => {
        const hour = new Date(log.timestamp).getHours();
        return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
      }) || [];
      
      if (businessHourViolations.length > 10) {
        suspiciousPatterns.push({
          type: 'OFF_HOURS_ACTIVITY',
          description: `${businessHourViolations.length} operations performed outside business hours`,
          severity: businessHourViolations.length > 50 ? 'HIGH' : 'MEDIUM',
          details: { count: businessHourViolations.length, operations: businessHourViolations.slice(0, 5) }
        });
      }
      
      // Pattern 3: Rapid sequential operations
      const rapidOperations = [];
      for (let i = 1; i < (logs?.length || 0); i++) {
        const prevLog = logs![i - 1];
        const currentLog = logs![i];
        
        if (prevLog.user_id === currentLog.user_id) {
          const timeDiff = new Date(currentLog.timestamp).getTime() - new Date(prevLog.timestamp).getTime();
          if (timeDiff < 1000) { // Less than 1 second between operations
            rapidOperations.push({ prevLog, currentLog, timeDiff });
          }
        }
      }
      
      if (rapidOperations.length > 20) {
        suspiciousPatterns.push({
          type: 'RAPID_OPERATIONS',
          description: `${rapidOperations.length} operations performed with less than 1 second intervals`,
          severity: rapidOperations.length > 100 ? 'HIGH' : 'MEDIUM',
          details: { count: rapidOperations.length, samples: rapidOperations.slice(0, 3) }
        });
      }
      
      return {
        suspiciousPatterns,
        analyzedPeriod: { from: fromDate, to: new Date() },
        totalLogsAnalyzed: logs?.length || 0
      };
      
    } catch (error) {
      logger.error('Error detecting suspicious audit activity', error);
      return {
        suspiciousPatterns: [],
        analyzedPeriod: { from: new Date(), to: new Date() },
        totalLogsAnalyzed: 0
      };
    }
  }
}