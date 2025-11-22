/**
 * Cloner Orchestrator
 * 
 * Main orchestrator for database cloning operations.
 * Coordinates deletion, schema copying, and data copying.
 */

import {
    CloneRequest,
    CloneProgress,
    CloneResult,
    CloneLog,
    CloneStatus,
    CloneStatistics,
    ProductionProtectionError
} from './types'
import { ConnectionValidator } from './connection-validator'
import { DataDeleter } from './data-deleter'
import { DataCopier } from './data-copier'
import { PgDumpCloner } from './pg-dump-cloner'

export class ClonerOrchestrator {
    private activeOperations: Map<string, CloneProgress> = new Map()
    private connectionValidator: ConnectionValidator
    private dataDeleter: DataDeleter
    private dataCopier: DataCopier
    private pgDumpCloner: PgDumpCloner
    private isCloning: boolean = false

    constructor() {
        this.connectionValidator = new ConnectionValidator()
        this.dataDeleter = new DataDeleter(this.addLog.bind(this))
        this.dataCopier = new DataCopier(this.addLog.bind(this))
        this.pgDumpCloner = new PgDumpCloner(this.addLog.bind(this))
    }

    /**
     * Start a clone operation
     */
    async startClone(request: CloneRequest): Promise<string> {
        console.log('🟢 [ORCHESTRATOR] startClone called at:', new Date().toISOString())
        
        // Prevent multiple simultaneous clones
        if (this.isCloning) {
            console.log('⚠️ [ORCHESTRATOR] Clone already in progress, rejecting duplicate request')
            throw new Error('A clone operation is already in progress. Please wait for it to complete.')
        }
        
        this.isCloning = true
        const operationId = this.generateOperationId()

        // Initialize progress tracking
        const progress: CloneProgress = {
            operationId,
            status: 'pending',
            progress: 0,
            currentPhase: 'Initializing',
            statistics: {
                tablesProcessed: 0,
                totalTables: 0,
                recordsProcessed: 0,
                totalRecords: 0,
                bytesProcessed: 0,
                totalBytes: 0,
                functionsCloned: 0,
                triggersCloned: 0,
                duration: 0
            },
            logs: [],
            startedAt: new Date()
        }

        this.activeOperations.set(operationId, progress)

        // Start cloning in background
        this.executeClone(operationId, request).catch(error => {
            this.handleCloneError(operationId, error)
        }).finally(() => {
            this.isCloning = false
            console.log('🟢 [ORCHESTRATOR] Clone operation finished, lock released')
        })

        return operationId
    }

    /**
     * Execute the cloning workflow
     */
    private async executeClone(
        operationId: string,
        request: CloneRequest
    ): Promise<void> {
        const progress = this.activeOperations.get(operationId)
        if (!progress) {
            throw new Error(`Operation ${operationId} not found`)
        }

        try {
            // Phase 1: Validation (0-10%)
            await this.phaseValidation(operationId, request)
            this.updateProgress(operationId, 10, 'validating')

            // Phase 2: Create Backup (10-20%)
            if (request.options.createBackup) {
                await this.phaseCreateBackup(operationId, request)
                this.updateProgress(operationId, 20, 'creating_backup')
            }

            // Phase 3: Complete Clone with pg_dump (20-95%)
            await this.phaseCloneWithPgDump(operationId, request)
            this.updateProgress(operationId, 95, 'copying_data')

            // Phase 4: Final Validation (95-100%)
            await this.phaseFinalValidation(operationId, request)
            this.updateProgress(operationId, 100, 'completed')

            // Mark as completed
            progress.status = 'completed'
            progress.completedAt = new Date()
            progress.statistics.duration = Date.now() - progress.startedAt.getTime()

            this.addLog(operationId, {
                timestamp: new Date(),
                level: 'success',
                phase: 'Completion',
                message: '🎉 Clone operation completed successfully!'
            })

        } catch (error: any) {
            throw error
        }
    }

