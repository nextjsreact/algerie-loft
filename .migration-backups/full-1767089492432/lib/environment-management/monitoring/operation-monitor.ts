/**
 * Operation Monitor
 * 
 * Monitors clone operations, tracks progress, and manages operation lifecycle
 */

import { 
  CloneOperation, 
  CloneLog, 
  CloneStatistics, 
  CloneOptions,
  CloneError,
  OperationMetrics,
  MonitoringConfig 
} from './types'
import { SecurityIncidentManager } from './security-incident-manager'

export class OperationMonitor {
  private operations: Map<string, CloneOperation> = new Map()
  private metrics: Map<string, OperationMetrics> = new Map()
  private config: MonitoringConfig
  private securityManager: SecurityIncidentManager

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
    this.startCleanupTimer()
  }

  /**
   * Creates a new clone operation for monitoring
   */
  public createOperation(
    sourceEnvId: string,
    targetEnvId: string,
    sourceEnvType: string,
    targetEnvType: string,
    options: CloneOptions,
    userId?: string,
    userEmail?: string
  ): CloneOperation {
    const operationId = this.generateOperationId()
    
    // Security check: Alert if production is involved
    if (sourceEnvType === 'production' || targetEnvType === 'production') {
      this.securityManager.reportIncident({
        type: 'production_access_attempt',
        severity: targetEnvType === 'production' ? 'critical' : 'medium',
        description: `Clone operation involving production: ${sourceEnvType} → ${targetEnvType}`,
        environmentId: targetEnvType === 'production' ? targetEnvId : sourceEnvId,
        userId,
        userEmail,
        operationId,
        component: 'OperationMonitor'
      })
    }

    const operation: CloneOperation = {
      id: operationId,
      sourceEnvironmentId: sourceEnvId,
      targetEnvironmentId: targetEnvId,
      sourceEnvironmentType: sourceEnvType,
      targetEnvironmentType: targetEnvType,
      status: 'pending',
      progress: 0,
      startedAt: new Date(),
      logs: [],
      statistics: this.initializeStatistics(),
      options,
      userId,
      userEmail
    }

    this.operations.set(operationId, operation)
    this.initializeMetrics(operationId)
    
    this.logOperation(operationId, 'info', 'OperationMonitor', 
      `Clone operation created: ${sourceEnvType} → ${targetEnvType}`)

    return operation
  }

  /**
   * Updates operation status
   */
  public updateOperationStatus(
    operationId: string, 
    status: CloneOperation['status'],
    error?: CloneError
  ): void {
    const operation = this.operations.get(operationId)
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`)
    }

    const previousStatus = operation.status
    operation.status = status
    
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      operation.completedAt = new Date()
      operation.actualDuration = operation.completedAt.getTime() - operation.startedAt.getTime()
    }

    if (error) {
      operation.error = error
      this.securityManager.reportIncident({
        type: 'system_error',
        severity: error.recoverable ? 'medium' : 'high',
        description: `Operation failed: ${error.message}`,
        environmentId: operation.targetEnvironmentId,
        userId: operation.userId,
        userEmail: operation.userEmail,
        operationId,
        component: error.component,
        metadata: { error: error.metadata }
      })
    }

    this.logOperation(operationId, status === 'failed' ? 'error' : 'info', 'OperationMonitor',
      `Operation status changed: ${previousStatus} → ${status}`)
  }

  /**
   * Updates operation progress
   */
  public updateProgress(operationId: string, progress: number, message?: string): void {
    const operation = this.operations.get(operationId)
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`)
    }

    operation.progress = Math.max(0, Math.min(100, progress))
    
    if (message) {
      this.logOperation(operationId, 'info', 'OperationMonitor', 
        `Progress: ${progress}% - ${message}`)
    }

    // Update estimated duration based on progress
    if (progress > 0 && operation.status === 'in_progress') {
      const elapsed = Date.now() - operation.startedAt.getTime()
      operation.estimatedDuration = Math.round((elapsed / progress) * 100)
    }
  }

  /**
   * Logs an operation event
   */
  public logOperation(
    operationId: string,
    level: CloneLog['level'],
    component: string,
    message: string,
    metadata?: Record<string, any>,
    duration?: number
  ): void {
    const operation = this.operations.get(operationId)
    if (!operation) {
      console.warn(`Attempted to log to non-existent operation: ${operationId}`)
      return
    }

    // Check if we should log based on configured level
    if (!this.shouldLog(level)) {
      return
    }

    const log: CloneLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operationId,
      timestamp: new Date(),
      level,
      component,
      message,
      metadata,
      duration,
      memoryUsage: this.getCurrentMemoryUsage()
    }

    operation.logs.push(log)

    // Console output for immediate visibility
    const timestamp = log.timestamp.toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${component}]`
    console.log(`${prefix} ${message}`, metadata ? metadata : '')

    // Keep logs within reasonable limits
    if (operation.logs.length > 10000) {
      operation.logs = operation.logs.slice(-5000) // Keep last 5000 logs
    }

    // Alert on critical logs
    if (level === 'critical' || level === 'error') {
      this.securityManager.reportIncident({
        type: 'system_error',
        severity: level === 'critical' ? 'critical' : 'high',
        description: message,
        environmentId: operation.targetEnvironmentId,
        userId: operation.userId,
        userEmail: operation.userEmail,
        operationId,
        component,
        metadata
      })
    }
  }

  /**
   * Updates operation statistics
   */
  public updateStatistics(operationId: string, updates: Partial<CloneStatistics>): void {
    const operation = this.operations.get(operationId)
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`)
    }

    operation.statistics = { ...operation.statistics, ...updates }
  }

  /**
   * Gets operation by ID
   */
  public getOperation(operationId: string): CloneOperation | undefined {
    return this.operations.get(operationId)
  }

  /**
   * Gets all operations
   */
  public getAllOperations(): CloneOperation[] {
    return Array.from(this.operations.values())
  }

  /**
   * Gets operations by status
   */
  public getOperationsByStatus(status: CloneOperation['status']): CloneOperation[] {
    return Array.from(this.operations.values()).filter(op => op.status === status)
  }

  /**
   * Gets active operations
   */
  public getActiveOperations(): CloneOperation[] {
    return this.getOperationsByStatus('in_progress')
  }

  /**
   * Gets operation metrics
   */
  public getOperationMetrics(operationId: string): OperationMetrics | undefined {
    return this.metrics.get(operationId)
  }

  /**
   * Generates operation report
   */
  public generateOperationReport(operationId: string): string {
    const operation = this.getOperation(operationId)
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`)
    }

    const metrics = this.getOperationMetrics(operationId)
    const duration = operation.actualDuration || (Date.now() - operation.startedAt.getTime())
    
    const report = [
      `=== Clone Operation Report ===`,
      `Operation ID: ${operation.id}`,
      `Source: ${operation.sourceEnvironmentType} (${operation.sourceEnvironmentId})`,
      `Target: ${operation.targetEnvironmentType} (${operation.targetEnvironmentId})`,
      `Status: ${operation.status}`,
      `Progress: ${operation.progress}%`,
      `Duration: ${this.formatDuration(duration)}`,
      `Started: ${operation.startedAt.toISOString()}`,
      operation.completedAt ? `Completed: ${operation.completedAt.toISOString()}` : '',
      ``,
      `=== Statistics ===`,
      `Tables Processed: ${operation.statistics.tablesProcessed}/${operation.statistics.totalTables}`,
      `Records Cloned: ${operation.statistics.recordsCloned.toLocaleString()}`,
      `Records Anonymized: ${operation.statistics.recordsAnonymized.toLocaleString()}`,
      `Functions Cloned: ${operation.statistics.functionsCloned}`,
      `Triggers Cloned: ${operation.statistics.triggersCloned}`,
      `Data Size: ${this.formatBytes(operation.statistics.totalSizeCloned)}`,
      `Peak Memory: ${this.formatBytes(operation.statistics.peakMemoryUsage)}`,
      ``,
      `=== Options ===`,
      `Anonymize Data: ${operation.options.anonymizeData}`,
      `Include Audit Logs: ${operation.options.includeAuditLogs}`,
      `Include Conversations: ${operation.options.includeConversations}`,
      `Include Reservations: ${operation.options.includeReservations}`,
      `Preserve User Roles: ${operation.options.preserveUserRoles}`,
      ``,
      `=== Logs Summary ===`,
      `Total Logs: ${operation.logs.length}`,
      `Errors: ${operation.logs.filter(l => l.level === 'error').length}`,
      `Warnings: ${operation.logs.filter(l => l.level === 'warning').length}`,
      ``,
      operation.error ? `=== Error ===\n${operation.error.message}\nComponent: ${operation.error.component}` : ''
    ].filter(line => line !== '').join('\n')

    return report
  }

  /**
   * Cancels an operation
   */
  public cancelOperation(operationId: string, reason: string): void {
    const operation = this.operations.get(operationId)
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`)
    }

    if (operation.status === 'completed' || operation.status === 'failed') {
      throw new Error(`Cannot cancel ${operation.status} operation`)
    }

    this.updateOperationStatus(operationId, 'cancelled')
    this.logOperation(operationId, 'warning', 'OperationMonitor', 
      `Operation cancelled: ${reason}`)
  }

  /**
   * Cleans up old operations and metrics
   */
  public cleanup(): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - this.config.metricsRetentionDays)

    let cleanedOperations = 0
    let cleanedMetrics = 0

    for (const [id, operation] of this.operations.entries()) {
      if (operation.startedAt < cutoffDate && 
          (operation.status === 'completed' || operation.status === 'failed' || operation.status === 'cancelled')) {
        this.operations.delete(id)
        cleanedOperations++
      }
    }

    for (const [id, metrics] of this.metrics.entries()) {
      if (metrics.startTime < cutoffDate) {
        this.metrics.delete(id)
        cleanedMetrics++
      }
    }

    if (cleanedOperations > 0 || cleanedMetrics > 0) {
      console.log(`🧹 Cleaned up ${cleanedOperations} operations and ${cleanedMetrics} metrics`)
    }
  }

  /**
   * Private helper methods
   */
  private generateOperationId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `op_${timestamp}_${random}`
  }

  private initializeStatistics(): CloneStatistics {
    return {
      tablesProcessed: 0,
      totalTables: 0,
      recordsCloned: 0,
      recordsAnonymized: 0,
      functionsCloned: 0,
      triggersCloned: 0,
      indexesCreated: 0,
      policiesApplied: 0,
      totalSizeCloned: 0,
      averageRecordSize: 0,
      peakMemoryUsage: 0,
      networkBytesTransferred: 0
    }
  }

  private initializeMetrics(operationId: string): void {
    const metrics: OperationMetrics = {
      operationId,
      startTime: new Date(),
      cpuUsage: [],
      memoryUsage: [],
      networkIO: {
        bytesReceived: 0,
        bytesSent: 0,
        packetsReceived: 0,
        packetsSent: 0,
        connectionErrors: 0,
        retries: 0
      },
      diskIO: {
        bytesRead: 0,
        bytesWritten: 0,
        readOperations: 0,
        writeOperations: 0,
        averageLatency: 0
      },
      databaseConnections: 0,
      peakConcurrency: 0
    }

    this.metrics.set(operationId, metrics)
  }

  private shouldLog(level: CloneLog['level']): boolean {
    const levels = ['debug', 'info', 'warning', 'error', 'critical']
    const configLevel = levels.indexOf(this.config.logLevel)
    const messageLevel = levels.indexOf(level)
    return messageLevel >= configLevel
  }

  private getCurrentMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed
    }
    return 0
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  private startCleanupTimer(): void {
    // Run cleanup every 24 hours
    setInterval(() => {
      this.cleanup()
    }, 24 * 60 * 60 * 1000)
  }
}