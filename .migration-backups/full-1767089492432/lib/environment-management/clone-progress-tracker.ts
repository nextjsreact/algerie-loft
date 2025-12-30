/**
 * Clone Progress Tracker
 * 
 * Tracks and reports progress for clone operations with real-time updates
 */

import { CloneOperation, CloneLog } from './environment-cloner'

export interface ProgressUpdate {
  operationId: string
  progress: number
  phase: string
  message: string
  timestamp: Date
  estimatedTimeRemaining?: number
}

export interface ProgressStatistics {
  operationId: string
  totalPhases: number
  currentPhase: number
  overallProgress: number
  phaseProgress: number
  startTime: Date
  estimatedCompletion?: Date
  averagePhaseTime: number
}

export class CloneProgressTracker {
  private operations: Map<string, CloneOperation> = new Map()
  private progressCallbacks: Map<string, ((update: ProgressUpdate) => void)[]> = new Map()
  private phaseTimings: Map<string, number[]> = new Map()

  /**
   * Initialize progress tracking for an operation
   */
  public initializeOperation(operationId: string, operation: CloneOperation): void {
    this.operations.set(operationId, operation)
    this.phaseTimings.set(operationId, [])
    
    this.emitProgressUpdate(operationId, {
      progress: 0,
      phase: 'Initialization',
      message: 'Starting clone operation...'
    })
  }

  /**
   * Update progress for an operation
   */
  public updateProgress(
    operationId: string, 
    progress: number, 
    phase?: string, 
    message?: string
  ): void {
    const operation = this.operations.get(operationId)
    if (!operation) {
      console.warn(`Progress update for unknown operation: ${operationId}`)
      return
    }

    // Update operation progress
    operation.progress = Math.min(100, Math.max(0, progress))

    // Record phase timing if phase changed
    if (phase && this.getCurrentPhase(operationId) !== phase) {
      this.recordPhaseCompletion(operationId)
    }

    this.emitProgressUpdate(operationId, {
      progress: operation.progress,
      phase: phase || this.getCurrentPhase(operationId),
      message: message || this.getDefaultMessage(operation.progress)
    })
  }

  /**
   * Update progress with detailed phase information
   */
  public updatePhaseProgress(
    operationId: string,
    phase: string,
    phaseProgress: number,
    overallProgress: number,
    message: string
  ): void {
    const operation = this.operations.get(operationId)
    if (!operation) return

    operation.progress = overallProgress

    this.emitProgressUpdate(operationId, {
      progress: overallProgress,
      phase,
      message: `${phase}: ${message} (${phaseProgress}%)`
    })
  }

  /**
   * Mark operation as completed
   */
  public completeOperation(operationId: string, success: boolean): void {
    const operation = this.operations.get(operationId)
    if (!operation) return

    operation.progress = 100
    operation.status = success ? 'completed' : 'failed'
    operation.completedAt = new Date()

    this.emitProgressUpdate(operationId, {
      progress: 100,
      phase: success ? 'Completed' : 'Failed',
      message: success ? 'Clone operation completed successfully' : 'Clone operation failed'
    })

    // Clean up after a delay
    setTimeout(() => {
      this.cleanup(operationId)
    }, 300000) // 5 minutes
  }

  /**
   * Register a callback for progress updates
   */
  public onProgressUpdate(
    operationId: string, 
    callback: (update: ProgressUpdate) => void
  ): void {
    if (!this.progressCallbacks.has(operationId)) {
      this.progressCallbacks.set(operationId, [])
    }
    this.progressCallbacks.get(operationId)!.push(callback)
  }

