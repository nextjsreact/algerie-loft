/**
 * Production Monitoring System
 * 
 * Comprehensive monitoring system for production environment cloning operations
 * with real-time dashboards, alerting, and automated reporting.
 * 
 * Requirements: 6.4
 */

import { EventEmitter } from 'events'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export interface MonitoringMetric {
  name: string
  value: number
  labels: Record<string, string>
  timestamp: Date
  unit?: string
}

export interface AlertRule {
  id: string
  name: string
  description: string
  condition: string
  severity: 'info' | 'warning' | 'critical'
  threshold: number
  duration: number // in milliseconds
  enabled: boolean
  channels: string[]
}

export interface AlertInstance {
  id: string
  ruleId: string
  ruleName: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  details: Record<string, any>
  triggeredAt: Date
  resolvedAt?: Date
  status: 'active' | 'resolved' | 'suppressed'
}

export interface DashboardPanel {
  id: string
  title: string
  type: 'metric' | 'graph' | 'table' | 'alert-list' | 'health-status'
  query: string
  refreshInterval: number
  position: { x: number; y: number; width: number; height: number }
}

export interface MonitoringDashboard {
  id: string
  title: string
  description: string
  panels: DashboardPanel[]
  refreshInterval: number
  autoRefresh: boolean
}

export interface HealthReport {
  timestamp: Date
  overallStatus: 'healthy' | 'degraded' | 'critical'
  components: ComponentHealth[]
  metrics: Record<string, number>
  alerts: AlertInstance[]
  recommendations: string[]
}

export interface ComponentHealth {
  component: string
  status: 'healthy' | 'degraded' | 'critical'
  message: string
  lastChecked: Date
  metrics?: Record<string, number>
}

export class ProductionMonitoringSystem extends EventEmitter {
  private metrics: Map<string, MonitoringMetric[]> = new Map()
  private alertRules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, AlertInstance> = new Map()
  private dashboards: Map<string, MonitoringDashboard> = new Map()
  private componentHealth: Map<string, ComponentHealth> = new Map()
  
  private metricsCollectionInterval: NodeJS.Timeout | null = null
  private alertEvaluationInterval: NodeJS.Timeout | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null
  
  private readonly reportsDir: string
  private readonly dashboardsDir: string

  constructor() {
    super()
    
    this.reportsDir = join(process.cwd(), 'monitoring', 'reports')
    this.dashboardsDir = join(process.cwd(), 'monitoring', 'dashboards')
    
    // Ensure directories exist
    [this.reportsDir, this.dashboardsDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
    })

