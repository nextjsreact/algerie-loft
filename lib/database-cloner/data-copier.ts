/**
 * Data Copier
 * 
 * Handles copying data from source to target database
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SupabaseCredentials, CloneLog } from './types'

export interface CopyOptions {
    batchSize: number
    anonymizeData: boolean
    preserveTimestamps: boolean
}

export interface CopyResult {
    success: boolean
    tablesCopied: string[]
    recordsCopied: number
    duration: number
    errors: string[]
}

export class DataCopier {
    private logCallback?: (log: CloneLog) => void

    constructor(logCallback?: (log: CloneLog) => void) {
        this.logCallback = logCallback
    }

    /**
     * Copy all data from source to target
     */
    async copyAllData(
        sourceCredentials: SupabaseCredentials,
        targetCredentials: SupabaseCredentials,
        options: CopyOptions
    ): Promise<CopyResult> {
        const startTime = Date.now()
        const result: CopyResult = {
            success: false,
            tablesCopied: [],
            recordsCopied: 0,
            duration: 0,
            errors: []
        }

        this.log('info', 'Copying', 'Starting data copy operation')

        try {
            const sourceClient = createClient(sourceCredentials.url, sourceCredentials.serviceKey, {
                auth: { persistSession: false, autoRefreshToken: false }
            })
            const targetClient = createClient(targetCredentials.url, targetCredentials.serviceKey, {
                auth: { persistSession: false, autoRefreshToken: false }
            })

            // Get tables in dependency order
            const tables = this.getTablesInDependencyOrder()
            this.log('info', 'Copying', `Will copy ${tables.length} tables`)

            // Copy each table
            for (const table of tables) {
                try {
                    const count = await this.copyTable(
                        sourceClient,
                        targetClient,
                        table,
                        options
                    )
                    result.tablesCopied.push(table)
                    result.recordsCopied += count
                    this.log('success', 'Copying', `Copied ${count} records from ${table}`)
                } catch (error: any) {
                    const errorMsg = `Failed to copy table ${table}: ${error.message}`
                    result.errors.push(errorMsg)
                    this.log('error', 'Copying', errorMsg)
                }
            }

            result.success = result.errors.length === 0
            result.duration = Date.now() - startTime

            if (result.success) {
                this.log('success', 'Copying',
                    `✅ Copied ${result.recordsCopied} records from ${result.tablesCopied.length} tables`)
            }

        } catch (error: any) {
            result.errors.push(error.message)
            result.duration = Date.now() - startTime
            this.log('error', 'Copying', `Copy operation failed: ${error.message}`)
        }

        return result
    }

    /**
     * Copy a single table's data
     */
    private async copyTable(
        sourceClient: SupabaseClient,
        targetClient: SupabaseClient,
        tableName: string,
        options: CopyOptions
    ): Promise<number> {
        let totalRecords = 0
        let offset = 0

        while (true) {
            // Fetch batch from source
            const { data: records, error: fetchError } = await sourceClient
                .from(tableName)
                .select('*')
                .range(offset, offset + options.batchSize - 1)

            if (fetchError) {
                throw fetchError
            }

            if (!records || records.length === 0) {
                break // No more records
            }

            // Process records (anonymize if needed)
            const processedRecords = options.anonymizeData
                ? this.anonymizeRecords(records, tableName)
                : records

            // Insert batch into target
            const { error: insertError } = await targetClient
                .from(tableName)
                .insert(processedRecords)

            if (insertError) {
                throw insertError
            }

            totalRecords += records.length
            offset += options.batchSize

            this.log('info', 'Copying',
                `Copied ${totalRecords} records from ${tableName}...`)

            // If we got less than batch size, we're done
            if (records.length < options.batchSize) {
                break
            }
        }

        return totalRecords
    }

    /**
     * Get tables in correct dependency order for copying
     */
    private getTablesInDependencyOrder(): string[] {
        return [
            // Base tables (no dependencies)
            'profiles',
            'user_roles',
            'teams',
            'currencies',

            // Property tables
            'lofts',
            'loft_photos',

            // Transaction tables (depend on lofts and profiles)
            'payment_methods',
            'transactions',
            'bills',

            // Booking tables (depend on lofts and profiles)
            'reservations',

            // Communication tables
            'conversations',
            'conversation_messages',
            'notifications',

            // Audit (depends on everything)
            'audit_logs'
        ]
    }

    /**
     * Anonymize sensitive data in records
     */
    private anonymizeRecords(records: any[], tableName: string): any[] {
        if (tableName === 'profiles') {
            return records.map(record => ({
                ...record,
                email: this.anonymizeEmail(record.email),
                phone: this.anonymizePhone(record.phone),
                full_name: this.anonymizeName(record.full_name)
            }))
        }

        if (tableName === 'reservations') {
            return records.map(record => ({
                ...record,
                guest_name: this.anonymizeName(record.guest_name),
                guest_email: this.anonymizeEmail(record.guest_email),
                guest_phone: this.anonymizePhone(record.guest_phone)
            }))
        }

        return records
    }

    private anonymizeEmail(email: string | null): string | null {
        if (!email) return null
        const [, domain] = email.split('@')
        return `user_${Math.random().toString(36).substr(2, 9)}@${domain || 'example.com'}`
    }

    private anonymizePhone(phone: string | null): string | null {
        if (!phone) return null
        return '+33600000000'
    }

    private anonymizeName(name: string | null): string | null {
        if (!name) return null
        return `User ${Math.random().toString(36).substr(2, 9)}`
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
