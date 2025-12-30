/**
 * Real-Time Clone Operation Monitor
 * 
 * Provides real-time monitoring and alerting for clone operations
 */

import { EventEmitter } from 'events'
import { CloneOperation, CloneLog } from './environment-cloner'
import { ProgressUpdate } from './clone-progress-tracker'

export interface MonitoringEvent {
  type: 'progress' | 'error' | 'warning' | 'milestone' | 'performance'
  operationId: string
  timestamp: Date
  data: any
}

export interface PerformanceAlert {
  id: string
  operationId: string
  type: 'slow_progress' | 'high_memory' | 'timeout_risk' | 'resource_exhaustion'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  threshold: number
  currentValue: number
  timestamp: Date
  resolved?: boolean
}

export interface MonitoringMetrics {
  operationId: string
  timestamp: Date
  progress: number
  phase: string
  recordsProcessed: number
  recordsPerSecond: number
  memoryUsage: number
  cpuUsage: number
  diskIO: number
  networkIO: number
  estimatedTimeRemaining: number
}

export interface AlertThresholds {
  slowProgressThreshold: number // records per second
  highMemoryThreshold: number // MB
  timeoutWarningThreshold: number // milliseconds
  maxOperationDuration: number // milliseconds
  errorRateThreshold: number // errors per minute
}

export class RealTimeMonitor extends EventEmitter {
  private activeOperations: Map<string, CloneOperation> = new Map()
  private performanceMetrics: Map<string, MonitoringMetrics[]> = new Map()
  private activeAlerts: Map<string, PerformanceAlert[]> = new Map()
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()
  
  private alertThresholds: AlertThresholds = {
    slowProgressThreshold: 10, // records per second
    highMemoryThreshold: 1024, // 1GB
    timeoutWarningThreshold: 1800000, // 30 minutes
    maxOperationDuration: 3600000, // 1 hour
    errorRateThreshold: 5 // errors per minute
  }

  constructor() {
    super()
    this.setupGlobalMonitoring()
  }

  /**
   * Start monitoring a clone operation
   */
  public startMonitoring(operation: CloneOperation): void {
    console.log(`📊 Starting real-time monitoring for operation: ${operation.id}`)
    
    this.activeOperations.set(operation.id, operation)
    this.performanceMetrics.set(operation.id, [])
    this.activeAlerts.set(operation.id, [])
    
    // Start periodic monitoring
    const interval = setInterval(() => {
      this.collectMetrics(operation.id)
      this.checkAlertConditions(operation.id)
    }, 5000) // Every 5 seconds
    
    this.monitoringIntervals.set(operation.id, interval)
    
    this.emit('monitoring_started', {
      type: 'milestone',
      operationId: operation.id,
      timestamp: new Date(),
      data: { message: 'Real-time monitoring started' }
    })
  }

  /**
   * Stop monitoring a clone operation
   */
  public stopMonitoring(operationId: string): void {
    console.log(`📊 Stopping monitoring for operation: ${operationId}`)
    
    const interval = this.monitoringIntervals.get(operationId)
    if (interval) {
      clearInterval(interval)
      this.monitoringIntervals.delete(operationId)
    }
    
    // Keep metrics and alerts for historical analysis
    // but remove from active monitoring
    this.activeOperations.delete(operationId)
    
    this.emit('monitoring_stopped', {
      type: 'milestone',
      operationId,
      timestamp: new Date(),
      data: { message: 'Real-time monitoring stopped' }
    })
  }

  /**
   * Update operation progress
   */
  public updateProgress(operationId: string, update: ProgressUpdate): void {
    const operation = this.activeOperations.get(operationId)
    if (!operation) return

    operation.progress = update.progress
    
    this.emit('progress_update', {
      type: 'progress',
      operationId,
      timestamp: update.timestamp,
      data: update
    })

    // Check for progress-related alerts
    this.checkProgressAlerts(operationId, update)
  }