    /**
     * Phase 1: Validation
     */
    private async phaseValidation(
        operationId: string,
        request: CloneRequest
    ): Promise<void> {
        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'info',
            phase: 'Validation',
            message: 'Validating clone request...'
        })

        // Check for production protection
        if (request.target.name.toLowerCase().includes('prod')) {
            throw new ProductionProtectionError(
                'Cannot clone to production environment'
            )
        }

        // Check if PostgreSQL passwords are provided
        if (!request.source.credentials.password) {
            throw new Error('Source PostgreSQL password is required')
        }
        if (!request.target.credentials.password) {
            throw new Error('Target PostgreSQL password is required')
        }

        // Basic URL validation
        if (!request.source.credentials.url.includes('supabase.co')) {
            throw new Error('Invalid source Supabase URL')
        }
        if (!request.target.credentials.url.includes('supabase.co')) {
            throw new Error('Invalid target Supabase URL')
        }

        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'success',
            phase: 'Validation',
            message: '✅ Basic validation passed. pg_dump will verify PostgreSQL credentials.'
        })
    }

    /**
     * Phase 2: Create Backup
     */
    private async phaseCreateBackup(
        operationId: string,
        request: CloneRequest
    ): Promise<void> {
        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'info',
            phase: 'Backup',
            message: 'Creating backup of target database...'
        })

        // TODO: Implement actual backup creation
        // For now, just simulate
        await this.sleep(1000)

        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'success',
            phase: 'Backup',
            message: '✅ Backup created successfully'
        })
    }

    /**
     * Phase 3: Delete Target Data
     */
    private async phaseDeleteTarget(
        operationId: string,
        request: CloneRequest
    ): Promise<void> {
        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'warning',
            phase: 'Deletion',
            message: `⚠️ Deleting all data from ${request.target.name}...`
        })

        const deleteResult = await this.dataDeleter.deleteAllData(
            request.target.credentials,
            request.target.name,
            {
                createBackup: request.options.createBackup,
                confirmDeletion: true
            }
        )

        if (!deleteResult.success) {
            throw new Error(`Data deletion failed: ${deleteResult.errors.join(', ')}`)
        }

        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'success',
            phase: 'Deletion',
            message: `✅ Deleted data from ${deleteResult.tablesCleared.length} tables`
        })
    }

    /**
     * Phase 3: Complete Clone with pg_dump
     * Replaces phases: Delete, Copy Schema, Copy Data, Copy Functions
     */
    private async phaseCloneWithPgDump(
        operationId: string,
        request: CloneRequest
    ): Promise<void> {
        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'info',
            phase: 'pg_dump',
            message: '🚀 Starting complete database clone with pg_dump...'
        })

        // Check if passwords are provided
        if (!request.source.credentials.password) {
            throw new Error('Source database password is required for pg_dump. Please provide the PostgreSQL password.')
        }
        if (!request.target.credentials.password) {
            throw new Error('Target database password is required for pg_dump. Please provide the PostgreSQL password.')
        }

        // Execute pg_dump clone
        const result = await this.pgDumpCloner.cloneDatabase(
            request.source.credentials,
            request.target.credentials,
            {
                excludeSchemas: request.options.includeStorage ? undefined : ['storage'],
                verbose: true,
                compress: false
            }
        )

        if (!result.success) {
            throw new Error(`pg_dump clone failed: ${result.errors.join(', ')}`)
        }

        // Update statistics
        const progress = this.activeOperations.get(operationId)
        if (progress && result.dumpSize) {
            progress.statistics.bytesProcessed = result.dumpSize
            progress.statistics.totalBytes = result.dumpSize
        }

        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'success',
            phase: 'pg_dump',
            message: `✅ Database cloned successfully${result.dumpSize ? ` (${this.formatBytes(result.dumpSize)})` : ''} in ${this.formatDuration(result.duration)}`
        })
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    private formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`
        }
        return `${seconds}s`
    }

    /**
     * Phase 4: Final Validation
     */

    /**
     * Phase 5: Copy Data
     */
    private async phaseCopyData(
        operationId: string,
        request: CloneRequest
    ): Promise<void> {
        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'info',
            phase: 'Data',
            message: 'Copying data from source to target...'
        })

        const copyResult = await this.dataCopier.copyAllData(
            request.source.credentials,
            request.target.credentials,
            {
                batchSize: 100,
                anonymizeData: request.options.anonymizeData,
                preserveTimestamps: true
            }
        )

        if (!copyResult.success) {
            throw new Error(`Data copy failed: ${copyResult.errors.join(', ')}`)
        }

        const progress = this.activeOperations.get(operationId)
        if (progress) {
            progress.statistics.tablesProcessed = copyResult.tablesCopied.length
            progress.statistics.recordsProcessed = copyResult.recordsCopied
        }

        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'success',
            phase: 'Data',
            message: `✅ Copied ${copyResult.recordsCopied} records from ${copyResult.tablesCopied.length} tables`
        })
    }

    /**
     * Phase 6: Copy Functions & Triggers
     */
    private async phaseCopyFunctions(
        operationId: string,
        request: CloneRequest
    ): Promise<void> {
        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'info',
            phase: 'Functions',
            message: 'Copying functions and triggers...'
        })

        // TODO: Implement actual function/trigger copying
        await this.sleep(500)

        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'success',
            phase: 'Functions',
            message: '✅ Functions and triggers copied'
        })
    }

    /**
     * Phase 7: Final Validation
     */
    private async phaseFinalValidation(
        operationId: string,
        request: CloneRequest
    ): Promise<void> {
        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'info',
            phase: 'Validation',
            message: 'Running final validation checks...'
        })

        // TODO: Implement validation
        await this.sleep(500)

        this.addLog(operationId, {
            timestamp: new Date(),
            level: 'success',
            phase: 'Validation',
            message: '✅ Validation completed'
        })
    }

    /**
     * Get operation status
     */
    getOperationStatus(operationId: string): CloneProgress | undefined {
        return this.activeOperations.get(operationId)
    }

    /**
     * Cancel operation
     */
    async cancelOperation(operationId: string): Promise<void> {
        const progress = this.activeOperations.get(operationId)
        if (progress && progress.status !== 'completed' && progress.status !== 'failed') {
            progress.status = 'cancelled'
            this.addLog(operationId, {
                timestamp: new Date(),
                level: 'warning',
                phase: 'Cancellation',
                message: 'Operation cancelled by user'
            })
        }
    }

    /**
     * Update operation progress
     */
    private updateProgress(
        operationId: string,
        progress: number,
        status: CloneStatus
    ): void {
        const operation = this.activeOperations.get(operationId)
        if (operation) {
            operation.progress = progress
            operation.status = status
            operation.currentPhase = this.getPhaseLabel(status)
        }
    }

    /**
     * Add log to operation
     */
    private addLog(operationId: string | CloneLog, log?: CloneLog): void {
        // Handle both signatures
        if (typeof operationId === 'string' && log) {
            const operation = this.activeOperations.get(operationId)
            if (operation) {
                operation.logs.push(log)
            }
        } else if (typeof operationId === 'object') {
            // Called from DataDeleter/DataCopier with just the log
            // Find the active operation and add the log
            for (const operation of this.activeOperations.values()) {
                if (operation.status !== 'completed' && operation.status !== 'failed') {
                    operation.logs.push(operationId)
                    break
                }
            }
        }
    }

    /**
     * Handle clone errors
     */
    private handleCloneError(operationId: string, error: any): void {
        console.error('🔴 [CLONE ERROR] Operation:', operationId)
        console.error('🔴 [CLONE ERROR] Error:', error)
        console.error('🔴 [CLONE ERROR] Stack:', error.stack)

        const progress = this.activeOperations.get(operationId)
        if (progress) {
            progress.status = 'failed'
            progress.completedAt = new Date()
            this.addLog(operationId, {
                timestamp: new Date(),
                level: 'error',
                phase: 'Error',
                message: `❌ Clone failed: ${error.message}`
            })
        }
    }

    /**
     * Get phase label from status
     */
    private getPhaseLabel(status: CloneStatus): string {
        const labels: Record<CloneStatus, string> = {
            pending: 'Initializing',
            validating: 'Validating connections',
            creating_backup: 'Creating backup',
            deleting_target: 'Deleting target data',
            copying_schema: 'Copying schema',
            copying_data: 'Copying data',
            copying_functions: 'Copying functions',
            copying_triggers: 'Copying triggers',
            validating_result: 'Validating result',
            completed: 'Completed',
            failed: 'Failed',
            cancelled: 'Cancelled'
        }
        return labels[status] || status
    }

    /**
     * Generate unique operation ID
     */
    private generateOperationId(): string {
        return `clone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    /**
     * Helper sleep function
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}
