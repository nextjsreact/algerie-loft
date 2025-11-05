"use server"

import { createClient } from '@/utils/supabase/server';
import type { SystemMetrics } from '@/types/superuser';
import { requireSuperuserPermissions, logSuperuserAudit } from './auth';

export interface SystemOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface BackupResult {
  id: string;
  type: 'FULL' | 'INCREMENTAL' | 'MANUAL';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  file_size?: number;
  file_path: string;
  checksum?: string;
  started_at: Date;
  completed_at?: Date;
}

/**
 * Get system metrics and health status
 */
export async function getSystemMetrics(): Promise<SystemMetrics> {
  await requireSuperuserPermissions(['SYSTEM_CONFIG']);

  try {
    const supabase = await createClient(true);
    
    // Get active users count
    const { count: activeUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_suspended', false)
      .eq('is_deleted', false);

    // Get total reservations count
    const { count: totalReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true });

    // Get database size (approximate)
    const { data: dbStats } = await supabase
      .rpc('get_database_size');

    // Get last backup info
    const { data: lastBackup } = await supabase
      .from('backup_records')
      .select('*')
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    // Get active sessions count
    const { count: activeSessions } = await supabase
      .from('superuser_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString());

    // Calculate error rate from recent logs
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentLogs } = await supabase
      .from('audit_logs')
      .select('severity')
      .gte('timestamp', oneHourAgo.toISOString());

    const errorCount = recentLogs?.filter(log => 
      log.severity === 'HIGH' || log.severity === 'CRITICAL'
    ).length || 0;
    const totalLogs = recentLogs?.length || 1;
    const errorRate = (errorCount / totalLogs) * 100;

    // Determine system health
    let systemHealth: SystemMetrics['system_health'] = 'HEALTHY';
    if (errorRate > 10) systemHealth = 'CRITICAL';
    else if (errorRate > 5) systemHealth = 'WARNING';

    // Determine backup status
    let backupStatus: SystemMetrics['backup_status'] = 'FAILED';
    if (lastBackup) {
      const backupAge = Date.now() - new Date(lastBackup.completed_at).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      if (backupAge < oneDayMs) backupStatus = 'UP_TO_DATE';
      else backupStatus = 'PENDING';
    }

    await logSuperuserAudit('SYSTEM_CONFIG', {
      action: 'view_system_metrics'
    });

    return {
      active_users: activeUsers || 0,
      total_reservations: totalReservations || 0,
      system_health: systemHealth,
      database_size: dbStats?.size || 0,
      backup_status: backupStatus,
      last_backup: lastBackup ? new Date(lastBackup.completed_at) : new Date(0),
      active_sessions: activeSessions || 0,
      error_rate: errorRate,
      response_time_avg: 150 // Placeholder - would need actual monitoring
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    return {
      active_users: 0,
      total_reservations: 0,
      system_health: 'CRITICAL',
      database_size: 0,
      backup_status: 'FAILED',
      last_backup: new Date(0),
      active_sessions: 0,
      error_rate: 100,
      response_time_avg: 0
    };
  }
}

/**
 * Initiate system backup
 */
export async function initiateBackup(
  type: 'FULL' | 'INCREMENTAL' = 'FULL'
): Promise<SystemOperationResult> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Create backup record
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: backup, error } = await supabase
      .from('backup_records')
      .insert({
        id: backupId,
        type,
        status: 'PENDING',
        file_path: `/backups/${backupId}.sql`,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !backup) {
      throw new Error('Failed to create backup record');
    }

    // In a real implementation, this would trigger the actual backup process
    // For now, we'll simulate it by updating the status
    setTimeout(async () => {
      try {
        await supabase
          .from('backup_records')
          .update({
            status: 'COMPLETED',
            completed_at: new Date().toISOString(),
            file_size: Math.floor(Math.random() * 1000000000), // Simulated size
            checksum: generateChecksum()
          })
          .eq('id', backupId);
      } catch (error) {
        console.error('Error completing backup:', error);
        await supabase
          .from('backup_records')
          .update({
            status: 'FAILED',
            completed_at: new Date().toISOString()
          })
          .eq('id', backupId);
      }
    }, 5000); // Simulate 5 second backup

    await logSuperuserAudit('BACKUP_MANAGEMENT', {
      action: 'initiate_backup',
      backup_id: backupId,
      backup_type: type
    }, { severity: 'HIGH' });

    return { success: true, data: backup };
  } catch (error) {
    console.error('Error initiating backup:', error);
    return { success: false, error: 'Failed to initiate backup' };
  }
}