  /**
   * Log operation event
   */
  public logEvent(operationId: string, log: CloneLog): void {
    const operation = this.activeOperations.get(operationId)
    if (!operation) return

    operation.logs.push(log)
    
    const eventType = log.level === 'error' ? 'error' : 
                     log.level === 'warning' ? 'warning' : 'progress'
    
    this.emit('operation_event', {
      type: eventType,
      operationId,
      timestamp: log.timestamp,
      data: log
    })

    // Check for error rate alerts
    if (log.level === 'error') {
      this.checkErrorRateAlerts(operationId)
    }
  }

  /**
   * Get current metrics for an operation
   */
  public getCurrentMetrics(operationId: string): MonitoringMetrics | null {
    const metrics = this.performanceMetrics.get(operationId)
    if (!metrics || metrics.length === 0) return null
    
    return metrics[metrics.length - 1]
  }

  /**
   * Get metrics history for an operation
   */
  public getMetricsHistory(operationId: string, limit?: number): MonitoringMetrics[] {
    const metrics = this.performanceMetrics.get(operationId) || []
    return limit ? metrics.slice(-limit) : metrics
  }

  /**
   * Get active alerts for an operation
   */
  public getActiveAlerts(operationId: string): PerformanceAlert[] {
    return (this.activeAlerts.get(operationId) || [])
      .filter(alert => !alert.resolved)
  }

  /**
   * Get all alerts for an operation
   */
  public getAllAlerts(operationId: string): PerformanceAlert[] {
    return this.activeAlerts.get(operationId) || []
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string): void {
    for (const [operationId, alerts] of this.activeAlerts.entries()) {
      const alert = alerts.find(a => a.id === alertId)
      if (alert) {
        alert.resolved = true
        
        this.emit('alert_resolved', {
          type: 'performance',
          operationId,
          timestamp: new Date(),
          data: alert
        })
        
        console.log(`✅ Alert resolved: ${alert.message}`)
        break
      }
    }
  }

  /**
   * Get monitoring dashboard data
   */
  public getDashboardData(): MonitoringDashboard {
    const activeOps = Array.from(this.activeOperations.values())
    const totalAlerts = Array.from(this.activeAlerts.values())
      .flat()
      .filter(alert => !alert.resolved)
    
    return {
      activeOperations: activeOps.length,
      totalAlerts: totalAlerts.length,
      criticalAlerts: totalAlerts.filter(a => a.severity === 'critical').length,
      averageProgress: activeOps.length > 0 
        ? activeOps.reduce((sum, op) => sum + op.progress, 0) / activeOps.length 
        : 0,
      operations: activeOps.map(op => ({
        id: op.id,
        progress: op.progress,
        status: op.status,
        startedAt: op.startedAt,
        sourceEnvironment: op.sourceEnvironment,
        targetEnvironment: op.targetEnvironment,
        currentPhase: this.getCurrentPhase(op.progress),
        alerts: this.getActiveAlerts(op.id).length
      })),
      systemHealth: this.getSystemHealth()
    }
  }

