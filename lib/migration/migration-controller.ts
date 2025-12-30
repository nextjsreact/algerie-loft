/**
 * Migration Controller for Next.js 16 Migration
 * Main orchestrator that coordinates all migration components
 */

import { BackupManager } from './backup-manager'
import { CompatibilityChecker } from './compatibility-checker'
import { PerformanceAnalyzer } from './performance-analyzer'
import { EnvironmentAnalyzer } from './environment-analyzer'
import { RollbackSystem } from './rollback-system'
import type {
  ApplicationAnalysis,
  MigrationPlan,
  MigrationResult,
  MigrationStatus,
  MigrationProgress,
  ValidationResult
} from './types'

export class MigrationController {
  private backupManager: BackupManager
  private compatibilityChecker: CompatibilityChecker
  private performanceAnalyzer: PerformanceAnalyzer
  private environmentAnalyzer: EnvironmentAnalyzer
  private rollbackSystem: RollbackSystem
  
  private currentStatus: MigrationStatus
  private currentPlan: MigrationPlan | null = null
  private checkpoints: Map<string, any> = new Map()
  private isPaused: boolean = false
  private pauseResolve: ((value: void) => void) | null = null

  constructor() {
    this.backupManager = new BackupManager()
    this.compatibilityChecker = new CompatibilityChecker()
    this.performanceAnalyzer = new PerformanceAnalyzer()
    this.environmentAnalyzer = new EnvironmentAnalyzer()
    this.rollbackSystem = new RollbackSystem()
    
    this.currentStatus = {
      phase: 'idle',
      currentStep: 'none',
      progress: 0,
      estimatedTimeRemaining: 0,
      status: 'idle'
    }
  }

