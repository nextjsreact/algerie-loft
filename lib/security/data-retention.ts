/**
 * Data Retention and Deletion Policies
 * Implements automated data lifecycle management and deletion policies
 */

import { logger } from '@/lib/logger';
import { DataCategory, RETENTION_PERIODS } from './gdpr-compliance';

export interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  dataCategory: DataCategory;
  retentionPeriodDays: number;
  deletionMethod: 'hard_delete' | 'soft_delete' | 'anonymize' | 'archive';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeletionJob {
  id: string;
  policyId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  scheduledFor: Date;
  startedAt?: Date;
  completedAt?: Date;
  recordsProcessed: number;
  recordsDeleted: number;
  errors?: string[];
}

export interface DataLifecycleEvent {
  id: string;
  userId?: string;
  dataType: string;
  action: 'created' | 'updated' | 'accessed' | 'deleted' | 'anonymized' | 'archived';
  timestamp: Date;
  retentionUntil: Date;
  metadata?: any;
}

/**
 * Data Retention Policy Manager
 */
export class RetentionPolicyManager {
  /**
   * Create a new retention policy
   */
  static async createPolicy(policy: Omit<RetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data } = await supabase
        .from('data_retention_policies')
        .insert({
          name: policy.name,
          description: policy.description,
          data_category: policy.dataCategory,
          retention_period_days: policy.retentionPeriodDays,
          deletion_method: policy.deletionMethod,
          is_active: policy.isActive,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      logger.info('Retention policy created', { policyId: data.id, name: policy.name });
      return data.id;
    } catch (error) {
      logger.error('Failed to create retention policy', error);
      throw new Error('Failed to create retention policy');
    }
  }

  /**
   * Get all active retention policies
   */
  static async getActivePolicies(): Promise<RetentionPolicy[]> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data } = await supabase
        .from('data_retention_policies')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      return data?.map(policy => ({
        id: policy.id,
        name: policy.name,
        description: policy.description,
        dataCategory: policy.data_category,
        retentionPeriodDays: policy.retention_period_days,
        deletionMethod: policy.deletion_method,
        isActive: policy.is_active,
        createdAt: new Date(policy.created_at),
        updatedAt: new Date(policy.updated_at)
      })) || [];
    } catch (error) {
      logger.error('Failed to get retention policies', error);
      return [];
    }
  }

  /**
   * Update retention policy
   */
  static async updatePolicy(policyId: string, updates: Partial<RetentionPolicy>): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      await supabase
        .from('data_retention_policies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', policyId);

      logger.info('Retention policy updated', { policyId });
    } catch (error) {
      logger.error('Failed to update retention policy', error);
      throw new Error('Failed to update retention policy');
    }
  }
}

/**
 * Automated Data Deletion Service
 */
export class DataDeletionService {
  /**
   * Schedule deletion jobs for expired data
   */
  static async scheduleDeletionJobs(): Promise<DeletionJob[]> {
    try {
      const policies = await RetentionPolicyManager.getActivePolicies();
      const jobs: DeletionJob[] = [];

      for (const policy of policies) {
        const expiredData = await this.findExpiredData(policy);
        
        if (expiredData.length > 0) {
          const job = await this.createDeletionJob(policy.id, expiredData.length);
          jobs.push(job);
        }
      }

      logger.info('Deletion jobs scheduled', { jobCount: jobs.length });
      return jobs;
    } catch (error) {
      logger.error('Failed to schedule deletion jobs', error);
      throw new Error('Failed to schedule deletion jobs');
    }
  }

  /**
   * Find expired data based on retention policy
   */
  private static async findExpiredData(policy: RetentionPolicy): Promise<any[]> {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

    let query;
    
    switch (policy.dataCategory) {
      case DataCategory.PERSONAL_IDENTITY:
        query = supabase
          .from('profiles')
          .select('id, created_at')
          .lt('created_at', cutoffDate.toISOString());
        break;
        
      case DataCategory.BEHAVIORAL_DATA:
        query = supabase
          .from('reservation_audit_log')
          .select('id, created_at')
          .lt('created_at', cutoffDate.toISOString());
        break;
        
      case DataCategory.TECHNICAL_DATA:
        query = supabase
          .from('security_events')
          .select('id, created_at')
          .lt('created_at', cutoffDate.toISOString());
        break;
        
      default:
        return [];
    }

    const { data } = await query;
    return data || [];
  }

  /**
   * Create a deletion job
   */
  private static async createDeletionJob(policyId: string, recordCount: number): Promise<DeletionJob> {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + 1); // Schedule for 1 hour from now

