"use server"

import { createClient } from '@/utils/supabase/server';
import { requireSuperuserPermissions, logSuperuserAudit } from './auth';
import { getBackupConfiguration } from './backup-service';

export interface BackupAlert {
  id: string;
  alert_type: 'BACKUP_FAILED' | 'BACKUP_OVERDUE' | 'STORAGE_FULL' | 'BACKUP_CORRUPTED' | 'RETENTION_WARNING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  backup_id?: string;
  metadata: Record<string, any>;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface BackupMonitoringStats {
  total_backups: number;
  successful_backups: number;
  failed_backups: number;
  pending_backups: number;
  success_rate: number;
  average_backup_time: number;
  total_storage_used: number;
  last_successful_backup: Date | null;
  next_scheduled_backup: Date | null;
  active_alerts: number;
  critical_alerts: number;
}

export interface BackupHealthReport {
  overall_health: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  checks: Array<{
    name: string;
    status: 'PASS' | 'WARN' | 'FAIL';
    message: string;
    details?: any;
  }>;
  recommendations: string[];
  last_check: Date;
}

export interface BackupTrend {
  date: Date;
  successful_backups: number;
  failed_backups: number;
  total_size: number;
  average_duration: number;
}

/**
 * Get backup monitoring statistics
 */
export async function getBackupMonitoringStats(): Promise<BackupMonitoringStats> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Get backup counts by status
    const { data: backupStats } = await supabase
      .from('backup_records')
      .select('status, file_size, started_at, completed_at')
      .gte('started_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    const totalBackups = backupStats?.length || 0;
    const successfulBackups = backupStats?.filter(b => b.status === 'COMPLETED').length || 0;
    const failedBackups = backupStats?.filter(b => b.status === 'FAILED').length || 0;
    const pendingBackups = backupStats?.filter(b => b.status === 'PENDING' || b.status === 'IN_PROGRESS').length || 0;

    const successRate = totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : 0;

    // Calculate average backup time
    const completedBackups = backupStats?.filter(b => b.status === 'COMPLETED' && b.completed_at) || [];
    const totalDuration = completedBackups.reduce((sum, backup) => {
      const duration = new Date(backup.completed_at).getTime() - new Date(backup.started_at).getTime();
      return sum + duration;
    }, 0);
    const averageBackupTime = completedBackups.length > 0 ? totalDuration / completedBackups.length : 0;

    // Calculate total storage used
    const totalStorageUsed = backupStats?.reduce((sum, backup) => 
      sum + (backup.file_size || 0), 0) || 0;

    // Get last successful backup
    const { data: lastSuccessfulBackup } = await supabase
      .from('backup_records')
      .select('completed_at')
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    // Get next scheduled backup (mock - would come from scheduler)
    const nextScheduledBackup = new Date();
    nextScheduledBackup.setDate(nextScheduledBackup.getDate() + 1);

    // Get active alerts count
    const { count: activeAlerts } = await supabase
      .from('backup_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_resolved', false);

    const { count: criticalAlerts } = await supabase
      .from('backup_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_resolved', false)
      .eq('severity', 'CRITICAL');

    return {
      total_backups: totalBackups,
      successful_backups: successfulBackups,
      failed_backups: failedBackups,
      pending_backups: pendingBackups,
      success_rate: successRate,
      average_backup_time: averageBackupTime,
      total_storage_used: totalStorageUsed,
      last_successful_backup: lastSuccessfulBackup ? new Date(lastSuccessfulBackup.completed_at) : null,
      next_scheduled_backup: nextScheduledBackup,
      active_alerts: activeAlerts || 0,
      critical_alerts: criticalAlerts || 0
    };
  } catch (error) {
    console.error('Error getting backup monitoring stats:', error);
    return {
      total_backups: 0,
      successful_backups: 0,
      failed_backups: 0,
      pending_backups: 0,
      success_rate: 0,
      average_backup_time: 0,
      total_storage_used: 0,
      last_successful_backup: null,
      next_scheduled_backup: null,
      active_alerts: 0,
      critical_alerts: 0
    };
  }
}

/**
 * Get backup alerts with filtering
 */
