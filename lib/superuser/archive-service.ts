"use server"

import { createClient } from '@/utils/supabase/server';
import { requireSuperuserPermissions, logSuperuserAudit } from './auth';
import crypto from 'crypto';

export interface ArchiveRecord {
  id: string;
  archive_type: 'DATA' | 'LOGS' | 'BACKUPS' | 'DOCUMENTS';
  source_table: string;
  archive_policy_id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  initiated_by: string;
  started_at: Date;
  completed_at?: Date;
  records_archived: number;
  archive_size: number;
  archive_path: string;
  compression_ratio?: number;
  search_index_path?: string;
  retention_until?: Date;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ArchivePolicy {
  id: string;
  name: string;
  description: string;
  table_name: string;
  archive_condition: string; // SQL WHERE condition
  retention_days: number;
  compression_enabled: boolean;
  create_search_index: boolean;
  schedule_cron?: string;
  is_active: boolean;
  last_executed?: Date;
  next_execution?: Date;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ArchiveSearchResult {
  id: string;
  archive_id: string;
  table_name: string;
  record_data: Record<string, any>;
  archived_at: Date;
  original_id: string;
}

export interface ArchiveStatistics {
  total_archives: number;
  total_archived_records: number;
  total_archive_size: number;
  archives_by_type: Record<string, number>;
  archives_by_status: Record<string, number>;
  storage_saved_percentage: number;
  oldest_archive: Date;
  newest_archive: Date;
}

/**
 * Create a new archive policy
 */
export async function createArchivePolicy(
  policy: Omit<ArchivePolicy, 'id' | 'created_at' | 'updated_at' | 'last_executed' | 'next_execution'>
): Promise<{ success: boolean; policy_id?: string; error?: string }> {
  await requireSuperuserPermissions(['ARCHIVE_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Validate the archive condition (basic SQL validation)
    if (!isValidArchiveCondition(policy.archive_condition)) {
      return { 
        success: false, 
        error: 'Invalid archive condition. Must be a valid SQL WHERE clause.' 
      };
    }

    // Calculate next execution if schedule is provided
    let nextExecution: Date | undefined;
    if (policy.schedule_cron) {
      nextExecution = calculateNextExecution(policy.schedule_cron);
    }

    const policyId = `policy_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    const { data: newPolicy, error } = await supabase
      .from('archive_policies')
      .insert({
        id: policyId,
        ...policy,
        next_execution: nextExecution?.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !newPolicy) {
      throw new Error(`Failed to create archive policy: ${error?.message}`);
    }

    await logSuperuserAudit('ARCHIVE_MANAGEMENT', {
      action: 'create_archive_policy',
      policy_id: policyId,
      table_name: policy.table_name,
      policy_name: policy.name
    }, { severity: 'HIGH' });

    return { success: true, policy_id: policyId };
  } catch (error) {
    console.error('Error creating archive policy:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute archive policy
 */
export async function executeArchivePolicy(
  policyId: string,
  dryRun: boolean = false
): Promise<{ 
  success: boolean; 
  archive_id?: string; 
  records_to_archive?: number;
  error?: string 
}> {
  await requireSuperuserPermissions(['ARCHIVE_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Get archive policy
    const { data: policy, error: policyError } = await supabase
      .from('archive_policies')
      .select('*')
      .eq('id', policyId)
      .single();

    if (policyError || !policy) {
      return { success: false, error: 'Archive policy not found' };
    }

    if (!policy.is_active) {
      return { success: false, error: 'Archive policy is not active' };
    }

    // Count records that match the archive condition
    const recordsQuery = `
      SELECT COUNT(*) as count 
      FROM ${policy.table_name} 
      WHERE ${policy.archive_condition}
    `;

    // In a real implementation, you would execute this query safely
    // For demonstration, we'll simulate the count
    const recordsToArchive = Math.floor(Math.random() * 10000) + 100;

    if (dryRun) {
      return { 
        success: true, 
        records_to_archive: recordsToArchive 
      };
    }

    // Create archive record
    const archiveId = `archive_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const archivePath = `/archives/${policy.table_name}/${archiveId}`;

    const { data: archive, error: archiveError } = await supabase
      .from('archive_records')
      .insert({
        id: archiveId,
        archive_type: determineArchiveType(policy.table_name),
        source_table: policy.table_name,
        archive_policy_id: policyId,
        status: 'PENDING',
        archive_path: archivePath,
        metadata: {
          policy_name: policy.name,
          archive_condition: policy.archive_condition,
          compression_enabled: policy.compression_enabled,
          create_search_index: policy.create_search_index
        }
      })
      .select()
      .single();

    if (archiveError || !archive) {
      throw new Error(`Failed to create archive record: ${archiveError?.message}`);
    }

    // Execute archiving process asynchronously
    executeArchiving(archiveId, policy, recordsToArchive).catch(error => {
      console.error(`Archive ${archiveId} failed:`, error);
    });

    // Update policy last execution
    await supabase
      .from('archive_policies')
      .update({
        last_executed: new Date().toISOString(),
        next_execution: policy.schedule_cron ? 
          calculateNextExecution(policy.schedule_cron)?.toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', policyId);

    await logSuperuserAudit('ARCHIVE_MANAGEMENT', {
      action: 'execute_archive_policy',
      policy_id: policyId,
      archive_id: archiveId,
      table_name: policy.table_name,
      estimated_records: recordsToArchive
    }, { severity: 'HIGH' });

    return { success: true, archive_id: archiveId };
  } catch (error) {
    console.error('Error executing archive policy:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get archive policies with filtering
 */
export async function getArchivePolicies(
  filters: {
    is_active?: boolean;
    table_name?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ policies: ArchivePolicy[]; total_count: number }> {
  await requireSuperuserPermissions(['ARCHIVE_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    let query = supabase
      .from('archive_policies')
      .select('*', { count: 'exact' });

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters.table_name) {
      query = query.eq('table_name', filters.table_name);
    }

    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: policies, error, count } = await query;

    if (error) {
      throw error;
    }

    const formattedPolicies: ArchivePolicy[] = (policies || []).map(policy => ({
      ...policy,
      last_executed: policy.last_executed ? new Date(policy.last_executed) : undefined,
      next_execution: policy.next_execution ? new Date(policy.next_execution) : undefined,
      created_at: new Date(policy.created_at),
      updated_at: new Date(policy.updated_at)
    }));

    return { policies: formattedPolicies, total_count: count || 0 };
  } catch (error) {
    console.error('Error getting archive policies:', error);
    return { policies: [], total_count: 0 };
  }
}

/**
 * Get archive history
 */
export async function getArchiveHistory(
  filters: {
    status?: string[];
    type?: string[];
    table_name?: string;
    date_from?: Date;
    date_to?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ archives: ArchiveRecord[]; total_count: number }> {
  await requireSuperuserPermissions(['ARCHIVE_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    let query = supabase
      .from('archive_records')
      .select('*', { count: 'exact' });

    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.type?.length) {
      query = query.in('archive_type', filters.type);
    }
    if (filters.table_name) {
      query = query.eq('source_table', filters.table_name);
    }
    if (filters.date_from) {
      query = query.gte('started_at', filters.date_from.toISOString());
    }
    if (filters.date_to) {
      query = query.lte('started_at', filters.date_to.toISOString());
    }

    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    query = query
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: archives, error, count } = await query;

    if (error) {
      throw error;
    }

    const formattedArchives: ArchiveRecord[] = (archives || []).map(archive => ({
      ...archive,
      started_at: new Date(archive.started_at),
      completed_at: archive.completed_at ? new Date(archive.completed_at) : undefined,
      retention_until: archive.retention_until ? new Date(archive.retention_until) : undefined,
      created_at: new Date(archive.created_at),
      updated_at: new Date(archive.updated_at)
    }));

    return { archives: formattedArchives, total_count: count || 0 };
  } catch (error) {
    console.error('Error getting archive history:', error);
    return { archives: [], total_count: 0 };
  }
}

/**
 * Search archived data
 */
export async function searchArchivedData(
  searchParams: {
    table_name?: string;
    archive_id?: string;
    search_query?: string;
    date_from?: Date;
    date_to?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<{ results: ArchiveSearchResult[]; total_count: number }> {
  await requireSuperuserPermissions(['ARCHIVE_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // In a real implementation, this would search through archived data
    // using the search indexes created during archiving
    // For demonstration, we'll return mock results
    
    const mockResults: ArchiveSearchResult[] = [];
    const totalCount = Math.floor(Math.random() * 1000);

    for (let i = 0; i < Math.min(searchParams.limit || 10, 10); i++) {
      mockResults.push({
        id: `search_result_${i}`,
        archive_id: `archive_${Date.now()}_${i}`,
        table_name: searchParams.table_name || 'reservations',
        record_data: {
          id: `record_${i}`,
          created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          status: 'archived',
          // Additional mock data based on table
        },
        archived_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        original_id: `original_${i}`
      });
    }

    await logSuperuserAudit('ARCHIVE_MANAGEMENT', {
      action: 'search_archived_data',
      search_params: searchParams,
      results_count: mockResults.length
    });

    return { results: mockResults, total_count: totalCount };
  } catch (error) {
    console.error('Error searching archived data:', error);
    return { results: [], total_count: 0 };
  }
}

/**
 * Restore archived data
 */
export async function restoreArchivedData(
  archiveId: string,
  recordIds?: string[]
): Promise<{ 
  success: boolean; 
  restored_count?: number; 
  restore_id?: string;
  error?: string 
}> {
  await requireSuperuserPermissions(['ARCHIVE_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Get archive record
    const { data: archive, error: archiveError } = await supabase
      .from('archive_records')
      .select('*')
      .eq('id', archiveId)
      .single();

    if (archiveError || !archive) {
      return { success: false, error: 'Archive not found' };
    }

    if (archive.status !== 'COMPLETED') {
      return { success: false, error: 'Archive is not in completed state' };
    }

    // In a real implementation, this would:
    // 1. Read the archived data from storage
    // 2. Validate the data integrity
    // 3. Restore the data to the original table
    // 4. Update the archive record with restoration info

    const restoreId = `restore_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const restoredCount = recordIds?.length || Math.floor(Math.random() * 100) + 1;

    // Simulate restoration process
    await new Promise(resolve => setTimeout(resolve, 2000));

    await logSuperuserAudit('ARCHIVE_MANAGEMENT', {
      action: 'restore_archived_data',
      archive_id: archiveId,
      restore_id: restoreId,
      restored_count: restoredCount,
      specific_records: recordIds?.length ? true : false
    }, { severity: 'HIGH' });

    return { 
      success: true, 
      restored_count: restoredCount,
      restore_id: restoreId
    };
  } catch (error) {
    console.error('Error restoring archived data:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get archive statistics
 */
export async function getArchiveStatistics(): Promise<ArchiveStatistics> {
  await requireSuperuserPermissions(['ARCHIVE_MANAGEMENT']);

  try {
    const supabase = await createClient(true);
    
    // Get total archives count
    const { count: totalArchives } = await supabase
      .from('archive_records')
      .select('*', { count: 'exact', head: true });

    // Get archives by type
    const { data: archivesByType } = await supabase
      .from('archive_records')
      .select('archive_type')
      .eq('status', 'COMPLETED');

    // Get archives by status
    const { data: archivesByStatus } = await supabase
      .from('archive_records')
      .select('status');

    // Get total archived records and size
    const { data: archiveStats } = await supabase
      .from('archive_records')
      .select('records_archived, archive_size, started_at')
      .eq('status', 'COMPLETED');

    const totalArchivedRecords = archiveStats?.reduce((sum, archive) => 
      sum + (archive.records_archived || 0), 0) || 0;
    
    const totalArchiveSize = archiveStats?.reduce((sum, archive) => 
      sum + (archive.archive_size || 0), 0) || 0;

    // Group by type
    const typeGroups = (archivesByType || []).reduce((acc, archive) => {
      acc[archive.archive_type] = (acc[archive.archive_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by status
    const statusGroups = (archivesByStatus || []).reduce((acc, archive) => {
      acc[archive.status] = (acc[archive.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate dates
    const dates = archiveStats?.map(a => new Date(a.started_at)) || [];
    const oldestArchive = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
    const newestArchive = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

    // Estimate storage saved (mock calculation)
    const storageSavedPercentage = totalArchiveSize > 0 ? Math.random() * 30 + 20 : 0;

    return {
      total_archives: totalArchives || 0,
      total_archived_records: totalArchivedRecords,
      total_archive_size: totalArchiveSize,
      archives_by_type: typeGroups,
      archives_by_status: statusGroups,
      storage_saved_percentage: storageSavedPercentage,
      oldest_archive: oldestArchive,
      newest_archive: newestArchive
    };
  } catch (error) {
    console.error('Error getting archive statistics:', error);
    return {
      total_archives: 0,
      total_archived_records: 0,
      total_archive_size: 0,
      archives_by_type: {},
      archives_by_status: {},
      storage_saved_percentage: 0,
      oldest_archive: new Date(),
      newest_archive: new Date()
    };
  }
}

// Helper functions

function isValidArchiveCondition(condition: string): boolean {
  // Basic validation for SQL WHERE clause
  // In production, this would be more sophisticated
  const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER'];
  const upperCondition = condition.toUpperCase();
  
  return !dangerousKeywords.some(keyword => upperCondition.includes(keyword));
}

function determineArchiveType(tableName: string): 'DATA' | 'LOGS' | 'BACKUPS' | 'DOCUMENTS' {
  if (tableName.includes('log') || tableName.includes('audit')) return 'LOGS';
  if (tableName.includes('backup')) return 'BACKUPS';
  if (tableName.includes('document') || tableName.includes('file')) return 'DOCUMENTS';
  return 'DATA';
}

function calculateNextExecution(cronExpression: string): Date | undefined {
  // Simple cron calculation - in production, use a proper cron library
  // For demonstration, just add 24 hours
  const nextExecution = new Date();
  nextExecution.setDate(nextExecution.getDate() + 1);
  return nextExecution;
}

async function executeArchiving(
  archiveId: string,
  policy: ArchivePolicy,
  recordCount: number
): Promise<void> {
  const supabase = await createClient(true);
  
  try {
    // Update status to IN_PROGRESS
    await supabase
      .from('archive_records')
      .update({
        status: 'IN_PROGRESS',
        updated_at: new Date().toISOString()
      })
      .eq('id', archiveId);

    // Simulate archiving process
    await new Promise(resolve => setTimeout(resolve, 15000)); // 15 second simulation

    // Calculate archive size and compression
    const archiveSize = recordCount * (Math.random() * 1000 + 500); // 500-1500 bytes per record
    const compressionRatio = policy.compression_enabled ? Math.random() * 40 + 30 : 0; // 30-70% compression

    // Create search index path if enabled
    const searchIndexPath = policy.create_search_index ? 
      `/archives/indexes/${policy.table_name}/${archiveId}.idx` : undefined;

    // Calculate retention date
    const retentionUntil = new Date();
    retentionUntil.setDate(retentionUntil.getDate() + policy.retention_days);

    // Update archive record as completed
    await supabase
      .from('archive_records')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        records_archived: recordCount,
        archive_size: Math.floor(archiveSize),
        compression_ratio: compressionRatio,
        search_index_path: searchIndexPath,
        retention_until: retentionUntil.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', archiveId);

  } catch (error) {
    console.error(`Archive ${archiveId} execution failed:`, error);
    
    // Update archive record as failed
    await supabase
      .from('archive_records')
      .update({
        status: 'FAILED',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', archiveId);
  }
}