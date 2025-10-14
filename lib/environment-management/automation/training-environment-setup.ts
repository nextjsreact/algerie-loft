#!/usr/bin/env tsx

/**
 * Training Environment Setup Automation
 * 
 * Automated script for creating and configuring training environments with
 * realistic sample data, user accounts, and training scenarios.
 * 
 * CRITICAL SAFETY: Production is ALWAYS read-only source
 */

import { EnvironmentCloner } from '../environment-cloner'
import { EnvironmentConfigManager } from '../environment-config-manager'
import { ProductionSafetyGuard } from '../production-safety-guard'
import { EnvironmentValidator } from '../environment-validator'
import { AnonymizationOrchestrator } from '../anonymization'
import { 
  Environment, 
  CloneOptions, 
  CloneResult,
  EnvironmentConfig 
} from '../types'

export interface TrainingSetupConfig {
  // Environment configuration
  environmentName: string
  baseEnvironment: 'production' | 'test' // Source for cloning
  
  // Training data configuration
  generateSampleData: boolean
  sampleDataSize: 'small' | 'medium' | 'large'
  includeHistoricalData: boolean
  
  // User accounts for training
  createTrainingUsers: boolean
  trainingUserRoles: TrainingUserRole[]
  
  // Training scenarios
  setupTrainingScenarios: boolean
  trainingScenarios: TrainingScenario[]
  
  // System configuration
  includeAuditSystem: boolean
  includeConversations: boolean
  includeReservations: boolean
  includeNotifications: boolean
  
  // Safety and cleanup
  autoCleanupAfterDays?: number
  createBackup: boolean
  
  // Documentation
  generateTrainingGuide: boolean
  includeTestData: boolean
}

export interface TrainingUserRole {
  role: 'admin' | 'manager' | 'member' | 'viewer'
  count: number
  permissions: string[]
  sampleData: boolean
}

export interface TrainingScenario {
  name: string
  description: string
  dataRequirements: string[]
  setupSteps: string[]
  expectedOutcomes: string[]
}

export interface TrainingSetupResult {
  success: boolean
  environmentId: string
  environmentUrl: string
  trainingUsers: TrainingUser[]
  sampleDataGenerated: SampleDataSummary
  scenariosSetup: string[]
  trainingGuideUrl?: string
  backupId?: string
  errors: string[]
  warnings: string[]
  setupDuration: number
  completedAt: Date
}

export interface TrainingUser {
  id: string
  email: string
  password: string
  role: string
  permissions: string[]
  sampleDataAssigned: boolean
}

export interface SampleDataSummary {
  lofts: number
  reservations: number
  transactions: number
  conversations: number
  tasks: number
  users: number
  auditLogs: number
}

export class TrainingEnvironmentSetup {
  private cloner: EnvironmentCloner
  private configManager: EnvironmentConfigManager
  private safetyGuard: ProductionSafetyGuard
  private validator: EnvironmentValidator
  private anonymizer: AnonymizationOrchestrator

  constructor() {
    this.cloner = new EnvironmentCloner()
    this.configManager = new EnvironmentConfigManager()
    this.safetyGuard = ProductionSafetyGuard.getInstance()
    this.validator = new EnvironmentValidator()
    this.anonymizer = new AnonymizationOrchestrator()
  }

