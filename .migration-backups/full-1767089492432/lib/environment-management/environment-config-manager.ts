/**
 * Environment Configuration Manager
 * 
 * Manages environment configuration files with production safety
 */

import fs from 'fs/promises'
import path from 'path'
import { 
  Environment, 
  EnvironmentConfig, 
  EnvironmentType,
  EnvironmentValidationError 
} from './types'
import { EnvironmentValidator } from './environment-validator'
import { ProductionSafetyGuard } from './production-safety-guard'

export class EnvironmentConfigManager {
  private validator: EnvironmentValidator
  private safetyGuard: ProductionSafetyGuard
  private configCache: Map<string, EnvironmentConfig> = new Map()

  constructor() {
    this.validator = new EnvironmentValidator()
    this.safetyGuard = ProductionSafetyGuard.getInstance()
  }

  /**
   * Loads environment configuration from file
   */
  public async loadEnvironmentConfig(envType: EnvironmentType): Promise<EnvironmentConfig> {
    const configPath = this.getConfigPath(envType)
    
    try {
      const configContent = await fs.readFile(configPath, 'utf-8')
      const config = this.parseEnvFile(configContent)
      
      // Add environment type detection
      config.ENVIRONMENT_TYPE = envType
      config.IS_PRODUCTION = envType === 'production'
      
      // For production, enforce read-only
      if (envType === 'production') {
        config.ALLOW_WRITES = false
      }

      // Validate configuration
      const validation = this.validator.validateEnvironmentConfig(config)
      if (!validation.isValid) {
        throw new EnvironmentValidationError(
          `Invalid configuration for ${envType} environment`,
          validation
        )
      }

      // Cache the configuration
      this.configCache.set(envType, config)
      
      return config
    } catch (error) {
      if (error instanceof EnvironmentValidationError) {
        throw error
      }
      throw new Error(`Failed to load ${envType} environment configuration: ${error.message}`)
    }
  }

  /**
   * Saves environment configuration to file
   */
  public async saveEnvironmentConfig(
    envType: EnvironmentType, 
    config: EnvironmentConfig
  ): Promise<void> {
    // CRITICAL: Never allow saving to production config
    if (envType === 'production') {
      throw new Error('PRODUCTION PROTECTION: Cannot modify production configuration file')
    }

    const configPath = this.getConfigPath(envType)
    
    // Validate configuration before saving
    const validation = this.validator.validateEnvironmentConfig(config)
    if (!validation.isValid) {
      throw new EnvironmentValidationError(
        `Cannot save invalid configuration for ${envType} environment`,
        validation
      )
    }

    try {
      const configContent = this.generateEnvFile(config)
      await fs.writeFile(configPath, configContent, 'utf-8')
      
      // Update cache
      this.configCache.set(envType, config)
      
      console.log(`✅ Saved ${envType} environment configuration`)
    } catch (error) {
      throw new Error(`Failed to save ${envType} environment configuration: ${error.message}`)
    }
  }

  /**
   * Creates Environment object from configuration
   */
  public async createEnvironmentFromConfig(
    envType: EnvironmentType,
    config?: EnvironmentConfig
  ): Promise<Environment> {
    const envConfig = config || await this.loadEnvironmentConfig(envType)
    
    const environment: Environment = {
      id: `env_${envType}_${Date.now()}`,
      name: `${envType.charAt(0).toUpperCase() + envType.slice(1)} Environment`,
      type: envType,
      supabaseUrl: envConfig.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: envConfig.SUPABASE_SERVICE_ROLE_KEY,
      databaseUrl: envConfig.NEXT_PUBLIC_SUPABASE_URL,
      status: envType === 'production' ? 'read_only' : 'active',
      isProduction: envType === 'production',
      allowWrites: envType !== 'production', // Production is always read-only
      createdAt: new Date(),
      lastUpdated: new Date(),
      description: `${envType} environment for Loft Algérie system`
    }

    // Validate the created environment
    const validation = await this.validator.validateEnvironment(environment)
    if (!validation.isValid) {
      throw new EnvironmentValidationError(
        `Created environment is invalid for ${envType}`,
        validation
      )
    }

    return environment
  }

  /**
   * Lists available environment configurations
   */
  public async listAvailableEnvironments(): Promise<EnvironmentType[]> {
    const envTypes: EnvironmentType[] = ['production', 'test', 'training', 'development', 'local']
    const availableEnvs: EnvironmentType[] = []

    for (const envType of envTypes) {
      const configPath = this.getConfigPath(envType)
      try {
        await fs.access(configPath)
        availableEnvs.push(envType)
      } catch {
        // Config file doesn't exist
      }
    }

    return availableEnvs
  }

