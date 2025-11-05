"use server"

import { createClient } from '@/utils/supabase/server';
import { requireSuperuserPermissions, logSuperuserAudit } from './auth';
import crypto from 'crypto';

export interface BackupRecord {
  id: string;
  backup_type: 'FULL' | 'INCREMENTAL' | 'MANUAL' | 'SCHEDULED';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  initiated_by: string;
  started_at: Date;
  completed_at?: Date;
  file_size?: number;
  file_path: string;
  checksum?: string;
  compression_ratio?: number;
  tables_included: string[];
  error_message?: string;
  retention_until?: Date;
  is_encrypted: boolean;
  encryption_key_id?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface BackupProgress {
  backup_id: string;
  progress_percentage: number;
  current_table?: string;
  tables_completed: number;
  total_tables: number;
  estimated_completion?: Date;
  bytes_processed: number;
  total_estimated_bytes: number;
}

export interface BackupConfiguration {
  retention_days: number;
  compression_enabled: boolean;
  encryption_enabled: boolean;
  max_concurrent_backups: number;
  backup_schedule: {
    full_backup_cron: string;
    incremental_backup_cron: string;
  };
  storage_location: string;
  notification_settings: {
    on_success: boolean;
    on_failure: boolean;
    email_recipients: string[];
  };
}

/**
 * Create a new backup
 */
export async function createBackup(
  type: 'FULL' | 'INCREMENTAL' | 'MANUAL' = 'MANUAL',
  options: {
    tables?: string[];
    compression?: boolean;
    encryption?: boolean;
    retention_days?: number;
  } = {}
): Promise<{ success: boolean; backup_id?: string; error?: string }> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Check for concurrent backups
    const { count: activeBackups } = await supabase
      .from('backup_records')
      .select('*', { count: 'exact', head: true })
      .in('status', ['PENDING', 'IN_PROGRESS']);

    const config = await getBackupConfiguration();
    if ((activeBackups || 0) >= config.max_concurrent_backups) {
      return { 
        success: false, 
        error: `Maximum concurrent backups (${config.max_concurrent_backups}) reached` 
      };
    }

