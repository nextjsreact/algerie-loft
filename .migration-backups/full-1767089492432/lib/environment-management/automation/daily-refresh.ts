#!/usr/bin/env tsx

/**
 * Daily Environment Refresh Automation
 * 
 * Automated script for refreshing test and training environments with fresh production data.
 * Runs daily to ensure environments have up-to-date data for testing and training.
 * 
 * CRITICAL SAFETY: Production is ALWAYS read-only source
 */

import { EnvironmentCloner } from '../environment-cloner'
import { EnvironmentConfigManager } from '../environment-config-manager'
import { ProductionSafetyGuard } from '../production-safety-guard'
import { EnvironmentValidator } from '../environment-validator'
import { CloneProgressTracker } from '../clone-progress-tracker'
import { 
  Environment, 
  CloneOptions, 
  CloneResult,
  EnvironmentType 
} from '../types'

export interface DailyRefreshConfig {
  // Environments to refresh
  targetEnvironments: EnvironmentType[]
  
  // Refresh schedule
  refreshTime: string // HH:MM format
  weekdaysOnly: boolean
  
  // Clone options
  anonymizeData: boolean
  includeAuditLogs: boolean
  includeConversations: boolean
  includeReservations: boolean
  
  // Safety options
  createBackups: boolean
  validateAfterRefresh: boolean
  
  // Notification options
  notifyOnSuccess: boolean
  notifyOnFailure: boolean
  notificationEmail?: string
}

export interface DailyRefreshResult {
  success: boolean
  refreshedEnvironments: string[]
  failedEnvironments: string[]
  totalDuration: number
  results: CloneResult[]
  errors: string[]
  timestamp: Date
}

export class DailyEnvironmentRefresh {
  private cloner: EnvironmentCloner
  private configManager: EnvironmentConfigManager
  private safetyGuard: ProductionSafetyGuard
  private validator: EnvironmentValidator
  private progressTracker: CloneProgressTracker
  
  private isRunning: boolean = false
  private lastRun?: Date
  private config: DailyRefreshConfig

  constructor(config: DailyRefreshConfig) {
    this.cloner = new EnvironmentCloner()
    this.configManager = new EnvironmentConfigManager()
    this.safetyGuard = ProductionSafetyGuard.getInstance()
    this.validator = new EnvironmentValidator()
    this.progressTracker = new CloneProgressTracker()
    this.config = config
  }

