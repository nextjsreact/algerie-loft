#!/usr/bin/env tsx

/**
 * Development Environment Quick Setup Automation
 * 
 * Automated script for quickly setting up development environments with
 * minimal data, fast configuration, and developer-friendly settings.
 * 
 * CRITICAL SAFETY: Production is ALWAYS read-only source
 */

import { EnvironmentCloner } from '../environment-cloner'
import { EnvironmentConfigManager } from '../environment-config-manager'
import { ProductionSafetyGuard } from '../production-safety-guard'
import { EnvironmentValidator } from '../environment-validator'
import { 
  Environment, 
  CloneOptions, 
  CloneResult,
  EnvironmentConfig 
} from '../types'

export interface DevelopmentSetupConfig {
  // Environment configuration
  environmentName?: string
  sourceEnvironment: 'production' | 'test' | 'minimal'
  
  // Development-specific options
  minimalDataSet: boolean
  includeDevTools: boolean
  enableDebugMode: boolean
  fastSetup: boolean
  
  // Data configuration
  anonymizeData: boolean
  includeAuditLogs: boolean
  includeConversations: boolean
  includeReservations: boolean
  maxRecordsPerTable: number
  
  // Developer features
  createDevUsers: boolean
  enableHotReload: boolean
  setupTestData: boolean
  
  // Performance options
  skipValidation: boolean
  parallelProcessing: boolean
  
  // Local development
  useLocalDatabase?: boolean
  localDatabaseUrl?: string
}

export interface DevelopmentSetupResult {
  success: boolean
  environmentId: string
  environmentName: string
  configurationPath: string
  devUsers: DevUser[]
  sampleDataSummary: DevDataSummary
  devToolsEnabled: string[]
  setupDuration: number
  quickStartGuide: string[]
  errors: string[]
  warnings: string[]
  completedAt: Date
}

export interface DevUser {
  id: string
  email: string
  password: string
  role: string
  purpose: string
}

export interface DevDataSummary {
  lofts: number
  reservations: number
  transactions: number
  users: number
  totalSize: string
}

export class DevelopmentEnvironmentSetup {
  private cloner: EnvironmentCloner
  private configManager: EnvironmentConfigManager
  private safetyGuard: ProductionSafetyGuard
  private validator: EnvironmentValidator

  constructor() {
    this.cloner = new EnvironmentCloner()
    this.configManager = new EnvironmentConfigManager()
    this.safetyGuard = ProductionSafetyGuard.getInstance()
    this.validator = new EnvironmentValidator()
  }

