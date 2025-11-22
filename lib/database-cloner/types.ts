/**
 * Database Cloner Types
 * 
 * Types for the database cloning system that allows cloning from one Supabase
 * environment to another with complete data deletion and replacement.
 */

export interface SupabaseCredentials {
  url: string
  anonKey: string
  serviceKey: string
  password?: string  // PostgreSQL database password (required for pg_dump/psql)
  host?: string      // Custom database host (optional, overrides default db.ref.supabase.co)
  port?: number      // Custom database port (optional, default 5432)
}

export type EnvironmentSourceType = 'configured' | 'manual'

export interface CloneEnvironment {
  id: string
  name: string
  type: EnvironmentSourceType
  credentials: SupabaseCredentials
  description?: string
}

export interface CloneOptions {
  createBackup: boolean
  anonymizeData: boolean
  includeStorage: boolean
  includeFunctions: boolean
  includeTriggers: boolean
}

export interface CloneRequest {
  source: CloneEnvironment
  target: CloneEnvironment
  options: CloneOptions
}

export type CloneStatus =
  | 'pending'
  | 'validating'
  | 'creating_backup'
  | 'deleting_target'
  | 'copying_schema'
  | 'copying_data'
  | 'copying_functions'
  | 'copying_triggers'
  | 'validating_result'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface CloneStatistics {
  tablesProcessed: number
  totalTables: number
  recordsProcessed: number
  totalRecords: number
  bytesProcessed: number
  totalBytes: number
  functionsCloned: number
  triggersCloned: number
  duration: number
}

export interface CloneLog {
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'success'
  phase: string
  message: string
  metadata?: Record<string, any>
}

export interface CloneProgress {
  operationId: string
  status: CloneStatus
  progress: number
  currentPhase: string
  statistics: CloneStatistics
  logs: CloneLog[]
  startedAt: Date
  completedAt?: Date
  error?: string
}

export interface CloneResult {
  success: boolean
  operationId: string
  sourceEnvironment: string
  targetEnvironment: string
  statistics: CloneStatistics
  backupId?: string
  errors: string[]
  warnings: string[]
  duration: number
  completedAt: Date
}

export interface ConfiguredEnvironment {
  id: string
  name: string
  type: 'production' | 'test' | 'training' | 'development'
  description: string
  canBeTarget: boolean
  canBeSource: boolean
  isAvailable: boolean
}

export interface ValidationResult {
  isValid: boolean
  environment: string
  checks: {
    connectionSuccessful: boolean
    hasReadPermission: boolean
    hasWritePermission: boolean
    schemaAccessible: boolean
  }
  errors: string[]
  warnings: string[]
}

export class CloneOperationError extends Error {
  constructor(
    message: string,
    public operationId: string,
    public phase: string,
    public recoverable: boolean = true
  ) {
    super(message)
    this.name = 'CloneOperationError'
  }
}

export class ProductionProtectionError extends Error {
  constructor(message: string) {
    super(`PRODUCTION PROTECTED: ${message}`)
    this.name = 'ProductionProtectionError'
  }
}
