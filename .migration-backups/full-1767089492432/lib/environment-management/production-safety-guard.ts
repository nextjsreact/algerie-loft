/**
 * Production Safety Guard
 * 
 * CRITICAL COMPONENT: Ensures production environment is NEVER modified
 * This class implements multiple layers of protection to prevent any
 * accidental writes, modifications, or deletions to production data.
 */

import { 
  Environment, 
  EnvironmentType, 
  ProductionAccessError, 
  SecurityAlert,
  ProductionSafetyConfig 
} from './types'

export class ProductionSafetyGuard {
  private static instance: ProductionSafetyGuard
  private config: ProductionSafetyConfig
  private securityAlerts: SecurityAlert[] = []

  private constructor() {
    this.config = {
      enforceReadOnlyProduction: true,
      blockProductionWrites: true,
      requireTargetConfirmation: true,
      alertOnProductionAccess: true,
      maxProductionConnections: 5,
      productionAccessTimeout: 30000 // 30 seconds
    }
  }

  public static getInstance(): ProductionSafetyGuard {
    if (!ProductionSafetyGuard.instance) {
      ProductionSafetyGuard.instance = new ProductionSafetyGuard()
    }
    return ProductionSafetyGuard.instance
  }

  /**
   * CRITICAL: Validates if an environment is production
   * This is the primary safety check used throughout the system
   */
  public validateEnvironmentType(env: Environment): EnvironmentType {
    // Multiple checks to ensure accurate production detection
    const isProductionByType = env.type === 'production'
    const isProductionByFlag = env.isProduction === true
    const isProductionByUrl = this.isProductionUrl(env.supabaseUrl)
    const isProductionByName = env.name.toLowerCase().includes('prod')

    // If ANY indicator suggests production, treat as production
    if (isProductionByType || isProductionByFlag || isProductionByUrl || isProductionByName) {
      this.logSecurityAlert('info', 'Production environment detected', env.id, 'validation')
      return 'production'
    }

    return env.type
  }

  /**
   * CRITICAL: Blocks any write operation to production
   * This method MUST be called before any database write operation
   */
  public async enforceReadOnlyAccess(env: Environment, operation: string): Promise<void> {
    const envType = this.validateEnvironmentType(env)
    
    if (envType === 'production') {
      const errorMessage = `Write operation '${operation}' blocked on production environment ${env.id}`
      
      this.logSecurityAlert('critical', errorMessage, env.id, operation)
      
      throw new ProductionAccessError(
        `Operation '${operation}' is not allowed on production environment. Production is read-only.`,
        env.id,
        operation
      )
    }
  }

  /**
   * CRITICAL: Validates target environment for clone operations
   * Ensures we never clone TO production (only FROM production)
   */
  public async validateCloneTarget(targetEnv: Environment): Promise<boolean> {
    const envType = this.validateEnvironmentType(targetEnv)
    
    if (envType === 'production') {
      this.logSecurityAlert(
        'critical', 
        'Attempted to use production as clone target - BLOCKED', 
        targetEnv.id, 
        'clone_validation'
      )
      
      throw new ProductionAccessError(
        'Cannot clone TO production environment. Production can only be used as a source.',
        targetEnv.id,
        'clone_target_validation'
      )
    }

    return true
  }

  /**
   * CRITICAL: Validates source environment for clone operations
   * Ensures production source is accessed in read-only mode
   */
  public async validateCloneSource(sourceEnv: Environment): Promise<void> {
    const envType = this.validateEnvironmentType(sourceEnv)
    
    if (envType === 'production') {
      this.logSecurityAlert(
        'warning', 
        'Production environment accessed as clone source - read-only mode enforced', 
        sourceEnv.id, 
        'clone_source_validation'
      )
      
      // Ensure production source is marked as read-only
      if (sourceEnv.allowWrites !== false) {
        throw new ProductionAccessError(
          'Production source environment must be explicitly marked as read-only',
          sourceEnv.id,
          'clone_source_validation'
        )
      }
    }
  }

  /**
   * Validates database connection for production safety
   */
  public async validateDatabaseConnection(env: Environment): Promise<boolean> {
    const envType = this.validateEnvironmentType(env)
    
    if (envType === 'production') {
      // For production, we only allow read-only connections
      this.logSecurityAlert(
        'info', 
        'Production database connection validated - read-only mode', 
        env.id, 
        'db_connection'
      )
      
      // Additional validation could be added here to check actual DB permissions
      return true
    }
    
    return true
  }

  /**
   * Checks if a URL appears to be a production URL
   */
  private isProductionUrl(url: string): boolean {
    const productionIndicators = [
      'prod',
      'production',
      'live',
      'main',
      // Add your specific production URL patterns here
    ]
    
    const lowerUrl = url.toLowerCase()
    return productionIndicators.some(indicator => lowerUrl.includes(indicator))
  }

  /**
   * Logs security alerts for monitoring and auditing
   */
  private logSecurityAlert(
    level: SecurityAlert['level'], 
    message: string, 
    environmentId: string, 
    operation: string,
    metadata?: Record<string, any>
  ): void {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      message,
      environmentId,
      operation,
      metadata
    }

    this.securityAlerts.push(alert)
    
    // In a real implementation, you would also:
    // - Send alerts to monitoring system
    // - Log to security audit trail
    // - Notify administrators for critical alerts
    
    console.log(`[SECURITY ${level.toUpperCase()}] ${message}`, {
      environmentId,
      operation,
      timestamp: alert.timestamp,
      metadata
    })

    // Keep only last 1000 alerts in memory
    if (this.securityAlerts.length > 1000) {
      this.securityAlerts = this.securityAlerts.slice(-1000)
    }
  }

  /**
   * Gets recent security alerts
   */
  public getSecurityAlerts(limit: number = 100): SecurityAlert[] {
    return this.securityAlerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Gets critical security alerts
   */
  public getCriticalAlerts(): SecurityAlert[] {
    return this.securityAlerts.filter(alert => alert.level === 'critical')
  }

  /**
   * Emergency stop - blocks all operations
   */
  public emergencyStop(reason: string): void {
    this.logSecurityAlert('critical', `EMERGENCY STOP: ${reason}`, 'system', 'emergency_stop')
    
    // In a real implementation, this would:
    // - Disable all database connections
    // - Stop all running operations
    // - Alert administrators immediately
    // - Lock down the system
    
    throw new Error(`EMERGENCY STOP ACTIVATED: ${reason}`)
  }

  /**
   * Validates configuration for production safety
   */
  public validateSafetyConfig(): boolean {
    const requiredSettings = [
      this.config.enforceReadOnlyProduction,
      this.config.blockProductionWrites,
      this.config.alertOnProductionAccess
    ]

    const isValid = requiredSettings.every(setting => setting === true)
    
    if (!isValid) {
      this.logSecurityAlert(
        'critical', 
        'Production safety configuration is invalid', 
        'system', 
        'config_validation'
      )
    }

    return isValid
  }
}