  /**
   * Creates a new environment configuration
   */
  public async createEnvironmentConfig(
    envType: EnvironmentType,
    baseConfig: Partial<EnvironmentConfig>
  ): Promise<EnvironmentConfig> {
    // CRITICAL: Never allow creating production config
    if (envType === 'production') {
      throw new Error('PRODUCTION PROTECTION: Cannot create production configuration programmatically')
    }

    const config: EnvironmentConfig = {
      NEXT_PUBLIC_SUPABASE_URL: baseConfig.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: baseConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: baseConfig.SUPABASE_SERVICE_ROLE_KEY || '',
      NEXT_PUBLIC_APP_URL: baseConfig.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      NODE_ENV: envType === 'production' ? 'production' : 'development',
      ENVIRONMENT_TYPE: envType,
      IS_PRODUCTION: envType === 'production',
      ALLOW_WRITES: envType !== 'production',
      ...baseConfig
    }

    await this.saveEnvironmentConfig(envType, config)
    return config
  }

  /**
   * Backs up current environment configuration
   */
  public async backupEnvironmentConfig(envType: EnvironmentType): Promise<string> {
    const config = await this.loadEnvironmentConfig(envType)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(process.cwd(), 'backups', `env-${envType}-${timestamp}.backup`)
    
    // Ensure backup directory exists
    await fs.mkdir(path.dirname(backupPath), { recursive: true })
    
    const configContent = this.generateEnvFile(config)
    await fs.writeFile(backupPath, configContent, 'utf-8')
    
    console.log(`📦 Backed up ${envType} configuration to ${backupPath}`)
    return backupPath
  }

  /**
   * Gets the configuration file path for an environment type
   */
  private getConfigPath(envType: EnvironmentType): string {
    const configFiles = {
      production: '.env.production',
      test: '.env.test',
      training: '.env.training',
      development: '.env.development',
      local: '.env.local'
    }

    return path.join(process.cwd(), configFiles[envType])
  }

  /**
   * Parses .env file content into configuration object
   */
  private parseEnvFile(content: string): EnvironmentConfig {
    const config: Partial<EnvironmentConfig> = {}
    
    const lines = content.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, '')
          
          // Type conversion for specific fields
          if (key === 'IS_PRODUCTION' || key === 'ALLOW_WRITES' || key === 'ANONYMIZE_DATA') {
            (config as any)[key] = cleanValue.toLowerCase() === 'true'
          } else {
            (config as any)[key] = cleanValue
          }
        }
      }
    }

    return config as EnvironmentConfig
  }

  /**
   * Generates .env file content from configuration object
   */
  private generateEnvFile(config: EnvironmentConfig): string {
    const lines: string[] = []
    
    // Add header comment
    lines.push(`# ${config.ENVIRONMENT_TYPE?.toUpperCase()} Environment Configuration`)
    lines.push(`# Generated on ${new Date().toISOString()}`)
    lines.push('')

    // Supabase Configuration
    lines.push('# Supabase Configuration')
    lines.push(`NEXT_PUBLIC_SUPABASE_URL=${config.NEXT_PUBLIC_SUPABASE_URL}`)
    lines.push(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${config.NEXT_PUBLIC_SUPABASE_ANON_KEY}`)
    lines.push(`SUPABASE_SERVICE_ROLE_KEY=${config.SUPABASE_SERVICE_ROLE_KEY}`)
    lines.push('')

    // Application Configuration
    lines.push('# Application Configuration')
    lines.push(`NEXT_PUBLIC_APP_URL=${config.NEXT_PUBLIC_APP_URL}`)
    lines.push(`NODE_ENV=${config.NODE_ENV}`)
    lines.push('')

    // Environment Type Configuration
    lines.push('# Environment Type Configuration')
    lines.push(`ENVIRONMENT_TYPE=${config.ENVIRONMENT_TYPE}`)
    lines.push(`IS_PRODUCTION=${config.IS_PRODUCTION}`)
    lines.push(`ALLOW_WRITES=${config.ALLOW_WRITES}`)
    lines.push('')

    // Clone-specific Configuration
    if (config.CLONE_SOURCE_ENV || config.ANONYMIZE_DATA !== undefined) {
      lines.push('# Clone Configuration')
      if (config.CLONE_SOURCE_ENV) {
        lines.push(`CLONE_SOURCE_ENV=${config.CLONE_SOURCE_ENV}`)
      }
      if (config.ANONYMIZE_DATA !== undefined) {
        lines.push(`ANONYMIZE_DATA=${config.ANONYMIZE_DATA}`)
      }
      if (config.INCLUDE_AUDIT_LOGS !== undefined) {
        lines.push(`INCLUDE_AUDIT_LOGS=${config.INCLUDE_AUDIT_LOGS}`)
      }
      if (config.PRESERVE_USER_ROLES !== undefined) {
        lines.push(`PRESERVE_USER_ROLES=${config.PRESERVE_USER_ROLES}`)
      }
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Clears configuration cache
   */
  public clearCache(): void {
    this.configCache.clear()
  }

  /**
   * Gets cached configuration if available
   */
  public getCachedConfig(envType: EnvironmentType): EnvironmentConfig | undefined {
    return this.configCache.get(envType)
  }
}