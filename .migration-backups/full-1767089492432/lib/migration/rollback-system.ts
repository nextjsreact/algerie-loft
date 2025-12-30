/**
 * Rollback System for Next.js 16 Migration
 * Handles automatic and manual rollback operations with fast restoration
 */

import { BackupManager } from './backup-manager'
import type {
  RollbackResult,
  RollbackTrigger,
  ValidationResult,
  MigrationPlan,
  BackupInfo,
  SnapshotInfo
} from './types'

export interface RollbackOptions {
  automatic?: boolean
  confirmationRequired?: boolean
  maxRollbackTime?: number // in minutes
  preserveLogs?: boolean
}

export interface RollbackContext {
  triggerReason: string
  failedStep?: string
  errorDetails?: string
  timestamp: Date
  userConfirmed?: boolean
}

export class RollbackSystem {
  private backupManager: BackupManager
  private rollbackTriggers: Map<string, RollbackTrigger> = new Map()
  private rollbackHistory: Array<{
    id: string
    timestamp: Date
    context: RollbackContext
    result: RollbackResult
  }> = []

  constructor() {
    this.backupManager = new BackupManager()
    this.setupDefaultTriggers()
  }

  /**
   * Setup default automatic rollback triggers
   */
  private setupDefaultTriggers(): void {
    // Critical error triggers
    this.addTrigger({
      condition: 'build_failure',
      threshold: 1,
      action: 'rollback'
    })

    this.addTrigger({
      condition: 'critical_test_failure',
      threshold: 3,
      action: 'rollback'
    })

    this.addTrigger({
      condition: 'dependency_conflict',
      threshold: 1,
      action: 'pause'
    })

    this.addTrigger({
      condition: 'performance_degradation',
      threshold: 25, // 25% degradation
      action: 'notify'
    })

    console.log('🔧 Default rollback triggers configured')
  }

  /**
   * Add a rollback trigger
   */
  addTrigger(trigger: RollbackTrigger): void {
    this.rollbackTriggers.set(trigger.condition, trigger)
    console.log(`📋 Added rollback trigger: ${trigger.condition} -> ${trigger.action}`)
  }

  /**
   * Remove a rollback trigger
   */
  removeTrigger(condition: string): void {
    this.rollbackTriggers.delete(condition)
    console.log(`🗑️ Removed rollback trigger: ${condition}`)
  }

  /**
   * Check if a condition should trigger rollback
   */
  async checkTriggers(condition: string, value: number = 1): Promise<'rollback' | 'pause' | 'notify' | null> {
    const trigger = this.rollbackTriggers.get(condition)
    
    if (!trigger) {
      return null
    }

    if (value >= trigger.threshold) {
      console.log(`🚨 Trigger activated: ${condition} (${value} >= ${trigger.threshold}) -> ${trigger.action}`)
      return trigger.action
    }

    return null
  }