  /**
   * Remove progress callback
   */
  public removeProgressCallback(
    operationId: string, 
    callback: (update: ProgressUpdate) => void
  ): void {
    const callbacks = this.progressCallbacks.get(operationId)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Get current progress statistics
   */
  public getProgressStatistics(operationId: string): ProgressStatistics | null {
    const operation = this.operations.get(operationId)
    if (!operation) return null

    const phaseTimings = this.phaseTimings.get(operationId) || []
    const averagePhaseTime = phaseTimings.length > 0 
      ? phaseTimings.reduce((sum, time) => sum + time, 0) / phaseTimings.length
      : 0

    const currentPhase = this.getCurrentPhaseNumber(operation.progress)
    const totalPhases = 5 // Schema, Data, Anonymization, PostClone, Validation

    let estimatedCompletion: Date | undefined
    if (averagePhaseTime > 0 && operation.progress > 0) {
      const remainingPhases = totalPhases - currentPhase
      const estimatedRemainingTime = remainingPhases * averagePhaseTime
      estimatedCompletion = new Date(Date.now() + estimatedRemainingTime)
    }

    return {
      operationId,
      totalPhases,
      currentPhase,
      overallProgress: operation.progress,
      phaseProgress: this.getPhaseProgress(operation.progress),
      startTime: operation.startedAt,
      estimatedCompletion,
      averagePhaseTime
    }
  }

  /**
   * Get all active operations
   */
  public getActiveOperations(): CloneOperation[] {
    return Array.from(this.operations.values())
      .filter(op => op.status === 'in_progress')
  }

  /**
   * Get operation by ID
   */
  public getOperation(operationId: string): CloneOperation | undefined {
    return this.operations.get(operationId)
  }

  /**
   * Cancel operation tracking
   */
  public cancelOperation(operationId: string): void {
    const operation = this.operations.get(operationId)
    if (operation) {
      operation.status = 'cancelled'
      operation.progress = 0
      
      this.emitProgressUpdate(operationId, {
        progress: 0,
        phase: 'Cancelled',
        message: 'Operation cancelled by user'
      })
    }
  }

  /**
   * Emit progress update to all registered callbacks
   */
  private emitProgressUpdate(operationId: string, update: Partial<ProgressUpdate>): void {
    const fullUpdate: ProgressUpdate = {
      operationId,
      progress: update.progress || 0,
      phase: update.phase || 'Unknown',
      message: update.message || '',
      timestamp: new Date(),
      estimatedTimeRemaining: this.calculateEstimatedTimeRemaining(operationId)
    }

    const callbacks = this.progressCallbacks.get(operationId) || []
    callbacks.forEach(callback => {
      try {
        callback(fullUpdate)
      } catch (error) {
        console.error('Error in progress callback:', error)
      }
    })

    // Also log to console for debugging
    console.log(`[PROGRESS] ${operationId}: ${fullUpdate.progress}% - ${fullUpdate.phase} - ${fullUpdate.message}`)
  }

  /**
   * Get current phase based on progress
   */
  private getCurrentPhase(operationId: string): string {
    const operation = this.operations.get(operationId)
    if (!operation) return 'Unknown'

    const progress = operation.progress
    if (progress < 10) return 'Initialization'
    if (progress < 30) return 'Schema Analysis'
    if (progress < 70) return 'Data Cloning'
    if (progress < 85) return 'Anonymization'
    if (progress < 95) return 'Post-Clone Setup'
    if (progress < 100) return 'Validation'
    return 'Completed'
  }

  /**
   * Get current phase number (1-5)
   */
  private getCurrentPhaseNumber(progress: number): number {
    if (progress < 10) return 1
    if (progress < 30) return 2
    if (progress < 70) return 3
    if (progress < 85) return 4
    if (progress < 95) return 5
    return 5
  }

  /**
   * Get progress within current phase (0-100)
   */
  private getPhaseProgress(progress: number): number {
    if (progress < 10) return (progress / 10) * 100
    if (progress < 30) return ((progress - 10) / 20) * 100
    if (progress < 70) return ((progress - 30) / 40) * 100
    if (progress < 85) return ((progress - 70) / 15) * 100
    if (progress < 95) return ((progress - 85) / 10) * 100
    return ((progress - 95) / 5) * 100
  }

  /**
   * Get default message for progress level
   */
  private getDefaultMessage(progress: number): string {
    if (progress < 10) return 'Initializing clone operation...'
    if (progress < 30) return 'Analyzing and migrating schema...'
    if (progress < 70) return 'Cloning data...'
    if (progress < 85) return 'Anonymizing sensitive data...'
    if (progress < 95) return 'Setting up cloned environment...'
    if (progress < 100) return 'Running final validation...'
    return 'Clone operation completed'
  }

  /**
   * Record phase completion timing
   */
  private recordPhaseCompletion(operationId: string): void {
    const operation = this.operations.get(operationId)
    if (!operation) return

    const phaseTimings = this.phaseTimings.get(operationId) || []
    const now = Date.now()
    const lastTiming = phaseTimings.length > 0 ? phaseTimings[phaseTimings.length - 1] : operation.startedAt.getTime()
    const phaseTime = now - lastTiming

    phaseTimings.push(phaseTime)
    this.phaseTimings.set(operationId, phaseTimings)
  }

  /**
   * Calculate estimated time remaining
   */
  private calculateEstimatedTimeRemaining(operationId: string): number | undefined {
    const operation = this.operations.get(operationId)
    if (!operation || operation.progress === 0) return undefined

    const phaseTimings = this.phaseTimings.get(operationId) || []
    if (phaseTimings.length === 0) return undefined

    const averagePhaseTime = phaseTimings.reduce((sum, time) => sum + time, 0) / phaseTimings.length
    const currentPhase = this.getCurrentPhaseNumber(operation.progress)
    const remainingPhases = 5 - currentPhase
    
    return remainingPhases * averagePhaseTime
  }

  /**
   * Clean up completed operation data
   */
  private cleanup(operationId: string): void {
    this.operations.delete(operationId)
    this.progressCallbacks.delete(operationId)
    this.phaseTimings.delete(operationId)
  }
}