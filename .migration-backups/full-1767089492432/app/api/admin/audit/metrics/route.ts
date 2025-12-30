import { NextRequest, NextResponse } from 'next/server'
import { reservationAuditService } from '@/lib/services/reservation-audit-service'
import { reservationMonitoringService } from '@/lib/monitoring/reservation-monitoring'
import { reservationErrorTrackingService } from '@/lib/services/reservation-error-tracking'
import { reservationSecurityMonitoringService } from '@/lib/services/reservation-security-monitoring'
import { logger } from '@/lib/logger'

/**
 * API endpoint for audit metrics
 * Requirements: 10.1, 10.2, 10.4
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = (searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d') || '24h'

    logger.info('Fetching audit metrics', { timeRange })

    // Get metrics from all monitoring services
    const [
      reservationMetrics,
      securityMetrics,
      errorAnalytics,
      systemHealth
    ] = await Promise.all([
      reservationMonitoringService.getReservationMetrics(timeRange),
      reservationSecurityMonitoringService.getSecurityMetrics(timeRange),
      reservationErrorTrackingService.getErrorAnalytics(timeRange),
      reservationMonitoringService.checkSystemHealth()
    ])

    const response = {
      reservation_metrics: reservationMetrics,
      security_metrics: securityMetrics,
      error_analytics: errorAnalytics,
      system_health: systemHealth,
      timestamp: new Date().toISOString(),
      time_range: timeRange
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Error fetching audit metrics', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit metrics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'refresh_metrics':
        // Trigger metrics refresh
        const health = await reservationMonitoringService.checkSystemHealth()
        return NextResponse.json({ success: true, health })

      case 'export_audit_logs':
        const { reservation_id, date_from, date_to, format = 'json' } = params
        const exportData = await reservationAuditService.exportAuditLogs(
          reservation_id,
          date_from,
          date_to,
          format
        )
        return NextResponse.json(exportData)

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Error processing audit metrics request', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}