  /**
   * Collect performance metrics for an operation
   */
  private collectMetrics(operationId: string): void {
    const operation = this.activeOperations.get(operationId)
    if (!operation) return

    // Simulate metric collection (in real implementation, this would collect actual metrics)
    const metrics: MonitoringMetrics = {
      operationId,
      timestamp: new Date(),
      progress: operation.progress,
      phase: this.getCurrentPhase(operation.progress),
      recordsProcessed: operation.statistics.recordsCloned,
      recordsPerSecond: this.calculateRecordsPerSecond(operationId),
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
      diskIO: this.getDiskIO(),
      networkIO: this.getNetworkIO(),
      estimatedTimeRemaining: this.calculateTimeRemaining(operationId)
    }

    const operationMetrics = this.performanceMetrics.get(operationId) || []
    operationMetrics.push(metrics)
    
    // Keep only last 100 metrics to prevent memory issues
    if (operationMetrics.length > 100) {
      operationMetrics.shift()
    }
    
    this.performanceMetrics.set(operationId, operationMetrics)

    this.emit('metrics_collected', {
      type: 'performance',
      operationId,
      timestamp: new Date(),
      data: metrics
    })
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(operationId: string): void {
    const metrics = this.getCurrentMetrics(operationId)
    if (!metrics) return

    const operation = this.activeOperations.get(operationId)
    if (!operation) return

    // Check slow progress
    if (metrics.recordsPerSecond < this.alertThresholds.slowProgressThreshold) {
      this.createAlert(operationId, {
        type: 'slow_progress',
        severity: 'medium',
        message: `Slow progress detected: ${metrics.recordsPerSecond} records/sec`,
        threshold: this.alertThresholds.slowProgressThreshold,
        currentValue: metrics.recordsPerSecond
      })
    }

    // Check high memory usage
    if (metrics.memoryUsage > this.alertThresholds.highMemoryThreshold) {
      this.createAlert(operationId, {
        type: 'high_memory',
        severity: 'high',
        message: `High memory usage: ${metrics.memoryUsage} MB`,
        threshold: this.alertThresholds.highMemoryThreshold,
        currentValue: metrics.memoryUsage
      })
    }

    // Check operation timeout risk
    const operationDuration = Date.now() - operation.startedAt.getTime()
    if (operationDuration > this.alertThresholds.timeoutWarningThreshold) {
      this.createAlert(operationId, {
        type: 'timeout_risk',
        severity: 'medium',
        message: `Operation running for ${Math.round(operationDuration / 60000)} minutes`,
        threshold: this.alertThresholds.timeoutWarningThreshold,
        currentValue: operationDuration
      })
    }

    // Check maximum operation duration
    if (operationDuration > this.alertThresholds.maxOperationDuration) {
      this.createAlert(operationId, {
        type: 'timeout_risk',
        severity: 'critical',
        message: `Operation exceeded maximum duration: ${Math.round(operationDuration / 60000)} minutes`,
        threshold: this.alertThresholds.maxOperationDuration,
        currentValue: operationDuration
      })
    }
  }

  /**
   * Check progress-specific alerts
   */
  private checkProgressAlerts(operationId: string, update: ProgressUpdate): void {
    // Check if progress has stalled
    const metrics = this.getMetricsHistory(operationId, 5)
    if (metrics.length >= 5) {
      const progressChanges = metrics.slice(-5).map(m => m.progress)
      const isStalled = progressChanges.every(p => p === progressChanges[0])
      
      if (isStalled && progressChanges[0] < 100) {
        this.createAlert(operationId, {
          type: 'slow_progress',
          severity: 'high',
          message: 'Progress appears to be stalled',
          threshold: 0,
          currentValue: 0
        })
      }
    }
  }

  /**
   * Check error rate alerts
   */
  private checkErrorRateAlerts(operationId: string): void {
    const operation = this.activeOperations.get(operationId)
    if (!operation) return

    // Count errors in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60000)
    const recentErrors = operation.logs.filter(log => 
      log.level === 'error' && log.timestamp > oneMinuteAgo
    ).length

    if (recentErrors > this.alertThresholds.errorRateThreshold) {
      this.createAlert(operationId, {
        type: 'resource_exhaustion',
        severity: 'critical',
        message: `High error rate: ${recentErrors} errors in last minute`,
        threshold: this.alertThresholds.errorRateThreshold,
        currentValue: recentErrors
      })
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(operationId: string, alertData: Omit<PerformanceAlert, 'id' | 'operationId' | 'timestamp'>): void {
    const alerts = this.activeAlerts.get(operationId) || []
    
    // Check if similar alert already exists
    const existingAlert = alerts.find(alert => 
      !alert.resolved && 
      alert.type === alertData.type && 
      alert.severity === alertData.severity
    )
    
    if (existingAlert) return // Don't create duplicate alerts

    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operationId,
      timestamp: new Date(),
      ...alertData
    }

    alerts.push(alert)
    this.activeAlerts.set(operationId, alerts)

    this.emit('alert_created', {
      type: 'performance',
      operationId,
      timestamp: new Date(),
      data: alert
    })

    console.log(`⚠️  Alert created: ${alert.message} (${alert.severity})`)
  }

  /**
   * Setup global monitoring for system health
   */
  private setupGlobalMonitoring(): void {
    // Monitor overall system health every 30 seconds
    setInterval(() => {
      this.checkSystemHealth()
    }, 30000)
  }

  /**
   * Check overall system health
   */
  private checkSystemHealth(): void {
    const activeOpsCount = this.activeOperations.size
    const totalAlerts = Array.from(this.activeAlerts.values()).flat().filter(a => !a.resolved).length
    
    if (activeOpsCount > 5) {
      console.log(`⚠️  High number of concurrent operations: ${activeOpsCount}`)
    }
    
    if (totalAlerts > 10) {
      console.log(`⚠️  High number of active alerts: ${totalAlerts}`)
    }
  }

  /**
   * Get current phase based on progress
   */
  private getCurrentPhase(progress: number): string {
    if (progress < 10) return 'Initialization'
    if (progress < 30) return 'Schema Analysis'
    if (progress < 70) return 'Data Cloning'
    if (progress < 85) return 'Anonymization'
    if (progress < 95) return 'Post-Clone Setup'
    if (progress < 100) return 'Validation'
    return 'Completed'
  }

  /**
   * Calculate records per second for an operation
   */
  private calculateRecordsPerSecond(operationId: string): number {
    const operation = this.activeOperations.get(operationId)
    if (!operation) return 0

    const duration = Date.now() - operation.startedAt.getTime()
    if (duration === 0) return 0

    return Math.round(operation.statistics.recordsCloned / (duration / 1000))
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateTimeRemaining(operationId: string): number {
    const operation = this.activeOperations.get(operationId)
    if (!operation || operation.progress === 0) return 0

    const duration = Date.now() - operation.startedAt.getTime()
    const remainingProgress = 100 - operation.progress
    
    return Math.round((duration / operation.progress) * remainingProgress)
  }

  /**
   * Get system memory usage (simulated)
   */
  private getMemoryUsage(): number {
    const usage = process.memoryUsage()
    return Math.round(usage.heapUsed / 1024 / 1024) // MB
  }

  /**
   * Get CPU usage (simulated)
   */
  private getCpuUsage(): number {
    // Simulate CPU usage between 20-80%
    return Math.round(20 + Math.random() * 60)
  }

  /**
   * Get disk I/O (simulated)
   */
  private getDiskIO(): number {
    // Simulate disk I/O in MB/s
    return Math.round(Math.random() * 50)
  }

  /**
   * Get network I/O (simulated)
   */
  private getNetworkIO(): number {
    // Simulate network I/O in MB/s
    return Math.round(Math.random() * 20)
  }

  /**
   * Get system health status
   */
  private getSystemHealth(): SystemHealth {
    return {
      status: 'healthy',
      memoryUsage: this.getMemoryUsage(),
      cpuUsage: this.getCpuUsage(),
      diskUsage: 45, // Simulated
      activeConnections: this.activeOperations.size,
      uptime: process.uptime()
    }
  }
}

// Additional interfaces
export interface MonitoringDashboard {
  activeOperations: number
  totalAlerts: number
  criticalAlerts: number
  averageProgress: number
  operations: OperationSummary[]
  systemHealth: SystemHealth
}

export interface OperationSummary {
  id: string
  progress: number
  status: string
  startedAt: Date
  sourceEnvironment: string
  targetEnvironment: string
  currentPhase: string
  alerts: number
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  memoryUsage: number
  cpuUsage: number
  diskUsage: number
  activeConnections: number
  uptime: number
}