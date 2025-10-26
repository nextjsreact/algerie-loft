/**
 * Health Check API Route
 * 
 * Provides health status for deployment monitoring
 */

import { NextResponse } from 'next/server'
import { deploymentMonitor } from '../../../lib/deployment/monitoring'
import { featureFlagManager } from '../../../lib/deployment/feature-flags'
import { rollbackManager } from '../../../lib/deployment/rollback'

export async function GET() {
  try {
    const timestamp = new Date().toISOString()
    
    // Get system status
    const monitoringStatus = deploymentMonitor.getMonitoringStatus()
    const rolloutStats = featureFlagManager.getRolloutStats()
    const rollbackStatus = rollbackManager.getMonitoringStatus()
    
    // Determine overall health
    let status = 'healthy'
    const issues: string[] = []
    
    if (!monitoringStatus.isActive) {
      status = 'degraded'
      issues.push('Monitoring system is not active')
    }
    
    if (rollbackStatus.recentEvents > 0) {
      status = 'degraded'
      issues.push(`${rollbackStatus.recentEvents} recent rollback events`)
    }
    
    // Get performance stats
    const performanceStats = deploymentMonitor.getPerformanceStats(5) // Last 5 minutes
    
    if (performanceStats.errorRate > 5) {
      status = 'unhealthy'
      issues.push(`High error rate: ${performanceStats.errorRate.toFixed(2)}%`)
    }
    
    if (performanceStats.averageResponseTime > 3000) {
      status = 'degraded'
      issues.push(`Slow response time: ${performanceStats.averageResponseTime.toFixed(0)}ms`)
    }

    const healthData = {
      status,
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      issues: issues.length > 0 ? issues : undefined,
      monitoring: {
        active: monitoringStatus.isActive,
        metricsCount: monitoringStatus.metricsCount,
        alertsCount: monitoringStatus.alertsCount,
        healthChecksCount: monitoringStatus.healthChecksCount
      },
      performance: {
        averageResponseTime: Math.round(performanceStats.averageResponseTime),
        errorRate: Math.round(performanceStats.errorRate * 100) / 100,
        requestCount: performanceStats.requestCount,
        slowRequestCount: performanceStats.slowRequestCount
      },
      featureFlags: {
        totalFlags: rolloutStats.totalFlags,
        enabledFlags: rolloutStats.enabledFlags,
        activeRollouts: rolloutStats.activeRollouts,
        averageRolloutPercentage: Math.round(rolloutStats.averageRolloutPercentage)
      },
      rollback: {
        monitoringActive: rollbackStatus.isActive,
        enabledTriggers: rollbackStatus.enabledTriggers,
        recentEvents: rollbackStatus.recentEvents
      }
    }

    // Return appropriate status code based on health
    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503

    return NextResponse.json(healthData, { status: statusCode })
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}