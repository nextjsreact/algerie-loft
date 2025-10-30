import { NextRequest, NextResponse } from 'next/server'
import { reservationAuditService } from '@/lib/services/reservation-audit-service'
import { logger } from '@/lib/logger'

/**
 * API endpoint for audit events
 * Requirements: 10.1, 10.2
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reservationId = searchParams.get('reservation_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    logger.info('Fetching audit events', { reservationId, limit, dateFrom, dateTo })

    if (reservationId) {
      // Get audit trail for specific reservation
      const auditTrail = await reservationAuditService.getReservationAuditTrail(
        reservationId,
        limit
      )
      
      return NextResponse.json({
        events: auditTrail,
        total: auditTrail.length,
        reservation_id: reservationId
      })
    } else {
      // Get general audit metrics
      const metrics = await reservationAuditService.getAuditMetrics(dateFrom, dateTo)
      
      return NextResponse.json({
        metrics,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    logger.error('Error fetching audit events', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'log_event':
        const eventId = await reservationAuditService.logAuditEvent(params)
        return NextResponse.json({ success: true, event_id: eventId })

      case 'detect_suspicious_activity':
        const { time_window_hours = 24 } = params
        const suspiciousActivity = await reservationAuditService.detectSuspiciousActivity(
          time_window_hours
        )
        return NextResponse.json({ suspicious_activity: suspiciousActivity })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Error processing audit events request', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}