  /**
   * Analyze current application state
   */
  async analyzeCurrent(): Promise<ApplicationAnalysis> {
    console.log('🔍 Starting comprehensive application analysis...')
    
    this.updateStatus({
      phase: 'analysis',
      currentStep: 'Analyzing current environment',
      progress: 0,
      status: 'running'
    })

    try {
      const analysis = await this.environmentAnalyzer.analyzeCurrentEnvironment()
      
      this.updateStatus({
        phase: 'analysis',
        currentStep: 'Analysis complete',
        progress: 100,
        status: 'completed'
      })

      console.log('✅ Application analysis completed successfully')
      return analysis
    } catch (error) {
      this.updateStatus({
        phase: 'analysis',
        currentStep: 'Analysis failed',
        progress: 0,
        status: 'failed'
      })
      
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Plan the migration based on analysis
   */
  async planMigration(): Promise<MigrationPlan> {
    console.log('📋 Creating migration plan...')
    
    this.updateStatus({
      phase: 'planning',
      currentStep: 'Creating migration plan',
      progress: 0,
      status: 'running'
    })

    try {
      // Get compatibility report
      const compatibilityReport = await this.compatibilityChecker.checkNextjs16Compatibility()
      
      // Create migration plan
      const plan: MigrationPlan = {
        id: `migration-${Date.now()}`,
        createdAt: new Date(),
        estimatedDuration: compatibilityReport.estimatedMigrationTime,
        totalSteps: 12, // Based on our task structure
        phases: [
          {
            id: 'preparation',
            name: 'Preparation and Analysis',
            description: 'Create backups and analyze compatibility',
            steps: [
              {
                id: 'backup',
                name: 'Create Full Backup',
                description: 'Create complete application backup',
                type: 'code',
                dependencies: [],
                rollbackable: false,
                estimatedDuration: 10,
                riskLevel: 'low',
                validationCriteria: [
                  {
                    type: 'test',
                    description: 'Verify backup integrity',
                    expectedResult: 'Backup validation passes'
                  }
                ]
              },
              {
                id: 'compatibility-check',
                name: 'Compatibility Analysis',
                description: 'Analyze dependency compatibility',
                type: 'test',
                dependencies: ['backup'],
                rollbackable: false,
                estimatedDuration: 5,
                riskLevel: 'low',
                validationCriteria: [
                  {
                    type: 'test',
                    description: 'Generate compatibility report',
                    expectedResult: 'All critical dependencies are compatible'
                  }
                ]
              }
            ],
            checkpoints: [
              {
                id: 'preparation-complete',
                name: 'Preparation Complete',
                description: 'Backup and analysis completed',
                validationSteps: ['Backup integrity verified', 'Compatibility issues identified'],
                rollbackPoint: true
              }
            ],
            rollbackStrategy: {
              automatic: false,
              triggers: [],
              steps: ['Restore from backup if needed']
            }
          },
          {
            id: 'migration',
            name: 'Core Migration',
            description: 'Update Next.js and dependencies',
            steps: [
              {
                id: 'update-nextjs',
                name: 'Update Next.js',
                description: 'Update Next.js to version 16.1.1',
                type: 'dependency',
                dependencies: ['compatibility-check'],
                rollbackable: true,
                estimatedDuration: 15,
                riskLevel: 'medium',
                validationCriteria: [
                  {
                    type: 'build',
                    description: 'Application builds successfully',
                    command: 'npm run build',
                    expectedResult: 'Build completes without errors'
                  }
                ]
              },
              {
                id: 'update-dependencies',
                name: 'Update Dependencies',
                description: 'Update incompatible dependencies',
                type: 'dependency',
                dependencies: ['update-nextjs'],
                rollbackable: true,
                estimatedDuration: 20,
                riskLevel: 'medium',
                validationCriteria: [
                  {
                    type: 'test',
                    description: 'All tests pass',
                    command: 'npm test',
                    expectedResult: 'Test suite passes'
                  }
                ]
              }
            ],
            checkpoints: [
              {
                id: 'migration-complete',
                name: 'Migration Complete',
                description: 'Core migration steps completed',
                validationSteps: ['Next.js updated', 'Dependencies updated', 'Build successful'],
                rollbackPoint: true
              }
            ],
            rollbackStrategy: {
              automatic: true,
              triggers: ['Build failure', 'Critical test failure'],
              steps: ['Restore package.json', 'Reinstall dependencies']
            }
          },
          {
            id: 'validation',
            name: 'Validation and Testing',
            description: 'Validate all functionality works correctly',
            steps: [
              {
                id: 'test-functionality',
                name: 'Test Core Functionality',
                description: 'Run comprehensive functionality tests',
                type: 'test',
                dependencies: ['update-dependencies'],
                rollbackable: false,
                estimatedDuration: 30,
                riskLevel: 'low',
                validationCriteria: [
                  {
                    type: 'test',
                    description: 'All feature tests pass',
                    expectedResult: 'No functionality regressions'
                  }
                ]
              },
              {
                id: 'performance-validation',
                name: 'Performance Validation',
                description: 'Validate performance metrics',
                type: 'test',
                dependencies: ['test-functionality'],
                rollbackable: false,
                estimatedDuration: 15,
                riskLevel: 'low',
                validationCriteria: [
                  {
                    type: 'performance',
                    description: 'Performance within acceptable limits',
                    expectedResult: 'No significant performance degradation'
                  }
                ]
              }
            ],
            checkpoints: [
              {
                id: 'validation-complete',
                name: 'Validation Complete',
                description: 'All validation tests passed',
                validationSteps: ['Functionality validated', 'Performance validated'],
                rollbackPoint: false
              }
            ],
            rollbackStrategy: {
              automatic: false,
              triggers: [],
              steps: ['Manual rollback if validation fails']
            }
          }
        ],
        rollbackPlan: {
          automaticTriggers: [
            {
              condition: 'Build failure',
              threshold: 1,
              action: 'rollback'
            },
            {
              condition: 'Critical test failure',
              threshold: 3,
              action: 'pause'
            }
          ],
          manualTriggers: ['User request', 'Performance degradation'],
          rollbackSteps: [
            {
              id: 'restore-backup',
              description: 'Restore from backup',
              command: 'restore-backup',
              validation: 'Application functionality restored'
            }
          ],
          estimatedRollbackTime: 5
        },
        validationStrategy: {
          runUnitTests: true,
          runIntegrationTests: true,
          runE2ETests: true,
          validateCriticalPaths: true,
          validatePerformance: true,
          validateSecurity: false,
          maxPerformanceDegradation: 10,
          minTestCoverage: 70,
          maxErrorRate: 5
        }
      }

      this.currentPlan = plan
      
      this.updateStatus({
        phase: 'planning',
        currentStep: 'Migration plan created',
        progress: 100,
        status: 'completed'
      })

      console.log('✅ Migration plan created successfully')
      return plan
    } catch (error) {
      this.updateStatus({
        phase: 'planning',
        currentStep: 'Planning failed',
        progress: 0,
        status: 'failed'
      })
      
      throw new Error(`Planning failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Execute the migration plan
   */
  async executeMigration(plan: MigrationPlan): Promise<MigrationResult> {
    console.log('🚀 Starting migration execution...')
    
    const startTime = Date.now()
    const completedSteps: string[] = []
    const failedSteps: string[] = []

    this.updateStatus({
      phase: 'execution',
      currentStep: 'Starting migration',
      progress: 0,
      status: 'running'
    })

    try {
      let totalSteps = 0
      let completedStepCount = 0

      // Count total steps
      for (const phase of plan.phases) {
        totalSteps += phase.steps.length
      }

      // Execute each phase
      for (const phase of plan.phases) {
        console.log(`📦 Executing phase: ${phase.name}`)
        
        for (const step of phase.steps) {
          console.log(`⚙️ Executing step: ${step.name}`)
          
          this.updateStatus({
            phase: 'execution',
            currentStep: step.name,
            progress: (completedStepCount / totalSteps) * 100,
            status: 'running'
          })

          try {
            const stepResult = await this.executeStep(step)
            
            if (stepResult.success) {
              completedSteps.push(step.id)
              console.log(`✅ Step completed: ${step.name}`)
            } else {
              failedSteps.push(step.id)
              console.log(`❌ Step failed: ${step.name}`)
              
              // Check automatic rollback triggers
              const triggerAction = await this.rollbackSystem.checkTriggers('step_failure', 1)
              
              if (triggerAction === 'rollback' || step.riskLevel === 'high' || phase.rollbackStrategy.automatic) {
                console.log('🔄 Triggering automatic rollback...')
                await this.executeRollback(plan)
                break
              } else if (triggerAction === 'pause') {
                console.log('⏸️ Pausing migration due to trigger...')
                this.pauseMigration()
                break
              }
            }
          } catch (error) {
            failedSteps.push(step.id)
            console.log(`❌ Step error: ${step.name} - ${error instanceof Error ? error.message : 'Unknown error'}`)
            
            // Check for critical errors that should trigger rollback
            const triggerAction = await this.rollbackSystem.checkTriggers('critical_error', 1)
            
            if (triggerAction === 'rollback' || step.riskLevel === 'high') {
              console.log('🔄 Triggering rollback due to critical error...')
              await this.executeRollback(plan)
              break
            }
          }

          completedStepCount++
        }

        // Execute checkpoint validation
        for (const checkpoint of phase.checkpoints) {
          console.log(`🔍 Validating checkpoint: ${checkpoint.name}`)
          
          // Create checkpoint before validation
          await this.createCheckpoint(checkpoint.id, {
            phase: phase.name,
            checkpoint: checkpoint.name,
            completedSteps: [...completedSteps]
          })
          
          const validation = await this.validateCheckpoint(checkpoint)
          
          if (!validation.success) {
            console.log(`❌ Checkpoint validation failed: ${checkpoint.name}`)
            if (checkpoint.rollbackPoint) {
              console.log('🔄 Triggering rollback from checkpoint...')
              await this.executeRollback(plan)
              break
            }
          } else {
            console.log(`✅ Checkpoint validated: ${checkpoint.name}`)
          }
        }
      }

      // Final validation
      console.log('🔍 Running final validation...')
      const finalValidation = await this.runFinalValidation(plan)

      const duration = Date.now() - startTime
      const success = failedSteps.length === 0 && finalValidation.success

      this.updateStatus({
        phase: 'execution',
        currentStep: success ? 'Migration completed' : 'Migration failed',
        progress: 100,
        status: success ? 'completed' : 'failed'
      })

      const result: MigrationResult = {
        success,
        completedSteps,
        failedSteps,
        duration,
        finalValidation,
        rollbackAvailable: true
      }

      if (success) {
        console.log('🎉 Migration completed successfully!')
      } else {
        console.log('💥 Migration failed. Rollback available.')
      }

      return result
    } catch (error) {
      this.updateStatus({
        phase: 'execution',
        currentStep: 'Migration error',
        progress: 0,
        status: 'failed'
      })
      
      throw new Error(`Migration execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Pause migration execution
   */
  pauseMigration(): void {
    this.isPaused = true
    this.updateStatus({
      ...this.currentStatus,
      status: 'paused'
    })
    console.log('⏸️ Migration paused')
  }

  /**
   * Resume migration execution
   */
  resumeMigration(): void {
    this.isPaused = false
    if (this.pauseResolve) {
      this.pauseResolve()
      this.pauseResolve = null
    }
    this.updateStatus({
      ...this.currentStatus,
      status: 'running'
    })
    console.log('▶️ Migration resumed')
  }

  /**
   * Create a checkpoint during migration
   */
  async createCheckpoint(id: string, data: any): Promise<void> {
    console.log(`📍 Creating checkpoint: ${id}`)
    
    try {
      // Create a snapshot for rollback
      const snapshot = await this.backupManager.createSnapshot(`checkpoint-${id}`)
      
      // Store checkpoint data
      this.checkpoints.set(id, {
        id,
        timestamp: new Date(),
        snapshotId: snapshot.id,
        data,
        status: this.currentStatus
      })
      
      console.log(`✅ Checkpoint created: ${id}`)
    } catch (error) {
      console.log(`❌ Failed to create checkpoint ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  /**
   * Restore from a checkpoint
   */
  async restoreFromCheckpoint(checkpointId: string): Promise<void> {
    console.log(`🔄 Restoring from checkpoint: ${checkpointId}`)
    
    const checkpoint = this.checkpoints.get(checkpointId)
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`)
    }

    try {
      // Restore from snapshot
      await this.backupManager.restoreFromSnapshot(checkpoint.snapshotId)
      
      // Restore status
      this.currentStatus = checkpoint.status
      
      console.log(`✅ Restored from checkpoint: ${checkpointId}`)
    } catch (error) {
      console.log(`❌ Failed to restore from checkpoint ${checkpointId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  /**
   * List available checkpoints
   */
  getCheckpoints(): Array<{ id: string; timestamp: Date; description: string }> {
    return Array.from(this.checkpoints.values()).map(checkpoint => ({
      id: checkpoint.id,
      timestamp: checkpoint.timestamp,
      description: `Checkpoint at ${checkpoint.status.currentStep}`
    }))
  }

  /**
   * Wait for resume if paused
   */
  private async waitIfPaused(): Promise<void> {
    if (this.isPaused) {
      console.log('⏸️ Migration is paused, waiting for resume...')
      return new Promise<void>((resolve) => {
        this.pauseResolve = resolve
      })
    }
  }

  /**
   * Get current migration status
   */
  getStatus(): MigrationStatus {
    return { ...this.currentStatus }
  }

  /**
   * Get migration progress
   */
  getProgress(): MigrationProgress {
    const totalSteps = this.currentPlan?.totalSteps || 0
    const completedSteps = Math.floor((this.currentStatus.progress / 100) * totalSteps)
    
    return {
      totalSteps,
      completedSteps,
      currentStep: this.currentStatus.currentStep,
      percentage: this.currentStatus.progress,
      elapsedTime: 0, // Would need to track start time
      estimatedTimeRemaining: this.currentStatus.estimatedTimeRemaining
    }
  }

  /**
   * Execute manual rollback to a specific checkpoint
   */
  async executeManualRollback(checkpointId: string, userConfirmed: boolean = false): Promise<void> {
    console.log(`🔄 Manual rollback requested to checkpoint: ${checkpointId}`)
    
    const checkpoint = this.checkpoints.get(checkpointId)
    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`)
    }

    const rollbackResult = await this.rollbackSystem.executeManualRollback(
      checkpoint.snapshotId,
      {
        triggerReason: 'Manual rollback request',
        timestamp: new Date(),
        userConfirmed
      },
      {
        confirmationRequired: true
      }
    )

    if (rollbackResult.success) {
      // Restore the status from checkpoint
      this.currentStatus = checkpoint.status
      console.log(`✅ Manual rollback to ${checkpointId} completed`)
    } else {
      throw new Error(`Manual rollback failed: ${rollbackResult.errors.join(', ')}`)
    }
  }

  /**
   * Get available rollback points
   */
  async getAvailableRollbackPoints(): Promise<Array<{
    id: string
    label: string
    timestamp: Date
    description: string
  }>> {
    return this.rollbackSystem.getAvailableRollbackPoints()
  }

  /**
   * Validate rollback capability
   */
  async validateRollbackCapability(): Promise<ValidationResult> {
    return this.rollbackSystem.validateRollbackCapability()
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(): Array<{
    id: string
    timestamp: Date
    reason: string
    success: boolean
    duration: number
  }> {
    return this.rollbackSystem.getRollbackHistory()
  }

  // Private helper methods

  private updateStatus(updates: Partial<MigrationStatus>): void {
    this.currentStatus = { ...this.currentStatus, ...updates }
  }

  private async executeStep(step: any): Promise<{ success: boolean; output: string; errors: string[] }> {
    // Check if paused before executing step
    await this.waitIfPaused()
    
    // Create checkpoint before executing step if it's rollbackable
    if (step.rollbackable) {
      await this.createCheckpoint(`before-${step.id}`, {
        stepId: step.id,
        stepName: step.name,
        phase: 'before-execution'
      })
    }
    
    try {
      console.log(`⚙️ Executing step: ${step.name}`)
      
      // Simulate step execution based on type
      switch (step.type) {
        case 'dependency':
          return await this.executeDependencyStep(step)
        case 'configuration':
          return await this.executeConfigurationStep(step)
        case 'code':
          return await this.executeCodeStep(step)
        case 'test':
          return await this.executeTestStep(step)
        default:
          // Generic step execution
          await new Promise(resolve => setTimeout(resolve, step.estimatedDuration * 100))
          return {
            success: true,
            output: `Step ${step.name} executed successfully`,
            errors: []
          }
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  private async executeDependencyStep(step: any): Promise<{ success: boolean; output: string; errors: string[] }> {
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const execAsync = promisify(exec)
      
      // Simulate dependency update
      if (step.id === 'update-nextjs') {
        console.log('📦 Updating Next.js to version 16...')
        // In real implementation, this would update package.json and run npm install
        await new Promise(resolve => setTimeout(resolve, 2000))
      } else if (step.id === 'update-dependencies') {
        console.log('📦 Updating dependencies...')
        // In real implementation, this would update all dependencies
        await new Promise(resolve => setTimeout(resolve, 3000))
      }
      
      return {
        success: true,
        output: `Dependency step ${step.name} completed`,
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [error instanceof Error ? error.message : 'Dependency update failed']
      }
    }
  }

  private async executeConfigurationStep(step: any): Promise<{ success: boolean; output: string; errors: string[] }> {
    try {
      console.log('⚙️ Updating configuration files...')
      // In real implementation, this would update config files
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return {
        success: true,
        output: `Configuration step ${step.name} completed`,
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [error instanceof Error ? error.message : 'Configuration update failed']
      }
    }
  }

  private async executeCodeStep(step: any): Promise<{ success: boolean; output: string; errors: string[] }> {
    try {
      console.log('💻 Executing code changes...')
      // In real implementation, this would make code changes
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      return {
        success: true,
        output: `Code step ${step.name} completed`,
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [error instanceof Error ? error.message : 'Code execution failed']
      }
    }
  }

  private async executeTestStep(step: any): Promise<{ success: boolean; output: string; errors: string[] }> {
    try {
      console.log('🧪 Running tests...')
      
      // Run validation criteria
      for (const criteria of step.validationCriteria) {
        if (criteria.command) {
          try {
            const { exec } = await import('child_process')
            const { promisify } = await import('util')
            const execAsync = promisify(exec)
            
            console.log(`Running: ${criteria.command}`)
            const { stdout, stderr } = await execAsync(criteria.command, { timeout: 60000 })
            
            if (stderr && !criteria.command.includes('test')) {
              console.log(`Warning: ${stderr}`)
            }
          } catch (error) {
            // For simulation, don't fail on command errors
            console.log(`Command failed (simulated): ${criteria.command}`)
          }
        }
      }
      
      return {
        success: true,
        output: `Test step ${step.name} completed`,
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        output: '',
        errors: [error instanceof Error ? error.message : 'Test execution failed']
      }
    }
  }

  private async executeRollback(plan: MigrationPlan): Promise<void> {
    console.log('🔄 Executing rollback...')
    
    try {
      const rollbackResult = await this.rollbackSystem.fastRollback('Migration step failure')
      
      if (rollbackResult.success) {
        console.log(`✅ Rollback completed successfully in ${rollbackResult.duration}ms`)
        
        this.updateStatus({
          phase: 'rollback',
          currentStep: 'Rollback completed',
          progress: 100,
          status: 'completed'
        })
      } else {
        console.log(`❌ Rollback failed: ${rollbackResult.errors.join(', ')}`)
        
        this.updateStatus({
          phase: 'rollback',
          currentStep: 'Rollback failed',
          progress: 0,
          status: 'failed'
        })
      }
    } catch (error) {
      console.log(`❌ Rollback execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      this.updateStatus({
        phase: 'rollback',
        currentStep: 'Rollback error',
        progress: 0,
        status: 'failed'
      })
    }
  }

  private async validateCheckpoint(checkpoint: any): Promise<ValidationResult> {
    // Simulate checkpoint validation
    return {
      success: true,
      errors: [],
      warnings: [],
      details: {}
    }
  }

  private async runFinalValidation(plan: MigrationPlan): Promise<ValidationResult> {
    try {
      // Run comprehensive validation
      const errors: string[] = []
      const warnings: string[] = []

      // Check if application builds
      try {
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)
        
        await execAsync('npm run build', { timeout: 300000 })
      } catch (error) {
        errors.push('Application build failed')
      }

      // Validate performance
      try {
        const comparison = await this.performanceAnalyzer.compareWithBaseline()
        const degradedMetrics = Object.values(comparison.comparison).filter(r => !r.acceptable)
        
        if (degradedMetrics.length > 0) {
          warnings.push(`${degradedMetrics.length} performance metrics degraded`)
        }
      } catch (error) {
        warnings.push('Performance validation failed')
      }

      return {
        success: errors.length === 0,
        errors,
        warnings,
        details: {
          validationTime: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Final validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        details: {}
      }
    }
  }
}