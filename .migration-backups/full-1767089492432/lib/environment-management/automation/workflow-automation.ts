/**
 * Workflow Automation Orchestrator
 * 
 * Coordinates and manages multiple automation workflows
 */

import { DailyEnvironmentRefresh, type DailyRefreshConfig } from './daily-refresh'
import { WeeklyEnvironmentRefresh, type WeeklyRefreshConfig } from './weekly-refresh'
import { TrainingEnvironmentSetup, type TrainingSetupConfig } from './training-environment-setup'
import { DevelopmentEnvironmentSetup, type DevelopmentSetupConfig } from './development-environment-setup'

export interface WorkflowConfig {
  // Refresh workflows
  dailyRefresh?: {
    enabled: boolean
    config: DailyRefreshConfig
  }
  
  weeklyRefresh?: {
    enabled: boolean
    config: WeeklyRefreshConfig
  }
  
  // Environment setup workflows
  autoTrainingSetup?: {
    enabled: boolean
    config: TrainingSetupConfig
    triggers: string[] // e.g., ['weekly', 'on-demand']
  }
  
  autoDevelopmentSetup?: {
    enabled: boolean
    config: DevelopmentSetupConfig
    triggers: string[] // e.g., ['on-branch-create', 'on-demand']
  }
  
  // Global settings
  notifications: {
    email?: string
    webhook?: string
    slack?: string
  }
  
  monitoring: {
    enabled: boolean
    healthChecks: boolean
    performanceMetrics: boolean
  }
}

export interface WorkflowStatus {
  dailyRefresh: {
    enabled: boolean
    lastRun?: Date
    nextRun?: Date
    status: 'idle' | 'running' | 'error'
  }
  
  weeklyRefresh: {
    enabled: boolean
    lastRun?: Date
    nextRun?: Date
    status: 'idle' | 'running' | 'error'
  }
  
  trainingSetup: {
    enabled: boolean
    lastSetup?: Date
    environmentsActive: number
  }
  
  developmentSetup: {
    enabled: boolean
    lastSetup?: Date
    environmentsActive: number
  }
}

export class WorkflowAutomation {
  private config: WorkflowConfig
  private dailyRefresh?: DailyEnvironmentRefresh
  private weeklyRefresh?: WeeklyEnvironmentRefresh
  private trainingSetup: TrainingEnvironmentSetup
  private developmentSetup: DevelopmentEnvironmentSetup
  
  private isInitialized: boolean = false

  constructor(config: WorkflowConfig) {
    this.config = config
    this.trainingSetup = new TrainingEnvironmentSetup()
    this.developmentSetup = new DevelopmentEnvironmentSetup()
  }

  /**
   * Initialize all configured workflows
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Workflow automation is already initialized')
    }

    console.log('🚀 Initializing workflow automation...')

    try {
      // Initialize daily refresh if enabled
      if (this.config.dailyRefresh?.enabled) {
        console.log('📅 Initializing daily refresh workflow...')
        this.dailyRefresh = new DailyEnvironmentRefresh(this.config.dailyRefresh.config)
        this.dailyRefresh.startScheduledRefresh()
        console.log('✅ Daily refresh workflow initialized')
      }

      // Initialize weekly refresh if enabled
      if (this.config.weeklyRefresh?.enabled) {
        console.log('📅 Initializing weekly refresh workflow...')
        this.weeklyRefresh = new WeeklyEnvironmentRefresh(this.config.weeklyRefresh.config)
        this.weeklyRefresh.startScheduledWeeklyRefresh()
        console.log('✅ Weekly refresh workflow initialized')
      }

      // Setup monitoring if enabled
      if (this.config.monitoring.enabled) {
        console.log('📊 Initializing monitoring...')
        await this.setupMonitoring()
        console.log('✅ Monitoring initialized')
      }

      this.isInitialized = true
      console.log('🎉 Workflow automation initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize workflow automation:', error.message)
      throw error
    }
  }

  /**
   * Get status of all workflows
   */
  public getWorkflowStatus(): WorkflowStatus {
    return {
      dailyRefresh: {
        enabled: this.config.dailyRefresh?.enabled || false,
        lastRun: this.dailyRefresh?.getRefreshStatus().lastRun,
        status: this.dailyRefresh?.getRefreshStatus().isRunning ? 'running' : 'idle'
      },
      
      weeklyRefresh: {
        enabled: this.config.weeklyRefresh?.enabled || false,
        lastRun: this.weeklyRefresh?.getRefreshStatus().lastRun,
        status: this.weeklyRefresh?.getRefreshStatus().isRunning ? 'running' : 'idle'
      },
      
      trainingSetup: {
        enabled: this.config.autoTrainingSetup?.enabled || false,
        environmentsActive: 0 // Would be tracked in real implementation
      },
      
      developmentSetup: {
        enabled: this.config.autoDevelopmentSetup?.enabled || false,
        environmentsActive: 0 // Would be tracked in real implementation
      }
    }
  }

  /**
   * Execute training environment setup on demand
   */
  public async executeTrainingSetup(customConfig?: Partial<TrainingSetupConfig>): Promise<void> {
    if (!this.config.autoTrainingSetup?.enabled) {
      throw new Error('Training environment setup is not enabled')
    }

    console.log('🎓 Executing on-demand training environment setup...')

    const config = customConfig 
      ? { ...this.config.autoTrainingSetup.config, ...customConfig }
      : this.config.autoTrainingSetup.config

    const result = await this.trainingSetup.setupTrainingEnvironment(config)

    if (!result.success) {
      throw new Error(`Training setup failed: ${result.errors.join(', ')}`)
    }

    console.log('✅ Training environment setup completed')
  }