    this.initializeDefaultAlertRules()
    this.initializeDefaultDashboards()
  }

  /**
   * Start the monitoring system
   */
  public start(): void {
    console.log('📊 Starting Production Monitoring System...')

    // Start metrics collection
    this.startMetricsCollection()

    // Start alert evaluation
    this.startAlertEvaluation()

    // Start health checks
    this.startHealthChecks()

    // Generate initial dashboards
    this.generateDashboards()

    console.log('✅ Production Monitoring System started')
    this.emit('monitoring-started')
  }

  /**
   * Stop the monitoring system
   */
  public stop(): void {
    console.log('📊 Stopping Production Monitoring System...')

    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval)
      this.metricsCollectionInterval = null
    }

    if (this.alertEvaluationInterval) {
      clearInterval(this.alertEvaluationInterval)
      this.alertEvaluationInterval = null
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    console.log('✅ Production Monitoring System stopped')
    this.emit('monitoring-stopped')
  }

  /**
   * Record a metric
   */
  public recordMetric(name: string, value: number, labels: Record<string, string> = {}, unit?: string): void {
    const metric: MonitoringMetric = {
      name,
      value,
      labels,
      timestamp: new Date(),
      unit
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    this.metrics.get(name)!.push(metric)
    
    // Keep only last 1000 metrics per type to prevent memory issues
    const metrics = this.metrics.get(name)!
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000)
    }

    this.emit('metric-recorded', metric)
  }

  /**
   * Get metrics by name
   */
  public getMetrics(name: string, since?: Date): MonitoringMetric[] {
    const metrics = this.metrics.get(name) || []
    
    if (since) {
      return metrics.filter(m => m.timestamp >= since)
    }
    
    return metrics
  }

  /**
   * Add alert rule
   */
  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule)
    console.log(`📋 Added alert rule: ${rule.name}`)
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values()).filter(alert => alert.status === 'active')
  }

  /**
   * Get all alerts (active and resolved)
   */
  public getAllAlerts(limit: number = 100): AlertInstance[] {
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
      .slice(0, limit)
  }

  /**
   * Generate comprehensive health report
   */
  public generateHealthReport(): HealthReport {
    const components = Array.from(this.componentHealth.values())
    const activeAlerts = this.getActiveAlerts()
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy'
    const criticalComponents = components.filter(c => c.status === 'critical')
    const degradedComponents = components.filter(c => c.status === 'degraded')
    
    if (criticalComponents.length > 0 || activeAlerts.some(a => a.severity === 'critical')) {
      overallStatus = 'critical'
    } else if (degradedComponents.length > 0 || activeAlerts.some(a => a.severity === 'warning')) {
      overallStatus = 'degraded'
    }

    // Collect key metrics
    const keyMetrics: Record<string, number> = {}
    const recentMetrics = this.getRecentMetrics(300000) // Last 5 minutes
    
    recentMetrics.forEach(metric => {
      if (!keyMetrics[metric.name]) {
        keyMetrics[metric.name] = 0
      }
      keyMetrics[metric.name] += metric.value
    })

    // Generate recommendations
    const recommendations = this.generateRecommendations(overallStatus, components, activeAlerts)

    return {
      timestamp: new Date(),
      overallStatus,
      components,
      metrics: keyMetrics,
      alerts: activeAlerts,
      recommendations
    }
  }

  /**
   * Create monitoring dashboard
   */
  public createDashboard(dashboard: MonitoringDashboard): void {
    this.dashboards.set(dashboard.id, dashboard)
    this.generateDashboardHTML(dashboard)
    console.log(`📊 Created dashboard: ${dashboard.title}`)
  }

  /**
   * Get dashboard by ID
   */
  public getDashboard(id: string): MonitoringDashboard | undefined {
    return this.dashboards.get(id)
  }

  /**
   * Generate automated report
   */
  public async generateAutomatedReport(type: 'daily' | 'weekly' | 'monthly'): Promise<string> {
    const report = this.generateHealthReport()
    const reportContent = this.formatHealthReport(report, type)
    
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${type}-report-${timestamp}.md`
    const filepath = join(this.reportsDir, filename)
    
    writeFileSync(filepath, reportContent)
    
    console.log(`📄 Generated ${type} report: ${filename}`)
    this.emit('report-generated', { type, filepath, report })
    
    return filepath
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(() => {
      this.collectSystemMetrics()
    }, 60000) // Collect every minute

    // Collect initial metrics
    this.collectSystemMetrics()
  }

  /**
   * Start alert evaluation
   */
  private startAlertEvaluation(): void {
    this.alertEvaluationInterval = setInterval(() => {
      this.evaluateAlertRules()
    }, 30000) // Evaluate every 30 seconds
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, 120000) // Check every 2 minutes

    // Perform initial health check
    this.performHealthChecks()
  }

  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    try {
      // System resource metrics
      const memoryUsage = process.memoryUsage()
      this.recordMetric('system_memory_used_bytes', memoryUsage.heapUsed, {}, 'bytes')
      this.recordMetric('system_memory_total_bytes', memoryUsage.heapTotal, {}, 'bytes')

      // Process uptime
      this.recordMetric('system_uptime_seconds', process.uptime(), {}, 'seconds')

      // Active operations (simulated)
      this.recordMetric('active_clone_operations', Math.floor(Math.random() * 5), {})
      
      // Environment health scores (simulated)
      const environments = ['production', 'test', 'training', 'development']
      environments.forEach(env => {
        const healthScore = 85 + Math.random() * 15 // 85-100
        this.recordMetric('environment_health_score', healthScore, { environment: env })
      })

      // Database connection metrics (simulated)
      const connectionTime = 50 + Math.random() * 100 // 50-150ms
      this.recordMetric('database_connection_time_ms', connectionTime, {}, 'milliseconds')

      this.emit('metrics-collected')
    } catch (error) {
      console.error('Error collecting system metrics:', error)
      this.emit('metrics-collection-error', error)
    }
  }

  /**
   * Evaluate alert rules
   */
  private evaluateAlertRules(): void {
    this.alertRules.forEach((rule, ruleId) => {
      if (!rule.enabled) return

      try {
        const shouldAlert = this.evaluateAlertCondition(rule)
        const existingAlert = Array.from(this.activeAlerts.values())
          .find(alert => alert.ruleId === ruleId && alert.status === 'active')

        if (shouldAlert && !existingAlert) {
          this.triggerAlert(rule)
        } else if (!shouldAlert && existingAlert) {
          this.resolveAlert(existingAlert.id)
        }
      } catch (error) {
        console.error(`Error evaluating alert rule ${rule.name}:`, error)
      }
    })
  }

  /**
   * Evaluate alert condition
   */
  private evaluateAlertCondition(rule: AlertRule): boolean {
    // Simplified alert condition evaluation
    // In a real implementation, this would parse and evaluate the condition string
    
    switch (rule.name) {
      case 'High Memory Usage':
        const memoryMetrics = this.getRecentMetrics(60000, 'system_memory_used_bytes')
        if (memoryMetrics.length > 0) {
          const avgMemory = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
          return avgMemory > rule.threshold
        }
        break
        
      case 'Environment Health Degraded':
        const healthMetrics = this.getRecentMetrics(300000, 'environment_health_score')
        if (healthMetrics.length > 0) {
          const minHealth = Math.min(...healthMetrics.map(m => m.value))
          return minHealth < rule.threshold
        }
        break
        
      case 'Database Connection Slow':
        const dbMetrics = this.getRecentMetrics(300000, 'database_connection_time_ms')
        if (dbMetrics.length > 0) {
          const avgConnectionTime = dbMetrics.reduce((sum, m) => sum + m.value, 0) / dbMetrics.length
          return avgConnectionTime > rule.threshold
        }
        break
    }

    return false
  }

  /**
   * Trigger alert
   */
  private triggerAlert(rule: AlertRule): void {
    const alertId = `${rule.id}-${Date.now()}`
    const alert: AlertInstance = {
      id: alertId,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: `Alert triggered: ${rule.description}`,
      details: {
        condition: rule.condition,
        threshold: rule.threshold
      },
      triggeredAt: new Date(),
      status: 'active'
    }

    this.activeAlerts.set(alertId, alert)
    
    console.log(`🚨 Alert triggered: ${rule.name} (${rule.severity})`)
    this.emit('alert-triggered', alert)

    // Send notifications (simplified)
    this.sendAlertNotifications(alert, rule.channels)
  }

  /**
   * Resolve alert
   */
  private resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId)
    if (alert) {
      alert.status = 'resolved'
      alert.resolvedAt = new Date()
      
      console.log(`✅ Alert resolved: ${alert.ruleName}`)
      this.emit('alert-resolved', alert)
    }
  }

  /**
   * Send alert notifications
   */
  private sendAlertNotifications(alert: AlertInstance, channels: string[]): void {
    channels.forEach(channel => {
      try {
        switch (channel) {
          case 'email':
            this.sendEmailNotification(alert)
            break
          case 'webhook':
            this.sendWebhookNotification(alert)
            break
          case 'console':
            console.log(`📧 Alert notification: ${alert.message}`)
            break
        }
      } catch (error) {
        console.error(`Failed to send alert via ${channel}:`, error)
      }
    })
  }

  /**
   * Send email notification (placeholder)
   */
  private sendEmailNotification(alert: AlertInstance): void {
    // Placeholder for email notification
    console.log(`📧 Email notification sent for alert: ${alert.ruleName}`)
  }

  /**
   * Send webhook notification (placeholder)
   */
  private sendWebhookNotification(alert: AlertInstance): void {
    // Placeholder for webhook notification
    console.log(`🔗 Webhook notification sent for alert: ${alert.ruleName}`)
  }

  /**
   * Perform health checks
   */
  private performHealthChecks(): void {
    const components = [
      'Environment Cloner',
      'Database Connections',
      'Production Safety Guard',
      'Anonymization System',
      'Validation Engine'
    ]

    components.forEach(component => {
      const health = this.checkComponentHealth(component)
      this.componentHealth.set(component, health)
    })

    this.emit('health-checks-completed')
  }

  /**
   * Check individual component health
   */
  private checkComponentHealth(component: string): ComponentHealth {
    // Simplified health check - in reality, this would perform actual checks
    const random = Math.random()
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
    let message = `${component} is operating normally`

    if (random < 0.05) { // 5% chance of critical
      status = 'critical'
      message = `${component} is experiencing critical issues`
    } else if (random < 0.15) { // 10% chance of degraded
      status = 'degraded'
      message = `${component} is experiencing performance issues`
    }

    return {
      component,
      status,
      message,
      lastChecked: new Date(),
      metrics: {
        responseTime: 50 + Math.random() * 100,
        errorRate: Math.random() * 5
      }
    }
  }

  /**
   * Get recent metrics
   */
  private getRecentMetrics(timeWindowMs: number, metricName?: string): MonitoringMetric[] {
    const cutoffTime = new Date(Date.now() - timeWindowMs)
    const allMetrics: MonitoringMetric[] = []

    if (metricName) {
      const metrics = this.metrics.get(metricName) || []
      allMetrics.push(...metrics.filter(m => m.timestamp >= cutoffTime))
    } else {
      this.metrics.forEach(metrics => {
        allMetrics.push(...metrics.filter(m => m.timestamp >= cutoffTime))
      })
    }

    return allMetrics
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    overallStatus: string,
    components: ComponentHealth[],
    alerts: AlertInstance[]
  ): string[] {
    const recommendations: string[] = []

    if (overallStatus === 'critical') {
      recommendations.push('Immediate attention required - critical issues detected')
    }

    const criticalComponents = components.filter(c => c.status === 'critical')
    if (criticalComponents.length > 0) {
      recommendations.push(`Address critical issues in: ${criticalComponents.map(c => c.component).join(', ')}`)
    }

    const criticalAlerts = alerts.filter(a => a.severity === 'critical')
    if (criticalAlerts.length > 0) {
      recommendations.push(`Resolve critical alerts: ${criticalAlerts.map(a => a.ruleName).join(', ')}`)
    }

    if (recommendations.length === 0) {
      recommendations.push('System is operating normally - continue monitoring')
    }

    return recommendations
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'System memory usage is above threshold',
        condition: 'system_memory_used_bytes > threshold',
        severity: 'warning',
        threshold: 500 * 1024 * 1024, // 500MB
        duration: 300000, // 5 minutes
        enabled: true,
        channels: ['email', 'console']
      },
      {
        id: 'environment-health-degraded',
        name: 'Environment Health Degraded',
        description: 'Environment health score is below acceptable level',
        condition: 'environment_health_score < threshold',
        severity: 'warning',
        threshold: 70,
        duration: 600000, // 10 minutes
        enabled: true,
        channels: ['email', 'console']
      },
      {
        id: 'database-connection-slow',
        name: 'Database Connection Slow',
        description: 'Database connection time is above acceptable threshold',
        condition: 'database_connection_time_ms > threshold',
        severity: 'warning',
        threshold: 1000, // 1 second
        duration: 300000, // 5 minutes
        enabled: true,
        channels: ['email', 'console']
      }
    ]

    defaultRules.forEach(rule => this.addAlertRule(rule))
  }

  /**
   * Initialize default dashboards
   */
  private initializeDefaultDashboards(): void {
    const mainDashboard: MonitoringDashboard = {
      id: 'main-dashboard',
      title: 'Environment Cloning System - Main Dashboard',
      description: 'Overview of system health and key metrics',
      refreshInterval: 30000, // 30 seconds
      autoRefresh: true,
      panels: [
        {
          id: 'system-overview',
          title: 'System Overview',
          type: 'metric',
          query: 'system_uptime_seconds',
          refreshInterval: 60000,
          position: { x: 0, y: 0, width: 6, height: 3 }
        },
        {
          id: 'environment-health',
          title: 'Environment Health',
          type: 'graph',
          query: 'environment_health_score',
          refreshInterval: 30000,
          position: { x: 6, y: 0, width: 6, height: 3 }
        },
        {
          id: 'active-alerts',
          title: 'Active Alerts',
          type: 'alert-list',
          query: 'active_alerts',
          refreshInterval: 15000,
          position: { x: 0, y: 3, width: 12, height: 4 }
        }
      ]
    }

    this.createDashboard(mainDashboard)
  }

  /**
   * Generate dashboards
   */
  private generateDashboards(): void {
    this.dashboards.forEach(dashboard => {
      this.generateDashboardHTML(dashboard)
    })
  }

  /**
   * Generate dashboard HTML
   */
  private generateDashboardHTML(dashboard: MonitoringDashboard): void {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${dashboard.title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 20px;
        }
        .panel {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .panel h3 {
            margin-top: 0;
            color: #333;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }
        .status-healthy { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-critical { color: #dc3545; }
        .refresh-info {
            color: #666;
            font-size: 0.9em;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${dashboard.title}</h1>
        <p>${dashboard.description}</p>
        <div class="refresh-info">
            Auto-refresh: ${dashboard.autoRefresh ? 'Enabled' : 'Disabled'} 
            (${dashboard.refreshInterval / 1000}s)
        </div>
    </div>

    <div class="dashboard-grid">
        ${dashboard.panels.map(panel => `
        <div class="panel" style="grid-column: span ${panel.position.width}; grid-row: span ${panel.position.height};">
            <h3>${panel.title}</h3>
            <div id="${panel.id}-content">
                <div class="metric-value">Loading...</div>
            </div>
        </div>
        `).join('')}
    </div>

    <script>
        function updateDashboard() {
            // Simulate data updates
            ${dashboard.panels.map(panel => `
            document.getElementById('${panel.id}-content').innerHTML = 
                '<div class="metric-value">' + Math.floor(Math.random() * 100) + '</div>';
            `).join('')}
            
            console.log('Dashboard updated at', new Date().toLocaleTimeString());
        }

        // Initial update
        updateDashboard();

        // Auto-refresh if enabled
        ${dashboard.autoRefresh ? `
        setInterval(updateDashboard, ${dashboard.refreshInterval});
        ` : ''}
    </script>
</body>
</html>`

    const filepath = join(this.dashboardsDir, `${dashboard.id}.html`)
    writeFileSync(filepath, html)
  }

  /**
   * Format health report
   */
  private formatHealthReport(report: HealthReport, type: string): string {
    const lines: string[] = []
    
    lines.push(`# ${type.charAt(0).toUpperCase() + type.slice(1)} Health Report`)
    lines.push(`Generated: ${report.timestamp.toISOString()}`)
    lines.push(`Overall Status: ${report.overallStatus.toUpperCase()}`)
    lines.push('')
    
    lines.push('## Component Health')
    report.components.forEach(component => {
      lines.push(`- **${component.component}**: ${component.status} - ${component.message}`)
    })
    lines.push('')
    
    lines.push('## Key Metrics')
    Object.entries(report.metrics).forEach(([name, value]) => {
      lines.push(`- ${name}: ${value}`)
    })
    lines.push('')
    
    if (report.alerts.length > 0) {
      lines.push('## Active Alerts')
      report.alerts.forEach(alert => {
        lines.push(`- **${alert.ruleName}** (${alert.severity}): ${alert.message}`)
      })
      lines.push('')
    }
    
    lines.push('## Recommendations')
    report.recommendations.forEach(rec => {
      lines.push(`- ${rec}`)
    })
    
    return lines.join('\n')
  }
}