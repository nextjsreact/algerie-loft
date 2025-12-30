import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import { AuditPermissionManager, AuditIntegrityManager } from '@/lib/permissions/audit-permissions'
import type { UserRole } from '@/lib/types'

/**
 * Comprehensive audit security service that manages all aspects of audit security
 */
export class AuditSecurityService {
  /**
   * Perform comprehensive security check for audit access
   * @param userId - User requesting access
   * @param userRole - User's role
   * @param accessType - Type of access requested
   * @param tableName - Table being accessed (optional)
   * @param recordId - Record being accessed (optional)
   * @param requestContext - Additional request context
   * @returns Promise with access decision and security metadata
   */
  static async performSecurityCheck(
    userId: string,
    userRole: UserRole,
    accessType: 'view_logs' | 'export_logs' | 'view_entity_history' | 'admin_dashboard',
    tableName?: string,
    recordId?: string,
    requestContext?: {
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      requestPath?: string;
      queryParameters?: Record<string, any>;
    }
  ): Promise<{
    accessGranted: boolean;
    reason: string;
    securityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    restrictions?: string[];
    auditLogId?: string;
  }> {
    const startTime = Date.now();
    let accessGranted = false;
    let reason = '';
    let securityLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    const restrictions: string[] = [];

    try {
      const supabase = await createClient();
      
      // Get user information
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, email, role, created_at, last_sign_in_at')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        reason = 'User not found or invalid';
        securityLevel = 'HIGH';
        accessGranted = false;
      } else {
        // Check basic permissions
        const permissions = AuditPermissionManager.getAuditPermissions(userRole);
        
        switch (accessType) {
          case 'view_logs':
            accessGranted = permissions.canViewAuditLogs;
            break;
          case 'export_logs':
            accessGranted = permissions.canExportAuditLogs;
            break;
          case 'view_entity_history':
            if (tableName && recordId) {
              accessGranted = await AuditPermissionManager.canViewEntityAuditLogs(
                userId, userRole, tableName, recordId
              );
            } else {
              accessGranted = permissions.canViewAuditLogs;
            }
            break;
          case 'admin_dashboard':
            accessGranted = permissions.canViewAllAuditLogs;
            break;
        }

        if (!accessGranted) {
          reason = `Insufficient permissions for ${accessType}`;
          securityLevel = 'MEDIUM';
        } else {
          // Additional security checks for granted access
          
          // Check for suspicious access patterns
          const recentAccess = await this.checkRecentAccessPatterns(userId, accessType);
          if (recentAccess.isSuspicious) {
            restrictions.push('Rate limited due to suspicious access patterns');
            securityLevel = 'HIGH';
            reason = 'Access granted with restrictions due to suspicious patterns';
          }
          
          // Check account age and activity
          const accountAge = Date.now() - new Date(user.created_at).getTime();
          const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
          
          if (daysSinceCreation < 7) {
            restrictions.push('New account - limited audit access');
            securityLevel = 'HIGH';
          }
          
          // Check for off-hours access
          const currentHour = new Date().getHours();
          if (currentHour < 6 || currentHour > 22) {
            restrictions.push('Off-hours access logged for security monitoring');
            securityLevel = 'HIGH';
          }
          
          // Check IP address patterns (if available)
          if (requestContext?.ipAddress) {
            const ipCheck = await this.checkIPAddressPatterns(userId, requestContext.ipAddress);
            if (ipCheck.isNewIP) {
              restrictions.push('New IP address detected');
              securityLevel = 'HIGH';
            }
          }
          
          reason = accessGranted ? 
            (restrictions.length > 0 ? 'Access granted with security restrictions' : 'Access granted') :
            'Access denied';
        }
      }

      // Log the access attempt
      const accessDuration = Date.now() - startTime;
      await AuditPermissionManager.logAuditAccessAttempt(
        userId,
        user?.email || 'unknown',
        userRole,
        accessType,
        tableName,
        recordId,
        accessGranted,
        reason,
        requestContext?.requestPath,
        requestContext?.queryParameters,
        undefined, // responseSize will be set later
        accessDuration,
        requestContext?.ipAddress,
        requestContext?.userAgent,
        requestContext?.sessionId
      );

      return {
        accessGranted,
        reason,
        securityLevel,
        restrictions: restrictions.length > 0 ? restrictions : undefined
      };

    } catch (error) {
      logger.error('Error performing audit security check', error);
      
      // Log failed security check
      await AuditPermissionManager.logAuditAccessAttempt(
        userId,
        'unknown',
        userRole,
        accessType,
        tableName,
        recordId,
        false,
        `Security check failed: ${error.message}`,
        requestContext?.requestPath,
        requestContext?.queryParameters,
        undefined,
        Date.now() - startTime,
        requestContext?.ipAddress,
        requestContext?.userAgent,
        requestContext?.sessionId
      );

      return {
        accessGranted: false,
        reason: 'Security check failed',
        securityLevel: 'HIGH'
      };
    }
  }

  /**
   * Check for suspicious recent access patterns
   */
  private static async checkRecentAccessPatterns(
    userId: string,
    accessType: string
  ): Promise<{ isSuspicious: boolean; reason?: string }> {
    try {
      const supabase = await createClient();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const { data: recentAccess, error } = await supabase
        .from('audit_access_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('access_type', accessType)
        .gte('timestamp', oneHourAgo.toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        logger.error('Error checking recent access patterns', error);
        return { isSuspicious: false };
      }

      // Check for excessive access attempts
      if (recentAccess && recentAccess.length > 50) {
        return { 
          isSuspicious: true, 
          reason: `${recentAccess.length} access attempts in the last hour` 
        };
      }

      // Check for rapid successive attempts
      if (recentAccess && recentAccess.length > 1) {
        const rapidAttempts = recentAccess.filter((access, index) => {
          if (index === 0) return false;
          const prevAccess = recentAccess[index - 1];
          const timeDiff = new Date(prevAccess.timestamp).getTime() - new Date(access.timestamp).getTime();
          return timeDiff < 5000; // Less than 5 seconds between attempts
        });

        if (rapidAttempts.length > 10) {
          return { 
            isSuspicious: true, 
            reason: `${rapidAttempts.length} rapid successive access attempts` 
          };
        }
      }

      return { isSuspicious: false };

    } catch (error) {
      logger.error('Error checking access patterns', error);
      return { isSuspicious: false };
    }
  }

  /**
   * Check IP address patterns for security
   */
  private static async checkIPAddressPatterns(
    userId: string,
    ipAddress: string
  ): Promise<{ isNewIP: boolean; isBlacklisted: boolean }> {
    try {
      const supabase = await createClient();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Check if this IP has been used by this user recently
      const { data: recentIPs, error } = await supabase
        .from('audit_access_logs')
        .select('ip_address')
        .eq('user_id', userId)
        .gte('timestamp', sevenDaysAgo.toISOString())
        .not('ip_address', 'is', null);

      if (error) {
        logger.error('Error checking IP patterns', error);
        return { isNewIP: false, isBlacklisted: false };
      }

      const knownIPs = new Set(recentIPs?.map(r => r.ip_address) || []);
      const isNewIP = !knownIPs.has(ipAddress);

      // In a production environment, you might want to check against
      // a blacklist of known malicious IPs
      const isBlacklisted = false; // Placeholder for IP blacklist check

      return { isNewIP, isBlacklisted };

    } catch (error) {
      logger.error('Error checking IP patterns', error);
      return { isNewIP: false, isBlacklisted: false };
    }
  }

  /**
   * Generate comprehensive security report
   */
  static async generateSecurityReport(days: number = 30): Promise<{
    summary: {
      totalAccessAttempts: number;
      successfulAccesses: number;
      deniedAccesses: number;
      suspiciousActivities: number;
      uniqueUsers: number;
    };
    topUsers: Array<{
      userId: string;
      userEmail: string;
      accessCount: number;
      deniedCount: number;
      riskScore: number;
    }>;
    securityAlerts: Array<{
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      description: string;
      count: number;
    }>;
    integrityStatus: any;
    generatedAt: Date;
  }> {
    try {
      const supabase = await createClient();
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get access statistics
      const { data: accessLogs, error } = await supabase
        .from('audit_access_logs')
        .select('*')
        .gte('timestamp', fromDate.toISOString());

      if (error) {
        throw error;
      }

      const totalAccessAttempts = accessLogs?.length || 0;
      const successfulAccesses = accessLogs?.filter(log => log.access_granted).length || 0;
      const deniedAccesses = totalAccessAttempts - successfulAccesses;
      const uniqueUsers = new Set(accessLogs?.map(log => log.user_id)).size;

      // Calculate top users and risk scores
      const userStats = new Map();
      accessLogs?.forEach(log => {
        const key = log.user_id;
        if (!userStats.has(key)) {
          userStats.set(key, {
            userId: log.user_id,
            userEmail: log.user_email,
            accessCount: 0,
            deniedCount: 0
          });
        }
        const stats = userStats.get(key);
        stats.accessCount++;
        if (!log.access_granted) {
          stats.deniedCount++;
        }
      });

      const topUsers = Array.from(userStats.values())
        .map(user => ({
          ...user,
          riskScore: Math.min(100, (user.deniedCount * 10) + (user.accessCount > 100 ? 20 : 0))
        }))
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      // Generate security alerts
      const securityAlerts = [];
      
      if (deniedAccesses > totalAccessAttempts * 0.1) {
        securityAlerts.push({
          type: 'HIGH_DENIAL_RATE',
          severity: 'HIGH' as const,
          description: `${Math.round((deniedAccesses / totalAccessAttempts) * 100)}% of access attempts were denied`,
          count: deniedAccesses
        });
      }

      const offHoursAccess = accessLogs?.filter(log => {
        const hour = new Date(log.timestamp).getHours();
        return hour < 6 || hour > 22;
      }).length || 0;

      if (offHoursAccess > 10) {
        securityAlerts.push({
          type: 'OFF_HOURS_ACCESS',
          severity: offHoursAccess > 50 ? 'HIGH' : 'MEDIUM' as const,
          description: `${offHoursAccess} audit access attempts outside business hours`,
          count: offHoursAccess
        });
      }

      // Get integrity status
      const integrityStatus = await AuditIntegrityManager.generateIntegrityReport();

      // Detect suspicious activities
      const suspiciousActivity = await AuditIntegrityManager.detectSuspiciousActivity(days);
      const suspiciousActivities = suspiciousActivity.suspiciousPatterns.length;

      return {
        summary: {
          totalAccessAttempts,
          successfulAccesses,
          deniedAccesses,
          suspiciousActivities,
          uniqueUsers
        },
        topUsers,
        securityAlerts,
        integrityStatus,
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Error generating security report', error);
      throw error;
    }
  }

  /**
   * Validate audit system security configuration
   */
  static async validateSecurityConfiguration(): Promise<{
    isSecure: boolean;
    issues: string[];
    recommendations: string[];
    configurationScore: number;
  }> {
    try {
      const supabase = await createClient();
      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // Check RLS policies
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_table_policies', { table_name: 'audit_logs' });

      if (policiesError || !policies || policies.length === 0) {
        issues.push('No RLS policies found for audit_logs table');
        score -= 30;
        recommendations.push('Implement Row Level Security policies for audit_logs table');
      }

      // Check retention policies
      const { data: retentionPolicies, error: retentionError } = await supabase
        .from('audit_retention_policies')
        .select('*')
        .eq('is_active', true);

      if (retentionError || !retentionPolicies || retentionPolicies.length === 0) {
        issues.push('No active retention policies configured');
        score -= 20;
        recommendations.push('Configure audit data retention policies');
      }

      // Check for admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (adminError || !adminUsers || adminUsers.length === 0) {
        issues.push('No admin users found for audit management');
        score -= 25;
        recommendations.push('Ensure at least one admin user exists for audit management');
      } else if (adminUsers.length > 5) {
        issues.push('Too many admin users - potential security risk');
        score -= 10;
        recommendations.push('Limit the number of admin users to minimize security risk');
      }

      // Check audit access logging
      const { data: accessLogs, error: accessError } = await supabase
        .from('audit_access_logs')
        .select('id')
        .limit(1);

      if (accessError) {
        issues.push('Audit access logging not properly configured');
        score -= 15;
        recommendations.push('Ensure audit access logging is properly configured');
      }

      const isSecure = issues.length === 0 && score >= 80;

      return {
        isSecure,
        issues,
        recommendations,
        configurationScore: Math.max(0, score)
      };

    } catch (error) {
      logger.error('Error validating security configuration', error);
      return {
        isSecure: false,
        issues: ['Failed to validate security configuration'],
        recommendations: ['Review audit system configuration and ensure all components are properly set up'],
        configurationScore: 0
      };
    }
  }
}