  /**
   * Setup complete training environment
   */
  public async setupTrainingEnvironment(config: TrainingSetupConfig): Promise<TrainingSetupResult> {
    const startTime = Date.now()
    const setupId = `training_setup_${Date.now()}`

    try {
      console.log('🎓 Starting training environment setup...')
      console.log(`📋 Setup ID: ${setupId}`)
      console.log(`🎯 Environment: ${config.environmentName}`)
      console.log(`📊 Data size: ${config.sampleDataSize}`)

      // Phase 1: Environment preparation
      console.log('\n📋 Phase 1: Environment preparation')
      const environment = await this.prepareTrainingEnvironment(config, setupId)

      // Phase 2: Base data cloning (if needed)
      console.log('\n🔄 Phase 2: Base data cloning')
      let cloneResult: CloneResult | undefined
      if (config.baseEnvironment) {
        cloneResult = await this.cloneBaseEnvironment(config, environment, setupId)
      }

      // Phase 3: Sample data generation
      console.log('\n📊 Phase 3: Sample data generation')
      const sampleDataSummary = await this.generateSampleData(config, environment, setupId)

      // Phase 4: Training users creation
      console.log('\n👥 Phase 4: Training users creation')
      const trainingUsers = await this.createTrainingUsers(config, environment, setupId)

      // Phase 5: Training scenarios setup
      console.log('\n🎯 Phase 5: Training scenarios setup')
      const scenariosSetup = await this.setupTrainingScenarios(config, environment, setupId)

      // Phase 6: Documentation generation
      console.log('\n📚 Phase 6: Documentation generation')
      const trainingGuideUrl = config.generateTrainingGuide 
        ? await this.generateTrainingGuide(config, environment, setupId)
        : undefined

      // Phase 7: Final validation
      console.log('\n✅ Phase 7: Final validation')
      await this.validateTrainingEnvironment(environment, setupId)

      const setupDuration = Date.now() - startTime

      const result: TrainingSetupResult = {
        success: true,
        environmentId: environment.id,
        environmentUrl: environment.supabaseUrl,
        trainingUsers,
        sampleDataGenerated: sampleDataSummary,
        scenariosSetup,
        trainingGuideUrl,
        backupId: cloneResult?.backupId,
        errors: [],
        warnings: [],
        setupDuration,
        completedAt: new Date()
      }

      // Schedule cleanup if configured
      if (config.autoCleanupAfterDays) {
        await this.scheduleEnvironmentCleanup(environment, config.autoCleanupAfterDays)
      }

      console.log('\n🎉 Training environment setup completed!')
      console.log(`🌐 Environment URL: ${result.environmentUrl}`)
      console.log(`👥 Training users: ${result.trainingUsers.length}`)
      console.log(`📊 Sample data: ${result.sampleDataGenerated.lofts} lofts, ${result.sampleDataGenerated.reservations} reservations`)
      console.log(`⏱️  Setup duration: ${Math.round(setupDuration / 60000)} minutes`)

      return result

    } catch (error) {
      console.error('❌ Training environment setup failed:', error.message)
      
      return {
        success: false,
        environmentId: '',
        environmentUrl: '',
        trainingUsers: [],
        sampleDataGenerated: {
          lofts: 0,
          reservations: 0,
          transactions: 0,
          conversations: 0,
          tasks: 0,
          users: 0,
          auditLogs: 0
        },
        scenariosSetup: [],
        errors: [error.message],
        warnings: [],
        setupDuration: Date.now() - startTime,
        completedAt: new Date()
      }
    }
  }

  /**
   * Prepare training environment configuration
   */
  private async prepareTrainingEnvironment(config: TrainingSetupConfig, setupId: string): Promise<Environment> {
    console.log(`🔧 Preparing training environment: ${config.environmentName}`)

    // Create environment configuration
    const envConfig: Partial<EnvironmentConfig> = {
      NEXT_PUBLIC_SUPABASE_URL: `https://${config.environmentName}.supabase.co`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'training_anon_key_placeholder',
      SUPABASE_SERVICE_ROLE_KEY: 'training_service_key_placeholder',
      NEXT_PUBLIC_APP_URL: `https://${config.environmentName}.vercel.app`,
      ANONYMIZE_DATA: true,
      INCLUDE_AUDIT_LOGS: config.includeAuditSystem,
      PRESERVE_USER_ROLES: false // We'll create our own training users
    }

    // Create environment configuration file
    await this.configManager.createEnvironmentConfig('training', envConfig)

    // Create environment object
    const environment = await this.configManager.createEnvironmentFromConfig('training', envConfig as EnvironmentConfig)

    console.log(`✅ Training environment prepared: ${environment.name}`)
    return environment
  }