  /**
   * Execute daily refresh for all configured environments
   */
  public async executeDailyRefresh(): Promise<DailyRefreshResult> {
    if (this.isRunning) {
      throw new Error('Daily refresh is already running')
    }

    this.isRunning = true
    const startTime = Date.now()
    const refreshId = `daily_refresh_${Date.now()}`

    try {
      console.log('🔄 Starting daily environment refresh...')
      console.log(`📅 Refresh ID: ${refreshId}`)
      console.log(`🎯 Target environments: ${this.config.targetEnvironments.join(', ')}`)

      // Validate production source environment
      const productionEnv = await this.getProductionEnvironment()
      await this.validateProductionSource(productionEnv, refreshId)

      // Execute refresh for each target environment
      const results: CloneResult[] = []
      const refreshedEnvironments: string[] = []
      const failedEnvironments: string[] = []
      const errors: string[] = []

      for (const envType of this.config.targetEnvironments) {
        try {
          console.log(`\n🔄 Refreshing ${envType} environment...`)
          
          const targetEnv = await this.configManager.createEnvironmentFromConfig(envType)
          const result = await this.refreshEnvironment(productionEnv, targetEnv, refreshId)
          
          results.push(result)
          
          if (result.success) {
            refreshedEnvironments.push(envType)
            console.log(`✅ ${envType} environment refreshed successfully`)
          } else {
            failedEnvironments.push(envType)
            errors.push(...result.errors)
            console.log(`❌ ${envType} environment refresh failed: ${result.errors.join(', ')}`)
          }
        } catch (error) {
          failedEnvironments.push(envType)
          errors.push(`${envType}: ${error.message}`)
          console.log(`❌ ${envType} environment refresh failed: ${error.message}`)
        }
      }

      const totalDuration = Date.now() - startTime
      this.lastRun = new Date()

      const refreshResult: DailyRefreshResult = {
        success: failedEnvironments.length === 0,
        refreshedEnvironments,
        failedEnvironments,
        totalDuration,
        results,
        errors,
        timestamp: new Date()
      }

      // Generate summary report
      await this.generateRefreshReport(refreshResult, refreshId)

      // Send notifications if configured
      if (this.config.notifyOnSuccess && refreshResult.success) {
        await this.sendSuccessNotification(refreshResult)
      }
      if (this.config.notifyOnFailure && !refreshResult.success) {
        await this.sendFailureNotification(refreshResult)
      }

      console.log('\n📊 Daily refresh completed')
      console.log(`✅ Successful: ${refreshedEnvironments.length}`)
      console.log(`❌ Failed: ${failedEnvironments.length}`)
      console.log(`⏱️  Total duration: ${Math.round(totalDuration / 1000)}s`)

      return refreshResult

    } catch (error) {
      console.error('❌ Daily refresh failed:', error.message)
      
      const refreshResult: DailyRefreshResult = {
        success: false,
        refreshedEnvironments: [],
        failedEnvironments: this.config.targetEnvironments,
        totalDuration: Date.now() - startTime,
        results: [],
        errors: [error.message],
        timestamp: new Date()
      }

      if (this.config.notifyOnFailure) {
        await this.sendFailureNotification(refreshResult)
      }

      return refreshResult
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Schedule daily refresh to run automatically
   */
  public startScheduledRefresh(): void {
    console.log(`📅 Scheduling daily refresh at ${this.config.refreshTime}`)
    
    const scheduleNextRun = () => {
      const now = new Date()
      const [hours, minutes] = this.config.refreshTime.split(':').map(Number)
      
      const nextRun = new Date()
      nextRun.setHours(hours, minutes, 0, 0)
      
      // If the time has already passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      
      // Skip weekends if weekdaysOnly is true
      if (this.config.weekdaysOnly) {
        while (nextRun.getDay() === 0 || nextRun.getDay() === 6) {
          nextRun.setDate(nextRun.getDate() + 1)
        }
      }
      
      const timeUntilRun = nextRun.getTime() - now.getTime()
      
      console.log(`⏰ Next refresh scheduled for: ${nextRun.toLocaleString()}`)
      
      setTimeout(async () => {
        try {
          await this.executeDailyRefresh()
        } catch (error) {
          console.error('Scheduled refresh failed:', error.message)
        }
        
        // Schedule the next run
        scheduleNextRun()
      }, timeUntilRun)
    }
    
    scheduleNextRun()
  }

  /**
   * Stop scheduled refresh
   */
  public stopScheduledRefresh(): void {
    console.log('🛑 Stopping scheduled refresh')
    // In a real implementation, this would clear the timeout
  }

  /**
   * Get refresh status
   */
  public getRefreshStatus(): {
    isRunning: boolean
    lastRun?: Date
    nextRun?: Date
  } {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun
    }
  }

  /**
   * Validate production source environment
   */
  private async validateProductionSource(productionEnv: Environment, refreshId: string): Promise<void> {
    console.log('🔒 Validating production source environment...')
    
    // Ensure production is read-only
    await this.safetyGuard.validateCloneSource(productionEnv)
    
    // Validate production connectivity
    const validation = await this.validator.validateEnvironment(productionEnv)
    if (!validation.isValid) {
      throw new Error(`Production environment validation failed: ${validation.errors.join(', ')}`)
    }
    
    console.log('✅ Production source validated')
  }

  /**
   * Get production environment configuration
   */
  private async getProductionEnvironment(): Promise<Environment> {
    try {
      return await this.configManager.createEnvironmentFromConfig('production')
    } catch (error) {
      throw new Error(`Failed to load production environment: ${error.message}`)
    }
  }

  /**
   * Refresh a single environment
   */
  private async refreshEnvironment(
    sourceEnv: Environment,
    targetEnv: Environment,
    refreshId: string
  ): Promise<CloneResult> {
    const cloneOptions: CloneOptions = {
      anonymizeData: this.config.anonymizeData,
      includeAuditLogs: this.config.includeAuditLogs,
      includeConversations: this.config.includeConversations,
      includeReservations: this.config.includeReservations,
      preserveUserRoles: true,
      createBackup: this.config.createBackups,
      validateAfterClone: this.config.validateAfterRefresh,
      skipConfirmation: true // Automated process
    }

    return await this.cloner.cloneEnvironment(sourceEnv, targetEnv, cloneOptions)
  }

  /**
   * Generate refresh report
   */
  private async generateRefreshReport(result: DailyRefreshResult, refreshId: string): Promise<void> {
    const report = {
      refreshId,
      timestamp: result.timestamp.toISOString(),
      config: this.config,
      result,
      summary: {
        totalEnvironments: this.config.targetEnvironments.length,
        successfulRefreshes: result.refreshedEnvironments.length,
        failedRefreshes: result.failedEnvironments.length,
        successRate: `${Math.round((result.refreshedEnvironments.length / this.config.targetEnvironments.length) * 100)}%`,
        totalDurationMinutes: Math.round(result.totalDuration / 60000)
      }
    }

    console.log('\n📋 Daily Refresh Report:')
    console.log(`📊 Success Rate: ${report.summary.successRate}`)
    console.log(`⏱️  Duration: ${report.summary.totalDurationMinutes} minutes`)
    console.log(`✅ Successful: ${result.refreshedEnvironments.join(', ') || 'None'}`)
    console.log(`❌ Failed: ${result.failedEnvironments.join(', ') || 'None'}`)

    // In a real implementation, this would save the report to a file or database
  }

  /**
   * Send success notification
   */
  private async sendSuccessNotification(result: DailyRefreshResult): Promise<void> {
    if (!this.config.notificationEmail) return

    const message = `
Daily Environment Refresh - SUCCESS

✅ Successfully refreshed ${result.refreshedEnvironments.length} environments:
${result.refreshedEnvironments.map(env => `  • ${env}`).join('\n')}

⏱️  Total duration: ${Math.round(result.totalDuration / 60000)} minutes
📅 Completed at: ${result.timestamp.toLocaleString()}
    `

    console.log('📧 Sending success notification...')
    // In a real implementation, this would send an email
    console.log(message)
  }

  /**
   * Send failure notification
   */
  private async sendFailureNotification(result: DailyRefreshResult): Promise<void> {
    if (!this.config.notificationEmail) return

    const message = `
Daily Environment Refresh - FAILURE

❌ Failed to refresh ${result.failedEnvironments.length} environments:
${result.failedEnvironments.map(env => `  • ${env}`).join('\n')}

Errors:
${result.errors.map(error => `  • ${error}`).join('\n')}

✅ Successfully refreshed: ${result.refreshedEnvironments.join(', ') || 'None'}
📅 Attempted at: ${result.timestamp.toLocaleString()}
    `

    console.log('📧 Sending failure notification...')
    // In a real implementation, this would send an email
    console.log(message)
  }
}

/**
 * CLI function to run daily refresh
 */
export async function runDailyRefresh(configPath?: string): Promise<void> {
  try {
    // Load configuration
    const config: DailyRefreshConfig = configPath 
      ? require(configPath)
      : {
          targetEnvironments: ['test', 'training'],
          refreshTime: '02:00',
          weekdaysOnly: true,
          anonymizeData: true,
          includeAuditLogs: true,
          includeConversations: true,
          includeReservations: true,
          createBackups: true,
          validateAfterRefresh: true,
          notifyOnSuccess: false,
          notifyOnFailure: true
        }

    const refresher = new DailyEnvironmentRefresh(config)
    const result = await refresher.executeDailyRefresh()

    if (!result.success) {
      process.exit(1)
    }
  } catch (error) {
    console.error('Daily refresh failed:', error.message)
    process.exit(1)
  }
}

/**
 * CLI function to start scheduled refresh
 */
export async function startScheduledRefresh(configPath?: string): Promise<void> {
  try {
    // Load configuration
    const config: DailyRefreshConfig = configPath 
      ? require(configPath)
      : {
          targetEnvironments: ['test', 'training'],
          refreshTime: '02:00',
          weekdaysOnly: true,
          anonymizeData: true,
          includeAuditLogs: true,
          includeConversations: true,
          includeReservations: true,
          createBackups: true,
          validateAfterRefresh: true,
          notifyOnSuccess: false,
          notifyOnFailure: true
        }

    const refresher = new DailyEnvironmentRefresh(config)
    refresher.startScheduledRefresh()

    // Keep the process running
    console.log('Daily refresh scheduler started. Press Ctrl+C to stop.')
    process.on('SIGINT', () => {
      console.log('\nStopping daily refresh scheduler...')
      refresher.stopScheduledRefresh()
      process.exit(0)
    })

    // Keep alive
    setInterval(() => {}, 1000)
  } catch (error) {
    console.error('Failed to start scheduled refresh:', error.message)
    process.exit(1)
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2]
  const configPath = process.argv[3]

  switch (command) {
    case 'run':
      runDailyRefresh(configPath)
      break
    case 'schedule':
      startScheduledRefresh(configPath)
      break
    default:
      console.log('Usage: tsx daily-refresh.ts [run|schedule] [config-path]')
      console.log('  run      - Execute daily refresh once')
      console.log('  schedule - Start scheduled daily refresh')
      process.exit(1)
  }
}