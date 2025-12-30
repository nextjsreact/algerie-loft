/**
 * Deployment Monitoring Middleware
 * 
 * Integrates performance monitoring, feature flags, and rollback capabilities
 * into the Next.js middleware pipeline.
 */

import { NextRequest, NextResponse } from 'next/server'
import { deploymentMonitor } from '../lib/deployment/monitoring'
import { featureFlagManager } from '../lib/deployment/feature-flags'
import { rollbackManager } from '../lib/deployment/rollback'

/**
 * Initialize deployment monitoring systems
 */
export function initializeDeploymentMonitoring(): void {
  // Start monitoring systems
  deploymentMonitor.startMonitoring()
  rollbackManager.startMonitoring()

  console.log('🚀 Deployment monitoring systems initialized')
}

/**
 * Middleware for deployment monitoring and feature flags
 */
export function deploymentMonitoringMiddleware(request: NextRequest): NextResponse {
  const startTime = Date.now()
  
  // Extract context for feature flags
  const context = {
    userId: request.headers.get('x-user-id') || undefined,
    country: request.geo?.country || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    customAttributes: {
      path: request.nextUrl.pathname,
      method: request.method
    }
  }

  // Check if dual-audience homepage is enabled
  const isDualAudienceEnabled = featureFlagManager.isFeatureEnabled('dual_audience_homepage', context)
  
  // Create response
  let response: NextResponse

  if (isDualAudienceEnabled) {
    // Allow request to proceed with new homepage
    response = NextResponse.next()
    
    // Add feature flag headers for client-side usage
    response.headers.set('x-feature-dual-audience', 'true')
    response.headers.set('x-feature-enhanced-hero', featureFlagManager.isFeatureEnabled('enhanced_hero_section', context).toString())
    response.headers.set('x-feature-featured-lofts', featureFlagManager.isFeatureEnabled('featured_lofts_showcase', context).toString())
    response.headers.set('x-feature-trust-proof', featureFlagManager.isFeatureEnabled('trust_social_proof', context).toString())
    response.headers.set('x-feature-owner-section', featureFlagManager.isFeatureEnabled('repositioned_owner_section', context).toString())
    response.headers.set('x-feature-multilingual', featureFlagManager.isFeatureEnabled('multilingual_currency_support', context).toString())
    response.headers.set('x-feature-booking', featureFlagManager.isFeatureEnabled('advanced_booking_functionality', context).toString())
    response.headers.set('x-feature-analytics', featureFlagManager.isFeatureEnabled('analytics_conversion_optimization', context).toString())
  } else {
    // Serve original homepage
    response = NextResponse.next()
    response.headers.set('x-feature-dual-audience', 'false')
  }

  // Record performance metrics after response
  const endTime = Date.now()
  const duration = endTime - startTime

  // Create a mock response object for monitoring (since we can't access the actual response in middleware)
  const mockResponse = {
    status: 200 // We'll assume success; actual status would be recorded in API routes
  }

  deploymentMonitor.recordMetrics(request, mockResponse as Response, duration)

  // Add monitoring headers
  response.headers.set('x-monitoring-duration', duration.toString())
  response.headers.set('x-monitoring-timestamp', startTime.toString())

  return response
}

/**
 * API route handler for recording Web Vitals
 */
export async function recordWebVitals(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { lcp, fid, cls, fcp, ttfb } = body

    deploymentMonitor.recordWebVitals({
      lcp: lcp ? parseFloat(lcp) : undefined,
      fid: fid ? parseFloat(fid) : undefined,
      cls: cls ? parseFloat(cls) : undefined,
      fcp: fcp ? parseFloat(fcp) : undefined,
      ttfb: ttfb ? parseFloat(ttfb) : undefined
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording Web Vitals:', error)
    return NextResponse.json({ error: 'Failed to record Web Vitals' }, { status: 500 })
  }
}

/**
 * API route handler for deployment monitoring dashboard
 */
export async function getMonitoringDashboard(): Promise<NextResponse> {
  try {
    const monitoringStatus = deploymentMonitor.getMonitoringStatus()
    const performanceStats = deploymentMonitor.getPerformanceStats(60) // Last hour
    const rolloutStats = featureFlagManager.getRolloutStats()
    const rollbackStats = rollbackManager.getRollbackStats()
    const rollbackHistory = rollbackManager.getRollbackHistory(10)

    const dashboard = {
      timestamp: new Date().toISOString(),
      monitoring: monitoringStatus,
      performance: performanceStats,
      rollout: rolloutStats,
      rollback: {
        stats: rollbackStats,
        recentEvents: rollbackHistory
      },
      featureFlags: featureFlagManager.getAllFlags().map(flag => ({
        id: flag.id,
        name: flag.name,
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
        updatedAt: flag.updatedAt
      }))
    }

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Error generating monitoring dashboard:', error)
    return NextResponse.json({ error: 'Failed to generate dashboard' }, { status: 500 })
  }
}

/**
 * API route handler for manual rollback
 */
export async function triggerManualRollback(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { reason, triggeredBy } = body

    if (!reason || !triggeredBy) {
      return NextResponse.json({ error: 'Reason and triggeredBy are required' }, { status: 400 })
    }

    const eventId = rollbackManager.emergencyRollback(reason, triggeredBy)

    return NextResponse.json({ 
      success: true, 
      eventId,
      message: 'Emergency rollback triggered successfully'
    })
  } catch (error) {
    console.error('Error triggering manual rollback:', error)
    return NextResponse.json({ error: 'Failed to trigger rollback' }, { status: 500 })
  }
}

/**
 * API route handler for updating feature flag rollout
 */
export async function updateFeatureRollout(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { flagId, percentage, updatedBy } = body

    if (!flagId || percentage === undefined || !updatedBy) {
      return NextResponse.json({ 
        error: 'flagId, percentage, and updatedBy are required' 
      }, { status: 400 })
    }

    const success = featureFlagManager.updateRolloutPercentage(flagId, percentage, updatedBy)

    if (!success) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Feature flag '${flagId}' updated to ${percentage}%`
    })
  } catch (error) {
    console.error('Error updating feature rollout:', error)
    return NextResponse.json({ error: 'Failed to update feature rollout' }, { status: 500 })
  }
}

/**
 * API route handler for starting gradual rollout
 */
export async function startGradualRollout(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { flagId, updatedBy } = body

    if (!flagId || !updatedBy) {
      return NextResponse.json({ 
        error: 'flagId and updatedBy are required' 
      }, { status: 400 })
    }

    const success = featureFlagManager.startGradualRollout(flagId, updatedBy)

    if (!success) {
      return NextResponse.json({ 
        error: 'Feature flag not found or gradual rollout not configured' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Gradual rollout started for '${flagId}'`
    })
  } catch (error) {
    console.error('Error starting gradual rollout:', error)
    return NextResponse.json({ error: 'Failed to start gradual rollout' }, { status: 500 })
  }
}