    const { data } = await supabase
      .from('data_deletion_jobs')
      .insert({
        policy_id: policyId,
        status: 'pending',
        scheduled_for: scheduledFor.toISOString(),
        records_processed: 0,
        records_deleted: 0
      })
      .select('*')
      .single();

    return {
      id: data.id,
      policyId: data.policy_id,
      status: data.status,
      scheduledFor: new Date(data.scheduled_for),
      recordsProcessed: data.records_processed,
      recordsDeleted: data.records_deleted
    };
  }

  /**
   * Execute deletion job
   */
  static async executeDeletionJob(jobId: string): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      // Update job status to running
      await supabase
        .from('data_deletion_jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', jobId);

      // Get job details
      const { data: job } = await supabase
        .from('data_deletion_jobs')
        .select('*, data_retention_policies(*)')
        .eq('id', jobId)
        .single();

      if (!job) {
        throw new Error('Deletion job not found');
      }

      const policy = job.data_retention_policies;
      let recordsDeleted = 0;

      // Execute deletion based on policy
      switch (policy.deletion_method) {
        case 'hard_delete':
          recordsDeleted = await this.hardDeleteData(policy);
          break;
        case 'soft_delete':
          recordsDeleted = await this.softDeleteData(policy);
          break;
        case 'anonymize':
          recordsDeleted = await this.anonymizeData(policy);
          break;
        case 'archive':
          recordsDeleted = await this.archiveData(policy);
          break;
      }

      // Update job completion
      await supabase
        .from('data_deletion_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          records_deleted: recordsDeleted
        })
        .eq('id', jobId);

      logger.info('Deletion job completed', { jobId, recordsDeleted });
    } catch (error) {
      logger.error('Deletion job failed', { jobId, error });
      
      // Update job status to failed
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();
      
      await supabase
        .from('data_deletion_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          errors: [error instanceof Error ? error.message : 'Unknown error']
        })
        .eq('id', jobId);
    }
  }

  /**
   * Hard delete data (permanent removal)
   */
  private static async hardDeleteData(policy: RetentionPolicy): Promise<number> {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

    let deletedCount = 0;

    switch (policy.dataCategory) {
      case DataCategory.BEHAVIORAL_DATA:
        const { count } = await supabase
          .from('reservation_audit_log')
          .delete()
          .lt('created_at', cutoffDate.toISOString());
        deletedCount = count || 0;
        break;
        
      case DataCategory.TECHNICAL_DATA:
        const { count: techCount } = await supabase
          .from('security_events')
          .delete()
          .lt('created_at', cutoffDate.toISOString());
        deletedCount = techCount || 0;
        break;
    }

    return deletedCount;
  }

  /**
   * Soft delete data (mark as deleted)
   */
  private static async softDeleteData(policy: RetentionPolicy): Promise<number> {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

    // This would depend on having a 'deleted_at' column in relevant tables
    const { count } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .lt('created_at', cutoffDate.toISOString())
      .is('deleted_at', null);

    return count || 0;
  }

  /**
   * Anonymize data (replace with anonymous values)
   */
  private static async anonymizeData(policy: RetentionPolicy): Promise<number> {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

    let anonymizedCount = 0;

    if (policy.dataCategory === DataCategory.PERSONAL_IDENTITY) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .lt('created_at', cutoffDate.toISOString())
        .not('full_name', 'like', 'ANONYMIZED_%');

      if (profiles) {
        for (const profile of profiles) {
          await supabase
            .from('profiles')
            .update({
              full_name: `ANONYMIZED_${profile.id.substring(0, 8)}`,
              email: `anonymized_${profile.id}@deleted.local`,
              phone: null,
              avatar_url: null
            })
            .eq('id', profile.id);
        }
        anonymizedCount = profiles.length;
      }
    }

    return anonymizedCount;
  }

  /**
   * Archive data (move to archive storage)
   */
  private static async archiveData(policy: RetentionPolicy): Promise<number> {
    // This would involve moving data to a separate archive table or storage
    // For now, we'll just mark it as archived
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

    const { count } = await supabase
      .from('reservation_audit_log')
      .update({ archived_at: new Date().toISOString() })
      .lt('created_at', cutoffDate.toISOString())
      .is('archived_at', null);

    return count || 0;
  }
}

/**
 * Data Lifecycle Tracker
 */
export class DataLifecycleTracker {
  /**
   * Record data lifecycle event
   */
  static async recordEvent(event: Omit<DataLifecycleEvent, 'id' | 'timestamp' | 'retentionUntil'>): Promise<void> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      // Calculate retention period based on data type
      const retentionPeriod = this.getRetentionPeriod(event.dataType);
      const retentionUntil = new Date();
      retentionUntil.setDate(retentionUntil.getDate() + retentionPeriod);

