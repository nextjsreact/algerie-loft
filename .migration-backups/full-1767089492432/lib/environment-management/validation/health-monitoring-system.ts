/**
 * Health Monitoring System
 * 
 * Continuous health monitoring for environments with performance metrics
 * collection and alerting system for environment issues.
 * 
 * Requirements: 6.4
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Environment } from '../types'
import { ValidationEngine, ValidationEngineResult } from './validation-engine'
import { FunctionalityTestSuite, FunctionalityTestSuiteResult } from './functionality-test-suite'

export interface PerformanceMetrics {
  responseTime: number
  throughput: number // requests per second
  errorRate: number // percentage
  cpuUsage?: number
  memoryUsage?: number
  diskUsage?: number
  connectionCount: number
  activeQueries: number
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  score: number // 0-100
  lastChecked: Date
  uptime: number // in milliseconds
  issues: HealthIssue[]
}

export interface HealthIssue {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'connectivity' | 'performance' | 'data' | 'security' | 'functionality'
  title: string
  description: string
  recommendation: string
  firstDetected: Date
  lastSeen: Date
  resolved: boolean
}

export interface HealthReport {
  environmentId: string
  environmentName: string
  timestamp: Date
  healthStatus: HealthStatus
  performanceMetrics: PerformanceMetrics
  validationResult: ValidationEngineResult
  functionalityResult?: FunctionalityTestSuiteResult
  trends: HealthTrend[]
  alerts: HealthAlert[]
}

export interface HealthTrend {
  metric: string
  timeframe: '1h' | '24h' | '7d' | '30d'
  values: { timestamp: Date; value: number }[]
  trend: 'improving' | 'stable' | 'degrading'
}

export interface HealthAlert {
  id: string
  environmentId: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  message: string
  timestamp: Date
  acknowledged: boolean
  resolvedAt?: Date
}

export interface MonitoringConfig {
  checkInterval: number // in milliseconds
  performanceThresholds: {
    responseTime: number // max acceptable response time in ms
    errorRate: number // max acceptable error rate percentage
    throughput: number // min acceptable throughput
  }
  alerting: {
    enabled: boolean
    emailNotifications: boolean
    webhookUrl?: string
    escalationRules: EscalationRule[]
  }
  retention: {
    metricsRetentionDays: number
    alertsRetentionDays: number
    reportsRetentionDays: number
  }
}

export interface EscalationRule {
  condition: string
  delay: number // in minutes
  action: 'email' | 'webhook' | 'sms'
  recipients: string[]
}

export class HealthMonitoringSystem {
  private validationEngine: ValidationEngine
  private functionalityTestSuite: FunctionalityTestSuite
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()
  private healthHistory: Map<string, HealthReport[]> = new Map()
  private activeAlerts: Map<string, HealthAlert[]> = new Map()

  constructor(private config: MonitoringConfig) {
    this.validationEngine = new ValidationEngine()
    this.functionalityTestSuite = new FunctionalityTestSuite()
  }

  /**
   * Start continuous monitoring for an environment
   */
  public startMonitoring(env: Environment): void {
    // Stop existing monitoring if any
    this.stopMonitoring(env.id)

    // Start new monitoring interval
    const interval = setInterval(async () => {
      try {
        await this.performHealthCheck(env)
      } catch (error) {
        console.error(`Health check failed for environment ${env.id}:`, error)
        await this.createAlert(env.id, 'error', 'Health Check Failed', 
          `Failed to perform health check: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }, this.config.checkInterval)

    this.monitoringIntervals.set(env.id, interval)
  }

  /**
   * Stop monitoring for an environment
   */
  public stopMonitoring(environmentId: string): void {
    const interval = this.monitoringIntervals.get(environmentId)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(environmentId)
    }
  }

  /**
   * Perform comprehensive health check
   */
  public async performHealthCheck(env: Environment): Promise<HealthReport> {
    const startTime = Date.now()

    // Run validation engine
    const validationResult = await this.validationEngine.validateEnvironment(env)

    // Collect performance metrics
    const performanceMetrics = await this.collectPerformanceMetrics(env)

    // Determine health status
    const healthStatus = this.calculateHealthStatus(validationResult, performanceMetrics)

    // Run functionality tests periodically (every 10th check)
    let functionalityResult: FunctionalityTestSuiteResult | undefined
    if (!env.isProduction && Math.random() < 0.1) { // 10% chance, never on production
      try {
        functionalityResult = await this.functionalityTestSuite.runFullTestSuite(env)
      } catch (error) {
        console.warn('Functionality test failed:', error)
      }
    }

    // Generate trends
    const trends = this.generateHealthTrends(env.id)

    // Get active alerts
    const alerts = this.getActiveAlerts(env.id)

    const report: HealthReport = {
      environmentId: env.id,
      environmentName: env.name,
      timestamp: new Date(),
      healthStatus,
      performanceMetrics,
      validationResult,
      functionalityResult,
      trends,
      alerts
    }

    // Store report in history
    this.storeHealthReport(env.id, report)

    // Check for new issues and create alerts
    await this.checkForIssues(env, report)

    return report
  }

  /**
   * Collect performance metrics
   */
  public async collectPerformanceMetrics(env: Environment): Promise<PerformanceMetrics> {
    const startTime = Date.now()

    try {
      const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey)

      // Test response time with a simple query
      const queryStart = Date.now()
      const { error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
        .single()

      const responseTime = Date.now() - queryStart

      // Calculate error rate (simplified - in real implementation would track over time)
      const errorRate = error ? 100 : 0

      // Estimate throughput (simplified)
      const throughput = responseTime > 0 ? 1000 / responseTime : 0

      // Get connection count (if available)
      let connectionCount = 0
      let activeQueries = 0

      try {
        // Try to get database stats (requires service key)
        const adminClient = createClient(env.supabaseUrl, env.supabaseServiceKey)
        
        // This would require custom functions in the database
        const { data: stats } = await adminClient.rpc('get_db_stats')
        if (stats) {
          connectionCount = stats.connection_count || 0
          activeQueries = stats.active_queries || 0
        }
      } catch {
        // Stats not available, use defaults
      }

      return {
        responseTime,
        throughput,
        errorRate,
        connectionCount,
        activeQueries
      }
    } catch (error) {
      return {
        responseTime: -1,
        throughput: 0,
        errorRate: 100,
        connectionCount: 0,
        activeQueries: 0
      }
    }
  }

  /**
   * Calculate overall health status
   */
  private calculateHealthStatus(
    validation: ValidationEngineResult,
    performance: PerformanceMetrics
  ): HealthStatus {
    const issues: HealthIssue[] = []
    let score = 100

    // Validation issues
    if (!validation.connectivity.connected) {
      issues.push({
        id: 'connectivity-failed',
        severity: 'critical',
        category: 'connectivity',
        title: 'Database Connection Failed',
        description: 'Cannot connect to the database',
        recommendation: 'Check database credentials and network connectivity',
        firstDetected: new Date(),
        lastSeen: new Date(),
        resolved: false
      })
      score -= 50
    }

    if (!validation.schema.isValid) {
      issues.push({
        id: 'schema-invalid',
        severity: 'high',
        category: 'data',
        title: 'Schema Validation Failed',
        description: `Missing tables: ${validation.schema.missingTables.join(', ')}`,
        recommendation: 'Run schema synchronization to fix missing tables',
        firstDetected: new Date(),
        lastSeen: new Date(),
        resolved: false
      })
      score -= 30
    }

    if (!validation.auditSystem.isValid) {
      issues.push({
        id: 'audit-system-invalid',
        severity: 'medium',
        category: 'functionality',
        title: 'Audit System Issues',
        description: validation.auditSystem.errors.join(', '),
        recommendation: 'Check audit system configuration and triggers',
        firstDetected: new Date(),
        lastSeen: new Date(),
        resolved: false
      })
      score -= 20
    }

    // Performance issues
    if (performance.responseTime > this.config.performanceThresholds.responseTime) {
      issues.push({
        id: 'slow-response',
        severity: 'medium',
        category: 'performance',
        title: 'Slow Response Time',
        description: `Response time ${performance.responseTime}ms exceeds threshold ${this.config.performanceThresholds.responseTime}ms`,
        recommendation: 'Check database performance and optimize queries',
        firstDetected: new Date(),
        lastSeen: new Date(),
        resolved: false
      })
      score -= 15
    }

    if (performance.errorRate > this.config.performanceThresholds.errorRate) {
      issues.push({
        id: 'high-error-rate',
        severity: 'high',
        category: 'performance',
        title: 'High Error Rate',
        description: `Error rate ${performance.errorRate}% exceeds threshold ${this.config.performanceThresholds.errorRate}%`,
        recommendation: 'Investigate and fix recurring errors',
        firstDetected: new Date(),
        lastSeen: new Date(),
        resolved: false
      })
      score -= 25
    }

    // Determine status based on score and issues
    let status: HealthStatus['status'] = 'healthy'
    if (score < 50) status = 'critical'
    else if (score < 70) status = 'warning'
    else if (issues.length > 0) status = 'warning'

    return {
      status,
      score: Math.max(0, score),
      lastChecked: new Date(),
      uptime: Date.now(), // Simplified - would track actual uptime
      issues
    }
  }

  /**
   * Generate health trends
   */
  private generateHealthTrends(environmentId: string): HealthTrend[] {
    const history = this.healthHistory.get(environmentId) || []
    const trends: HealthTrend[] = []

    if (history.length < 2) return trends

    // Response time trend
    const responseTimeTrend = this.calculateTrend(
      history.map(h => ({ timestamp: h.timestamp, value: h.performanceMetrics.responseTime }))
    )

    trends.push({
      metric: 'responseTime',
      timeframe: '24h',
      values: history.slice(-24).map(h => ({ 
        timestamp: h.timestamp, 
        value: h.performanceMetrics.responseTime 
      })),
      trend: responseTimeTrend
    })

    // Health score trend
    const scoreTrend = this.calculateTrend(
      history.map(h => ({ timestamp: h.timestamp, value: h.healthStatus.score }))
    )

    trends.push({
      metric: 'healthScore',
      timeframe: '24h',
      values: history.slice(-24).map(h => ({ 
        timestamp: h.timestamp, 
        value: h.healthStatus.score 
      })),
      trend: scoreTrend
    })

    return trends
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(values: { timestamp: Date; value: number }[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 2) return 'stable'

    const recent = values.slice(-5) // Last 5 values
    const older = values.slice(-10, -5) // Previous 5 values

    if (recent.length === 0 || older.length === 0) return 'stable'

    const recentAvg = recent.reduce((sum, v) => sum + v.value, 0) / recent.length
    const olderAvg = older.reduce((sum, v) => sum + v.value, 0) / older.length

    const change = ((recentAvg - olderAvg) / olderAvg) * 100

    if (change > 5) return 'improving'
    if (change < -5) return 'degrading'
    return 'stable'
  }

  /**
   * Store health report in history
   */
  private storeHealthReport(environmentId: string, report: HealthReport): void {
    const history = this.healthHistory.get(environmentId) || []
    history.push(report)

    // Keep only recent reports (based on retention policy)
    const cutoffDate = new Date(Date.now() - this.config.retention.reportsRetentionDays * 24 * 60 * 60 * 1000)
    const filteredHistory = history.filter(h => h.timestamp > cutoffDate)

    this.healthHistory.set(environmentId, filteredHistory)
  }

  /**
   * Check for issues and create alerts
   */
  private async checkForIssues(env: Environment, report: HealthReport): Promise<void> {
    for (const issue of report.healthStatus.issues) {
      // Check if this is a new issue or escalation needed
      const existingAlerts = this.getActiveAlerts(env.id)
      const existingAlert = existingAlerts.find(a => a.title === issue.title)

      if (!existingAlert) {
        // Create new alert
        await this.createAlert(
          env.id,
          this.mapSeverityToAlertLevel(issue.severity),
          issue.title,
          issue.description
        )
      }
    }
  }

  /**
   * Create a new alert
   */
  private async createAlert(
    environmentId: string,
    severity: HealthAlert['severity'],
    title: string,
    message: string
  ): Promise<void> {
    const alert: HealthAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      environmentId,
      severity,
      title,
      message,
      timestamp: new Date(),
      acknowledged: false
    }

    const alerts = this.activeAlerts.get(environmentId) || []
    alerts.push(alert)
    this.activeAlerts.set(environmentId, alerts)

    // Send notifications if enabled
    if (this.config.alerting.enabled) {
      await this.sendAlertNotification(alert)
    }
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: HealthAlert): Promise<void> {
    try {
      if (this.config.alerting.webhookUrl) {
        // Send webhook notification
        await fetch(this.config.alerting.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert,
            timestamp: new Date().toISOString()
          })
        })
      }

      // Email notifications would be implemented here
      if (this.config.alerting.emailNotifications) {
        console.log(`Email alert: ${alert.title} - ${alert.message}`)
      }
    } catch (error) {
      console.error('Failed to send alert notification:', error)
    }
  }

  /**
   * Get active alerts for an environment
   */
  public getActiveAlerts(environmentId: string): HealthAlert[] {
    return this.activeAlerts.get(environmentId) || []
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(environmentId: string, alertId: string): void {
    const alerts = this.activeAlerts.get(environmentId) || []
    const alert = alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
    }
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(environmentId: string, alertId: string): void {
    const alerts = this.activeAlerts.get(environmentId) || []
    const alertIndex = alerts.findIndex(a => a.id === alertId)
    if (alertIndex >= 0) {
      alerts[alertIndex].resolvedAt = new Date()
      // Remove resolved alerts after some time
      setTimeout(() => {
        const currentAlerts = this.activeAlerts.get(environmentId) || []
        const filteredAlerts = currentAlerts.filter(a => a.id !== alertId)
        this.activeAlerts.set(environmentId, filteredAlerts)
      }, 60000) // Remove after 1 minute
    }
  }

  /**
   * Get health history for an environment
   */
  public getHealthHistory(environmentId: string, timeframe?: '1h' | '24h' | '7d' | '30d'): HealthReport[] {
    const history = this.healthHistory.get(environmentId) || []
    
    if (!timeframe) return history

    const now = Date.now()
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }

    const cutoff = new Date(now - timeframes[timeframe])
    return history.filter(h => h.timestamp > cutoff)
  }

  /**
   * Map issue severity to alert level
   */
  private mapSeverityToAlertLevel(severity: HealthIssue['severity']): HealthAlert['severity'] {
    switch (severity) {
      case 'low': return 'info'
      case 'medium': return 'warning'
      case 'high': return 'error'
      case 'critical': return 'critical'
      default: return 'info'
    }
  }

  /**
   * Cleanup old data based on retention policies
   */
  public cleanup(): void {
    const now = Date.now()

    // Cleanup health history
    for (const [envId, history] of this.healthHistory.entries()) {
      const cutoff = new Date(now - this.config.retention.reportsRetentionDays * 24 * 60 * 60 * 1000)
      const filtered = history.filter(h => h.timestamp > cutoff)
      this.healthHistory.set(envId, filtered)
    }

    // Cleanup old alerts
    for (const [envId, alerts] of this.activeAlerts.entries()) {
      const cutoff = new Date(now - this.config.retention.alertsRetentionDays * 24 * 60 * 60 * 1000)
      const filtered = alerts.filter(a => a.timestamp > cutoff)
      this.activeAlerts.set(envId, filtered)
    }
  }

  /**
   * Stop all monitoring
   */
  public stopAllMonitoring(): void {
    for (const [envId] of this.monitoringIntervals.entries()) {
      this.stopMonitoring(envId)
    }
  }
}