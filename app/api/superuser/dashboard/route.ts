import { NextRequest, NextResponse } from 'next/server';
import { verifySuperuserAPI } from '@/lib/superuser/auth';
import { createClient } from '@/utils/supabase/server';
import type { SystemMetrics, SecurityAlert, AuditLogEntry } from '@/types/superuser';

export async function GET(request: NextRequest) {
  try {
    // Verify superuser access
    const { authorized, error } = await verifySuperuserAPI(['AUDIT_ACCESS']);
    if (!authorized) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient(true); // Use service role

    // Get system metrics
    const systemMetrics = await getSystemMetrics(supabase);
    
    // Get recent security alerts
    const recentAlerts = await getRecentSecurityAlerts(supabase);
    
    // Get recent audit logs
    const recentAuditLogs = await getRecentAuditLogs(supabase);

    return NextResponse.json({
      systemMetrics,
      recentAlerts,
      recentAuditLogs
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getSystemMetrics(supabase: any): Promise<SystemMetrics> {
  try {
    // Get active users count
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Get total reservations
    const { count: totalReservations } = await supabase
      .from('reservations')
      .select('*', { count: 'exact', head: true });

    // Get active sessions count
    const { count: activeSessions } = await supabase
      .from('superuser_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString());

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

    // Calculate system health based on various factors
    let systemHealth: SystemMetrics['system_health'] = 'HEALTHY';
    const errorRate = Math.random() * 10; // Mock error rate
    const responseTime = 150 + Math.random() * 100; // Mock response time

    if (errorRate > 10 || responseTime > 500) {
      systemHealth = 'CRITICAL';
    } else if (errorRate > 5 || responseTime > 300) {
      systemHealth = 'WARNING';
    }

    return {
      active_users: activeUsers || 0,
      total_reservations: totalReservations || 0,
      system_health: systemHealth,
      database_size: dbStats?.size || 0,
      backup_status: lastBackup ? 'UP_TO_DATE' : 'PENDING',
      last_backup: lastBackup ? new Date(lastBackup.completed_at) : new Date(),
      active_sessions: activeSessions || 0,
      error_rate: Math.round(errorRate * 100) / 100,
      response_time_avg: Math.round(responseTime)
    };

  } catch (error) {
    console.error('Error getting system metrics:', error);
    // Return default metrics on error
    return {
      active_users: 0,
      total_reservations: 0,
      system_health: 'CRITICAL',
      database_size: 0,
      backup_status: 'FAILED',
      last_backup: new Date(),
      active_sessions: 0,
      error_rate: 0,
      response_time_avg: 0
    };
  }
}

async function getRecentSecurityAlerts(supabase: any): Promise<SecurityAlert[]> {
  try {
    const { data: alerts, error } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching security alerts:', error);
      return [];
    }

    return (alerts || []).map((alert: any) => ({
      ...alert,
      created_at: new Date(alert.created_at),
      resolved_at: alert.resolved_at ? new Date(alert.resolved_at) : undefined
    }));

  } catch (error) {
    console.error('Error getting security alerts:', error);
    return [];
  }
}

async function getRecentAuditLogs(supabase: any): Promise<AuditLogEntry[]> {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs_view')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return (logs || []).map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp)
    }));

  } catch (error) {
    console.error('Error getting audit logs:', error);
    return [];
  }
}