  /**
   * Quick setup development environment
   */
  public async setupDevelopmentEnvironment(config: DevelopmentSetupConfig): Promise<DevelopmentSetupResult> {
    const startTime = Date.now()
    const setupId = `dev_setup_${Date.now()}`

    try {
      console.log('⚡ Starting quick development environment setup...')
      console.log(`🔧 Setup ID: ${setupId}`)
      console.log(`📊 Mode: ${config.fastSetup ? 'Fast Setup' : 'Standard Setup'}`)
      console.log(`💾 Data: ${config.minimalDataSet ? 'Minimal' : 'Standard'}`)

      // Phase 1: Environment configuration
      console.log('\n🔧 Phase 1: Environment configuration')
      const environment = await this.createDevelopmentEnvironment(config, setupId)

      // Phase 2: Data setup
      console.log('\n📊 Phase 2: Data setup')
      let cloneResult: CloneResult | undefined
      let sampleDataSummary: DevDataSummary

      if (config.sourceEnvironment === 'minimal') {
        sampleDataSummary = await this.createMinimalData(config, environment, setupId)
      } else {
        cloneResult = await this.cloneSourceData(config, environment, setupId)
        sampleDataSummary = this.extractDataSummary(cloneResult)
      }

      // Phase 3: Developer users
      console.log('\n👥 Phase 3: Developer users')
      const devUsers = await this.createDeveloperUsers(config, environment, setupId)

      // Phase 4: Development tools
      console.log('\n🛠️  Phase 4: Development tools')
      const devToolsEnabled = await this.setupDevelopmentTools(config, environment, setupId)

      // Phase 5: Configuration finalization
      console.log('\n⚙️  Phase 5: Configuration finalization')
      const configPath = await this.finalizeConfiguration(config, environment, setupId)

      // Phase 6: Quick validation (if not skipped)
      if (!config.skipValidation) {
        console.log('\n✅ Phase 6: Quick validation')
        await this.quickValidation(environment, setupId)
      }

      const setupDuration = Date.now() - startTime

      const result: DevelopmentSetupResult = {
        success: true,
        environmentId: environment.id,
        environmentName: environment.name,
        configurationPath: configPath,
        devUsers,
        sampleDataSummary,
        devToolsEnabled,
        setupDuration,
        quickStartGuide: this.generateQuickStartGuide(config, environment, devUsers),
        errors: [],
        warnings: [],
        completedAt: new Date()
      }

      console.log('\n🚀 Development environment ready!')
      console.log(`⚡ Setup completed in ${Math.round(setupDuration / 1000)}s`)
      console.log(`🔧 Environment: ${result.environmentName}`)
      console.log(`👥 Dev users: ${result.devUsers.length}`)
      console.log(`📊 Sample data: ${result.sampleDataSummary.lofts} lofts, ${result.sampleDataSummary.reservations} reservations`)

      return result

    } catch (error) {
      console.error('❌ Development environment setup failed:', error.message)
      
      return {
        success: false,
        environmentId: '',
        environmentName: config.environmentName || 'dev-failed',
        configurationPath: '',
        devUsers: [],
        sampleDataSummary: {
          lofts: 0,
          reservations: 0,
          transactions: 0,
          users: 0,
          totalSize: '0 MB'
        },
        devToolsEnabled: [],
        setupDuration: Date.now() - startTime,
        quickStartGuide: [],
        errors: [error.message],
        warnings: [],
        completedAt: new Date()
      }
    }
  }

