/**
 * Environment Validator
 * 
 * Validates environment configurations and ensures production safety
 */

import { 
  Environment, 
  EnvironmentConfig, 
  EnvironmentValidationResult, 
  EnvironmentValidationError,
  EnvironmentType 
} from './types'
import { ProductionSafetyGuard } from './production-safety-guard'

export class EnvironmentValidator {
  private safetyGuard: ProductionSafetyGuard

  constructor() {
    this.safetyGuard = ProductionSafetyGuard.getInstance()
  }

  /**
   * Validates an environment configuration
   */
  public async validateEnvironment(env: Environment): Promise<EnvironmentValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Basic validation
    if (!env.id) errors.push('Environment ID is required')
    if (!env.name) errors.push('Environment name is required')
    if (!env.supabaseUrl) errors.push('Supabase URL is required')
    if (!env.supabaseAnonKey) errors.push('Supabase anonymous key is required')
    if (!env.supabaseServiceKey) errors.push('Supabase service key is required')

    // URL validation
    if (env.supabaseUrl && !this.isValidUrl(env.supabaseUrl)) {
      errors.push('Invalid Supabase URL format')
    }

    // Environment type validation
    const detectedType = this.safetyGuard.validateEnvironmentType(env)
    const isProduction = detectedType === 'production'

    // Production-specific validation
    if (isProduction) {
      // Production MUST be read-only
      if (env.allowWrites !== false) {
        errors.push('Production environment must have allowWrites set to false')
      }
      
      if (env.status !== 'read_only' && env.status !== 'active') {
        warnings.push('Production environment should have status "read_only" or "active"')
      }

      // Production flag consistency check
      if (env.isProduction !== true) {
        warnings.push('Production environment should have isProduction flag set to true')
      }
    }

    // Non-production validation
    if (!isProduction) {
      if (env.isProduction === true) {
        errors.push('Non-production environment has isProduction flag set to true')
      }
    }

    // Safety checks
    const safetyChecks = {
      productionProtected: isProduction ? env.allowWrites === false : true,
      writeAccessControlled: env.allowWrites !== undefined,
      connectionValidated: await this.validateConnection(env)
    }

    const result: EnvironmentValidationResult = {
      isValid: errors.length === 0,
      environmentType: detectedType,
      isProduction,
      allowWrites: env.allowWrites ?? false,
      errors,
      warnings,
      safetyChecks
    }

    return result
  }

  /**
   * Validates environment configuration from .env format
   */
  public validateEnvironmentConfig(config: EnvironmentConfig): EnvironmentValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields validation
    if (!config.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
    }
    if (!config.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    }
    if (!config.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required')
    }

    // Environment type validation
    const envType = config.ENVIRONMENT_TYPE || this.detectEnvironmentType(config)
    const isProduction = envType === 'production' || config.IS_PRODUCTION === true

    // Production safety validation
    if (isProduction) {
      if (config.ALLOW_WRITES !== false) {
        errors.push('Production environment must have ALLOW_WRITES=false')
      }
      
      if (config.NODE_ENV !== 'production') {
        warnings.push('Production environment should have NODE_ENV=production')
      }
    }

    // URL validation
    if (config.NEXT_PUBLIC_SUPABASE_URL && !this.isValidUrl(config.NEXT_PUBLIC_SUPABASE_URL)) {
      errors.push('Invalid NEXT_PUBLIC_SUPABASE_URL format')
    }

    const safetyChecks = {
      productionProtected: isProduction ? config.ALLOW_WRITES === false : true,
      writeAccessControlled: config.ALLOW_WRITES !== undefined,
      connectionValidated: true // Would need actual connection test
    }

    return {
      isValid: errors.length === 0,
      environmentType: envType,
      isProduction,
      allowWrites: config.ALLOW_WRITES ?? false,
      errors,
      warnings,
      safetyChecks
    }
  }

  /**
   * Validates that an environment is safe for write operations
   */
  public async validateWriteAccess(env: Environment, operation: string): Promise<void> {
    const validation = await this.validateEnvironment(env)
    
    if (!validation.isValid) {
      throw new EnvironmentValidationError(
        `Environment validation failed for write operation '${operation}'`,
        validation
      )
    }

    // Use safety guard to enforce production protection
    await this.safetyGuard.enforceReadOnlyAccess(env, operation)

    if (!env.allowWrites) {
      throw new EnvironmentValidationError(
        `Write access not allowed for environment ${env.id}`,
        validation
      )
    }
  }

  /**
   * Validates clone operation safety
   */
  public async validateCloneOperation(
    sourceEnv: Environment, 
    targetEnv: Environment
  ): Promise<{ sourceValid: boolean; targetValid: boolean; errors: string[] }> {
    const errors: string[] = []

    try {
      // Validate source environment
      await this.safetyGuard.validateCloneSource(sourceEnv)
    } catch (error) {
      errors.push(`Source validation failed: ${error.message}`)
    }

    try {
      // Validate target environment
      await this.safetyGuard.validateCloneTarget(targetEnv)
    } catch (error) {
      errors.push(`Target validation failed: ${error.message}`)
    }

    // Additional validations
    const sourceValidation = await this.validateEnvironment(sourceEnv)
    const targetValidation = await this.validateEnvironment(targetEnv)

    if (!sourceValidation.isValid) {
      errors.push(`Source environment validation failed: ${sourceValidation.errors.join(', ')}`)
    }

    if (!targetValidation.isValid) {
      errors.push(`Target environment validation failed: ${targetValidation.errors.join(', ')}`)
    }

    return {
      sourceValid: sourceValidation.isValid && errors.length === 0,
      targetValid: targetValidation.isValid && errors.length === 0,
      errors
    }
  }

  /**
   * Detects environment type from configuration
   */
  private detectEnvironmentType(config: EnvironmentConfig): EnvironmentType {
    // Check explicit type first
    if (config.ENVIRONMENT_TYPE) {
      return config.ENVIRONMENT_TYPE
    }

    // Check production flag
    if (config.IS_PRODUCTION === true) {
      return 'production'
    }

    // Check NODE_ENV
    if (config.NODE_ENV === 'production') {
      return 'production'
    }

    // Check URL patterns
    const url = config.NEXT_PUBLIC_SUPABASE_URL?.toLowerCase() || ''
    if (url.includes('prod') || url.includes('production')) {
      return 'production'
    }

    // Default based on NODE_ENV
    switch (config.NODE_ENV) {
      case 'test':
        return 'test'
      case 'development':
        return 'development'
      default:
        return 'development'
    }
  }

  /**
   * Validates URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validates database connection (placeholder)
   */
  private async validateConnection(env: Environment): Promise<boolean> {
    // In a real implementation, this would test the actual database connection
    // For now, we just validate that we have the required connection info
    return !!(env.supabaseUrl && env.supabaseServiceKey)
  }
}