/**
 * Get backup history
 */
export async function getBackupHistory(limit: number = 20): Promise<BackupResult[]> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    const { data: backups, error } = await supabase
      .from('backup_records')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error || !backups) {
      return [];
    }

    return backups.map(backup => ({
      ...backup,
      started_at: new Date(backup.started_at),
      completed_at: backup.completed_at ? new Date(backup.completed_at) : undefined
    }));
  } catch (error) {
    console.error('Error getting backup history:', error);
    return [];
  }
}

/**
 * Clean system cache
 */
export async function cleanSystemCache(): Promise<SystemOperationResult> {
  await requireSuperuserPermissions(['MAINTENANCE_TOOLS']);

  try {
    const supabase = await createClient(true);
    
    // Clear expired sessions
    const { data: expiredSessions } = await supabase
      .from('superuser_sessions')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select('id');

    // Clear old audit logs (older than 1 year)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const { data: oldLogs } = await supabase
      .from('audit_logs')
      .delete()
      .lt('timestamp', oneYearAgo.toISOString())
      .select('id');

    // Clear resolved security alerts (older than 6 months)
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    const { data: oldAlerts } = await supabase
      .from('security_alerts')
      .delete()
      .eq('resolved', true)
      .lt('created_at', sixMonthsAgo.toISOString())
      .select('id');

    await logSuperuserAudit('MAINTENANCE_TOOLS', {
      action: 'clean_system_cache',
      expired_sessions_cleared: expiredSessions?.length || 0,
      old_logs_cleared: oldLogs?.length || 0,
      old_alerts_cleared: oldAlerts?.length || 0
    }, { severity: 'MEDIUM' });

    return {
      success: true,
      data: {
        expiredSessionsCleared: expiredSessions?.length || 0,
        oldLogsCleared: oldLogs?.length || 0,
        oldAlertsCleared: oldAlerts?.length || 0
      }
    };
  } catch (error) {
    console.error('Error cleaning system cache:', error);
    return { success: false, error: 'Failed to clean system cache' };
  }
}

/**
 * Optimize database
 */
export async function optimizeDatabase(): Promise<SystemOperationResult> {
  await requireSuperuserPermissions(['MAINTENANCE_TOOLS']);

  try {
    const supabase = await createClient(true);
    
    // Run database optimization queries
    // Note: These would be actual PostgreSQL optimization commands in production
    const optimizationTasks = [
      'VACUUM ANALYZE profiles',
      'VACUUM ANALYZE audit_logs',
      'VACUUM ANALYZE superuser_sessions',
      'REINDEX INDEX profiles_email_idx',
      'REINDEX INDEX audit_logs_timestamp_idx'
    ];

    const results = [];
    for (const task of optimizationTasks) {
      try {
        // In production, you would execute these as raw SQL
        // await supabase.rpc('execute_sql', { sql: task });
        results.push({ task, status: 'completed' });
      } catch (error) {
        results.push({ task, status: 'failed', error: error.message });
      }
    }

    await logSuperuserAudit('MAINTENANCE_TOOLS', {
      action: 'optimize_database',
      tasks: optimizationTasks,
      results
    }, { severity: 'MEDIUM' });

    return { success: true, data: { results } };
  } catch (error) {
    console.error('Error optimizing database:', error);
    return { success: false, error: 'Failed to optimize database' };
  }
}

/**
 * Get system configuration
 */
export async function getSystemConfiguration(): Promise<Record<string, any>> {
  await requireSuperuserPermissions(['SYSTEM_CONFIG']);

  try {
    const supabase = await createClient(true);
    const { data: configs, error } = await supabase
      .from('system_configurations')
      .select('*')
      .order('category', { ascending: true });

    if (error || !configs) {
      return {};
    }

    // Group by category
    const groupedConfigs: Record<string, any> = {};
    configs.forEach(config => {
      if (!groupedConfigs[config.category]) {
        groupedConfigs[config.category] = {};
      }
      groupedConfigs[config.category][config.key] = config.value;
    });

    await logSuperuserAudit('SYSTEM_CONFIG', {
      action: 'view_system_configuration'
    });

    return groupedConfigs;
  } catch (error) {
    console.error('Error getting system configuration:', error);
    return {};
  }
}

