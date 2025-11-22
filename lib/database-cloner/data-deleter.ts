/**
 * Data Deleter
 * 
 * Handles complete deletion of all data from target database before cloning.
 * CRITICAL: Protected against production deletion.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SupabaseCredentials, CloneLog, ProductionProtectionError } from './types'

export interface DeleteOptions {
    createBackup: boolean
    confirmDeletion: boolean
}

export interface DeleteResult {
    success: boolean
    tablesCleared: string[]
    recordsDeleted: number
    duration: number
    errors: string[]
}

export class DataDeleter {
    private logCallback?: (log: CloneLog) => void

    constructor(logCallback?: (log: CloneLog) => void) {
        this.logCallback = logCallback
    }

    /**
     * Delete all data from target database
     * CRITICAL: This is a destructive operation
     */
    async deleteAllData(
        credentials: SupabaseCredentials,
        environmentName: string,
        options: DeleteOptions
    ): Promise<DeleteResult> {
        const startTime = Date.now()
        const result: DeleteResult = {
            success: false,
            tablesCleared: [],
            recordsDeleted: 0,
            duration: 0,
            errors: []
        }

        // CRITICAL SAFETY CHECK: Prevent production deletion
        if (environmentName.toLowerCase().includes('prod')) {
            throw new ProductionProtectionError(
                'Cannot delete data from production environment'
            )
        }

        if (!options.confirmDeletion) {
            throw new Error('Deletion must be explicitly confirmed')
        }

        this.log('info', 'Deletion', `Starting deletion of all data from ${environmentName}`)

        try {
            const client = createClient(credentials.url, credentials.serviceKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            })

            // Get list of all tables (excluding system tables)
            const tables = await this.getTablesToDelete(client)
            this.log('info', 'Deletion', `Found ${tables.length} tables to clear`)

            // Delete data from each table (in reverse dependency order)
            for (const table of tables.reverse()) {
                try {
                    await this.deleteTableData(client, table)
                    result.tablesCleared.push(table)
                    this.log('success', 'Deletion', `Cleared table: ${table}`)
                } catch (error: any) {
                    const errorMsg = `Failed to clear table ${table}: ${error.message}`
                    result.errors.push(errorMsg)
                    this.log('error', 'Deletion', errorMsg)
                }
            }

            result.success = result.errors.length === 0
            result.duration = Date.now() - startTime

            if (result.success) {
                this.log('success', 'Deletion',
                    `✅ All data deleted successfully from ${result.tablesCleared.length} tables`)
            } else {
                this.log('warning', 'Deletion',
                    `⚠️ Deletion completed with ${result.errors.length} errors`)
            }

        } catch (error: any) {
            result.errors.push(error.message)
            result.duration = Date.now() - startTime
            this.log('error', 'Deletion', `Deletion failed: ${error.message}`)
            throw error
        }

        return result
    }

    /**
     * Get list of tables to delete (excluding system tables)
     */
    private async getTablesToDelete(client: SupabaseClient): Promise<string[]> {
        // Standard tables in the application
        const standardTables = [
            // User-related
            'conversations',
            'conversation_messages',
            'notifications',

            // Property-related
            'reservations',
            'loft_photos',
            'lofts',

            // Financial
            'transactions',
            'bills',
            'payment_methods',
            'currencies',

            // Administrative
            'audit_logs',
            'profiles',
            'user_roles',
            'teams'
        ]

        // Filter to only tables that exist
        const existingTables: string[] = []

        for (const table of standardTables) {
            try {
                const { error } = await client.from(table).select('id').limit(1)
                if (!error) {
                    existingTables.push(table)
                }
            } catch {
                // Table doesn't exist or isn't accessible, skip it
            }
        }

        return existingTables
    }

    /**
     * Delete all data from a specific table
     */
    private async deleteTableData(
        client: SupabaseClient,
        tableName: string
    ): Promise<void> {
        try {
            // First, get count of records
            const { count, error: countError } = await client
                .from(tableName)
                .select('*', { count: 'exact', head: true })

            if (countError) {
                throw countError
            }

            // Delete all records
            const { error: deleteError } = await client
                .from(tableName)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all except impossible UUID

            if (deleteError) {
                throw deleteError
            }

            this.log('info', 'Deletion',
                `Deleted ${count || 0} records from ${tableName}`)

        } catch (error: any) {
            throw new Error(`Failed to delete from ${tableName}: ${error.message}`)
        }
    }

    /**
     * Helper to log messages
     */
    private log(
        level: 'info' | 'warning' | 'error' | 'success',
        phase: string,
        message: string
    ): void {
        if (this.logCallback) {
            this.logCallback({
                timestamp: new Date(),
                level,
                phase,
                message
            })
        }
        console.log(`[${level.toUpperCase()}] [${phase}] ${message}`)
    }
}