      await supabase
        .from('data_lifecycle_events')
        .insert({
          user_id: event.userId,
          data_type: event.dataType,
          action: event.action,
          timestamp: new Date().toISOString(),
          retention_until: retentionUntil.toISOString(),
          metadata: event.metadata
        });

      logger.debug('Data lifecycle event recorded', { 
        dataType: event.dataType, 
        action: event.action,
        userId: event.userId 
      });
    } catch (error) {
      logger.error('Failed to record lifecycle event', error);
    }
  }

  /**
   * Get retention period for data type
   */
  private static getRetentionPeriod(dataType: string): number {
    const dataTypeToCategory: Record<string, DataCategory> = {
      'user_profile': DataCategory.PERSONAL_IDENTITY,
      'reservation': DataCategory.PERSONAL_IDENTITY,
      'payment': DataCategory.FINANCIAL_DATA,
      'audit_log': DataCategory.BEHAVIORAL_DATA,
      'security_event': DataCategory.TECHNICAL_DATA,
      'communication': DataCategory.CONTACT_INFORMATION
    };

    const category = dataTypeToCategory[dataType] || DataCategory.BEHAVIORAL_DATA;
    return RETENTION_PERIODS[category];
  }

  /**
   * Get lifecycle events for a user
   */
  static async getUserLifecycleEvents(userId: string): Promise<DataLifecycleEvent[]> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data } = await supabase
        .from('data_lifecycle_events')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      return data?.map(event => ({
        id: event.id,
        userId: event.user_id,
        dataType: event.data_type,
        action: event.action,
        timestamp: new Date(event.timestamp),
        retentionUntil: new Date(event.retention_until),
        metadata: event.metadata
      })) || [];
    } catch (error) {
      logger.error('Failed to get lifecycle events', error);
      return [];
    }
  }
}

/**
 * Data Retention Scheduler
 */
export class RetentionScheduler {
  /**
   * Run daily retention cleanup
   */
  static async runDailyCleanup(): Promise<{
    jobsScheduled: number;
    jobsExecuted: number;
    recordsDeleted: number;
    errors: string[];
  }> {
    const result = {
      jobsScheduled: 0,
      jobsExecuted: 0,
      recordsDeleted: 0,
      errors: [] as string[]
    };

    try {
      // Schedule new deletion jobs
      const jobs = await DataDeletionService.scheduleDeletionJobs();
      result.jobsScheduled = jobs.length;

      // Execute pending jobs
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      const { data: pendingJobs } = await supabase
        .from('data_deletion_jobs')
        .select('id')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString());

      if (pendingJobs) {
        for (const job of pendingJobs) {
          try {
            await DataDeletionService.executeDeletionJob(job.id);
            result.jobsExecuted++;
          } catch (error) {
            result.errors.push(`Job ${job.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Get total records deleted today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: completedJobs } = await supabase
        .from('data_deletion_jobs')
        .select('records_deleted')
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());

      result.recordsDeleted = completedJobs?.reduce((sum, job) => sum + job.records_deleted, 0) || 0;

      logger.info('Daily retention cleanup completed', result);
      return result;
    } catch (error) {
      logger.error('Daily retention cleanup failed', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return result;
    }
  }

  /**
   * Generate retention report
   */
  static async generateRetentionReport(): Promise<{
    activePolicies: number;
    pendingJobs: number;
    completedJobsToday: number;
    recordsDeletedToday: number;
    upcomingExpirations: any[];
  }> {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();

      // Count active policies
      const { count: activePolicies } = await supabase
        .from('data_retention_policies')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Count pending jobs
      const { count: pendingJobs } = await supabase
        .from('data_deletion_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Count completed jobs today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: completedJobsToday } = await supabase
        .from('data_deletion_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());

      // Sum records deleted today
      const { data: todayJobs } = await supabase
        .from('data_deletion_jobs')
        .select('records_deleted')
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());

      const recordsDeletedToday = todayJobs?.reduce((sum, job) => sum + job.records_deleted, 0) || 0;

      // Get upcoming expirations (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: upcomingExpirations } = await supabase
        .from('data_lifecycle_events')
        .select('data_type, retention_until, count(*)')
        .lte('retention_until', thirtyDaysFromNow.toISOString())
        .gte('retention_until', new Date().toISOString());

      return {
        activePolicies: activePolicies || 0,
        pendingJobs: pendingJobs || 0,
        completedJobsToday: completedJobsToday || 0,
        recordsDeletedToday,
        upcomingExpirations: upcomingExpirations || []
      };
    } catch (error) {
      logger.error('Failed to generate retention report', error);
      throw new Error('Failed to generate retention report');
    }
  }
}