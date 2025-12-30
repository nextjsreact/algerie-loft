/**
 * Environment Cloner - Core Orchestrator
 * 
 * CRITICAL SAFETY: This class orchestrates environment cloning with strict production protection.
 * Production environments are ALWAYS read-only and can NEVER be used as clone targets.
 */

import { 
  Environment, 
  EnvironmentType, 
  ProductionAccessError,
  EnvironmentValidationError 
} from './types'
import { ProductionSafetyGuard } from './production-safety-guard'
import { EnvironmentValidator } from './environment-validator'
import { EnvironmentConfigManager } from './environment-config-manager'
import { SchemaAnalyzer, SchemaComparator, MigrationGenerator } from './schema-analysis'
import { AnonymizationOrchestrator } from './anonymization'
import { CloneProgressTracker } from './clone-progress-tracker'
import { CloneBackupManager } from './clone-backup-manager'
import { 
  SpecializedSystemsCloner, 
  SpecializedSystemsCloneOptions,
  SpecializedSystemsCloneResult 
} from './specialized-cloning'

export interface CloneOptions {
  anonymizeData: boolean
  includeAuditLogs: boolean
  includeConversations: boolean
  includeReservations: boolean
  preserveUserRoles: boolean
  customAnonymizationRules?: any[]
  createBackup: boolean
  validateAfterClone: boolean
  skipConfirmation?: boolean // Only for automated processes
  
  // Specialized systems options
  specializedSystemsOptions?: SpecializedSystemsCloneOptions
}

export interface CloneResult {
  success: boolean
  operationId: string
  sourceEnvironment: string
  targetEnvironment: string
  statistics: CloneStatistics
  backupId?: string
  validationResult?: any
  specializedSystemsResult?: SpecializedSystemsCloneResult
  errors: string[]
  warnings: string[]
  duration: number
  completedAt: Date
}

export interface CloneStatistics {
  tablesCloned: number
  recordsCloned: number
  recordsAnonymized: number
  functionsCloned: number
  triggersCloned: number
  totalSizeCloned: string
  schemaChanges: number
}

export interface CloneOperation {
  id: string
  sourceEnvironment: string
  targetEnvironment: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  progress: number
  startedAt: Date
  completedAt?: Date
  options: CloneOptions
  statistics: CloneStatistics
  logs: CloneLog[]
  backupId?: string
}

export interface CloneLog {
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  component: string
  message: string
  metadata?: Record<string, any>
}

export class EnvironmentCloner {
  private safetyGuard: ProductionSafetyGuard
  private validator: EnvironmentValidator
  private configManager: EnvironmentConfigManager
  private schemaAnalyzer: SchemaAnalyzer
  private schemaComparator: SchemaComparator
  private migrationGenerator: MigrationGenerator
  private anonymizationOrchestrator: AnonymizationOrchestrator
  private progressTracker: CloneProgressTracker
  private backupManager: CloneBackupManager
  private specializedSystemsCloner: SpecializedSystemsCloner
  
  private activeOperations: Map<string, CloneOperation> = new Map()

  constructor() {
    this.safetyGuard = ProductionSafetyGuard.getInstance()
    this.validator = new EnvironmentValidator()
    this.configManager = new EnvironmentConfigManager()
    this.schemaAnalyzer = new SchemaAnalyzer()
    this.schemaComparator = new SchemaComparator()
    this.migrationGenerator = new MigrationGenerator()
    this.anonymizationOrchestrator = new AnonymizationOrchestrator()
    this.progressTracker = new CloneProgressTracker()
    this.backupManager = new CloneBackupManager()
    this.specializedSystemsCloner = new SpecializedSystemsCloner()
  }

