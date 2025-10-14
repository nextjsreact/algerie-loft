/**
 * Monitoring and Logging Types
 * 
 * Types for operation tracking, progress monitoring, and security incident logging
 */

export interface CloneOperation {
  id: string
  sourceEnvironmentId: string
  targetEnvironmentId: string
  sourceEnvironmentType: string
  targetEnvironmentType: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  progress: number // 0-100
  startedAt: Date
  completedAt?: Date
  estimatedDuration?: number // in milliseconds
  actualDuration?: number // in milliseconds
  logs: CloneLog[]
  statistics: CloneStatistics
  options: CloneOptions
  error?: CloneError
  userId?: string
  userEmail?: string
}

export interface CloneOptions {
  anonymizeData: boolean
  includeAuditLogs: boolean
  includeConversations: boolean
  includeReservations: boolean
  preserveUserRoles: boolean
  customAnonymizationRules?: any[]
  dryRun?: boolean
  backupBeforeClone?: boolean
}

export interface CloneLog {
  id: string
  operationId: string
  timestamp: Date
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical'
  component: string
  message: string
  metadata?: Record<string, any>
  duration?: number // in milliseconds
  memoryUsage?: number // in bytes
}

export interface CloneStatistics {
  tablesProcessed: number
  totalTables: number
  recordsCloned: number
  recordsAnonymized: number
  functionsCloned: number
  triggersCloned: number
  indexesCreated: number
  policiesApplied: number
  totalSizeCloned: number // in bytes
  compressionRatio?: number
  averageRecordSize: number
  peakMemoryUsage: number
  networkBytesTransferred: number
}

export interface CloneError {
  code: string
  message: string
  component: string
  timestamp: Date
  stack?: string
  metadata?: Record<string, any>
  recoverable: boolean
  suggestedAction?: string
}

export interface OperationMetrics {
  operationId: string
  startTime: Date
  endTime?: Date
  duration?: number
  cpuUsage: number[]
  memoryUsage: number[]
  networkIO: NetworkIOMetrics
  diskIO: DiskIOMetrics
  databaseConnections: number
  peakConcurrency: number
}

export interface NetworkIOMetrics {
  bytesReceived: number
  bytesSent: number
  packetsReceived: number
  packetsSent: number
  connectionErrors: number
  retries: number
}

export interface DiskIOMetrics {
  bytesRead: number
  bytesWritten: number
  readOperations: number
  writeOperations: number
  averageLatency: number
}

export interface SecurityIncident {
  id: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: 'unauthorized_access' | 'production_access_attempt' | 'configuration_tampering' | 'suspicious_activity' | 'system_error'
  description: string
  environmentId?: string
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  operationId?: string
  component: string
  metadata?: Record<string, any>
  resolved: boolean
  resolvedAt?: Date
  resolvedBy?: string
  resolution?: string
}

export interface HealthStatus {
  environmentId: string
  timestamp: Date
  overall: 'healthy' | 'warning' | 'critical' | 'unknown'
  checks: HealthCheck[]
  uptime: number // in milliseconds
  lastSuccessfulOperation?: Date
  metrics: EnvironmentMetrics
}

export interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  duration: number // in milliseconds
  metadata?: Record<string, any>
}

export interface EnvironmentMetrics {
  databaseConnections: {
    active: number
    idle: number
    total: number
    maxAllowed: number
  }
  responseTime: {
    average: number
    p95: number
    p99: number
  }
  errorRate: number // percentage
  throughput: number // operations per second
  resourceUsage: {
    cpu: number // percentage
    memory: number // percentage
    storage: number // percentage
  }
}

export interface AlertRule {
  id: string
  name: string
  description: string
  enabled: boolean
  conditions: AlertCondition[]
  actions: AlertAction[]
  cooldownPeriod: number // in milliseconds
  lastTriggered?: Date
}

export interface AlertCondition {
  metric: string
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains'
  threshold: number | string
  duration?: number // in milliseconds
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'log' | 'emergency_stop'
  config: Record<string, any>
}

export interface MonitoringConfig {
  enableDetailedLogging: boolean
  logLevel: 'debug' | 'info' | 'warning' | 'error'
  metricsRetentionDays: number
  alertingEnabled: boolean
  healthCheckInterval: number // in milliseconds
  maxConcurrentOperations: number
  operationTimeout: number // in milliseconds
  enablePerformanceMetrics: boolean
  enableSecurityMonitoring: boolean
}