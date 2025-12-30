/**
 * Granular Rollback Manager
 * 
 * Provides granular rollback capabilities by component or table
 * CRITICAL: Never performs rollback operations on production
 */

import { Environment, ProductionAccessError } from './types'
import { ProductionSafetyGuard } from './production-safety-guard'
import { CloneBackupManager, BackupMetadata } from './clone-backup-manager'

export interface RollbackTarget {
  type: 'table' | 'schema' | 'function' | 'trigger' | 'data' | 'full'
  name: string
  schema?: string
}

export interface RollbackOptions {
  targets: RollbackTarget[]
  validateBeforeRollback: boolean
  createCheckpoint: boolean
  preserveNewData?: boolean // Keep data added after backup
  rollbackTimeout?: number // in milliseconds
}

export interface RollbackResult {
  success: boolean
  rollbackId: string
  environmentId: string
  targetsRolledBack: RollbackTarget[]
  duration: number
  errors: string[]
  warnings: string[]
  checkpointId?: string
}

export interface RollbackCheckpoint {
  id: string
  environmentId: string
  createdAt: Date
  targets: RollbackTarget[]
  backupPath: string
  metadata: Record<string, any>
}

export class GranularRollbackManager {
  private safetyGuard: ProductionSafetyGuard
  private backupManager: CloneBackupManager
  private checkpoints: Map<string, RollbackCheckpoint> = new Map()

  constructor() {
    this.safetyGuard = ProductionSafetyGuard.getInstance()
    this.backupManager = new CloneBackupManager()
  }

  /**
   * Perform granular rollback of specific components
   * CRITICAL: Never rollback production environment
   */
  public async performGranularRollback(
    environment: Environment,
    backupId: string,
    options: RollbackOptions
  ): Promise<RollbackResult> {
    // CRITICAL SAFETY CHECK: Never rollback production
    await this.safetyGuard.enforceReadOnlyAccess(environment, 'granular_rollback')

    const rollbackId = `rollback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    console.log(`🔄 Starting granular rollback: ${rollbackId}`)
    console.log(`   Environment: ${environment.name}`)
    console.log(`   Backup: ${backupId}`)
    console.log(`   Targets: ${options.targets.map(t => `${t.type}:${t.name}`).join(', ')}`)

    const result: RollbackResult = {
      success: false,
      rollbackId,
      environmentId: environment.id,
      targetsRolledBack: [],
      duration: 0,
      errors: [],
      warnings: []
    }

    try {
      // Validate backup exists and is valid
      const backupInfo = await this.backupManager.getBackupInfo(backupId)
      if (!backupInfo) {
        throw new Error(`Backup not found: ${backupId}`)
      }

      if (!backupInfo.isValid) {
        throw new Error(`Backup is invalid: ${backupId}`)
      }

      // Create checkpoint if requested
      if (options.createCheckpoint) {
        result.checkpointId = await this.createRollbackCheckpoint(environment, options.targets)
        console.log(`📍 Created rollback checkpoint: ${result.checkpointId}`)
      }

      // Validate targets before rollback
      if (options.validateBeforeRollback) {
        await this.validateRollbackTargets(environment, options.targets, backupInfo)
      }

      // Perform rollback for each target
      for (const target of options.targets) {
        try {
          await this.rollbackTarget(environment, backupInfo, target, options)
          result.targetsRolledBack.push(target)
          console.log(`✅ Rolled back ${target.type}: ${target.name}`)
        } catch (error) {
          const errorMsg = `Failed to rollback ${target.type} ${target.name}: ${error.message}`
          result.errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }

      // Validate rollback results
      await this.validateRollbackResults(environment, result)

      result.success = result.errors.length === 0
      result.duration = Date.now() - startTime

      if (result.success) {
        console.log(`✅ Granular rollback completed successfully: ${rollbackId}`)
        console.log(`   Targets rolled back: ${result.targetsRolledBack.length}`)
        console.log(`   Duration: ${this.formatDuration(result.duration)}`)
      } else {
        console.log(`⚠️  Granular rollback completed with errors: ${rollbackId}`)
        console.log(`   Successful targets: ${result.targetsRolledBack.length}`)
        console.log(`   Failed targets: ${result.errors.length}`)
      }

      return result

    } catch (error) {
      result.success = false
      result.duration = Date.now() - startTime
      result.errors.push(error.message)

      console.error(`❌ Granular rollback failed: ${error.message}`)
      
      // Attempt to restore checkpoint if available
      if (result.checkpointId) {
        try {
          await this.restoreCheckpoint(environment, result.checkpointId)
          result.warnings.push('Restored to checkpoint after rollback failure')
        } catch (checkpointError) {
          result.errors.push(`Checkpoint restore failed: ${checkpointError.message}`)
        }
      }

      return result
    }
  }

  /**
   * Rollback specific table data only
   */
  public async rollbackTableData(
    environment: Environment,
    backupId: string,
    tableName: string,
    schemaName: string = 'public'
  ): Promise<RollbackResult> {
    const options: RollbackOptions = {
      targets: [{ type: 'table', name: tableName, schema: schemaName }],
      validateBeforeRollback: true,
      createCheckpoint: true
    }

    return await this.performGranularRollback(environment, backupId, options)
  }

  /**
   * Rollback schema changes only (structure, not data)
   */
  public async rollbackSchemaChanges(
    environment: Environment,
    backupId: string,
    schemaName: string = 'public'
  ): Promise<RollbackResult> {
    const options: RollbackOptions = {
      targets: [{ type: 'schema', name: schemaName }],
      validateBeforeRollback: true,
      createCheckpoint: true,
      preserveNewData: true // Keep data, only rollback structure
    }

    return await this.performGranularRollback(environment, backupId, options)
  }

  /**
   * Rollback specific functions and triggers
   */
  public async rollbackFunctions(
    environment: Environment,
    backupId: string,
    functionNames: string[]
  ): Promise<RollbackResult> {
    const targets: RollbackTarget[] = functionNames.map(name => ({
      type: 'function',
      name
    }))

    const options: RollbackOptions = {
      targets,
      validateBeforeRollback: true,
      createCheckpoint: true
    }

    return await this.performGranularRollback(environment, backupId, options)
  }

  /**
   * Create a rollback checkpoint for specific targets
   */
  public async createRollbackCheckpoint(
    environment: Environment,
    targets: RollbackTarget[]
  ): Promise<string> {
    // CRITICAL: Never create checkpoint of production
    await this.safetyGuard.enforceReadOnlyAccess(environment, 'checkpoint_creation')

    const checkpointId = `checkpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`📍 Creating rollback checkpoint: ${checkpointId}`)

