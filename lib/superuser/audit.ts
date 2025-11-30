"use server"

import { createClient } from '@/utils/supabase/server';
import type { AuditLogEntry } from '@/types/superuser';

/**
 * Audit logging utilities for superuser operations
 */

export async function logAuditEntry(entry: Omit<AuditLogEntry, 'id'>): Promise<void> {
  try {
    const supabase = await createClient(true);
    await supabase
      .from('audit_logs')
      .insert({
        ...entry,
        timestamp: entry.timestamp.toISOString()
      });
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

/**
 * Helper function for logging audit events with a simpler signature
 * @deprecated Use logAuditEntry instead for better type safety
 */
export async function logAuditEvent(
  supabase: any,
  userId: string,
  category: string,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: `${category}_${action}`,
        resource_type: category,
        details: details || {},
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function getAuditLogs(filters: {
  superuserId?: string;
  actionType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
} = {}): Promise<AuditLogEntry[]> {
  try {
    const supabase = await createClient(true);
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (filters.superuserId) {
      query = query.eq('superuser_id', filters.superuserId);
    }

    if (filters.actionType) {
      query = query.eq('action_type', filters.actionType);
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

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }

    return data.map(entry => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}