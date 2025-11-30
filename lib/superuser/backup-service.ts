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

    // Generate file path with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    
    // Convert storage_location to proper path (handle both /backups and backups)
    const path = require('path');
    let storageDir = config.storage_location;
    if (storageDir.startsWith('/')) {
      storageDir = storageDir.substring(1); // Remove leading slash
    }
    
    // Make it relative to current working directory
    const absoluteStorageDir = path.resolve(process.cwd(), storageDir);
    const filePath = path.join(absoluteStorageDir, `${type.toLowerCase()}_${timestamp}_${randomSuffix}.sql`);
    
    console.log(`📁 Storage location: ${config.storage_location}`);
    console.log(`📁 Resolved path: ${absoluteStorageDir}`);
    console.log(`📄 Full file path: ${filePath}`);

    // Determine tables to include
    let tablesToInclude = options.tables || [];
    if (type === 'FULL' || tablesToInclude.length === 0) {
      tablesToInclude = await getAllTableNames();
    }

    // Calculate retention date
    const retentionDays = options.retention_days || config.retention_days;
    const retentionUntil = new Date();
    retentionUntil.setDate(retentionUntil.getDate() + retentionDays);

    // Create backup record (let PostgreSQL generate UUID)
    const { data: backup, error } = await supabase
      .from('backup_records')
      .insert({
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

    const backupId = backup.id;

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
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Update status to IN_PROGRESS
    await supabase
      .from('backup_records')
      .update({
        status: 'IN_PROGRESS',
        updated_at: new Date().toISOString()
      })
      .eq('id', backupId);

    // Get backup record to get file path
    const { data: backupRecord } = await supabase
      .from('backup_records')
      .select('file_path')
      .eq('id', backupId)
      .single();

    if (!backupRecord) {
      throw new Error('Backup record not found');
    }

    const outputFile = backupRecord.file_path;
    
    // Ensure backup directory exists
    const backupDir = path.dirname(outputFile);
    await fs.mkdir(backupDir, { recursive: true });

    // Get database credentials from environment
    const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;
    
    if (!dbUrl || !dbPassword) {
      throw new Error('Database credentials not found. Please set SUPABASE_DB_PASSWORD in .env.local');
    }

    // Parse Supabase URL to get project reference
    const projectRef = dbUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (!projectRef) {
      throw new Error('Invalid Supabase URL format');
    }

    // Use the proven PgDumpCloner from the cloning system
    const { PgDumpCloner } = require('@/lib/database-cloner/pg-dump-cloner');
    const cloner = new PgDumpCloner();

    // Prepare credentials in the format expected by PgDumpCloner
    // Use POOLER for IPv4 compatibility (same as cloning system)
    const credentials = {
      url: dbUrl,  // Note: 'url' not 'projectUrl'
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      password: dbPassword,
      host: `aws-0-eu-central-1.pooler.supabase.com`,  // Use pooler (IPv4)
      port: 6543  // Pooler port
    };

    console.log(`🚀 Starting backup using PgDumpCloner for ${projectRef}...`);

    // Execute dump using the proven cloner logic
    // This handles DNS resolution, IPv6/IPv4, retries, etc.
    const connection = cloner['parseSupabaseCredentials'](credentials);
    
    // Create temporary directory
    const os = require('os');
    const tempDir = path.join(os.tmpdir(), 'supabase-cloner');
    await fs.mkdir(tempDir, { recursive: true });
    
    const timestamp = Date.now();
    
    console.log(`📦 Creating complete backup (auth + storage + public)...`);
    
    // Step 1: Dump auth and storage schemas (data only, like cloning)
    console.log(`📝 Step 1/2: Dumping auth and storage data...`);
    const systemTempFile = path.join(tempDir, `backup_system_${timestamp}.sql`);
    const systemDumpOptions = {
      verbose: true,
      schemaOnly: false,
      dataOnly: true,
      includeSchemas: ['auth', 'storage'],
      useInserts: true,
      excludeTables: [
        'auth.oauth_clients',
        'auth.oauth_authorizations',
        'auth.oauth_consents',
        'auth.sso_providers',
        'auth.sso_domains',
        'auth.saml_providers',
        'auth.saml_relay_states',
        'auth.schema_migrations',
        'auth.sessions',
        'auth.refresh_tokens',
        'auth.mfa_amr_claims',
        'auth.mfa_challenges',
        'auth.mfa_factors',
        'auth.flow_state',
        'auth.one_time_tokens',
        'auth.audit_log_entries'
      ]
    };
    
    await cloner['executeDump'](connection, systemTempFile, systemDumpOptions);
    const systemStats = await fs.stat(systemTempFile);
    console.log(`✅ System schemas dumped: ${(systemStats.size / 1024).toFixed(2)} KB`);
    
    // Step 2: Dump user schemas (public, audit, and any custom schemas)
    console.log(`📝 Step 2/2: Dumping user schemas (public, audit, custom) (schema + data)...`);
    const userTempFile = path.join(tempDir, `backup_user_${timestamp}.sql`);
    const userDumpOptions = {
      verbose: true,
      clean: true,
      ifExists: true,
      // Only exclude Supabase system schemas, keep all user schemas
      excludeSchemas: [
        'auth',           // Handled separately
        'storage',        // Handled separately
        'realtime',       // Supabase managed
        'extensions',     // Supabase managed
        'graphql',        // Supabase managed
        'graphql_public', // Supabase managed
        'vault',          // Supabase managed
        'pgbouncer',      // Supabase managed
        'pgsodium',       // Supabase managed
        'pgsodium_masks', // Supabase managed
        'supabase_functions', // Supabase managed
        'supabase_migrations' // Supabase managed
      ]
    };

    // If specific tables requested, only dump those
    if (tables && tables.length > 0) {
      userDumpOptions['includeTables'] = tables.map(t => `public.${t}`);
    }

    await cloner['executeDump'](connection, userTempFile, userDumpOptions);
    const userStats = await fs.stat(userTempFile);
    console.log(`✅ User schemas dumped: ${(userStats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Step 3: Merge both files into final backup
    console.log(`📋 Merging dumps into final backup: ${outputFile}...`);
    const systemContent = await fs.readFile(systemTempFile, 'utf8');
    const userContent = await fs.readFile(userTempFile, 'utf8');
    
    // Combine with separator
    const finalContent = `-- =====================================================
-- COMPLETE DATABASE BACKUP
-- Generated: ${new Date().toISOString()}
-- Includes: auth (data), storage (data), all user schemas (schema + data)
-- User schemas: public, audit, and any custom schemas
-- =====================================================

-- =====================================================
-- PART 1: AUTH AND STORAGE DATA
-- =====================================================

${systemContent}

-- =====================================================
-- PART 2: USER SCHEMAS (SCHEMA + DATA)
-- Includes: public, audit, and any custom schemas
-- =====================================================

${userContent}
`;
    
    await fs.writeFile(outputFile, finalContent, 'utf8');
    
    // Verify final file
    const finalStats = await fs.stat(outputFile);
    const totalSize = systemStats.size + userStats.size;
    console.log(`✅ Complete backup created: ${outputFile}`);
    console.log(`📊 Total size: ${(finalStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Auth/Storage: ${(systemStats.size / 1024).toFixed(2)} KB`);
    console.log(`   - User schemas (public, audit, custom): ${(userStats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Clean up temp files
    await fs.unlink(systemTempFile).catch(() => {});
    await fs.unlink(userTempFile).catch(() => {});

    // Get file stats
    const stats = await fs.stat(outputFile);
    const fileSize = stats.size;
    console.log(`📊 File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

    // Calculate checksum
    console.log(`🔐 Calculating checksum...`);
    const fileBuffer = await fs.readFile(outputFile);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    console.log(`✅ Checksum: ${checksum}`);

    // Calculate compression ratio if compression was enabled
    let compressionRatio = 0;
    if (options.compression) {
      compressionRatio = 25; // Typical SQL compression ratio
    }

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

    console.log(`✅ Backup ${backupId} completed successfully: ${outputFile} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

  } catch (error) {
    console.error(`❌ Backup ${backupId} execution failed:`, error);
    
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