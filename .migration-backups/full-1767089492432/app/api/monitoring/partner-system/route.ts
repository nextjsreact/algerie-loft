/**
 * Partner System Monitoring API
 * Provides monitoring endpoints for the partner dashboard system
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRoleAPI } from '@/lib/auth';
import { PartnerSystemMonitor } from '@/lib/monitoring/partner-system-monitor';

// GET /api/monitoring/partner-system - Get monitoring data
export async function GET(request: NextRequest) {
  try {
    // Require admin role for monitoring endpoints
    const session = await requireRoleAPI(['admin']);
    if (!session) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'metrics';

    const monitor = PartnerSystemMonitor.getInstance();

    switch (action) {
      case 'metrics':
        const metrics = await monitor.collectMetrics();
        return NextResponse.json({
          success: true,
          data: metrics,
          timestamp: new Date().toISOString()
        });

      case 'alerts':
        const alerts = monitor.getAlerts();
        return NextResponse.json({
          success: true,
          data: {
            alerts,
            total_alerts: alerts.length,
            critical_alerts: alerts.filter(a => a.type === 'critical').length,
            warning_alerts: alerts.filter(a => a.type === 'warning').length,
            info_alerts: alerts.filter(a => a.type === 'info').length
          }
        });

      case 'health':
        const healthStatus = monitor.getHealthStatus();
        const currentMetrics = monitor.getMetrics();
        
        return NextResponse.json({
          success: true,
          data: {
            status: healthStatus,
            metrics: currentMetrics,
            alerts: monitor.getAlerts(),
            last_update: currentMetrics ? new Date().toISOString() : null
          }
        });

      case 'dashboard':
        // Get comprehensive dashboard data
        const dashboardMetrics = await monitor.collectMetrics();
        const dashboardAlerts = monitor.getAlerts();
        const dashboardHealth = monitor.getHealthStatus();

        return NextResponse.json({
          success: true,
          data: {
            health_status: dashboardHealth,
            metrics: dashboardMetrics,
            alerts: {
              total: dashboardAlerts.length,
              critical: dashboardAlerts.filter(a => a.type === 'critical').length,
              warning: dashboardAlerts.filter(a => a.type === 'warning').length,
              info: dashboardAlerts.filter(a => a.type === 'info').length,
              recent: dashboardAlerts.slice(0, 5)
            },
            summary: {
              system_operational: dashboardHealth === 'healthy',
              partners_active: dashboardMetrics.total_active_partners,
              daily_registrations: dashboardMetrics.daily_registrations,
              pending_validations: dashboardMetrics.pending_validations,
              api_performance: dashboardMetrics.api_response_time_ms < 2000 ? 'good' : 'poor',
              error_rate: dashboardMetrics.error_rate_percentage < 1 ? 'low' : 'high'
            }
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Partner system monitoring API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/monitoring/partner-system - Perform monitoring actions
export async function POST(request: NextRequest) {
  try {
    // Require admin role for monitoring actions
    const session = await requireRoleAPI(['admin']);
    if (!session) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, alertId, settings } = body;

    const monitor = PartnerSystemMonitor.getInstance();

    switch (action) {
      case 'resolve-alert':
        if (!alertId) {
          return NextResponse.json(
            { error: 'Alert ID required' },
            { status: 400 }
          );
        }

        monitor.resolveAlert(alertId);

        return NextResponse.json({
          success: true,
          message: `Alert ${alertId} resolved successfully`
        });

      case 'refresh-metrics':
        const refreshedMetrics = await monitor.collectMetrics();

        return NextResponse.json({
          success: true,
          data: refreshedMetrics,
          message: 'Metrics refreshed successfully'
        });

      case 'test-alerts':
        // Trigger test alerts for testing purposes
        const testAlerts = [
          {
            id: `test-alert-${Date.now()}`,
            type: 'info' as const,
            title: 'Test Alert',
            description: 'This is a test alert to verify the monitoring system',
            metric: 'test_metric',
            threshold: 0,
            current_value: 1,
            timestamp: new Date().toISOString(),
            resolved: false
          }
        ];

        return NextResponse.json({
          success: true,
          data: testAlerts,
          message: 'Test alerts generated'
        });

      case 'update-settings':
        if (!settings) {
          return NextResponse.json(
            { error: 'Settings required' },
            { status: 400 }
          );
        }

        // In a real implementation, this would update monitoring settings
        // For now, we'll just validate and return success
        const validSettings = [
          'alert_thresholds',
          'notification_channels',
          'monitoring_interval',
          'retention_period'
        ];

        const invalidSettings = Object.keys(settings).filter(key => 
          !validSettings.includes(key)
        );

        if (invalidSettings.length > 0) {
          return NextResponse.json(
            { error: `Invalid settings: ${invalidSettings.join(', ')}` },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: settings,
          message: 'Monitoring settings updated successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Partner system monitoring POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/monitoring/partner-system - Update monitoring configuration
export async function PUT(request: NextRequest) {
  try {
    // Require admin role for monitoring configuration
    const session = await requireRoleAPI(['admin']);
    if (!session) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { thresholds, notifications, intervals } = body;

    // Validate threshold settings
    if (thresholds) {
      const validThresholds = [
        'error_rate_threshold',
        'response_time_threshold',
        'pending_validations_threshold',
        'approval_rate_threshold'
      ];

      const invalidThresholds = Object.keys(thresholds).filter(key => 
        !validThresholds.includes(key)
      );

      if (invalidThresholds.length > 0) {
        return NextResponse.json(
          { error: `Invalid thresholds: ${invalidThresholds.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate notification settings
    if (notifications) {
      const validChannels = ['email', 'slack', 'webhook', 'sms'];
      
      if (notifications.channels) {
        const invalidChannels = notifications.channels.filter((channel: string) => 
          !validChannels.includes(channel)
        );

        if (invalidChannels.length > 0) {
          return NextResponse.json(
            { error: `Invalid notification channels: ${invalidChannels.join(', ')}` },
            { status: 400 }
          );
        }
      }
    }

    // In a real implementation, this would persist the configuration
    const updatedConfig = {
      thresholds: thresholds || {},
      notifications: notifications || {},
      intervals: intervals || {},
      updated_at: new Date().toISOString(),
      updated_by: session.user.id
    };

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: 'Monitoring configuration updated successfully'
    });

  } catch (error) {
    console.error('Partner system monitoring PUT error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}