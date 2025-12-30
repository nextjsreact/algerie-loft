/**
 * Deployment Monitoring System
 * 
 * Provides performance monitoring, alerting, and health checks
 * for the dual-audience homepage deployment.
 */

import { NextRequest } from 'next/server'

export interface PerformanceMetrics {
  timestamp: number
  url: string
  method: string
  duration: number
  statusCode: number
  userAgent?: string
  country?: string
  region?: string
  // Core Web Vitals
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  fcp?: number // First Contentful Paint
  ttfb?: number // Time to First Byte
}

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  condition: {
    metric: keyof PerformanceMetrics
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
    threshold: number
    timeWindow: number // minutes
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  actions: AlertAction[]
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'log' | 'rollback'
  config: Record<string, any>
}

export interface HealthCheck {
  id: string
  name: string
  description: string
  endpoint: string
  method: 'GET' | 'POST' | 'HEAD'
  expectedStatus: number
  timeout: number
  interval: number // seconds
  enabled: boolean
}

export class DeploymentMonitor {
  private metrics: PerformanceMetrics[] = []
  private alerts: AlertRule[] = []
  private healthChecks: HealthCheck[] = []
  private isMonitoring = false

  constructor() {
    this.initializeDefaultAlerts()
    this.initializeDefaultHealthChecks()
  }

  /**
   * Start monitoring system
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    console.log('🔍 Deployment monitoring started')

    // Start health check intervals
    this.healthChecks.forEach(check => {
      if (check.enabled) {
        setInterval(() => this.performHealthCheck(check), check.interval * 1000)
      }
    })

    // Start alert evaluation
    setInterval(() => this.evaluateAlerts(), 30000) // Every 30 seconds
  }

  /**
   * Stop monitoring system
   */
  public stopMonitoring(): void {
    this.isMonitoring = false
    console.log('⏹️ Deployment monitoring stopped')
  }

  /**
   * Record performance metrics
   */
  public recordMetrics(request: NextRequest, response: Response, duration: number): void {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      url: request.url,
      method: request.method,
      duration,
      statusCode: response.status,
      userAgent: request.headers.get('user-agent') || undefined,
      country: request.geo?.country || undefined,
      region: request.geo?.region || undefined
    }