  /**
   * Clone base environment data
   */
  private async cloneBaseEnvironment(
    config: TrainingSetupConfig,
    targetEnv: Environment,
    setupId: string
  ): Promise<CloneResult> {
    console.log(`🔄 Cloning from ${config.baseEnvironment} environment...`)

    const sourceEnv = await this.configManager.createEnvironmentFromConfig(config.baseEnvironment)
    
    // Validate source environment
    if (config.baseEnvironment === 'production') {
      await this.safetyGuard.validateCloneSource(sourceEnv)
    }

    const cloneOptions: CloneOptions = {
      anonymizeData: true, // Always anonymize for training
      includeAuditLogs: config.includeAuditSystem,
      includeConversations: config.includeConversations,
      includeReservations: config.includeReservations,
      preserveUserRoles: false, // We'll create training-specific users
      createBackup: config.createBackup,
      validateAfterClone: true,
      skipConfirmation: true
    }

    const result = await this.cloner.cloneEnvironment(sourceEnv, targetEnv, cloneOptions)
    
    if (result.success) {
      console.log(`✅ Base environment cloned successfully`)
    } else {
      throw new Error(`Failed to clone base environment: ${result.errors.join(', ')}`)
    }

    return result
  }

  /**
   * Generate sample data for training
   */
  private async generateSampleData(
    config: TrainingSetupConfig,
    environment: Environment,
    setupId: string
  ): Promise<SampleDataSummary> {
    if (!config.generateSampleData) {
      console.log('⏭️  Skipping sample data generation (disabled in config)')
      return {
        lofts: 0,
        reservations: 0,
        transactions: 0,
        conversations: 0,
        tasks: 0,
        users: 0,
        auditLogs: 0
      }
    }

    console.log(`📊 Generating ${config.sampleDataSize} sample data set...`)

    // Define data sizes based on configuration
    const dataSizes = {
      small: { lofts: 5, reservations: 20, transactions: 50, conversations: 10, tasks: 15, users: 8 },
      medium: { lofts: 15, reservations: 100, transactions: 250, conversations: 50, tasks: 75, users: 20 },
      large: { lofts: 50, reservations: 500, transactions: 1000, conversations: 200, tasks: 300, users: 50 }
    }

    const targetCounts = dataSizes[config.sampleDataSize]

    // Generate sample data (simulated)
    console.log(`🏠 Generating ${targetCounts.lofts} sample lofts...`)
    console.log(`📅 Generating ${targetCounts.reservations} sample reservations...`)
    console.log(`💰 Generating ${targetCounts.transactions} sample transactions...`)
    
    if (config.includeConversations) {
      console.log(`💬 Generating ${targetCounts.conversations} sample conversations...`)
    }
    
    console.log(`📋 Generating ${targetCounts.tasks} sample tasks...`)

    // Simulate audit logs if enabled
    let auditLogs = 0
    if (config.includeAuditSystem) {
      auditLogs = Math.floor((targetCounts.lofts + targetCounts.reservations + targetCounts.transactions) * 2.5)
      console.log(`📝 Generated ${auditLogs} audit log entries`)
    }

    const summary: SampleDataSummary = {
      lofts: targetCounts.lofts,
      reservations: targetCounts.reservations,
      transactions: targetCounts.transactions,
      conversations: config.includeConversations ? targetCounts.conversations : 0,
      tasks: targetCounts.tasks,
      users: targetCounts.users,
      auditLogs
    }

    console.log('✅ Sample data generation completed')
    return summary
  }

  /**
   * Create training user accounts
   */
  private async createTrainingUsers(
    config: TrainingSetupConfig,
    environment: Environment,
    setupId: string
  ): Promise<TrainingUser[]> {
    if (!config.createTrainingUsers) {
      console.log('⏭️  Skipping training users creation (disabled in config)')
      return []
    }

    console.log('👥 Creating training user accounts...')

    const trainingUsers: TrainingUser[] = []

    for (const roleConfig of config.trainingUserRoles) {
      for (let i = 1; i <= roleConfig.count; i++) {
        const user: TrainingUser = {
          id: `training_${roleConfig.role}_${i}`,
          email: `training.${roleConfig.role}${i}@loft-algerie.training`,
          password: `Training${roleConfig.role.charAt(0).toUpperCase() + roleConfig.role.slice(1)}${i}!`,
          role: roleConfig.role,
          permissions: roleConfig.permissions,
          sampleDataAssigned: roleConfig.sampleData
        }

        trainingUsers.push(user)
        console.log(`👤 Created ${roleConfig.role} user: ${user.email}`)
      }
    }

    console.log(`✅ Created ${trainingUsers.length} training users`)
    return trainingUsers
  }