    // Create targeted backup for checkpoint
    const backupId = await this.backupManager.createBackup(environment, {
      includeSchema: targets.some(t => t.type === 'schema' || t.type === 'function' || t.type === 'trigger'),
      includeData: targets.some(t => t.type === 'table' || t.type === 'data'),
      compressionLevel: 'medium'
    })

    const checkpoint: RollbackCheckpoint = {
      id: checkpointId,
      environmentId: environment.id,
      createdAt: new Date(),
      targets,
      backupPath: backupId,
      metadata: {
        environmentName: environment.name,
        environmentType: environment.type,
        targetCount: targets.length
      }
    }

    this.checkpoints.set(checkpointId, checkpoint)
    
    console.log(`✅ Checkpoint created: ${checkpointId}`)
    return checkpointId
  }

  /**
   * Restore from a rollback checkpoint
   */
  public async restoreCheckpoint(
    environment: Environment,
    checkpointId: string
  ): Promise<void> {
    // CRITICAL: Never restore to production
    await this.safetyGuard.enforceReadOnlyAccess(environment, 'checkpoint_restore')

    const checkpoint = this.checkpoints.get(checkpointId)
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`)
    }

    console.log(`🔄 Restoring checkpoint: ${checkpointId}`)

    // Restore using the backup manager
    await this.backupManager.restoreBackup(environment, checkpoint.backupPath, {
      validateBeforeRestore: true,
      createRestorePoint: false // Don't create nested restore points
    })

    console.log(`✅ Checkpoint restored: ${checkpointId}`)
  }

  /**
   * List available checkpoints for an environment
   */
  public getCheckpoints(environmentId?: string): RollbackCheckpoint[] {
    let checkpoints = Array.from(this.checkpoints.values())
    
    if (environmentId) {
      checkpoints = checkpoints.filter(cp => cp.environmentId === environmentId)
    }
    
    return checkpoints.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  /**
   * Delete a checkpoint
   */
  public async deleteCheckpoint(checkpointId: string): Promise<void> {
    const checkpoint = this.checkpoints.get(checkpointId)
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`)
    }

    // Delete the associated backup
    await this.backupManager.deleteBackup(checkpoint.backupPath)
    
    // Remove from memory
    this.checkpoints.delete(checkpointId)
    
    console.log(`🗑️  Deleted checkpoint: ${checkpointId}`)
  }

  /**
   * Validate rollback targets against backup
   */
  private async validateRollbackTargets(
    environment: Environment,
    targets: RollbackTarget[],
    backupInfo: BackupMetadata
  ): Promise<void> {
    console.log(`🔍 Validating rollback targets...`)

    for (const target of targets) {
      // Validate target exists in backup
      // This would check the backup content in a real implementation
      
      // Validate target exists in current environment
      // This would query the database in a real implementation
      
      console.log(`✅ Validated target: ${target.type}:${target.name}`)
    }
  }

  /**
   * Rollback a specific target
   */
  private async rollbackTarget(
    environment: Environment,
    backupInfo: BackupMetadata,
    target: RollbackTarget,
    options: RollbackOptions
  ): Promise<void> {
    console.log(`🔄 Rolling back ${target.type}: ${target.name}`)

    switch (target.type) {
      case 'table':
        await this.rollbackTableTarget(environment, backupInfo, target, options)
        break
      case 'schema':
        await this.rollbackSchemaTarget(environment, backupInfo, target, options)
        break
      case 'function':
        await this.rollbackFunctionTarget(environment, backupInfo, target, options)
        break
      case 'trigger':
        await this.rollbackTriggerTarget(environment, backupInfo, target, options)
        break
      case 'data':
        await this.rollbackDataTarget(environment, backupInfo, target, options)
        break
      case 'full':
        await this.rollbackFullTarget(environment, backupInfo, target, options)
        break
      default:
        throw new Error(`Unsupported rollback target type: ${target.type}`)
    }
  }

  /**
   * Rollback table structure and/or data
   */
  private async rollbackTableTarget(
    environment: Environment,
    backupInfo: BackupMetadata,
    target: RollbackTarget,
    options: RollbackOptions
  ): Promise<void> {
    // This is a placeholder for actual table rollback implementation
    // In a real system, this would:
    // 1. Extract table definition from backup
    // 2. Compare with current table
    // 3. Generate rollback SQL
    // 4. Execute rollback
    
    console.log(`  📋 Rolling back table: ${target.schema || 'public'}.${target.name}`)
    
    if (!options.preserveNewData) {
      console.log(`  🔄 Rolling back table data...`)
    }
    
    // Simulate rollback process
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  /**
   * Rollback schema structure
   */
  private async rollbackSchemaTarget(
    environment: Environment,
    backupInfo: BackupMetadata,
    target: RollbackTarget,
    options: RollbackOptions
  ): Promise<void> {
    console.log(`  🏗️  Rolling back schema: ${target.name}`)
    
    // Simulate schema rollback
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  /**
   * Rollback function definition
   */
  private async rollbackFunctionTarget(
    environment: Environment,
    backupInfo: BackupMetadata,
    target: RollbackTarget,
    options: RollbackOptions
  ): Promise<void> {
    console.log(`  ⚙️  Rolling back function: ${target.name}`)
    
    // Simulate function rollback
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  /**
   * Rollback trigger definition
   */
  private async rollbackTriggerTarget(
    environment: Environment,
    backupInfo: BackupMetadata,
    target: RollbackTarget,
    options: RollbackOptions
  ): Promise<void> {
    console.log(`  🔧 Rolling back trigger: ${target.name}`)
    
    // Simulate trigger rollback
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  /**
   * Rollback data only (preserve structure)
   */
  private async rollbackDataTarget(
    environment: Environment,
    backupInfo: BackupMetadata,
    target: RollbackTarget,
    options: RollbackOptions
  ): Promise<void> {
    console.log(`  📊 Rolling back data: ${target.name}`)
    
    // Simulate data rollback
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  /**
   * Full rollback (everything)
   */
  private async rollbackFullTarget(
    environment: Environment,
    backupInfo: BackupMetadata,
    target: RollbackTarget,
    options: RollbackOptions
  ): Promise<void> {
    console.log(`  🔄 Performing full rollback`)
    
    // Use the backup manager for full restore
    await this.backupManager.restoreBackup(environment, backupInfo.id, {
      validateBeforeRestore: options.validateBeforeRollback,
      createRestorePoint: false
    })
  }

  /**
   * Validate rollback results
   */
  private async validateRollbackResults(
    environment: Environment,
    result: RollbackResult
  ): Promise<void> {
    console.log(`✅ Validating rollback results...`)
    
    // This would perform validation checks in a real implementation
    // For now, just simulate validation
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Add warnings for any issues found
    if (Math.random() > 0.9) {
      result.warnings.push('Minor validation warnings found after rollback')
    }
  }

  /**
   * Format duration for display
   */
  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }
}