    // Generate backup ID and file path
    const backupId = `backup_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = `${config.storage_location}/${type.toLowerCase()}_${timestamp}_${backupId}.sql`;

    // Determine tables to include
    let tablesToInclude = options.tables || [];
    if (type === 'FULL' || tablesToInclude.length === 0) {
      tablesToInclude = await getAllTableNames();
    }

    // Calculate retention date
    const retentionDays = options.retention_days || config.retention_days;
    const retentionUntil = new Date();
    retentionUntil.setDate(retentionUntil.getDate() + retentionDays);

    // Create backup record
    const { data: backup, error } = await supabase
      .from('backup_records')
      .insert({
        id: backupId,
        backup_type: type,
        status: 'PENDING',
        file_path: filePath,
        tables_included: tablesToInclude,
        retention_until: retentionUntil.toISOString(),
        is_encrypted: options.encryption ?? config.encryption_enabled,
        encryption_key_id: options.encryption ? generateEncryptionKeyId() : null,
        metadata: {
          compression_enabled: options.compression ?? config.compression_enabled,
          requested_by: 'superuser',
          backup_options: options
        }
      })
      .select()
      .single();

    if (error || !backup) {
      throw new Error(`Failed to create backup record: ${error?.message}`);
    }

    // Start backup process asynchronously
    executeBackup(backupId, tablesToInclude, {
      compression: options.compression ?? config.compression_enabled,
      encryption: options.encryption ?? config.encryption_enabled,
      encryption_key_id: backup.encryption_key_id
    }).catch(error => {
      console.error(`Backup ${backupId} failed:`, error);
    });

    await logSuperuserAudit('BACKUP', {
      action: 'create_backup',
      backup_id: backupId,
      backup_type: type,
      tables_count: tablesToInclude.length,
      options
    }, { severity: 'HIGH' });

    return { success: true, backup_id: backupId };
  } catch (error) {
    console.error('Error creating backup:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get backup history with filtering and pagination
 */
export async function getBackupHistory(
  filters: {
    status?: string[];
    type?: string[];
    date_from?: Date;
    date_to?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ backups: BackupRecord[]; total_count: number }> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    let query = supabase
      .from('backup_records')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.type?.length) {
      query = query.in('backup_type', filters.type);
    }
    if (filters.date_from) {
      query = query.gte('started_at', filters.date_from.toISOString());
    }
    if (filters.date_to) {
      query = query.lte('started_at', filters.date_to.toISOString());
    }

    // Apply pagination
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: backups, error, count } = await query;

    if (error) {
      throw error;
    }

    const formattedBackups: BackupRecord[] = (backups || []).map(backup => ({
      ...backup,
      started_at: new Date(backup.started_at),
      completed_at: backup.completed_at ? new Date(backup.completed_at) : undefined,
      retention_until: backup.retention_until ? new Date(backup.retention_until) : undefined,
      created_at: new Date(backup.created_at),
      updated_at: new Date(backup.updated_at)
    }));

    return { backups: formattedBackups, total_count: count || 0 };
  } catch (error) {
    console.error('Error getting backup history:', error);
    return { backups: [], total_count: 0 };
  }
}

/**
 * Get backup progress for active backups
 */
export async function getBackupProgress(backupId: string): Promise<BackupProgress | null> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Get backup record
    const { data: backup, error } = await supabase
      .from('backup_records')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error || !backup) {
      return null;
    }

    // For demonstration, calculate progress based on time elapsed
    // In a real implementation, this would track actual backup progress
    const startTime = new Date(backup.started_at).getTime();
    const currentTime = Date.now();
    const elapsedMinutes = (currentTime - startTime) / (1000 * 60);
    
    let progressPercentage = 0;
    let estimatedCompletion: Date | undefined;

    if (backup.status === 'IN_PROGRESS') {
      // Estimate progress based on backup type and elapsed time
      const estimatedDuration = backup.backup_type === 'FULL' ? 30 : 10; // minutes
      progressPercentage = Math.min(95, (elapsedMinutes / estimatedDuration) * 100);
      
      if (progressPercentage < 95) {
        const remainingMinutes = estimatedDuration - elapsedMinutes;
        estimatedCompletion = new Date(currentTime + remainingMinutes * 60 * 1000);
      }
    } else if (backup.status === 'COMPLETED') {
      progressPercentage = 100;
    }

    const tablesIncluded = backup.tables_included || [];
    const tablesCompleted = Math.floor((progressPercentage / 100) * tablesIncluded.length);

    return {
      backup_id: backupId,
      progress_percentage: progressPercentage,
      current_table: tablesCompleted < tablesIncluded.length ? tablesIncluded[tablesCompleted] : undefined,
      tables_completed: tablesCompleted,
      total_tables: tablesIncluded.length,
      estimated_completion: estimatedCompletion,
      bytes_processed: Math.floor((progressPercentage / 100) * (backup.file_size || 1000000)),
      total_estimated_bytes: backup.file_size || 1000000
    };
  } catch (error) {
    console.error('Error getting backup progress:', error);
    return null;
  }
}

/**
 * Cancel an active backup
 */
export async function cancelBackup(backupId: string): Promise<{ success: boolean; error?: string }> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    const { data: backup, error } = await supabase
      .from('backup_records')
      .update({
        status: 'CANCELLED',
        completed_at: new Date().toISOString(),
        error_message: 'Backup cancelled by user',
        updated_at: new Date().toISOString()
      })
      .eq('id', backupId)
      .in('status', ['PENDING', 'IN_PROGRESS'])
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!backup) {
      return { success: false, error: 'Backup not found or cannot be cancelled' };
    }

    await logSuperuserAudit('BACKUP', {
      action: 'cancel_backup',
      backup_id: backupId
    }, { severity: 'MEDIUM' });

    return { success: true };
  } catch (error) {
    console.error('Error cancelling backup:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify backup integrity
 */
export async function verifyBackup(backupId: string): Promise<{
  success: boolean;
  is_valid: boolean;
  checksum_match: boolean;
  file_exists: boolean;
  error?: string;
}> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    const { data: backup, error } = await supabase
      .from('backup_records')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error || !backup) {
      return {
        success: false,
        is_valid: false,
        checksum_match: false,
        file_exists: false,
        error: 'Backup record not found'
      };
    }

    // In a real implementation, this would:
    // 1. Check if the backup file exists in storage
    // 2. Verify the file checksum
    // 3. Validate the backup file structure
    
    // For demonstration, simulate verification
    const fileExists = backup.status === 'COMPLETED';
    const checksumMatch = backup.checksum !== null;
    const isValid = fileExists && checksumMatch;

    await logSuperuserAudit('BACKUP', {
      action: 'verify_backup',
      backup_id: backupId,
      verification_result: {
        is_valid: isValid,
        checksum_match: checksumMatch,
        file_exists: fileExists
      }
    });

    return {
      success: true,
      is_valid: isValid,
      checksum_match: checksumMatch,
      file_exists: fileExists
    };
  } catch (error) {
    console.error('Error verifying backup:', error);
    return {
      success: false,
      is_valid: false,
      checksum_match: false,
      file_exists: false,
      error: error.message
    };
  }
}

/**
 * Delete old backups based on retention policy
 */
export async function cleanupExpiredBackups(): Promise<{
  success: boolean;
  deleted_count: number;
  error?: string;
}> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    const { data: expiredBackups, error } = await supabase
      .from('backup_records')
      .delete()
      .lt('retention_until', new Date().toISOString())
      .select('id, file_path');

    if (error) {
      throw error;
    }

    const deletedCount = expiredBackups?.length || 0;

    // In a real implementation, also delete the actual backup files from storage
    // for (const backup of expiredBackups || []) {
    //   await deleteBackupFile(backup.file_path);
    // }

    await logSuperuserAudit('BACKUP', {
      action: 'cleanup_expired_backups',
      deleted_count: deletedCount,
      deleted_backup_ids: expiredBackups?.map(b => b.id) || []
    }, { severity: 'MEDIUM' });

    return { success: true, deleted_count: deletedCount };
  } catch (error) {
    console.error('Error cleaning up expired backups:', error);
    return { success: false, deleted_count: 0, error: error.message };
  }
}

/**
 * Get backup configuration
 */
export async function getBackupConfiguration(): Promise<BackupConfiguration> {
  try {
    const supabase = await createClient(true);
    
    const { data: configs } = await supabase
      .from('system_configurations')
      .select('config_key, config_value')
      .eq('category', 'backup');

    const configMap = new Map(
      (configs || []).map(c => [c.config_key, c.config_value])
    );

    return {
      retention_days: configMap.get('retention_days') || 30,
      compression_enabled: configMap.get('compression_enabled') || true,
      encryption_enabled: configMap.get('encryption_enabled') || true,
      max_concurrent_backups: configMap.get('max_concurrent_backups') || 2,
      backup_schedule: configMap.get('backup_schedule') || {
        full_backup_cron: '0 2 * * 0', // Weekly on Sunday at 2 AM
        incremental_backup_cron: '0 2 * * 1-6' // Daily at 2 AM except Sunday
      },
      storage_location: configMap.get('storage_location') || '/backups',
      notification_settings: configMap.get('notification_settings') || {
        on_success: true,
        on_failure: true,
        email_recipients: []
      }
    };
  } catch (error) {
    console.error('Error getting backup configuration:', error);
    // Return default configuration
    return {
      retention_days: 30,
      compression_enabled: true,
      encryption_enabled: true,
      max_concurrent_backups: 2,
      backup_schedule: {
        full_backup_cron: '0 2 * * 0',
        incremental_backup_cron: '0 2 * * 1-6'
      },
      storage_location: '/backups',
      notification_settings: {
        on_success: true,
        on_failure: true,
        email_recipients: []
      }
    };
  }
}

/**
 * Update backup configuration
 */
export async function updateBackupConfiguration(
  config: Partial<BackupConfiguration>
): Promise<{ success: boolean; error?: string }> {
  await requireSuperuserPermissions(['BACKUP_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    const updates = [];
    for (const [key, value] of Object.entries(config)) {
      updates.push({
        category: 'backup',
        config_key: key,
        config_value: value,
        modified_at: new Date().toISOString()
      });
    }

    const { error } = await supabase
      .from('system_configurations')
      .upsert(updates);

    if (error) {
      throw error;
    }

    await logSuperuserAudit('BACKUP', {
      action: 'update_backup_configuration',
      updated_settings: Object.keys(config)
    }, { severity: 'HIGH' });

    return { success: true };
  } catch (error) {
    console.error('Error updating backup configuration:', error);
    return { success: false, error: error.message };
  }
}

// Helper functions

async function getAllTableNames(): Promise<string[]> {
  // In a real implementation, this would query the database schema
  // to get all table names that should be included in backups
  return [
    'profiles',
    'lofts',
    'reservations',
    'transactions',
    'audit_logs',
    'superuser_profiles',
    'backup_records',
    'system_configurations',
    'notifications',
    'conversations'
  ];
}

function generateEncryptionKeyId(): string {
  return `key_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

async function executeBackup(
  backupId: string,
  tables: string[],
  options: {
    compression: boolean;
    encryption: boolean;
    encryption_key_id?: string;
  }
): Promise<void> {
  const supabase = await createClient(true);
  
  try {
    // Update status to IN_PROGRESS
    await supabase
      .from('backup_records')
      .update({
        status: 'IN_PROGRESS',
        updated_at: new Date().toISOString()
      })
      .eq('id', backupId);

    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second simulation

    // Generate checksum and file size
    const checksum = crypto.randomBytes(32).toString('hex');
    const fileSize = Math.floor(Math.random() * 1000000000) + 100000000; // 100MB - 1GB
    const compressionRatio = options.compression ? Math.random() * 30 + 20 : 0; // 20-50% compression

    // Update backup record as completed
    await supabase
      .from('backup_records')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        file_size: fileSize,
        checksum: checksum,
        compression_ratio: compressionRatio,
        updated_at: new Date().toISOString()
      })
      .eq('id', backupId);

  } catch (error) {
    console.error(`Backup ${backupId} execution failed:`, error);
    
    // Update backup record as failed
    await supabase
      .from('backup_records')
      .update({
        status: 'FAILED',
        completed_at: new Date().toISOString(),
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', backupId);
  }
}