  /**
   * Execute automatic rollback
   */
  async executeAutomaticRollback(
    context: RollbackContext,
    options: RollbackOptions = {}
  ): Promise<RollbackResult> {
    console.log(`🔄 Executing automatic rollback: ${context.triggerReason}`)
    
    const rollbackId = `rollback-${Date.now()}`
    const startTime = Date.now()

    try {
      // Get the latest backup or snapshot
      const snapshots = await this.backupManager.listSnapshots()
      
      if (snapshots.length === 0) {
        throw new Error('No snapshots available for rollback')
      }

      // Find the most recent stable snapshot
      const latestSnapshot = snapshots[snapshots.length - 1]
      
      console.log(`📦 Rolling back to snapshot: ${latestSnapshot.id}`)
      
      // Execute the rollback
      const restoreResult = await this.backupManager.restoreFromSnapshot(latestSnapshot.id)
      
      const duration = Date.now() - startTime
      
      const result: RollbackResult = {
        success: restoreResult.success,
        restoredState: latestSnapshot.id,
        duration,
        errors: restoreResult.errors
      }

      // Record rollback in history
      this.rollbackHistory.push({
        id: rollbackId,
        timestamp: new Date(),
        context,
        result
      })

      if (result.success) {
        console.log(`✅ Automatic rollback completed in ${duration}ms`)
      } else {
        console.log(`❌ Automatic rollback failed: ${result.errors.join(', ')}`)
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const result: RollbackResult = {
        success: false,
        restoredState: 'failed',
        duration,
        errors: [error instanceof Error ? error.message : 'Unknown rollback error']
      }

      this.rollbackHistory.push({
        id: rollbackId,
        timestamp: new Date(),
        context,
        result
      })

      console.log(`❌ Automatic rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  /**
   * Execute manual rollback with user confirmation
   */
  async executeManualRollback(
    targetSnapshot: string,
    context: RollbackContext,
    options: RollbackOptions = {}
  ): Promise<RollbackResult> {
    console.log(`🔄 Executing manual rollback to: ${targetSnapshot}`)
    
    // Check if confirmation is required
    if (options.confirmationRequired && !context.userConfirmed) {
      throw new Error('User confirmation required for manual rollback')
    }

    const rollbackId = `manual-rollback-${Date.now()}`
    const startTime = Date.now()

    try {
      // Validate target snapshot exists
      const snapshots = await this.backupManager.listSnapshots()
      const targetSnapshotInfo = snapshots.find(s => s.id === targetSnapshot)
      
      if (!targetSnapshotInfo) {
        throw new Error(`Target snapshot not found: ${targetSnapshot}`)
      }

      console.log(`📦 Rolling back to snapshot: ${targetSnapshot} (${targetSnapshotInfo.label})`)
      
      // Execute the rollback
      const restoreResult = await this.backupManager.restoreFromSnapshot(targetSnapshot)
      
      const duration = Date.now() - startTime
      
      const result: RollbackResult = {
        success: restoreResult.success,
        restoredState: targetSnapshot,
        duration,
        errors: restoreResult.errors
      }

      // Record rollback in history
      this.rollbackHistory.push({
        id: rollbackId,
        timestamp: new Date(),
        context,
        result
      })

      if (result.success) {
        console.log(`✅ Manual rollback completed in ${duration}ms`)
      } else {
        console.log(`❌ Manual rollback failed: ${result.errors.join(', ')}`)
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      const result: RollbackResult = {
        success: false,
        restoredState: 'failed',
        duration,
        errors: [error instanceof Error ? error.message : 'Unknown rollback error']
      }

      this.rollbackHistory.push({
        id: rollbackId,
        timestamp: new Date(),
        context,
        result
      })

      console.log(`❌ Manual rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  /**
   * Fast rollback to the most recent stable state
   */
  async fastRollback(reason: string): Promise<RollbackResult> {
    console.log(`⚡ Executing fast rollback: ${reason}`)
    
    const context: RollbackContext = {
      triggerReason: reason,
      timestamp: new Date()
    }

    return this.executeAutomaticRollback(context, {
      automatic: true,
      maxRollbackTime: 2 // 2 minutes max for fast rollback
    })
  }

  /**
   * Validate rollback capability
   */
  async validateRollbackCapability(): Promise<ValidationResult> {
    console.log('🔍 Validating rollback capability...')
    
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Check if backup manager is available
      const snapshots = await this.backupManager.listSnapshots()
      
      if (snapshots.length === 0) {
        errors.push('No snapshots available for rollback')
      } else {
        console.log(`📦 Found ${snapshots.length} snapshots available for rollback`)
      }

      // Check if the most recent snapshot is valid
      if (snapshots.length > 0) {
        const latestSnapshot = snapshots[snapshots.length - 1]
        const validation = await this.backupManager.validateBackup(latestSnapshot.backupId)
        
        if (!validation.success) {
          errors.push(`Latest snapshot validation failed: ${validation.errors.join(', ')}`)
        }
      }

      // Check rollback triggers
      if (this.rollbackTriggers.size === 0) {
        warnings.push('No rollback triggers configured')
      }

      return {
        success: errors.length === 0,
        errors,
        warnings,
        details: {
          availableSnapshots: snapshots.length,
          configuredTriggers: this.rollbackTriggers.size,
          rollbackHistory: this.rollbackHistory.length
        }
      }
    } catch (error) {
      return {
        success: false,
        errors: [`Rollback validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings,
        details: {}
      }
    }
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
    return this.rollbackHistory.map(entry => ({
      id: entry.id,
      timestamp: entry.timestamp,
      reason: entry.context.triggerReason,
      success: entry.result.success,
      duration: entry.result.duration
    }))
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
    try {
      const snapshots = await this.backupManager.listSnapshots()
      
      return snapshots.map(snapshot => ({
        id: snapshot.id,
        label: snapshot.label,
        timestamp: snapshot.timestamp,
        description: snapshot.description || `Snapshot created at ${snapshot.timestamp.toISOString()}`
      }))
    } catch (error) {
      console.log(`❌ Failed to get rollback points: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return []
    }
  }

  /**
   * Estimate rollback time
   */
  async estimateRollbackTime(targetSnapshot?: string): Promise<number> {
    try {
      const snapshots = await this.backupManager.listSnapshots()
      
      if (snapshots.length === 0) {
        return 0
      }

      const target = targetSnapshot 
        ? snapshots.find(s => s.id === targetSnapshot)
        : snapshots[snapshots.length - 1]

      if (!target) {
        return 0
      }

      // Estimate based on backup size and historical data
      const baseTime = 30000 // 30 seconds base time
      const sizeMultiplier = Math.log(target.backupId.length || 1000) * 1000 // Rough size estimation
      
      // Factor in historical rollback times
      const avgHistoricalTime = this.rollbackHistory.length > 0
        ? this.rollbackHistory.reduce((sum, entry) => sum + entry.result.duration, 0) / this.rollbackHistory.length
        : baseTime

      return Math.max(baseTime, Math.min(avgHistoricalTime * 1.2, baseTime + sizeMultiplier))
    } catch (error) {
      console.log(`❌ Failed to estimate rollback time: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return 300000 // 5 minutes default
    }
  }

  /**
   * Clear rollback history (for cleanup)
   */
  clearHistory(): void {
    this.rollbackHistory = []
    console.log('🧹 Rollback history cleared')
  }
}