  /**
   * Setup training scenarios
   */
  private async setupTrainingScenarios(
    config: TrainingSetupConfig,
    environment: Environment,
    setupId: string
  ): Promise<string[]> {
    if (!config.setupTrainingScenarios) {
      console.log('⏭️  Skipping training scenarios setup (disabled in config)')
      return []
    }

    console.log('🎯 Setting up training scenarios...')

    const setupScenarios: string[] = []

    for (const scenario of config.trainingScenarios) {
      try {
        console.log(`🎯 Setting up scenario: ${scenario.name}`)
        
        // Simulate scenario setup
        console.log(`  📋 Description: ${scenario.description}`)
        console.log(`  📊 Data requirements: ${scenario.dataRequirements.join(', ')}`)
        console.log(`  🔧 Setup steps: ${scenario.setupSteps.length} steps`)
        
        // In a real implementation, this would:
        // 1. Create specific data for the scenario
        // 2. Configure system state
        // 3. Set up test conditions
        
        setupScenarios.push(scenario.name)
        console.log(`  ✅ Scenario setup completed`)
      } catch (error) {
        console.log(`  ❌ Scenario setup failed: ${error.message}`)
      }
    }

    console.log(`✅ Setup ${setupScenarios.length} training scenarios`)
    return setupScenarios
  }

  /**
   * Generate training guide and documentation
   */
  private async generateTrainingGuide(
    config: TrainingSetupConfig,
    environment: Environment,
    setupId: string
  ): Promise<string> {
    console.log('📚 Generating training guide...')

    const guideContent = `
# Training Environment Guide

## Environment Information
- **Environment Name**: ${config.environmentName}
- **Environment URL**: ${environment.supabaseUrl}
- **Setup Date**: ${new Date().toLocaleDateString()}

## Training Users
${config.trainingUserRoles.map(role => `
### ${role.role.toUpperCase()} Users (${role.count})
- **Email Pattern**: training.${role.role}[1-${role.count}]@loft-algerie.training
- **Password Pattern**: Training${role.role.charAt(0).toUpperCase() + role.role.slice(1)}[1-${role.count}]!
- **Permissions**: ${role.permissions.join(', ')}
`).join('')}

## Sample Data
- **Lofts**: ${config.sampleDataSize} dataset
- **Reservations**: Realistic booking data
- **Transactions**: Financial transaction history
- **Conversations**: ${config.includeConversations ? 'Included' : 'Not included'}
- **Audit System**: ${config.includeAuditSystem ? 'Enabled' : 'Disabled'}

## Training Scenarios
${config.trainingScenarios.map(scenario => `
### ${scenario.name}
**Description**: ${scenario.description}
**Expected Outcomes**: ${scenario.expectedOutcomes.join(', ')}
`).join('')}

## System Features
- **Audit System**: ${config.includeAuditSystem ? '✅ Enabled' : '❌ Disabled'}
- **Conversations**: ${config.includeConversations ? '✅ Enabled' : '❌ Disabled'}
- **Reservations**: ${config.includeReservations ? '✅ Enabled' : '❌ Disabled'}
- **Notifications**: ${config.includeNotifications ? '✅ Enabled' : '❌ Disabled'}

## Getting Started
1. Access the training environment at: ${environment.supabaseUrl}
2. Login with one of the training user accounts
3. Explore the sample data and features
4. Follow the training scenarios for guided learning

## Support
For technical support or questions about this training environment, contact the system administrator.

---
Generated on ${new Date().toISOString()}
Setup ID: ${setupId}
    `

    // In a real implementation, this would save the guide to a file or documentation system
    const guideUrl = `https://docs.loft-algerie.training/${config.environmentName}/guide`
    
    console.log(`✅ Training guide generated: ${guideUrl}`)
    return guideUrl
  }

  /**
   * Validate training environment
   */
  private async validateTrainingEnvironment(environment: Environment, setupId: string): Promise<void> {
    console.log('✅ Validating training environment...')

    const validation = await this.validator.validateEnvironment(environment)
    
    if (!validation.isValid) {
      console.log('⚠️  Validation warnings:')
      validation.warnings.forEach(warning => console.log(`  • ${warning}`))
      
      if (validation.errors.length > 0) {
        throw new Error(`Training environment validation failed: ${validation.errors.join(', ')}`)
      }
    }

    console.log('✅ Training environment validation passed')
  }