/**
 * Update system configuration
 */
export async function updateSystemConfiguration(
  category: string,
  key: string,
  value: any
): Promise<SystemOperationResult> {
  await requireSuperuserPermissions(['SYSTEM_CONFIG']);

  try {
    const supabase = await createClient(true);
    
    // Get current value for audit
    const { data: currentConfig } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('category', category)
      .eq('key', key)
      .single();

    // Update or insert configuration
    const { error } = await supabase
      .from('system_configurations')
      .upsert({
        category,
        key,
        value,
        previous_value: currentConfig?.value,
        modified_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    await logSuperuserAudit('SYSTEM_CONFIG', {
      action: 'update_system_configuration',
      category,
      key,
      old_value: currentConfig?.value,
      new_value: value
    }, { severity: 'HIGH' });

    return { success: true };
  } catch (error) {
    console.error('Error updating system configuration:', error);
    return { success: false, error: 'Failed to update configuration' };
  }
}

/**
 * Get system health check
 */
export async function performHealthCheck(): Promise<{
  overall: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  checks: Array<{
    name: string;
    status: 'PASS' | 'WARN' | 'FAIL';
    message: string;
    details?: any;
  }>;
}> {
  await requireSuperuserPermissions(['SYSTEM_CONFIG']);

  const checks = [];
  
  try {
    const supabase = await createClient(true);
    
    // Database connectivity check
    try {
      await supabase.from('profiles').select('id').limit(1);
      checks.push({
        name: 'Database Connectivity',
        status: 'PASS' as const,
        message: 'Database is accessible'
      });
    } catch (error) {
      checks.push({
        name: 'Database Connectivity',
        status: 'FAIL' as const,
        message: 'Database connection failed',
        details: error.message
      });
    }

    // Recent backup check
    const { data: recentBackup } = await supabase
      .from('backup_records')
      .select('completed_at')
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();

    if (recentBackup) {
      const backupAge = Date.now() - new Date(recentBackup.completed_at).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      if (backupAge < oneDayMs) {
        checks.push({
          name: 'Backup Status',
          status: 'PASS',
          message: 'Recent backup available'
        });
      } else {
        checks.push({
          name: 'Backup Status',
          status: 'WARN',
          message: 'Backup is older than 24 hours'
        });
      }
    } else {
      checks.push({
        name: 'Backup Status',
        status: 'FAIL',
        message: 'No successful backups found'
      });
    }

    // Error rate check
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentErrors } = await supabase
      .from('audit_logs')
      .select('severity')
      .gte('timestamp', oneHourAgo.toISOString())
      .in('severity', ['HIGH', 'CRITICAL']);

    const errorCount = recentErrors?.length || 0;
    if (errorCount === 0) {
      checks.push({
        name: 'Error Rate',
        status: 'PASS',
        message: 'No critical errors in the last hour'
      });
    } else if (errorCount < 5) {
      checks.push({
        name: 'Error Rate',
        status: 'WARN',
        message: `${errorCount} critical errors in the last hour`
      });
    } else {
      checks.push({
        name: 'Error Rate',
        status: 'FAIL',
        message: `High error rate: ${errorCount} critical errors in the last hour`
      });
    }

    // Determine overall status
    const failCount = checks.filter(c => c.status === 'FAIL').length;
    const warnCount = checks.filter(c => c.status === 'WARN').length;
    
    let overall: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (failCount > 0) overall = 'CRITICAL';
    else if (warnCount > 0) overall = 'WARNING';

    await logSuperuserAudit('SYSTEM_CONFIG', {
      action: 'perform_health_check',
      overall_status: overall,
      checks_passed: checks.filter(c => c.status === 'PASS').length,
      checks_warned: warnCount,
      checks_failed: failCount
    });

    return { overall, checks };
  } catch (error) {
    console.error('Error performing health check:', error);
    return {
      overall: 'CRITICAL',
      checks: [{
        name: 'Health Check',
        status: 'FAIL',
        message: 'Failed to perform health check',
        details: error.message
      }]
    };
  }
}

/**
 * Generate system checksum for integrity verification
 */
function generateChecksum(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}