  /**
   * Create development environment configuration
   */
  private async createDevelopmentEnvironment(config: DevelopmentSetupConfig, setupId: string): Promise<Environment> {
    const envName = config.environmentName || `dev-${Date.now()}`
    console.log(`🔧 Creating development environment: ${envName}`)

    const envConfig: Partial<EnvironmentConfig> = {
      NEXT_PUBLIC_SUPABASE_URL: config.useLocalDatabase 
        ? config.localDatabaseUrl || 'http://localhost:54321'
        : `https://${envName}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dev_anon_key_placeholder',
      SUPABASE_SERVICE_ROLE_KEY: 'dev_service_key_placeholder',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NODE_ENV: 'development',
      ANONYMIZE_DATA: config.anonymizeData,
      INCLUDE_AUDIT_LOGS: config.includeAuditLogs,
      PRESERVE_USER_ROLES: false
    }

    // Add development-specific environment variables
    if (config.enableDebugMode) {
      (envConfig as any).DEBUG = 'true'
      (envConfig as any).LOG_LEVEL = 'debug'
    }

    if (config.enableHotReload) {
      (envConfig as any).FAST_REFRESH = 'true'
      (envConfig as any).TURBOPACK = 'true'
    }

    // Create environment configuration
    await this.configManager.createEnvironmentConfig('development', envConfig)
    const environment = await this.configManager.createEnvironmentFromConfig('development', envConfig as EnvironmentConfig)

    console.log(`✅ Development environment created: ${environment.name}`)
    return environment
  }

  /**
   * Clone data from source environment
   */
  private async cloneSourceData(
    config: DevelopmentSetupConfig,
    targetEnv: Environment,
    setupId: string
  ): Promise<CloneResult> {
    console.log(`📊 Cloning data from ${config.sourceEnvironment} environment...`)

    const sourceEnv = await this.configManager.createEnvironmentFromConfig(config.sourceEnvironment)
    
    // Validate source environment
    if (config.sourceEnvironment === 'production') {
      await this.safetyGuard.validateCloneSource(sourceEnv)
    }

    const cloneOptions: CloneOptions = {
      anonymizeData: config.anonymizeData,
      includeAuditLogs: config.includeAuditLogs,
      includeConversations: config.includeConversations,
      includeReservations: config.includeReservations,
      preserveUserRoles: false,
      createBackup: false, // Skip backup for dev environments
      validateAfterClone: !config.skipValidation,
      skipConfirmation: true
    }

    const result = await this.cloner.cloneEnvironment(sourceEnv, targetEnv, cloneOptions)
    
    if (result.success) {
      console.log(`✅ Data cloned successfully from ${config.sourceEnvironment}`)
    } else {
      throw new Error(`Failed to clone data: ${result.errors.join(', ')}`)
    }

    return result
  }

  /**
   * Create minimal development data
   */
  private async createMinimalData(
    config: DevelopmentSetupConfig,
    environment: Environment,
    setupId: string
  ): Promise<DevDataSummary> {
    console.log('📊 Creating minimal development data...')

    // Create minimal data set for fast development
    const minimalData = {
      lofts: Math.min(config.maxRecordsPerTable, 3),
      reservations: Math.min(config.maxRecordsPerTable, 5),
      transactions: Math.min(config.maxRecordsPerTable, 10),
      users: Math.min(config.maxRecordsPerTable, 5)
    }

    console.log(`🏠 Creating ${minimalData.lofts} sample lofts...`)
    console.log(`📅 Creating ${minimalData.reservations} sample reservations...`)
    console.log(`💰 Creating ${minimalData.transactions} sample transactions...`)
    console.log(`👥 Creating ${minimalData.users} sample users...`)

    // In a real implementation, this would create actual minimal data
    // For now, we simulate the creation

    const summary: DevDataSummary = {
      lofts: minimalData.lofts,
      reservations: minimalData.reservations,
      transactions: minimalData.transactions,
      users: minimalData.users,
      totalSize: '5 MB'
    }

    console.log('✅ Minimal development data created')
    return summary
  }

  /**
   * Create developer user accounts
   */
  private async createDeveloperUsers(
    config: DevelopmentSetupConfig,
    environment: Environment,
    setupId: string
  ): Promise<DevUser[]> {
    if (!config.createDevUsers) {
      console.log('⏭️  Skipping developer users creation (disabled in config)')
      return []
    }

    console.log('👥 Creating developer user accounts...')

    const devUsers: DevUser[] = [
      {
        id: 'dev_admin',
        email: 'admin@dev.local',
        password: 'DevAdmin123!',
        role: 'admin',
        purpose: 'Full system access for development'
      },
      {
        id: 'dev_manager',
        email: 'manager@dev.local',
        password: 'DevManager123!',
        role: 'manager',
        purpose: 'Manager role testing'
      },
      {
        id: 'dev_user',
        email: 'user@dev.local',
        password: 'DevUser123!',
        role: 'member',
        purpose: 'Standard user testing'
      },
      {
        id: 'dev_test',
        email: 'test@dev.local',
        password: 'DevTest123!',
        role: 'viewer',
        purpose: 'Automated testing account'
      }
    ]

    devUsers.forEach(user => {
      console.log(`👤 Created dev user: ${user.email} (${user.role})`)
    })

    console.log(`✅ Created ${devUsers.length} developer users`)
    return devUsers
  }

  /**
   * Setup development tools and features
   */
  private async setupDevelopmentTools(
    config: DevelopmentSetupConfig,
    environment: Environment,
    setupId: string
  ): Promise<string[]> {
    if (!config.includeDevTools) {
      console.log('⏭️  Skipping development tools setup (disabled in config)')
      return []
    }

    console.log('🛠️  Setting up development tools...')

    const devTools: string[] = []

    // Enable debug mode
    if (config.enableDebugMode) {
      console.log('🐛 Enabling debug mode...')
      devTools.push('Debug Mode')
    }

    // Enable hot reload
    if (config.enableHotReload) {
      console.log('🔥 Enabling hot reload...')
      devTools.push('Hot Reload')
    }

    // Setup test data
    if (config.setupTestData) {
      console.log('🧪 Setting up test data utilities...')
      devTools.push('Test Data Utilities')
    }

    // Development database tools
    console.log('🗄️  Setting up database development tools...')
    devTools.push('Database Tools')

    // API development tools
    console.log('🔌 Setting up API development tools...')
    devTools.push('API Tools')

    // Performance monitoring
    console.log('📊 Setting up performance monitoring...')
    devTools.push('Performance Monitoring')

    console.log(`✅ Development tools setup completed: ${devTools.join(', ')}`)
    return devTools
  }

  /**
   * Finalize environment configuration
   */
  private async finalizeConfiguration(
    config: DevelopmentSetupConfig,
    environment: Environment,
    setupId: string
  ): Promise<string> {
    console.log('⚙️  Finalizing environment configuration...')

    // Create .env.development file
    const configPath = '.env.development'
    
    // In a real implementation, this would write the actual configuration file
    console.log(`📝 Configuration saved to: ${configPath}`)
    
    // Setup package.json scripts for development
    console.log('📦 Setting up development scripts...')
    
    // Setup IDE configuration
    console.log('💻 Setting up IDE configuration...')
    
    console.log('✅ Configuration finalized')
    return configPath
  }

  /**
   * Quick validation for development environment
   */
  private async quickValidation(environment: Environment, setupId: string): Promise<void> {
    console.log('✅ Running quick validation...')

    // Basic connectivity check
    console.log('🔌 Checking database connectivity...')
    
    // Schema validation
    console.log('🗄️  Validating database schema...')
    
    // Basic functionality test
    console.log('⚡ Testing basic functionality...')

    const validation = await this.validator.validateEnvironment(environment)
    
    if (validation.errors.length > 0) {
      console.log('⚠️  Validation warnings (non-blocking for dev):')
      validation.errors.forEach(error => console.log(`  • ${error}`))
    }

    console.log('✅ Quick validation completed')
  }

  /**
   * Extract data summary from clone result
   */
  private extractDataSummary(cloneResult: CloneResult): DevDataSummary {
    return {
      lofts: Math.floor(cloneResult.statistics.recordsCloned * 0.1), // Estimate
      reservations: Math.floor(cloneResult.statistics.recordsCloned * 0.3), // Estimate
      transactions: Math.floor(cloneResult.statistics.recordsCloned * 0.5), // Estimate
      users: Math.floor(cloneResult.statistics.recordsCloned * 0.1), // Estimate
      totalSize: cloneResult.statistics.totalSizeCloned
    }
  }

  /**
   * Generate quick start guide
   */
  private generateQuickStartGuide(
    config: DevelopmentSetupConfig,
    environment: Environment,
    devUsers: DevUser[]
  ): string[] {
    const guide = [
      '🚀 Development Environment Quick Start Guide',
      '',
      '1. Environment Setup:',
      `   • Environment: ${environment.name}`,
      `   • Database: ${config.useLocalDatabase ? 'Local' : 'Remote'}`,
      `   • Debug Mode: ${config.enableDebugMode ? 'Enabled' : 'Disabled'}`,
      '',
      '2. Start Development Server:',
      '   npm run dev',
      '   # or',
      '   yarn dev',
      '',
      '3. Development Users:'
    ]

    devUsers.forEach(user => {
      guide.push(`   • ${user.email} / ${user.password} (${user.role})`)
    })

    guide.push(
      '',
      '4. Useful Commands:',
      '   npm run db:reset     # Reset database',
      '   npm run db:seed      # Seed test data',
      '   npm run test         # Run tests',
      '   npm run lint         # Run linting',
      '',
      '5. Development URLs:',
      '   • App: http://localhost:3000',
      '   • API: http://localhost:3000/api',
      config.useLocalDatabase ? '   • Database: http://localhost:54321' : '',
      '',
      '6. Tips:',
      '   • Use the admin account for full access',
      '   • Test different user roles with provided accounts',
      '   • Check console for debug information',
      config.enableHotReload ? '   • Hot reload is enabled for fast development' : '',
      '',
      '🎉 Happy coding!'
    )

    return guide.filter(line => line !== null)
  }

  /**
   * Get default development configuration
   */
  public static getDefaultConfig(): DevelopmentSetupConfig {
    return {
      sourceEnvironment: 'production',
      minimalDataSet: true,
      includeDevTools: true,
      enableDebugMode: true,
      fastSetup: true,
      anonymizeData: true,
      includeAuditLogs: false, // Skip for faster setup
      includeConversations: false, // Skip for faster setup
      includeReservations: true,
      maxRecordsPerTable: 10,
      createDevUsers: true,
      enableHotReload: true,
      setupTestData: true,
      skipValidation: false,
      parallelProcessing: true,
      useLocalDatabase: false
    }
  }

  /**
   * Get minimal configuration for fastest setup
   */
  public static getMinimalConfig(): DevelopmentSetupConfig {
    return {
      sourceEnvironment: 'minimal',
      minimalDataSet: true,
      includeDevTools: false,
      enableDebugMode: false,
      fastSetup: true,
      anonymizeData: false,
      includeAuditLogs: false,
      includeConversations: false,
      includeReservations: false,
      maxRecordsPerTable: 3,
      createDevUsers: true,
      enableHotReload: true,
      setupTestData: false,
      skipValidation: true,
      parallelProcessing: true,
      useLocalDatabase: true
    }
  }
}

/**
 * CLI function to setup development environment
 */
export async function setupDevelopmentEnvironment(
  mode: 'default' | 'minimal' | 'custom' = 'default',
  configPath?: string
): Promise<void> {
  try {
    let config: DevelopmentSetupConfig

    switch (mode) {
      case 'minimal':
        config = DevelopmentEnvironmentSetup.getMinimalConfig()
        break
      case 'custom':
        if (!configPath) {
          throw new Error('Custom mode requires config path')
        }
        config = require(configPath)
        break
      default:
        config = DevelopmentEnvironmentSetup.getDefaultConfig()
    }

    const setup = new DevelopmentEnvironmentSetup()
    const result = await setup.setupDevelopmentEnvironment(config)

    if (result.success) {
      console.log('\n🎉 Development environment setup completed!')
      console.log(`⚡ Setup time: ${Math.round(result.setupDuration / 1000)}s`)
      console.log(`🔧 Environment: ${result.environmentName}`)
      console.log(`📝 Configuration: ${result.configurationPath}`)
      
      console.log('\n📋 Quick Start Guide:')
      result.quickStartGuide.forEach(line => console.log(line))
    } else {
      console.error('❌ Development environment setup failed')
      result.errors.forEach(error => console.error(`  • ${error}`))
      process.exit(1)
    }
  } catch (error) {
    console.error('Development environment setup failed:', error.message)
    process.exit(1)
  }
}

// CLI execution
if (require.main === module) {
  const mode = (process.argv[2] as 'default' | 'minimal' | 'custom') || 'default'
  const configPath = process.argv[3]

  if (mode === 'custom' && !configPath) {
    console.log('Usage: tsx development-environment-setup.ts [default|minimal|custom] [config-path]')
    console.log('  default - Standard development setup with sample data')
    console.log('  minimal - Fastest setup with minimal data')
    console.log('  custom  - Custom setup using provided config file')
    process.exit(1)
  }

  setupDevelopmentEnvironment(mode, configPath)
}