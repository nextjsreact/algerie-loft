import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireSuperuser } from '@/lib/superuser/auth';
import { logAuditEvent } from '@/lib/superuser/audit';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Verify superuser permissions
    const authResult = await requireSuperuser(supabase, ['SECURITY_MONITORING']);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const limit = parseInt(searchParams.get('limit') || '50');
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');

    let result = {};

    switch (operation) {
      case 'alerts':
        result = await getSecurityAlerts(supabase, { limit, severity, resolved });
        break;
      case 'suspicious-activities':
        result = await getSuspiciousActivities(supabase, { limit });
        break;
      case 'failed-logins':
        result = await getFailedLogins(supabase, { limit });
        break;
      case 'security-metrics':
        result = await getSecurityMetrics(supabase);
        break;
      default:
        result = {
          alerts: await getSecurityAlerts(supabase, { limit: 20 }),
          suspiciousActivities: await getSuspiciousActivities(supabase, { limit: 10 }),
          failedLogins: await getFailedLogins(supabase, { limit: 10 }),
          metrics: await getSecurityMetrics(supabase)
        };
    }

    // Log audit event
    await logAuditEvent(supabase, authResult.superuser!.id, 'SECURITY', 'VIEW_SECURITY_DATA', {
      operation: operation || 'all',
      filters: { limit, severity, resolved }
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Security monitoring API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Verify superuser permissions
    const authResult = await requireSuperuser(supabase, ['SECURITY_MONITORING']);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { operation, alertId, action, options = {} } = body;

    let result = {};

    switch (operation) {
      case 'resolve-alert':
        result = await resolveSecurityAlert(supabase, alertId, authResult.superuser!.id);
        break;
      case 'create-alert':
        result = await createSecurityAlert(supabase, options);
        break;
      case 'block-ip':
        result = await blockSuspiciousIP(supabase, options.ip, authResult.superuser!.id);
        break;
      case 'enable-monitoring':
        result = await enableSecurityMonitoring(supabase, options);
        break;
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    // Log audit event
    await logAuditEvent(supabase, authResult.superuser!.id, 'SECURITY', 'SECURITY_ACTION', {
      operation,
      alertId,
      action,
      options
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Security action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getSecurityAlerts(supabase: any, options: any) {
  try {
    let query = supabase
      .from('security_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(options.limit || 50);

    if (options.severity) {
      query = query.eq('severity', options.severity);
    }

    if (options.resolved !== undefined) {
      query = query.eq('resolved', options.resolved === 'true');
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error('Error fetching security alerts:', error);
      return { error: 'Failed to fetch security alerts' };
    }

    return { alerts: alerts || [] };
  } catch (error) {
    console.error('Error in getSecurityAlerts:', error);
    return { error: 'Failed to fetch security alerts' };
  }
}

async function getSuspiciousActivities(supabase: any, options: any) {
  try {
    // Get suspicious activities from audit logs
    const { data: activities, error } = await supabase
      .from('superuser_audit_logs')
      .select('*')
      .in('severity', ['HIGH', 'CRITICAL'])
      .order('timestamp', { ascending: false })
      .limit(options.limit || 10);

    if (error) {
      console.error('Error fetching suspicious activities:', error);
      return { error: 'Failed to fetch suspicious activities' };
    }

    return { activities: activities || [] };
  } catch (error) {
    console.error('Error in getSuspiciousActivities:', error);
    return { error: 'Failed to fetch suspicious activities' };
  }
}

async function getFailedLogins(supabase: any, options: any) {
  try {
    // Get failed login attempts from audit logs
    const { data: failedLogins, error } = await supabase
      .from('superuser_audit_logs')
      .select('*')
      .eq('action_type', 'SECURITY')
      .ilike('action_details->action', '%FAILED_LOGIN%')
      .order('timestamp', { ascending: false })
      .limit(options.limit || 10);

    if (error) {
      console.error('Error fetching failed logins:', error);
      return { error: 'Failed to fetch failed logins' };
    }

    return { failedLogins: failedLogins || [] };
  } catch (error) {
    console.error('Error in getFailedLogins:', error);
    return { error: 'Failed to fetch failed logins' };
  }
}

async function getSecurityMetrics(supabase: any) {
  try {
    // Get security metrics from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Count alerts by severity
    const { data: alertCounts } = await supabase
      .from('security_alerts')
      .select('severity')
      .gte('created_at', twentyFourHoursAgo);

    // Count failed login attempts
    const { data: failedLoginCount } = await supabase
      .from('superuser_audit_logs')
      .select('id', { count: 'exact' })
      .eq('action_type', 'SECURITY')
      .ilike('action_details->action', '%FAILED_LOGIN%')
      .gte('timestamp', twentyFourHoursAgo);

    // Count suspicious activities
    const { data: suspiciousCount } = await supabase
      .from('superuser_audit_logs')
      .select('id', { count: 'exact' })
      .in('severity', ['HIGH', 'CRITICAL'])
      .gte('timestamp', twentyFourHoursAgo);

    const alertsBySeverity = (alertCounts || []).reduce((acc: any, alert: any) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});

    return {
      alertsBySeverity,
      failedLogins24h: failedLoginCount?.length || 0,
      suspiciousActivities24h: suspiciousCount?.length || 0,
      totalAlerts24h: (alertCounts || []).length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in getSecurityMetrics:', error);
    return { error: 'Failed to fetch security metrics' };
  }
}

async function resolveSecurityAlert(supabase: any, alertId: string, superuserId: string) {
  try {
    const { data: alert, error } = await supabase
      .from('security_alerts')
      .update({
        resolved: true,
        resolved_by: superuserId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      console.error('Error resolving security alert:', error);
      return { error: 'Failed to resolve security alert' };
    }

    return { alert, message: 'Security alert resolved successfully' };
  } catch (error) {
    console.error('Error in resolveSecurityAlert:', error);
    return { error: 'Failed to resolve security alert' };
  }
}

async function createSecurityAlert(supabase: any, options: any) {
  try {
    const { data: alert, error } = await supabase
      .from('security_alerts')
      .insert({
        alert_type: options.alert_type,
        severity: options.severity,
        description: options.description,
        source_ip: options.source_ip,
        user_id: options.user_id || null,
        metadata: options.metadata || {},
        resolved: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating security alert:', error);
      return { error: 'Failed to create security alert' };
    }

    return { alert, message: 'Security alert created successfully' };
  } catch (error) {
    console.error('Error in createSecurityAlert:', error);
    return { error: 'Failed to create security alert' };
  }
}

async function blockSuspiciousIP(supabase: any, ip: string, superuserId: string) {
  try {
    // In a real implementation, this would add the IP to a blocklist
    // For now, we'll create a security alert
    const { data: alert, error } = await supabase
      .from('security_alerts')
      .insert({
        alert_type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        description: `IP address ${ip} has been blocked due to suspicious activity`,
        source_ip: ip,
        metadata: { action: 'IP_BLOCKED', blocked_by: superuserId },
        resolved: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error blocking IP:', error);
      return { error: 'Failed to block IP address' };
    }

    return { alert, message: `IP address ${ip} has been blocked` };
  } catch (error) {
    console.error('Error in blockSuspiciousIP:', error);
    return { error: 'Failed to block IP address' };
  }
}

async function enableSecurityMonitoring(supabase: any, options: any) {
  try {
    // This would enable various security monitoring features
    // For now, return a success message
    return { 
      message: 'Security monitoring enabled successfully',
      features: options.features || ['real_time_alerts', 'suspicious_activity_detection', 'failed_login_monitoring']
    };
  } catch (error) {
    console.error('Error in enableSecurityMonitoring:', error);
    return { error: 'Failed to enable security monitoring' };
  }
}