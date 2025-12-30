/**
 * Environment Management Types with Production Safety
 * 
 * CRITICAL SAFETY RULE: Production environment is ALWAYS read-only
 */

export type EnvironmentType = 'production' | 'test' | 'training' | 'development' | 'local'

export interface Environment {
  id: string
  name: string
  type: EnvironmentType
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceKey: string
  databaseUrl?: string
  status: 'active' | 'inactive' | 'cloning' | 'error' | 'read_only'
  isProduction: boolean // Critical flag for production identification
  allowWrites: boolean // Explicit write permission flag
  createdAt: Date
  lastUpdated: Date
  description?: string
}

export interface EnvironmentConfig {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  
  // Application Configuration
  NEXT_PUBLIC_APP_URL: string
  NODE_ENV: 'production' | 'test' | 'development'
  
  // Environment Type Identification (CRITICAL for safety)
  ENVIRONMENT_TYPE: EnvironmentType
  IS_PRODUCTION: boolean
  ALLOW_WRITES: boolean
  
  // Clone-specific Configuration
  CLONE_SOURCE_ENV?: string
  ANONYMIZE_DATA?: boolean
  INCLUDE_AUDIT_LOGS?: boolean
  PRESERVE_USER_ROLES?: boolean
}

export interface ProductionSafetyConfig {
  // Production Protection Settings
  enforceReadOnlyProduction: boolean
  blockProductionWrites: boolean
  requireTargetConfirmation: boolean
  alertOnProductionAccess: boolean
  maxProductionConnections: number
  productionAccessTimeout: number // in milliseconds
}

export interface EnvironmentValidationResult {
  isValid: boolean
  environmentType: EnvironmentType
  isProduction: boolean
  allowWrites: boolean
  errors: string[]
  warnings: string[]
  safetyChecks: {
    productionProtected: boolean
    writeAccessControlled: boolean
    connectionValidated: boolean
  }
}

export interface SecurityAlert {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  environmentId: string
  operation: string
  userId?: string
  metadata?: Record<string, any>
}

export class ProductionAccessError extends Error {
  constructor(message: string, public environmentId: string, public operation: string) {
    super(`PRODUCTION ACCESS BLOCKED: ${message}`)
    this.name = 'ProductionAccessError'
  }
}

export class EnvironmentValidationError extends Error {
  constructor(message: string, public validationResult: EnvironmentValidationResult) {
    super(`Environment validation failed: ${message}`)
    this.name = 'EnvironmentValidationError'
  }
}

// Environment Switching Types

export interface SwitchOptions {
  targetEnvironment: EnvironmentType
  backupCurrent?: boolean
  restartServices?: boolean
  confirmProduction?: boolean
}

export interface SwitchResult {
  success: boolean
  previousEnvironment?: string
  targetEnvironment: string
  backupPath?: string
  servicesRestarted?: boolean
  error?: string
}

export interface EnvironmentStatus {
  environmentType: EnvironmentType
  isActive: boolean
  isHealthy: boolean
  lastChecked: Date
  error?: string
}

export interface HealthStatus {
  overallHealth: 'healthy' | 'degraded' | 'unhealthy'
  issues?: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
  }>
}

// Reset and Rollback Types

export interface ResetResult {
  success: boolean
  environment: string
  backupPath?: string
  error?: string
}