export async function getBackupAlerts(
  filters: {
    alert_type?: string[];
    severity?: string[];
    is_resolved?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ alerts: BackupAlert[]; total_count: number }> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    let query = supabase
      .from('backup_alerts')
      .select('*', { count: 'exact' });

    if (filters.alert_type?.length) {
      query = query.in('alert_type', filters.alert_type);
    }
    if (filters.severity?.length) {
      query = query.in('severity', filters.severity);
    }
    if (filters.is_resolved !== undefined) {
      query = query.eq('is_resolved', filters.is_resolved);
    }

    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: alerts, error, count } = await query;

    if (error) {
      throw error;
    }

    const formattedAlerts: BackupAlert[] = (alerts || []).map(alert => ({
      ...alert,
      resolved_at: alert.resolved_at ? new Date(alert.resolved_at) : undefined,
      created_at: new Date(alert.created_at),
      updated_at: new Date(alert.updated_at)
    }));

    return { alerts: formattedAlerts, total_count: count || 0 };
  } catch (error) {
    console.error('Error getting backup alerts:', error);
    return { alerts: [], total_count: 0 };
  }
}

/**
 * Create a backup alert
 */
export async function createBackupAlert(
  alertType: BackupAlert['alert_type'],
  severity: BackupAlert['severity'],
  title: string,
  description: string,
  backupId?: string,
  metadata: Record<string, any> = {}
): Promise<{ success: boolean; alert_id?: string; error?: string }> {
  try {
    const supabase = await createClient(true);
    
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: alert, error } = await supabase
      .from('backup_alerts')
      .insert({
        id: alertId,
        alert_type: alertType,
        severity,
        title,
        description,
        backup_id: backupId,
        metadata,
        is_resolved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !alert) {
      throw new Error(`Failed to create backup alert: ${error?.message}`);
    }

    // Send notifications for critical alerts
    if (severity === 'CRITICAL') {
      await sendCriticalAlertNotification(alert);
    }

    await logSuperuserAudit('BACKUP', {
      action: 'create_backup_alert',
      alert_id: alertId,
      alert_type: alertType,
      severity,
      backup_id: backupId
    }, { severity: 'MEDIUM' });

    return { success: true, alert_id: alertId };
  } catch (error) {
    console.error('Error creating backup alert:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Resolve a backup alert
 */
export async function resolveBackupAlert(
  alertId: string,
  resolvedBy: string,
  resolution_notes?: string
): Promise<{ success: boolean; error?: string }> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    const { data: alert, error } = await supabase
      .from('backup_alerts')
      .update({
        is_resolved: true,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        metadata: {
          resolution_notes
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .eq('is_resolved', false)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!alert) {
      return { success: false, error: 'Alert not found or already resolved' };
    }

    await logSuperuserAudit('BACKUP', {
      action: 'resolve_backup_alert',
      alert_id: alertId,
      resolved_by: resolvedBy,
      resolution_notes
    });

    return { success: true };
  } catch (error) {
    console.error('Error resolving backup alert:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Perform backup health check
 */
export async function performBackupHealthCheck(): Promise<BackupHealthReport> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  const checks = [];
  const recommendations = [];
  
  try {
    const supabase = await createClient(true);
    const config = await getBackupConfiguration();
    
    // Check 1: Recent backup availability
    const { data: recentBackup } = await supabase
      .from('backup_records')
      .select('completed_at, status')
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (recentBackup) {
      const backupAge = Date.now() - new Date(recentBackup.completed_at).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      if (backupAge < oneDayMs) {
        checks.push({
          name: 'Recent Backup',
          status: 'PASS' as const,
          message: 'Recent backup available within 24 hours'
        });
      } else if (backupAge < 2 * oneDayMs) {
        checks.push({
          name: 'Recent Backup',
          status: 'WARN' as const,
          message: 'Last backup is older than 24 hours'
        });
        recommendations.push('Schedule more frequent backups');
      } else {
        checks.push({
          name: 'Recent Backup',
          status: 'FAIL' as const,
          message: 'No recent backup found (older than 48 hours)'
        });
        recommendations.push('Immediately create a new backup');
      }
    } else {
      checks.push({
        name: 'Recent Backup',
        status: 'FAIL' as const,
        message: 'No successful backups found'
      });
      recommendations.push('Create your first backup immediately');
    }

    // Check 2: Backup failure rate
    const { data: recentBackups } = await supabase
      .from('backup_records')
      .select('status')
      .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    if (recentBackups && recentBackups.length > 0) {
      const failedCount = recentBackups.filter(b => b.status === 'FAILED').length;
      const failureRate = (failedCount / recentBackups.length) * 100;
      
      if (failureRate === 0) {
        checks.push({
          name: 'Backup Reliability',
          status: 'PASS',
          message: 'No backup failures in the last 7 days'
        });
      } else if (failureRate < 10) {
        checks.push({
          name: 'Backup Reliability',
          status: 'WARN',
          message: `${failureRate.toFixed(1)}% backup failure rate`
        });
        recommendations.push('Investigate backup failure causes');
      } else {
        checks.push({
          name: 'Backup Reliability',
          status: 'FAIL',
          message: `High backup failure rate: ${failureRate.toFixed(1)}%`
        });
        recommendations.push('Urgent: Fix backup system issues');
      }
    }

    // Check 3: Storage space
    const { data: storageStats } = await supabase
      .from('backup_records')
      .select('file_size')
      .eq('status', 'COMPLETED');

    const totalStorageUsed = storageStats?.reduce((sum, backup) => 
      sum + (backup.file_size || 0), 0) || 0;
    
    // Mock storage limit check (in production, this would check actual storage)
    const storageLimit = 100 * 1024 * 1024 * 1024; // 100GB mock limit
    const storageUsagePercent = (totalStorageUsed / storageLimit) * 100;

    if (storageUsagePercent < 70) {
      checks.push({
        name: 'Storage Space',
        status: 'PASS',
        message: `Storage usage: ${storageUsagePercent.toFixed(1)}%`
      });
    } else if (storageUsagePercent < 90) {
      checks.push({
        name: 'Storage Space',
        status: 'WARN',
        message: `Storage usage: ${storageUsagePercent.toFixed(1)}%`
      });
      recommendations.push('Consider cleaning up old backups');
    } else {
      checks.push({
        name: 'Storage Space',
        status: 'FAIL',
        message: `Critical storage usage: ${storageUsagePercent.toFixed(1)}%`
      });
      recommendations.push('Urgent: Free up storage space');
    }

    // Check 4: Backup retention compliance
    const { count: expiredBackups } = await supabase
      .from('backup_records')
      .select('*', { count: 'exact', head: true })
      .lt('retention_until', new Date().toISOString());

    if ((expiredBackups || 0) === 0) {
      checks.push({
        name: 'Retention Compliance',
        status: 'PASS',
        message: 'All backups within retention policy'
      });
    } else {
      checks.push({
        name: 'Retention Compliance',
        status: 'WARN',
        message: `${expiredBackups} backups exceed retention policy`
      });
      recommendations.push('Clean up expired backups');
    }

    // Determine overall health
    const failCount = checks.filter(c => c.status === 'FAIL').length;
    const warnCount = checks.filter(c => c.status === 'WARN').length;
    
    let overallHealth: BackupHealthReport['overall_health'] = 'HEALTHY';
    if (failCount > 0) overallHealth = 'CRITICAL';
    else if (warnCount > 0) overallHealth = 'WARNING';

    // Create alerts for critical issues
    if (overallHealth === 'CRITICAL') {
      const criticalIssues = checks.filter(c => c.status === 'FAIL');
      for (const issue of criticalIssues) {
        await createBackupAlert(
          'BACKUP_FAILED',
          'CRITICAL',
          `Backup Health Check Failed: ${issue.name}`,
          issue.message
        );
      }
    }

    await logSuperuserAudit('BACKUP', {
      action: 'perform_backup_health_check',
      overall_health: overallHealth,
      checks_passed: checks.filter(c => c.status === 'PASS').length,
      checks_warned: warnCount,
      checks_failed: failCount
    });

    return {
      overall_health: overallHealth,
      checks,
      recommendations,
      last_check: new Date()
    };
  } catch (error) {
    console.error('Error performing backup health check:', error);
    return {
      overall_health: 'CRITICAL',
      checks: [{
        name: 'Health Check',
        status: 'FAIL',
        message: 'Failed to perform health check',
        details: error.message
      }],
      recommendations: ['Fix backup monitoring system'],
      last_check: new Date()
    };
  }
}

/**
 * Get backup trends over time
 */
export async function getBackupTrends(
  days: number = 30
): Promise<BackupTrend[]> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: backups } = await supabase
      .from('backup_records')
      .select('status, file_size, started_at, completed_at')
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: true });

    // Group backups by date
    const trendMap = new Map<string, {
      successful: number;
      failed: number;
      totalSize: number;
      durations: number[];
    }>();

    (backups || []).forEach(backup => {
      const date = new Date(backup.started_at).toISOString().split('T')[0];
      
      if (!trendMap.has(date)) {
        trendMap.set(date, {
          successful: 0,
          failed: 0,
          totalSize: 0,
          durations: []
        });
      }

      const trend = trendMap.get(date)!;
      
      if (backup.status === 'COMPLETED') {
        trend.successful++;
        trend.totalSize += backup.file_size || 0;
        
        if (backup.completed_at) {
          const duration = new Date(backup.completed_at).getTime() - new Date(backup.started_at).getTime();
          trend.durations.push(duration);
        }
      } else if (backup.status === 'FAILED') {
        trend.failed++;
      }
    });

    // Convert to trend array
    const trends: BackupTrend[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const trend = trendMap.get(dateStr) || {
        successful: 0,
        failed: 0,
        totalSize: 0,
        durations: []
      };

      const averageDuration = trend.durations.length > 0 
        ? trend.durations.reduce((sum, d) => sum + d, 0) / trend.durations.length
        : 0;

      trends.push({
        date: new Date(dateStr),
        successful_backups: trend.successful,
        failed_backups: trend.failed,
        total_size: trend.totalSize,
        average_duration: averageDuration
      });
    }

    return trends;
  } catch (error) {
    console.error('Error getting backup trends:', error);
    return [];
  }
}