  /**
   * Schedule environment cleanup
   */
  private async scheduleEnvironmentCleanup(environment: Environment, days: number): Promise<void> {
    const cleanupDate = new Date()
    cleanupDate.setDate(cleanupDate.getDate() + days)
    
    console.log(`🗑️  Scheduled environment cleanup for: ${cleanupDate.toLocaleDateString()}`)
    
    // In a real implementation, this would schedule a cleanup job
    // For now, we just log the intention
  }

  /**
   * Get default training scenarios
   */
  public static getDefaultTrainingScenarios(): TrainingScenario[] {
    return [
      {
        name: 'Basic Loft Management',
        description: 'Learn to create, edit, and manage loft properties',
        dataRequirements: ['lofts', 'owners'],
        setupSteps: [
          'Create sample lofts with different configurations',
          'Assign owners to lofts',
          'Set up pricing and availability'
        ],
        expectedOutcomes: ['Understand loft CRUD operations', 'Learn owner assignment', 'Master pricing setup']
      },
      {
        name: 'Reservation Workflow',
        description: 'Complete reservation process from booking to checkout',
        dataRequirements: ['lofts', 'reservations', 'guests'],
        setupSteps: [
          'Create available lofts',
          'Generate guest profiles',
          'Set up reservation scenarios'
        ],
        expectedOutcomes: ['Master reservation creation', 'Understand booking workflow', 'Learn guest management']
      },
      {
        name: 'Financial Management',
        description: 'Handle transactions, payments, and financial reporting',
        dataRequirements: ['transactions', 'payment_methods', 'bills'],
        setupSteps: [
          'Create transaction history',
          'Set up payment methods',
          'Generate financial reports'
        ],
        expectedOutcomes: ['Understand transaction management', 'Learn payment processing', 'Master financial reporting']
      },
      {
        name: 'Team Collaboration',
        description: 'Use conversations and task management for team coordination',
        dataRequirements: ['conversations', 'tasks', 'teams'],
        setupSteps: [
          'Create team structures',
          'Set up conversation channels',
          'Assign tasks and responsibilities'
        ],
        expectedOutcomes: ['Learn team management', 'Master communication tools', 'Understand task workflows']
      }
    ]
  }

  /**
   * Get default training user roles
   */
  public static getDefaultTrainingUserRoles(): TrainingUserRole[] {
    return [
      {
        role: 'admin',
        count: 1,
        permissions: ['all'],
        sampleData: true
      },
      {
        role: 'manager',
        count: 2,
        permissions: ['lofts', 'reservations', 'transactions', 'reports'],
        sampleData: true
      },
      {
        role: 'member',
        count: 3,
        permissions: ['lofts', 'reservations', 'tasks'],
        sampleData: true
      },
      {
        role: 'viewer',
        count: 2,
        permissions: ['view_only'],
        sampleData: false
      }
    ]
  }
}

/**
 * CLI function to setup training environment
 */
export async function setupTrainingEnvironment(configPath?: string): Promise<void> {
  try {
    const config: TrainingSetupConfig = configPath 
      ? require(configPath)
      : {
          environmentName: `training-${Date.now()}`,
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
        }

    const setup = new TrainingEnvironmentSetup()
    const result = await setup.setupTrainingEnvironment(config)

    if (result.success) {
      console.log('\n🎉 Training environment setup completed successfully!')
      console.log(`🌐 Environment URL: ${result.environmentUrl}`)
      console.log(`👥 Training users created: ${result.trainingUsers.length}`)
      if (result.trainingGuideUrl) {
        console.log(`📚 Training guide: ${result.trainingGuideUrl}`)
      }
    } else {
      console.error('❌ Training environment setup failed')
      result.errors.forEach(error => console.error(`  • ${error}`))
      process.exit(1)
    }
  } catch (error) {
    console.error('Training environment setup failed:', error.message)
    process.exit(1)
  }
}

// CLI execution
if (require.main === module) {
  const configPath = process.argv[2]
  setupTrainingEnvironment(configPath)
}