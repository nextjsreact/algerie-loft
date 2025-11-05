"use server"

import { createClient } from '@/utils/supabase/server';
import { logSuperuserAudit } from './auth';
import type { SecurityAlert } from '@/types/superuser';

// Import utility functions
import { validateIPAddress } from './utils';

// Re-export for backward compatibility
export { validateIPAddress };

/**
 * Security monitoring and alerting for superuser operations
 */

/**
 * Create security alert
 */
export async function createSecurityAlert(
  alertType: SecurityAlert['alert_type'],
  severity: SecurityAlert['severity'],
  description: string,
  sourceIP: string,
  metadata: Record<string, any> = {},
  userId?: string
): Promise<SecurityAlert | null> {
  try {
    const supabase = await createClient(true);
    
    const { data: alert, error } = await supabase
      .from('security_alerts')
      .insert({
        alert_type: alertType,
        severity,
        description,
        source_ip: sourceIP,
        user_id: userId,
        metadata,
        resolved: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !alert) {
      console.error('Failed to create security alert:', error);
      return null;
    }

    return {
      ...alert,
      created_at: new Date(alert.created_at),
      resolved_at: alert.resolved_at ? new Date(alert.resolved_at) : undefined
    };
  } catch (error) {
    console.error('Error creating security alert:', error);
    return null;
  }
}

/**
 * Get security alerts with filtering
 */
export async function getSecurityAlerts(filters: {
  alertType?: SecurityAlert['alert_type'];
  severity?: SecurityAlert['severity'];
  resolved?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  sourceIP?: string;
  limit?: number;
} = {}): Promise<SecurityAlert[]> {
  try {
    const supabase = await createClient(true);
    
    let query = supabase
      .from('security_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.alertType) {
      query = query.eq('alert_type', filters.alertType);
    }

    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters.resolved !== undefined) {
      query = query.eq('resolved', filters.resolved);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom.toISOString());
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo.toISOString());
    }

    if (filters.sourceIP) {
      query = query.eq('source_ip', filters.sourceIP);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error('Failed to fetch security alerts:', error);
      return [];
    }

    return alerts.map(alert => ({
      ...alert,
      created_at: new Date(alert.created_at),
      resolved_at: alert.resolved_at ? new Date(alert.resolved_at) : undefined
    }));
  } catch (error) {
    console.error('Error fetching security alerts:', error);
    return [];
  }
}

/**
 * Resolve security alert
 */
export async function resolveSecurityAlert(
  alertId: string,
  resolvedBy: string,
  resolution?: string
): Promise<boolean> {
  try {
    const supabase = await createClient(true);
    
    const { error } = await supabase
      .from('security_alerts')
      .update({
        resolved: true,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString(),
        metadata: resolution ? { resolution } : undefined
      })
      .eq('id', alertId);

    if (error) {
      console.error('Failed to resolve security alert:', error);
      return false;
    }

    // Log the resolution
    await logSuperuserAudit('SECURITY', {
      action: 'alert_resolved',
      alert_id: alertId,
      resolved_by: resolvedBy,
      resolution
    });

    return true;
  } catch (error) {
    console.error('Error resolving security alert:', error);
    return false;
  }
}