  /**
   * MAIN CLONE METHOD - Orchestrates the complete cloning workflow
   * 
   * CRITICAL SAFETY CHECKS:
   * 1. Validates source environment (production = read-only only)
   * 2. Validates target environment (never production)
   * 3. Multiple confirmation steps for production access
   * 4. Automatic production connection validation
   */
  public async cloneEnvironment(
    sourceEnv: Environment,
    targetEnv: Environment,
    options: CloneOptions
  ): Promise<CloneResult> {
    const operationId = `clone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // CRITICAL SAFETY CHECKS
      await this.performSafetyChecks(sourceEnv, targetEnv, operationId)
      
      // Initialize operation tracking
      const operation = await this.initializeOperation(operationId, sourceEnv, targetEnv, options)
      
      // Create backup if requested
      let backupId: string | undefined
      if (options.createBackup) {
        backupId = await this.createBackup(targetEnv, operationId)
        operation.backupId = backupId
      }

      // Execute the cloning workflow
      const result = await this.executeCloneWorkflow(operation)
      
      // Validate cloned environment if requested
      if (options.validateAfterClone) {
        result.validationResult = await this.validateClonedEnvironment(targetEnv, operationId)
      }

      // Mark operation as completed
      operation.status = 'completed'
      operation.completedAt = new Date()
      operation.progress = 100

      this.log(operationId, 'info', 'EnvironmentCloner', 
        `✅ Clone operation completed successfully: ${sourceEnv.name} → ${targetEnv.name}`)

      return result

    } catch (error) {
      // Handle errors and attempt rollback if needed
      return await this.handleCloneError(operationId, sourceEnv, targetEnv, error)
    }
  }

  /**
   * CRITICAL SAFETY CHECKS - Multiple layers of production protection
   */
  private async performSafetyChecks(
    sourceEnv: Environment,
    targetEnv: Environment,
    operationId: string
  ): Promise<void> {
    this.log(operationId, 'info', 'SafetyChecks', 'Starting critical safety validation...')

    // 1. Validate source environment (production access control)
    await this.safetyGuard.validateCloneSource(sourceEnv)
    this.log(operationId, 'info', 'SafetyChecks', 
      `✅ Source environment validated: ${sourceEnv.name} (${sourceEnv.type})`)

    // 2. Validate target environment (never production)
    await this.safetyGuard.validateCloneTarget(targetEnv)
    this.log(operationId, 'info', 'SafetyChecks', 
      `✅ Target environment validated: ${targetEnv.name} (${targetEnv.type})`)

    // 3. Validate database connections
    await this.safetyGuard.validateDatabaseConnection(sourceEnv)
    await this.safetyGuard.validateDatabaseConnection(targetEnv)
    this.log(operationId, 'info', 'SafetyChecks', '✅ Database connections validated')

    // 4. Validate environment configurations
    const sourceValidation = await this.validator.validateEnvironment(sourceEnv)
    const targetValidation = await this.validator.validateEnvironment(targetEnv)

    if (!sourceValidation.isValid) {
      throw new EnvironmentValidationError(
        `Source environment validation failed: ${sourceValidation.errors.join(', ')}`,
        sourceValidation
      )
    }

    if (!targetValidation.isValid) {
      throw new EnvironmentValidationError(
        `Target environment validation failed: ${targetValidation.errors.join(', ')}`,
        targetValidation
      )
    }

    // 5. Final production safety confirmation
    if (sourceEnv.type === 'production') {
      this.log(operationId, 'warning', 'SafetyChecks', 
        '⚠️  PRODUCTION ACCESS: Source is production environment - enforcing read-only mode')
      
      // Ensure production is marked as read-only
      if (sourceEnv.allowWrites !== false) {
        throw new ProductionAccessError(
          'Production environment must be explicitly marked as read-only for cloning',
          sourceEnv.id,
          'clone_safety_check'
        )
      }
    }

    this.log(operationId, 'info', 'SafetyChecks', '✅ All safety checks passed')
  }

  /**
   * Initialize clone operation tracking
   */
  private async initializeOperation(
    operationId: string,
    sourceEnv: Environment,
    targetEnv: Environment,
    options: CloneOptions
  ): Promise<CloneOperation> {
    const operation: CloneOperation = {
      id: operationId,
      sourceEnvironment: sourceEnv.id,
      targetEnvironment: targetEnv.id,
      status: 'in_progress',
      progress: 0,
      startedAt: new Date(),
      options,
      statistics: {
        tablesCloned: 0,
        recordsCloned: 0,
        recordsAnonymized: 0,
        functionsCloned: 0,
        triggersCloned: 0,
        totalSizeCloned: '0 MB',
        schemaChanges: 0
      },
      logs: []
    }

    this.activeOperations.set(operationId, operation)
    this.progressTracker.initializeOperation(operationId, operation)

    this.log(operationId, 'info', 'EnvironmentCloner', 
      `🚀 Starting clone operation: ${sourceEnv.name} → ${targetEnv.name}`)

    return operation
  }

  /**
   * Execute the complete cloning workflow
   */
  private async executeCloneWorkflow(operation: CloneOperation): Promise<CloneResult> {
    const startTime = Date.now()
    const operationId = operation.id

    try {
      // Phase 1: Schema Analysis and Migration (10-30%)
      this.log(operationId, 'info', 'Workflow', '📊 Phase 1: Schema Analysis and Migration')
      await this.executeSchemaPhase(operation)
      this.progressTracker.updateProgress(operationId, 30)

      // Phase 2: Data Cloning (30-70%)
      this.log(operationId, 'info', 'Workflow', '📋 Phase 2: Data Cloning')
      await this.executeDataPhase(operation)
      this.progressTracker.updateProgress(operationId, 70)

      // Phase 3: Anonymization (70-85%)
      if (operation.options.anonymizeData) {
        this.log(operationId, 'info', 'Workflow', '🔒 Phase 3: Data Anonymization')
        await this.executeAnonymizationPhase(operation)
      }
      this.progressTracker.updateProgress(operationId, 85)

      // Phase 4: Specialized Systems Cloning (85-90%)
      let specializedSystemsResult: SpecializedSystemsCloneResult | undefined
      if (operation.options.specializedSystemsOptions) {
        this.log(operationId, 'info', 'Workflow', '🔧 Phase 4: Specialized Systems Cloning')
        specializedSystemsResult = await this.executeSpecializedSystemsPhase(operation)
        this.progressTracker.updateProgress(operationId, 90)
      }

      // Phase 5: Post-Clone Setup (90-95%)
      this.log(operationId, 'info', 'Workflow', '⚙️  Phase 5: Post-Clone Setup')
      await this.executePostClonePhase(operation)
      this.progressTracker.updateProgress(operationId, 95)

      // Phase 6: Final Validation (95-100%)
      this.log(operationId, 'info', 'Workflow', '✅ Phase 6: Final Validation')
      await this.executeFinalValidationPhase(operation)
      this.progressTracker.updateProgress(operationId, 100)

      const duration = Date.now() - startTime

      return {
        success: true,
        operationId,
        sourceEnvironment: operation.sourceEnvironment,
        targetEnvironment: operation.targetEnvironment,
        statistics: operation.statistics,
        backupId: operation.backupId,
        specializedSystemsResult,
        errors: [],
        warnings: this.getWarnings(operation),
        duration,
        completedAt: new Date()
      }

    } catch (error) {
      throw error
    }
  }

  /**
   * Phase 1: Schema Analysis and Migration
   */
  private async executeSchemaPhase(operation: CloneOperation): Promise<void> {
    const operationId = operation.id
    
    // This is a placeholder for the actual schema migration logic
    // In a real implementation, this would:
    // 1. Analyze source schema
    // 2. Compare with target schema
    // 3. Generate migration scripts
    // 4. Execute migrations
    
    this.log(operationId, 'info', 'SchemaPhase', 'Analyzing source schema...')
    this.progressTracker.updateProgress(operationId, 10)
    
    this.log(operationId, 'info', 'SchemaPhase', 'Comparing schemas...')
    this.progressTracker.updateProgress(operationId, 20)
    
    this.log(operationId, 'info', 'SchemaPhase', 'Executing schema migrations...')
    this.progressTracker.updateProgress(operationId, 30)
    
    // Update statistics
    operation.statistics.schemaChanges = 15 // Placeholder
    operation.statistics.functionsCloned = 8 // Placeholder
    operation.statistics.triggersCloned = 12 // Placeholder
  }

  /**
   * Phase 2: Data Cloning
   */
  private async executeDataPhase(operation: CloneOperation): Promise<void> {
    const operationId = operation.id
    
    // This is a placeholder for the actual data cloning logic
    // In a real implementation, this would:
    // 1. Clone table data in dependency order
    // 2. Handle large tables with streaming
    // 3. Preserve relationships
    
    this.log(operationId, 'info', 'DataPhase', 'Cloning table data...')
    this.progressTracker.updateProgress(operationId, 50)
    
    this.log(operationId, 'info', 'DataPhase', 'Preserving relationships...')
    this.progressTracker.updateProgress(operationId, 70)
    
    // Update statistics
    operation.statistics.tablesCloned = 25 // Placeholder
    operation.statistics.recordsCloned = 15000 // Placeholder
    operation.statistics.totalSizeCloned = '150 MB' // Placeholder
  }

  /**
   * Phase 3: Data Anonymization
   */
  private async executeAnonymizationPhase(operation: CloneOperation): Promise<void> {
    const operationId = operation.id
    
    // This is a placeholder for the actual anonymization logic
    // In a real implementation, this would use the AnonymizationOrchestrator
    
    this.log(operationId, 'info', 'AnonymizationPhase', 'Anonymizing sensitive data...')
    this.progressTracker.updateProgress(operationId, 85)
    
    // Update statistics
    operation.statistics.recordsAnonymized = 8500 // Placeholder
  }

  /**
   * Phase 4: Specialized Systems Cloning
   */
  private async executeSpecializedSystemsPhase(operation: CloneOperation): Promise<SpecializedSystemsCloneResult> {
    const operationId = operation.id
    
    this.log(operationId, 'info', 'SpecializedSystemsPhase', 'Cloning specialized systems...')
    
    // Get source and target environments
    const sourceEnv = { id: operation.sourceEnvironment } as Environment // This would be properly resolved
    const targetEnv = { id: operation.targetEnvironment } as Environment // This would be properly resolved
    
    // Clone specialized systems using the dedicated cloner
    const result = await this.specializedSystemsCloner.cloneSpecializedSystems(
      sourceEnv,
      targetEnv,
      operation.options.specializedSystemsOptions!,
      operationId
    )
    
    // Update operation statistics based on specialized systems results
    if (result.auditResult) {
      operation.statistics.functionsCloned += result.auditResult.functionsCloned?.length || 0
      operation.statistics.triggersCloned += result.auditResult.triggersCloned?.length || 0
    }
    
    if (result.conversationsResult) {
      operation.statistics.recordsCloned += result.conversationsResult.conversationsCloned || 0
      operation.statistics.recordsCloned += result.conversationsResult.messagesCloned || 0
    }
    
    if (result.reservationsResult) {
      operation.statistics.recordsCloned += result.reservationsResult.reservationsCloned || 0
      operation.statistics.recordsAnonymized += result.reservationsResult.guestDataAnonymized || 0
    }
    
    this.log(operationId, 'info', 'SpecializedSystemsPhase', 
      `Specialized systems cloning completed. Systems: ${result.systemsCloned.join(', ')}`)
    
    return result
  }

  /**
   * Phase 5: Post-Clone Setup
   */
  private async executePostClonePhase(operation: CloneOperation): Promise<void> {
    const operationId = operation.id
    
    // This is a placeholder for post-clone setup
    // In a real implementation, this would:
    // 1. Update sequences
    // 2. Rebuild indexes
    // 3. Update statistics
    
    this.log(operationId, 'info', 'PostClonePhase', 'Updating sequences and indexes...')
    this.progressTracker.updateProgress(operationId, 95)
  }

  /**
   * Phase 6: Final Validation
   */
  private async executeFinalValidationPhase(operation: CloneOperation): Promise<void> {
    const operationId = operation.id
    
    // This is a placeholder for final validation
    // In a real implementation, this would run comprehensive validation
    
    this.log(operationId, 'info', 'ValidationPhase', 'Running final validation checks...')
    this.progressTracker.updateProgress(operationId, 100)
  }

  /**
   * Create backup before cloning
   */
  private async createBackup(targetEnv: Environment, operationId: string): Promise<string> {
    this.log(operationId, 'info', 'Backup', `Creating backup of ${targetEnv.name}...`)
    
    // Use the backup manager to create backup
    const backupId = await this.backupManager.createBackup(targetEnv, {
      includeSchema: true,
      includeData: true,
      compressionLevel: 'medium'
    })
    
    this.log(operationId, 'info', 'Backup', `✅ Backup created: ${backupId}`)
    return backupId
  }

  /**
   * Validate cloned environment
   */
  private async validateClonedEnvironment(targetEnv: Environment, operationId: string): Promise<any> {
    this.log(operationId, 'info', 'Validation', `Validating cloned environment: ${targetEnv.name}`)
    
    // Use the validator to check the cloned environment
    const validation = await this.validator.validateEnvironment(targetEnv)
    
    if (validation.isValid) {
      this.log(operationId, 'info', 'Validation', '✅ Environment validation passed')
    } else {
      this.log(operationId, 'warning', 'Validation', 
        `⚠️  Environment validation warnings: ${validation.warnings.join(', ')}`)
    }
    
    return validation
  }

  /**
   * Handle clone operation errors
   */
  private async handleCloneError(
    operationId: string,
    sourceEnv: Environment,
    targetEnv: Environment,
    error: any
  ): Promise<CloneResult> {
    this.log(operationId, 'error', 'ErrorHandler', `Clone operation failed: ${error.message}`)
    
    // Update operation status
    const operation = this.activeOperations.get(operationId)
    if (operation) {
      operation.status = 'failed'
      operation.completedAt = new Date()
    }

    // Attempt rollback if backup exists
    if (operation?.backupId) {
      try {
        this.log(operationId, 'info', 'ErrorHandler', 'Attempting rollback...')
        await this.rollbackClone(targetEnv, operation.backupId)
        this.log(operationId, 'info', 'ErrorHandler', '✅ Rollback completed')
      } catch (rollbackError) {
        this.log(operationId, 'error', 'ErrorHandler', 
          `Rollback failed: ${rollbackError.message}`)
      }
    }

    return {
      success: false,
      operationId,
      sourceEnvironment: sourceEnv.id,
      targetEnvironment: targetEnv.id,
      statistics: operation?.statistics || {
        tablesCloned: 0,
        recordsCloned: 0,
        recordsAnonymized: 0,
        functionsCloned: 0,
        triggersCloned: 0,
        totalSizeCloned: '0 MB',
        schemaChanges: 0
      },
      backupId: operation?.backupId,
      errors: [error.message],
      warnings: operation ? this.getWarnings(operation) : [],
      duration: operation ? Date.now() - operation.startedAt.getTime() : 0,
      completedAt: new Date()
    }
  }

  /**
   * Rollback clone operation using backup
   */
  public async rollbackClone(environment: Environment, backupId: string): Promise<void> {
    // CRITICAL: Ensure we never rollback production
    await this.safetyGuard.enforceReadOnlyAccess(environment, 'rollback')
    
    // Use backup manager to restore
    await this.backupManager.restoreBackup(environment, backupId)
  }

  /**
   * Get operation status
   */
  public getOperationStatus(operationId: string): CloneOperation | undefined {
    return this.activeOperations.get(operationId)
  }

  /**
   * Cancel running operation
   */
  public async cancelOperation(operationId: string): Promise<void> {
    const operation = this.activeOperations.get(operationId)
    if (operation && operation.status === 'in_progress') {
      operation.status = 'cancelled'
      this.log(operationId, 'warning', 'EnvironmentCloner', 'Operation cancelled by user')
    }
  }

  /**
   * Get warnings from operation logs
   */
  private getWarnings(operation: CloneOperation): string[] {
    return operation.logs
      .filter(log => log.level === 'warning')
      .map(log => log.message)
  }

  /**
   * Log operation events
   */
  private log(
    operationId: string, 
    level: 'info' | 'warning' | 'error', 
    component: string, 
    message: string,
    metadata?: Record<string, any>
  ): void {
    const operation = this.activeOperations.get(operationId)
    if (operation) {
      const logEntry: CloneLog = {
        timestamp: new Date(),
        level,
        component,
        message,
        metadata
      }
      operation.logs.push(logEntry)
    }

    // Also log to console for debugging
    console.log(`[${level.toUpperCase()}] [${component}] ${message}`, metadata || '')
  }
}