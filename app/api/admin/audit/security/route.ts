import { NextRequest, NextResponse } from 'next/server'
import { reservationSecurityMonitoringService } from '@/lib/services/reservation-security-monitoring'
import { logger } from '@/lib/logger'

/**
 * API endpoint for security monitoring
 * Requirements: 10.4
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = (searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d') || '24h'
    const action = searchParams.get('action')

    logger.info('Fetching security data', { timeRange, action })

    switch (action) {
      case 'metrics':
        const metrics = reservationSecurityMonitoringService.getSecurityMetrics(timeRange)
        return NextResponse.json({ metrics })

      case 'report':
        const report = await reservationSecurityMonitoringService.generateSecurityReport(timeRange)
        return NextResponse.json({ report })

      default:
        const defaultMetrics = reservationSecurityMonitoringService.getSecurityMetrics(timeRange)
        return NextResponse.json({ metrics: defaultMetrics })
    }

  } catch (error) {
    logger.error('Error fetching security data', error)
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'detect_threats':
        const threats = await reservationSecurityMonitoringService.detectSecurityThreats(params)
        return NextResponse.json({ threats })

      case 'check_request':
        const blockResult = await reservationSecurityMonitoringService.shouldBlockRequest(params)
        return NextResponse.json({ block_result: blockResult })

      case 'block_ip':
        const { ip_address, reason, duration, blocked_by } = params
        await reservationSecurityMonitoringService.blockIPAddress(
          ip_address,
          reason,
          duration,
          blocked_by
        )
        return NextResponse.json({ success: true, message: 'IP address blocked' })

      case 'unblock_ip':
        const { ip_address: unblockIp, reason: unblockReason, unblocked_by } = params
        await reservationSecurityMonitoringService.unblockIPAddress(
          unblockIp,
          unblockReason,
          unblocked_by
        )
        return NextResponse.json({ success: true, message: 'IP address unblocked' })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Error processing security request', error)
    return NextResponse.json(
      { error: 'Failed to process security request' },
      { status: 500 }
    )
  }
}