    this.metrics.push(metrics)

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Log slow requests
    if (duration > 2000) {
      console.warn(`🐌 Slow request detected: ${request.url} took ${duration}ms`)
    }
  }

  /**
   * Record Core Web Vitals
   */
  public recordWebVitals(vitals: {
    lcp?: number
    fid?: number
    cls?: number
    fcp?: number
    ttfb?: number
  }): void {
    const latestMetric = this.metrics[this.metrics.length - 1]
    if (latestMetric) {
      Object.assign(latestMetric, vitals)
    }
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(timeWindow: number = 60): {
    averageResponseTime: number
    errorRate: number
    requestCount: number
    slowRequestCount: number
    webVitals: {
      averageLCP: number
      averageFID: number
      averageCLS: number
    }
  } {
    const cutoff = Date.now() - (timeWindow * 60 * 1000)
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff)

    if (recentMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        errorRate: 0,
        requestCount: 0,
        slowRequestCount: 0,
        webVitals: { averageLCP: 0, averageFID: 0, averageCLS: 0 }
      }
    }

    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0)
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length
    const slowRequestCount = recentMetrics.filter(m => m.duration > 2000).length

    // Calculate Web Vitals averages
    const lcpMetrics = recentMetrics.filter(m => m.lcp).map(m => m.lcp!)
    const fidMetrics = recentMetrics.filter(m => m.fid).map(m => m.fid!)
    const clsMetrics = recentMetrics.filter(m => m.cls).map(m => m.cls!)

    return {
      averageResponseTime: totalDuration / recentMetrics.length,
      errorRate: (errorCount / recentMetrics.length) * 100,
      requestCount: recentMetrics.length,
      slowRequestCount,
      webVitals: {
        averageLCP: lcpMetrics.length > 0 ? lcpMetrics.reduce((a, b) => a + b, 0) / lcpMetrics.length : 0,
        averageFID: fidMetrics.length > 0 ? fidMetrics.reduce((a, b) => a + b, 0) / fidMetrics.length : 0,
        averageCLS: clsMetrics.length > 0 ? clsMetrics.reduce((a, b) => a + b, 0) / clsMetrics.length : 0
      }
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(check: HealthCheck): Promise<void> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), check.timeout)

      const response = await fetch(check.endpoint, {
        method: check.method,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.status === check.expectedStatus) {
        console.log(`✅ Health check passed: ${check.name}`)
      } else {
        console.error(`❌ Health check failed: ${check.name} - Expected ${check.expectedStatus}, got ${response.status}`)
        this.triggerAlert('health_check_failed', {
          checkName: check.name,
          expectedStatus: check.expectedStatus,
          actualStatus: response.status
        })
      }
    } catch (error) {
      console.error(`❌ Health check error: ${check.name} - ${error}`)
      this.triggerAlert('health_check_error', {
        checkName: check.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Evaluate alert rules
   */
  private evaluateAlerts(): void {
    const stats = this.getPerformanceStats(5) // Last 5 minutes

    this.alerts.forEach(alert => {
      if (!alert.enabled) return

      let shouldTrigger = false
      const { metric, operator, threshold } = alert.condition

      let value: number = 0
      switch (metric) {
        case 'duration':
          value = stats.averageResponseTime
          break
        case 'statusCode':
          value = stats.errorRate
          break
        case 'lcp':
          value = stats.webVitals.averageLCP
          break
        case 'fid':
          value = stats.webVitals.averageFID
          break
        case 'cls':
          value = stats.webVitals.averageCLS
          break
      }

      switch (operator) {
        case 'gt':
          shouldTrigger = value > threshold
          break
        case 'gte':
          shouldTrigger = value >= threshold
          break
        case 'lt':
          shouldTrigger = value < threshold
          break
        case 'lte':
          shouldTrigger = value <= threshold
          break
        case 'eq':
          shouldTrigger = value === threshold
          break
      }

      if (shouldTrigger) {
        this.triggerAlert(alert.id, { metric, value, threshold, stats })
      }
    })
  }

  /**
   * Trigger alert
   */
  private triggerAlert(alertId: string, context: Record<string, any>): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (!alert) {
      console.error(`⚠️ Alert triggered: ${alertId}`, context)
      return
    }

    console.error(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.name}`, context)

    alert.actions.forEach(action => {
      this.executeAlertAction(action, alert, context)
    })
  }

  /**
   * Execute alert action
   */
  private executeAlertAction(action: AlertAction, alert: AlertRule, context: Record<string, any>): void {
    switch (action.type) {
      case 'log':
        console.error(`📝 Alert logged: ${alert.name}`, { alert, context })
        break
      case 'email':
        // In a real implementation, this would send an email
        console.log(`📧 Email alert would be sent for: ${alert.name}`)
        break
      case 'webhook':
        // In a real implementation, this would call a webhook
        console.log(`🔗 Webhook alert would be triggered for: ${alert.name}`)
        break
      case 'rollback':
        console.error(`🔄 Rollback triggered by alert: ${alert.name}`)
        // This would trigger the rollback system
        break
    }
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlerts(): void {
    this.alerts = [
      {
        id: 'high_response_time',
        name: 'High Response Time',
        description: 'Average response time exceeds 2 seconds',
        enabled: true,
        condition: {
          metric: 'duration',
          operator: 'gt',
          threshold: 2000,
          timeWindow: 5
        },
        severity: 'high',
        actions: [
          { type: 'log', config: {} },
          { type: 'webhook', config: {} }
        ]
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds 5%',
        enabled: true,
        condition: {
          metric: 'statusCode',
          operator: 'gt',
          threshold: 5,
          timeWindow: 5
        },
        severity: 'critical',
        actions: [
          { type: 'log', config: {} },
          { type: 'email', config: {} },
          { type: 'webhook', config: {} }
        ]
      },
      {
        id: 'poor_lcp',
        name: 'Poor Largest Contentful Paint',
        description: 'LCP exceeds 2.5 seconds',
        enabled: true,
        condition: {
          metric: 'lcp',
          operator: 'gt',
          threshold: 2500,
          timeWindow: 10
        },
        severity: 'medium',
        actions: [
          { type: 'log', config: {} }
        ]
      }
    ]
  }

  /**
   * Initialize default health checks
   */
  private initializeDefaultHealthChecks(): void {
    this.healthChecks = [
      {
        id: 'homepage_health',
        name: 'Homepage Health',
        description: 'Check if homepage is accessible',
        endpoint: '/',
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000,
        interval: 60,
        enabled: true
      },
      {
        id: 'api_health',
        name: 'API Health',
        description: 'Check if API is responding',
        endpoint: '/api/health',
        method: 'GET',
        expectedStatus: 200,
        timeout: 5000,
        interval: 30,
        enabled: true
      }
    ]
  }

  /**
   * Get monitoring status
   */
  public getMonitoringStatus(): {
    isActive: boolean
    metricsCount: number
    alertsCount: number
    healthChecksCount: number
    lastMetricTimestamp?: number
  } {
    return {
      isActive: this.isMonitoring,
      metricsCount: this.metrics.length,
      alertsCount: this.alerts.filter(a => a.enabled).length,
      healthChecksCount: this.healthChecks.filter(h => h.enabled).length,
      lastMetricTimestamp: this.metrics.length > 0 ? this.metrics[this.metrics.length - 1].timestamp : undefined
    }
  }
}

// Global monitoring instance
export const deploymentMonitor = new DeploymentMonitor()