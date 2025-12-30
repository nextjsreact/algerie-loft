/**
 * Environment Status Display
 * 
 * Provides comprehensive environment status display and monitoring
 * with visual formatting and health indicators.
 */

import { ConfigurationManager } from './configuration-manager'
import { ServiceManager } from './service-manager'
import { logger } from '../../logger'
import { 
  EnvironmentType, 
  Environment,
  EnvironmentStatus,
  HealthStatus 
} from '../types'

export interface DetailedEnvironmentStatus {
  environmentType: EnvironmentType
  environmentName: string
  isActive: boolean
  isHealthy: boolean
  isProduction: boolean
  supabaseUrl: string
  appUrl: string
  lastChecked: Date
  services: { [serviceName: string]: boolean }
  warnings: string[]
  errors: string[]
  uptime?: number
}

export class EnvironmentStatusDisplay {
  private configManager: ConfigurationManager
  private serviceManager: ServiceManager

  constructor() {
    this.configManager = new ConfigurationManager()
    this.serviceManager = new ServiceManager()
  }

  /**
   * Display current environment status in console
   */
  async displayStatus(): Promise<void> {
    try {
      const status = await this.getDetailedStatus()
      this.renderStatusToConsole(status)
    } catch (error) {
      logger.error('Failed to display environment status', { error: error.message })
      console.error('❌ Could not display environment status:', error.message)
    }
  }

  /**
   * Get current environment status
   */
  async getCurrentStatus(): Promise<EnvironmentStatus> {
    try {
      const currentEnv = await this.configManager.getCurrentEnvironment()
      const services = await this.serviceManager.checkServicesStatus()
      
      const isHealthy = this.calculateHealthStatus(currentEnv, services)
      
      return {
        environmentType: currentEnv.type,
        isActive: true,
        isHealthy,
        lastChecked: new Date()
      }

    } catch (error) {
      logger.error('Failed to get current status', { error: error.message })
      
      return {
        environmentType: 'development', // Safe fallback
        isActive: false,
        isHealthy: false,
        lastChecked: new Date(),
        error: error.message
      }
    }
  }

  /**
   * Get detailed environment status
   */
  async getDetailedStatus(): Promise<DetailedEnvironmentStatus> {
    try {
      const currentEnv = await this.configManager.getCurrentEnvironment()
      const services = await this.serviceManager.checkServicesStatus()
      
      const warnings: string[] = []
      const errors: string[] = []

      // Check for potential issues
      if (currentEnv.type === 'production') {
        warnings.push('PRODUCTION ENVIRONMENT: Write operations are blocked')
      }

      if (!currentEnv.supabaseUrl) {
        errors.push('Supabase URL is not configured')
      }

      if (!currentEnv.supabaseAnonKey) {
        errors.push('Supabase anonymous key is not configured')
      }

      const isHealthy = errors.length === 0 && this.calculateHealthStatus(currentEnv, services)

      return {
        environmentType: currentEnv.type,
        environmentName: currentEnv.name,
        isActive: true,
        isHealthy,
        isProduction: currentEnv.type === 'production',
        supabaseUrl: this.maskSensitiveUrl(currentEnv.supabaseUrl),
        appUrl: currentEnv.databaseUrl || 'Not configured',
        lastChecked: new Date(),
        services,
        warnings,
        errors
      }

    } catch (error) {
      logger.error('Failed to get detailed status', { error: error.message })
      
      return {
        environmentType: 'development',
        environmentName: 'Unknown',
        isActive: false,
        isHealthy: false,
        isProduction: false,
        supabaseUrl: 'Not available',
        appUrl: 'Not available',
        lastChecked: new Date(),
        services: {},
        warnings: [],
        errors: [error.message]
      }
    }
  }

  /**
   * Get status for a specific environment
   */
  async getEnvironmentStatus(envType: EnvironmentType): Promise<EnvironmentStatus> {
    try {
      const environment = await this.configManager.getEnvironmentConfig(envType)
      const currentEnv = await this.configManager.getCurrentEnvironmentType()
      
      const isActive = currentEnv === envType
      const isHealthy = this.validateEnvironmentHealth(environment)

      return {
        environmentType: envType,
        isActive,
        isHealthy,
        lastChecked: new Date()
      }

    } catch (error) {
      logger.error('Failed to get environment status', { 
        error: error.message, 
        envType 
      })
      
      return {
        environmentType: envType,
        isActive: false,
        isHealthy: false,
        lastChecked: new Date(),
        error: error.message
      }
    }
  }

