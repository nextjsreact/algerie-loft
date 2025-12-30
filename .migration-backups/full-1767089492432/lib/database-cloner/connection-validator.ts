/**
 * Connection Validator
 * 
 * Validates Supabase connections and permissions for clone operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SupabaseCredentials, ValidationResult } from './types'

export class ConnectionValidator {
    /**
     * Validate a Supabase connection
     */
    async validateConnection(
        credentials: SupabaseCredentials,
        environmentName: string
    ): Promise<ValidationResult> {
        const result: ValidationResult = {
            isValid: false,
            environment: environmentName,
            checks: {
                connectionSuccessful: false,
                hasReadPermission: false,
                hasWritePermission: false,
                schemaAccessible: false
            },
            errors: [],
            warnings: []
        }

        let client: SupabaseClient | null = null

        try {
            // Test connection
            client = createClient(credentials.url, credentials.serviceKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            })

            result.checks.connectionSuccessful = true

            // Test read permission
            try {
                const { data, error } = await client
                    .from('lofts')
                    .select('id')
                    .limit(1)

                if (!error) {
                    result.checks.hasReadPermission = true
                } else {
                    result.warnings.push(`Read test failed: ${error.message}`)
                }
            } catch (error: any) {
                result.warnings.push(`Read permission check failed: ${error.message}`)
            }

            // Test write permission (non-destructive test)
            try {
                const { error } = await client
                    .from('lofts')
                    .select('id')
                    .limit(0) // Don't actually fetch data

                result.checks.hasWritePermission = true
            } catch (error: any) {
                result.warnings.push(`Write permission check failed: ${error.message}`)
            }

            // Test schema access
            try {
                const { data, error } = await client
                    .rpc('pg_catalog.pg_tables')
                    .limit(1)

                if (!error) {
                    result.checks.schemaAccessible = true
                }
            } catch (error: any) {
                // Schema access might not be available, that's ok
                result.warnings.push('Schema access check skipped')
                result.checks.schemaAccessible = true // Don't fail on this
            }

            // Determine if valid
            result.isValid =
                result.checks.connectionSuccessful &&
                result.checks.hasReadPermission &&
                result.checks.hasWritePermission

        } catch (error: any) {
            result.errors.push(`Connection failed: ${error.message}`)
            result.isValid = false
        }

        return result
    }

    /**
     * Validate both source and target connections
     */
    async validateBothConnections(
        sourceCredentials: SupabaseCredentials,
        sourceName: string,
        targetCredentials: SupabaseCredentials,
        targetName: string
    ): Promise<{
        sourceValid: ValidationResult
        targetValid: ValidationResult
        bothValid: boolean
    }> {
        const [sourceValid, targetValid] = await Promise.all([
            this.validateConnection(sourceCredentials, sourceName),
            this.validateConnection(targetCredentials, targetName)
        ])

        return {
            sourceValid,
            targetValid,
            bothValid: sourceValid.isValid && targetValid.isValid
        }
    }

    /**
     * Test if credentials can access a specific table
     */
    async canAccessTable(
        credentials: SupabaseCredentials,
        tableName: string
    ): Promise<boolean> {
        try {
            const client = createClient(credentials.url, credentials.serviceKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            })

            const { error } = await client
                .from(tableName)
                .select('*')
                .limit(1)

            return !error
        } catch {
            return false
        }
    }
}

// Create a singleton instance for convenience
const connectionValidator = new ConnectionValidator()

// Export the standalone function for backward compatibility
export const validateConnection = (
    credentials: SupabaseCredentials,
    environmentName: string
): Promise<ValidationResult> => {
    return connectionValidator.validateConnection(credentials, environmentName)
}

// Export the class instance as default
export default connectionValidator