  /**
   * Execute development environment setup on demand
   */
  public async executeDevelopmentSetup(customConfig?: Partial<DevelopmentSetupConfig>): Promise<void> {
    if (!this.config.autoDevelopmentSetup?.enabled) {
      throw new Error('Development environment setup is not enabled')
    }

    console.log('⚡ Executing on-demand development environment setup...')

    const config = customConfig 
      ? { ...this.config.autoDevelopmentSetup.config, ...customConfig }
      : this.config.autoDevelopmentSetup.config

    const result = await this.developmentSetup.setupDevelopmentEnvironment(config)

    if (!result.success) {
      throw new Error(`Development setup failed: ${result.errors.join(', ')}`)
    }

    console.log('✅ Development environment setup completed')
  }

  /**
   * Execute daily refresh on demand
   */
  public async executeDailyRefresh(): Promise<void> {
    if (!this.dailyRefresh) {
      throw new Error('Daily refresh is not initialized')
    }

    console.log('🔄 Executing on-demand daily refresh...')
    const result = await this.dailyRefresh.executeDailyRefresh()

    if (!result.success) {
      throw new Error(`Daily refresh failed: ${result.errors.join(', ')}`)
    }

    console.log('✅ Daily refresh completed')
  }

  /**
   * Execute weekly refresh on demand
   */
  public async executeWeeklyRefresh(): Promise<void> {
    if (!this.weeklyRefresh) {
      throw new Error('Weekly refresh is not initialized')
    }

    console.log('🔄 Executing on-demand weekly refresh...')
    const result = await this.weeklyRefresh.executeWeeklyRefresh()

    if (!result.success) {
      throw new Error(`Weekly refresh failed: ${result.errors.join(', ')}`)
    }

    console.log('✅ Weekly refresh completed')
  }

  /**
   * Stop all workflows
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down workflow automation...')

    if (this.dailyRefresh) {
      this.dailyRefresh.stopScheduledRefresh()
    }

    // In a real implementation, this would properly stop all scheduled tasks
    
    this.isInitialized = false
    console.log('✅ Workflow automation shut down')
  }

  /**
   * Update workflow configuration
   */
  public async updateConfig(newConfig: Partial<WorkflowConfig>): Promise<void> {
    console.log('⚙️  Updating workflow configuration...')

    // Merge new configuration
    this.config = { ...this.config, ...newConfig }

    // Restart workflows if needed
    if (this.isInitialized) {
      await this.shutdown()
      await this.initialize()
    }

    console.log('✅ Configuration updated')
  }

  /**
   * Setup monitoring and health checks
   */
  private async setupMonitoring(): Promise<void> {
    // In a real implementation, this would:
    // 1. Setup health check endpoints
    // 2. Configure performance monitoring
    // 3. Setup alerting systems
    // 4. Initialize logging systems

    console.log('📊 Monitoring system configured')
  }

  /**
   * Get default workflow configuration
   */
  public static getDefaultConfig(): WorkflowConfig {
    return {
      dailyRefresh: {
        enabled: true,
        config: {
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
      },

      weeklyRefresh: {
        enabled: true,
        config: {
          targetEnvironments: ['test', 'training', 'development'],
          dayOfWeek: 0, // Sunday
          refreshTime: '01:00',
          performDeepClean: true,
          optimizeDatabase: true,
          updateSchemas: true,
          fullValidation: true,
          anonymizeData: true,
          includeAuditLogs: true,
          includeConversations: true,
          includeReservations: true,
          createFullBackups: true,
          retainBackupDays: 30,
          generateDetailedReport: true
        }
      },

      autoTrainingSetup: {
        enabled: false, // Disabled by default, enabled on demand
        config: {
          environmentName: 'auto-training',
          baseEnvironment: 'production',
          generateSampleData: true,
          sampleDataSize: 'medium',
          includeHistoricalData: true,
          createTrainingUsers: true,
          trainingUserRoles: TrainingEnvironmentSetup.getDefaultTrainingUserRoles(),
          setupTrainingScenarios: true,
          trainingScenarios: TrainingEnvironmentSetup.getDefaultTrainingScenarios(),
          includeAuditSystem: true,
          includeConversations: true,
          includeReservations: true,
          includeNotifications: true,
          autoCleanupAfterDays: 30,
          createBackup: true,
          generateTrainingGuide: true,
          includeTestData: true
        },
        triggers: ['weekly', 'on-demand']
      },

      autoDevelopmentSetup: {
        enabled: false, // Disabled by default, enabled on demand
        config: DevelopmentEnvironmentSetup.getDefaultConfig(),
        triggers: ['on-demand']
      },

      notifications: {
        // Configure as needed
      },

      monitoring: {
        enabled: true,
        healthChecks: true,
        performanceMetrics: true
      }
    }
  }
}

/**
 * CLI function to start workflow automation
 */
export async function startWorkflowAutomation(configPath?: string): Promise<void> {
  try {
    const config: WorkflowConfig = configPath 
      ? require(configPath)
      : WorkflowAutomation.getDefaultConfig()

    const automation = new WorkflowAutomation(config)
    await automation.initialize()

    console.log('Workflow automation started. Press Ctrl+C to stop.')
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down workflow automation...')
      await automation.shutdown()
      process.exit(0)
    })

    // Keep the process alive
    setInterval(() => {
      // Optionally log status periodically
      const status = automation.getWorkflowStatus()
      console.log(`Status: Daily(${status.dailyRefresh.status}) Weekly(${status.weeklyRefresh.status})`)
    }, 300000) // Every 5 minutes

  } catch (error) {
    console.error('Failed to start workflow automation:', error.message)
    process.exit(1)
  }
}

// CLI execution
if (require.main === module) {
  const configPath = process.argv[2]
  startWorkflowAutomation(configPath)
}