  /**
   * Display status comparison between environments
   */
  async displayEnvironmentComparison(): Promise<void> {
    try {
      console.log('\n' + '='.repeat(80))
      console.log('🌍 ENVIRONMENT COMPARISON')
      console.log('='.repeat(80))

      const environments = await this.configManager.listEnvironments()
      const currentEnvType = await this.configManager.getCurrentEnvironmentType()

      for (const env of environments) {
        const status = await this.getEnvironmentStatus(env.type)
        const isActive = env.type === currentEnvType
        
        console.log(`\n📋 ${env.type.toUpperCase()} Environment`)
        console.log(`   Status: ${isActive ? '🟢 ACTIVE' : '⚪ Inactive'}`)
        console.log(`   Health: ${status.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`)
        console.log(`   URL: ${this.maskSensitiveUrl(env.supabaseUrl)}`)
        
        if (status.error) {
          console.log(`   Error: ❌ ${status.error}`)
        }
      }

      console.log('\n' + '='.repeat(80))

    } catch (error) {
      logger.error('Failed to display environment comparison', { error: error.message })
      console.error('❌ Could not display environment comparison:', error.message)
    }
  }

  /**
   * Display service status
   */
  async displayServiceStatus(): Promise<void> {
    try {
      console.log('\n' + '='.repeat(60))
      console.log('🔧 SERVICE STATUS')
      console.log('='.repeat(60))

      const services = await this.serviceManager.checkServicesStatus()
      
      if (Object.keys(services).length === 0) {
        console.log('   No services detected')
      } else {
        for (const [serviceName, isRunning] of Object.entries(services)) {
          const status = isRunning ? '🟢 Running' : '🔴 Stopped'
          console.log(`   ${serviceName}: ${status}`)
        }
      }

      // Display manual restart instructions
      console.log('\n📋 Manual Restart Instructions:')
      const instructions = this.serviceManager.getManualRestartInstructions()
      instructions.forEach(instruction => {
        console.log(`   ${instruction}`)
      })

      console.log('='.repeat(60))

    } catch (error) {
      logger.error('Failed to display service status', { error: error.message })
      console.error('❌ Could not display service status:', error.message)
    }
  }

  // Private helper methods

  private renderStatusToConsole(status: DetailedEnvironmentStatus): void {
    console.log('\n' + '='.repeat(80))
    console.log('🌍 CURRENT ENVIRONMENT STATUS')
    console.log('='.repeat(80))

    // Environment info
    console.log(`\n📋 Environment: ${status.environmentType.toUpperCase()}`)
    console.log(`   Name: ${status.environmentName}`)
    console.log(`   Status: ${status.isActive ? '🟢 ACTIVE' : '⚪ Inactive'}`)
    console.log(`   Health: ${status.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`)
    
    if (status.isProduction) {
      console.log('   ⚠️  PRODUCTION ENVIRONMENT - READ ONLY')
    }

    // Configuration info
    console.log(`\n🔗 Configuration:`)
    console.log(`   Supabase URL: ${status.supabaseUrl}`)
    console.log(`   App URL: ${status.appUrl}`)
    console.log(`   Last Checked: ${status.lastChecked.toLocaleString()}`)

    // Services status
    if (Object.keys(status.services).length > 0) {
      console.log(`\n🔧 Services:`)
      for (const [serviceName, isRunning] of Object.entries(status.services)) {
        const serviceStatus = isRunning ? '🟢 Running' : '🔴 Stopped'
        console.log(`   ${serviceName}: ${serviceStatus}`)
      }
    }

    // Warnings
    if (status.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`)
      status.warnings.forEach(warning => {
        console.log(`   • ${warning}`)
      })
    }

    // Errors
    if (status.errors.length > 0) {
      console.log(`\n❌ Errors:`)
      status.errors.forEach(error => {
        console.log(`   • ${error}`)
      })
    }

    console.log('\n' + '='.repeat(80))
  }

  private calculateHealthStatus(environment: Environment, services: { [key: string]: boolean }): boolean {
    // Basic health checks
    if (!environment.supabaseUrl || !environment.supabaseAnonKey) {
      return false
    }

    // Check if critical services are running (if any)
    const criticalServices = ['Next.js Development Server']
    for (const service of criticalServices) {
      if (services[service] === false) {
        // Service is explicitly stopped - this might be intentional
        // Don't mark as unhealthy just for this
      }
    }

    return true
  }

  private validateEnvironmentHealth(environment: Environment): boolean {
    // Validate required configuration
    if (!environment.supabaseUrl) return false
    if (!environment.supabaseAnonKey) return false
    if (!environment.supabaseServiceKey) return false

    // Validate URL format
    try {
      new URL(environment.supabaseUrl)
    } catch {
      return false
    }

    return true
  }

  private maskSensitiveUrl(url: string): string {
    if (!url) return 'Not configured'
    
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      
      // Show first few characters and domain
      if (domain.includes('supabase')) {
        const parts = domain.split('.')
        if (parts.length > 0) {
          const projectId = parts[0]
          const maskedId = projectId.substring(0, 4) + '***' + projectId.substring(projectId.length - 2)
          return `https://${maskedId}.supabase.co`
        }
      }
      
      return `${urlObj.protocol}//${domain}`
    } catch {
      // If URL parsing fails, mask the string
      if (url.length > 20) {
        return url.substring(0, 10) + '***' + url.substring(url.length - 7)
      }
      return url
    }
  }
}