/**
 * Monitor backup system and create alerts
 */
export async function monitorBackupSystem(): Promise<void> {
  try {
    const healthReport = await performBackupHealthCheck();
    
    // Create alerts for critical issues
    if (healthReport.overall_health === 'CRITICAL') {
      const criticalChecks = healthReport.checks.filter(c => c.status === 'FAIL');
      
      for (const check of criticalChecks) {
        await createBackupAlert(
          'BACKUP_FAILED',
          'CRITICAL',
          `Critical Backup Issue: ${check.name}`,
          check.message,
          undefined,
          { health_check: true, check_details: check }
        );
      }
    }

    // Check for overdue backups
    const stats = await getBackupMonitoringStats();
    if (stats.last_successful_backup) {
      const timeSinceLastBackup = Date.now() - stats.last_successful_backup.getTime();
      const overdueThreshold = 48 * 60 * 60 * 1000; // 48 hours
      
      if (timeSinceLastBackup > overdueThreshold) {
        await createBackupAlert(
          'BACKUP_OVERDUE',
          'HIGH',
          'Backup Overdue',
          `Last successful backup was ${Math.floor(timeSinceLastBackup / (60 * 60 * 1000))} hours ago`,
          undefined,
          { hours_overdue: Math.floor(timeSinceLastBackup / (60 * 60 * 1000)) }
        );
      }
    }

  } catch (error) {
    console.error('Error monitoring backup system:', error);
  }
}

// Helper functions

async function sendCriticalAlertNotification(alert: any): Promise<void> {
  try {
    const config = await getBackupConfiguration();
    
    if (config.notification_settings.on_failure && 
        config.notification_settings.email_recipients.length > 0) {
      
      // In a real implementation, this would send email notifications
      console.log(`Critical backup alert: ${alert.title} - ${alert.description}`);
      
      // Log the notification attempt
      await logSuperuserAudit('BACKUP', {
        action: 'send_critical_alert_notification',
        alert_id: alert.id,
        recipients: config.notification_settings.email_recipients
      });
    }
  } catch (error) {
    console.error('Error sending critical alert notification:', error);
  }
}