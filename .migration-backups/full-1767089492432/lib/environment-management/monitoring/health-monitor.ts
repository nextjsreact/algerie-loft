/**
 * Health Monitor
 * 
 * Monitors environment health, performs health checks, and tracks metrics
 */

import { 
  HealthStatus, 
  HealthCheck, 
  EnvironmentMetrics, 
  MonitoringConfig 
} from './types'
import { Environment } from '../types'
import { SecurityIncidentManager } from './security-incident-manager'

export class HealthMonitor {
  private healthStatuses: Map<string, HealthStatus> = new Map()
  private config: MonitoringConfig
  private securityManager: SecurityIncidentManager
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      enableDetailedLogging: true,
      logLevel: 'info',
      metricsRetentionDays: 30,
      alertingEnabled: true,
      healthCheckInterval: 60000, // 1 minute
      maxConcurrentOperations: 5,
      operationTimeout: 3600000, // 1 hour
      enablePerformanceMetrics: true,
      enableSecurityMonitoring: true,
      ...config
    }
    
    this.securityManager = new SecurityIncidentManager()
  }

  /**
   * Starts monitoring an environment
   */
  public startMonitoring(environment: Environment): void {
    console.log(`🔍 Starting health monitoring for environment: ${environment.name}`)
    
    // Perform initial health check
    this.performHealthCheck(environment)
    
    // Set up periodic health checks
    const interval = setInterval(() => {
      this.performHealthCheck(environment)
    }, this.config.healthCheckInterval)
    
    this.healthCheckIntervals.set(environment.id, interval)
  }

  /**
   * Stops monitoring an environment
   */
  public stopMonitoring(environmentId: string): void {
    const interval = this.healthCheckIntervals.get(environmentId)
    if (interval) {
      clearInterval(interval)
      this.healthCheckIntervals.delete(environmentId)
      console.log(`⏹️ Stopped health monitoring for environment: ${environmentId}`)
    }
  }

  /**
   * Performs a comprehensive health check
   */
  public async performHealthCheck(environment: Environment): Promise<HealthStatus> {
    const startTime = Date.now()
    const checks: HealthCheck[] = []
    
    try {
      // Database connectivity check
      checks.push(await this.checkDatabaseConnectivity(environment))
      
      // Schema validation check
      checks.push(await this.checkSchemaIntegrity(environment))
      
      // Performance check
      checks.push(await this.checkPerformance(environment))
      
      // Security check
      checks.push(await this.checkSecurity(environment))
      
      // Resource usage check
      checks.push(await this.checkResourceUsage(environment))
      
      // Determine overall health status
      const overallStatus = this.determineOverallStatus(checks)
      
      // Generate metrics
      const metrics = await this.generateEnvironmentMetrics(environment)
      
      // Calculate uptime
      const previousStatus = this.healthStatuses.get(environment.id)
      const uptime = previousStatus ? Date.now() - previousStatus.timestamp.getTime() : 0
      
      const healthStatus: HealthStatus = {
        environmentId: environment.id,
        timestamp: new Date(),
        overall: overallStatus,
        checks,
        uptime,
        lastSuccessfulOperation: previousStatus?.lastSuccessfulOperation,
        metrics
      }
      
      this.healthStatuses.set(environment.id, healthStatus)
      
      // Log health status changes
      if (!previousStatus || previousStatus.overall !== overallStatus) {
        this.logHealthStatusChange(environment, overallStatus, previousStatus?.overall)
      }
      
      // Alert on health issues
      if (overallStatus === 'critical' || overallStatus === 'warning') {
        this.alertOnHealthIssue(environment, healthStatus)
      }
      
      return healthStatus
      
    } catch (error) {
      const errorCheck: HealthCheck = {
        name: 'Health Check Execution',
        status: 'fail',
        message: `Health check failed: ${error.message}`,
        duration: Date.now() - startTime
      }
      
      const healthStatus: HealthStatus = {
        environmentId: environment.id,
        timestamp: new Date(),
        overall: 'critical',
        checks: [errorCheck],
        uptime: 0,
        metrics: this.getDefaultMetrics()
      }
      
      this.healthStatuses.set(environment.id, healthStatus)
      
      // Report as security incident
      this.securityManager.reportIncident({
        type: 'system_error',
        severity: 'high',
        description: `Health check failed for environment ${environment.id}: ${error.message}`,
        environmentId: environment.id,
        component: 'HealthMonitor'
      })
      
      return healthStatus
    }
  }

  /**
   * Gets current health status for an environment
   */
  public getHealthStatus(environmentId: string): HealthStatus | undefined {
    return this.healthStatuses.get(environmentId)
  }

  /**
   * Gets health status for all monitored environments
   */
  public getAllHealthStatuses(): HealthStatus[] {
    return Array.from(this.healthStatuses.values())
  }

  /**
   * Gets environments with health issues
   */
  public getUnhealthyEnvironments(): HealthStatus[] {
    return this.getAllHealthStatuses().filter(status => 
      status.overall === 'warning' || status.overall === 'critical'
    )
  }

  /**
   * Generates health report
   */
  public generateHealthReport(): string {
    const allStatuses = this.getAllHealthStatuses()
    const healthy = allStatuses.filter(s => s.overall === 'healthy').length
    const warning = allStatuses.filter(s => s.overall === 'warning').length
    const critical = allStatuses.filter(s => s.overall === 'critical').length
    const unknown = allStatuses.filter(s => s.overall === 'unknown').length
    
    const report = [
      `=== Environment Health Report ===`,
      `Generated: ${new Date().toISOString()}`,
      ``,
      `=== Summary ===`,
      `Total Environments: ${allStatuses.length}`,
      `Healthy: ${healthy}`,
      `Warning: ${warning}`,
      `Critical: ${critical}`,
      `Unknown: ${unknown}`,
      ``,
      `=== Environment Details ===`,
      ...allStatuses.map(status => {
        const statusEmoji = {
          healthy: '✅',
          warning: '⚠️',
          critical: '❌',
          unknown: '❓'
        }
        
        const failedChecks = status.checks.filter(c => c.status === 'fail').length
        const warningChecks = status.checks.filter(c => c.status === 'warning').length
        
        return [
          `${statusEmoji[status.overall]} Environment: ${status.environmentId}`,
          `   Status: ${status.overall.toUpperCase()}`,
          `   Last Check: ${status.timestamp.toISOString()}`,
          `   Uptime: ${this.formatDuration(status.uptime)}`,
          `   Checks: ${status.checks.length} total, ${failedChecks} failed, ${warningChecks} warnings`,
          `   Response Time: ${status.metrics.responseTime.average}ms avg`,
          `   Error Rate: ${status.metrics.errorRate.toFixed(2)}%`,
          ``
        ].join('\n')
      })
    ].join('\n')
    
    return report
  }

  /**
   * Individual health check methods
   */
  private async checkDatabaseConnectivity(environment: Environment): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      // In a real implementation, this would test actual database connectivity
      // For now, we simulate the check
      await this.simulateAsyncOperation(100) // Simulate 100ms database check
      
      return {
        name: 'Database Connectivity',
        status: 'pass',
        message: 'Database connection successful',
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        name: 'Database Connectivity',
        status: 'fail',
        message: `Database connection failed: ${error.message}`,
        duration: Date.now() - startTime
      }
    }
  }

  private async checkSchemaIntegrity(environment: Environment): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      // In a real implementation, this would validate database schema
      await this.simulateAsyncOperation(200) // Simulate 200ms schema check
      
      return {
        name: 'Schema Integrity',
        status: 'pass',
        message: 'Database schema is valid',
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        name: 'Schema Integrity',
        status: 'fail',
        message: `Schema validation failed: ${error.message}`,
        duration: Date.now() - startTime
      }
    }
  }

  private async checkPerformance(environment: Environment): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      // Simulate performance check
      const responseTime = Math.random() * 1000 // Random response time 0-1000ms
      await this.simulateAsyncOperation(responseTime)
      
      const status = responseTime > 500 ? 'warning' : 'pass'
      const message = responseTime > 500 
        ? `Slow response time: ${responseTime.toFixed(0)}ms`
        : `Good response time: ${responseTime.toFixed(0)}ms`
      
      return {
        name: 'Performance',
        status,
        message,
        duration: Date.now() - startTime,
        metadata: { responseTime }
      }
    } catch (error) {
      return {
        name: 'Performance',
        status: 'fail',
        message: `Performance check failed: ${error.message}`,
        duration: Date.now() - startTime
      }
    }
  }

  private async checkSecurity(environment: Environment): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      // Check if production environment has proper security settings
      if (environment.type === 'production') {
        if (environment.allowWrites !== false) {
          return {
            name: 'Security',
            status: 'fail',
            message: 'Production environment allows writes - SECURITY RISK',
            duration: Date.now() - startTime
          }
        }
      }
      
      return {
        name: 'Security',
        status: 'pass',
        message: 'Security configuration is valid',
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        name: 'Security',
        status: 'fail',
        message: `Security check failed: ${error.message}`,
        duration: Date.now() - startTime
      }
    }
  }

  private async checkResourceUsage(environment: Environment): Promise<HealthCheck> {
    const startTime = Date.now()
    
    try {
      // Simulate resource usage check
      const cpuUsage = Math.random() * 100
      const memoryUsage = Math.random() * 100
      const storageUsage = Math.random() * 100
      
      let status: HealthCheck['status'] = 'pass'
      let message = 'Resource usage is normal'
      
      if (cpuUsage > 90 || memoryUsage > 90 || storageUsage > 90) {
        status = 'warning'
        message = 'High resource usage detected'
      }
      
      return {
        name: 'Resource Usage',
        status,
        message,
        duration: Date.now() - startTime,
        metadata: { cpuUsage, memoryUsage, storageUsage }
      }
    } catch (error) {
      return {
        name: 'Resource Usage',
        status: 'fail',
        message: `Resource check failed: ${error.message}`,
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Helper methods
   */
  private determineOverallStatus(checks: HealthCheck[]): HealthStatus['overall'] {
    const failedChecks = checks.filter(c => c.status === 'fail')
    const warningChecks = checks.filter(c => c.status === 'warning')
    
    if (failedChecks.length > 0) {
      return 'critical'
    } else if (warningChecks.length > 0) {
      return 'warning'
    } else if (checks.length > 0) {
      return 'healthy'
    } else {
      return 'unknown'
    }
  }

  private async generateEnvironmentMetrics(environment: Environment): Promise<EnvironmentMetrics> {
    // In a real implementation, these would be actual metrics from the environment
    return {
      databaseConnections: {
        active: Math.floor(Math.random() * 10),
        idle: Math.floor(Math.random() * 5),
        total: Math.floor(Math.random() * 15),
        maxAllowed: 100
      },
      responseTime: {
        average: Math.random() * 500,
        p95: Math.random() * 1000,
        p99: Math.random() * 2000
      },
      errorRate: Math.random() * 5, // 0-5%
      throughput: Math.random() * 1000, // 0-1000 ops/sec
      resourceUsage: {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        storage: Math.random() * 100
      }
    }
  }

  private getDefaultMetrics(): EnvironmentMetrics {
    return {
      databaseConnections: { active: 0, idle: 0, total: 0, maxAllowed: 100 },
      responseTime: { average: 0, p95: 0, p99: 0 },
      errorRate: 0,
      throughput: 0,
      resourceUsage: { cpu: 0, memory: 0, storage: 0 }
    }
  }

  private logHealthStatusChange(
    environment: Environment, 
    newStatus: HealthStatus['overall'], 
    previousStatus?: HealthStatus['overall']
  ): void {
    const statusEmoji = {
      healthy: '✅',
      warning: '⚠️',
      critical: '❌',
      unknown: '❓'
    }
    
    if (previousStatus) {
      console.log(`${statusEmoji[newStatus]} Health status changed for ${environment.name}: ${previousStatus} → ${newStatus}`)
    } else {
      console.log(`${statusEmoji[newStatus]} Initial health status for ${environment.name}: ${newStatus}`)
    }
  }

  private alertOnHealthIssue(environment: Environment, healthStatus: HealthStatus): void {
    const severity = healthStatus.overall === 'critical' ? 'high' : 'medium'
    const failedChecks = healthStatus.checks.filter(c => c.status === 'fail')
    const warningChecks = healthStatus.checks.filter(c => c.status === 'warning')
    
    let description = `Environment health issue: ${healthStatus.overall}`
    if (failedChecks.length > 0) {
      description += ` (${failedChecks.length} failed checks)`
    }
    if (warningChecks.length > 0) {
      description += ` (${warningChecks.length} warning checks)`
    }
    
    this.securityManager.reportIncident({
      type: 'system_error',
      severity,
      description,
      environmentId: environment.id,
      component: 'HealthMonitor',
      metadata: {
        healthStatus: healthStatus.overall,
        failedChecks: failedChecks.map(c => c.name),
        warningChecks: warningChecks.map(c => c.name)
      }
    })
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  private async simulateAsyncOperation(duration: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, duration))
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    // Stop all health check intervals
    for (const [environmentId, interval] of this.healthCheckIntervals.entries()) {
      clearInterval(interval)
      console.log(`⏹️ Stopped health monitoring for environment: ${environmentId}`)
    }
    
    this.healthCheckIntervals.clear()
    this.healthStatuses.clear()
  }
}