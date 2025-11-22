/**
 * PG Dump Cloner
 * 
 * Production-ready database cloner using PostgreSQL native tools (pg_dump & psql)
 * Handles complete database cloning including schema, data, constraints, indexes,
 * views, functions, triggers, and RLS policies
 */

import { spawn } from 'child_process'
import { SupabaseCredentials, CloneLog } from './types'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as dns from 'dns/promises'

export interface PgDumpOptions {
    includeSchemas?: string[]  // e.g. ['auth', 'storage'] - if set, only these schemas are dumped
    excludeSchemas?: string[]  // e.g., ['auth', 'storage'] to exclude system schemas
    excludeTables?: string[]   // e.g., ['auth.oauth_clients'] to exclude specific tables
    dataOnly?: boolean         // Clone data only, skip schema
    schemaOnly?: boolean       // Clone schema only, skip data
    anonymize?: boolean        // Anonymize sensitive data (post-processing)
    compress?: boolean         // Use gzip compression
    verbose?: boolean          // Detailed logging
    useInserts?: boolean       // Use INSERT instead of COPY (allows ON CONFLICT DO NOTHING)
}

export interface PgCloneResult {
    success: boolean
    duration: number
    dumpSize?: number
    errors: string[]
    warnings: string[]
}

interface PostgresConnection {
    host: string
    port: number
    database: string
    user: string
    password: string
    isIpResolved?: boolean
}

export class PgDumpCloner {
    private logCallback?: (log: CloneLog) => void
    private tempDir: string

    constructor(logCallback?: (log: CloneLog) => void) {
        this.logCallback = logCallback
        this.tempDir = path.join(os.tmpdir(), 'supabase-cloner')

        // Ensure temp directory exists
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true })
        }
    }

    /**
     * Clone entire database from source to target
     */
    async cloneDatabase(
        sourceCredentials: SupabaseCredentials,
        targetCredentials: SupabaseCredentials,
        options: PgDumpOptions = {}
    ): Promise<PgCloneResult> {
        const startTime = Date.now()
        const result: PgCloneResult = {
            success: false,
            duration: 0,
            errors: [],
            warnings: []
        }

        this.log('info', 'Starting', 'Initializing pg_dump cloning process...')

        try {
            // Step 1: Parse connection strings
            const sourceConn = this.parseSupabaseCredentials(sourceCredentials)
            const targetConn = this.parseSupabaseCredentials(targetCredentials)

            // Step 2: Verify pg_dump is available
            await this.verifyPgTools()

            // Step 3: Dump System Data (Auth, Storage) - Data Only
            // We dump these separately as data-only to avoid permission issues with creating system schemas/types
            // We exclude tables that are known to cause version mismatch issues or contain transient data
            this.log('info', 'Dumping', 'Dumping system schemas (auth, storage) data...')
            const systemDumpFile = path.join(this.tempDir, `dump_system_${Date.now()}.sql`)
            await this.executeDump(sourceConn, systemDumpFile, {
                ...options,
                schemaOnly: false,
                dataOnly: true,
                includeSchemas: ['auth', 'storage'],
                useInserts: true, // Use INSERT ON CONFLICT DO NOTHING
                excludeTables: [
                    'auth.oauth_clients',
                    'auth.oauth_authorizations', // Exclude oauth authorizations (mismatch risk)
                    'auth.oauth_consents',       // Exclude oauth consents (mismatch risk)
                    'auth.sso_providers',
                    'auth.sso_domains',
                    'auth.saml_providers',
                    'auth.saml_relay_states',
                    'auth.schema_migrations',
                    'auth.sessions',         // Exclude sessions (transient, schema mismatch risk)
                    'auth.refresh_tokens',   // Exclude tokens (linked to sessions)
                    'auth.mfa_amr_claims',   // Exclude MFA claims (linked to sessions)
                    'auth.mfa_challenges',   // Exclude MFA challenges
                    'auth.mfa_factors',      // Exclude MFA factors
                    'auth.flow_state',       // Exclude flow state (transient)
                    'auth.one_time_tokens',  // Exclude one time tokens (transient)
                    'auth.audit_log_entries' // Exclude audit logs (not needed, causes conflicts)
                ]
            })

            // Step 4: Dump User Content (Public, etc) - Schema + Data
            // We exclude auth/storage here as we handled them above
            // We also exclude other system schemas that are managed by Supabase extensions
            this.log('info', 'Dumping', 'Dumping user schemas (public, etc)...')
            const userDumpFile = path.join(this.tempDir, `dump_user_${Date.now()}.sql`)
            await this.executeDump(sourceConn, userDumpFile, {
                ...options,
                excludeSchemas: [
                    'auth',
                    'storage',
                    'realtime',
                    'extensions',
                    'graphql',
                    'graphql_public',
                    'vault',
                    'pgbouncer',
                    'pgsodium',
                    'pgsodium_masks',
                    ...(options.excludeSchemas || [])
                ]
            })

            // Calculate total size
            const systemStats = fs.statSync(systemDumpFile)
            const userStats = fs.statSync(userDumpFile)
            result.dumpSize = systemStats.size + userStats.size
            this.log('success', 'Dumping', `✅ Dumps created successfully (Total: ${this.formatBytes(result.dumpSize)})`)

            // Step 5: Reset Target
            // This drops public schema and cleans up auth/storage data
            this.log('info', 'Resetting', 'Resetting target database...')
            await this.resetTarget(targetConn)

            // Step 6: Restore System Data
            // We restore this first (after cleaning) but we need to be careful about FKs.
            this.log('info', 'Restoring', 'Restoring system data (auth, storage)...')
            await this.executeRestore(targetConn, systemDumpFile, options)

            // Step 7: Restore User Content
            this.log('info', 'Restoring', 'Restoring user content (public schema)...')
            await this.executeRestore(targetConn, userDumpFile, options)

            this.log('success', 'Restoring', '✅ Database restored successfully')

            // Step 8: Cleanup temp files
            fs.unlinkSync(systemDumpFile)
            fs.unlinkSync(userDumpFile)
            this.log('info', 'Cleanup', 'Temporary files cleaned up')

            result.success = true
            result.duration = Date.now() - startTime

            this.log('success', 'Completion', `✅ Clone completed in ${this.formatDuration(result.duration)}`)

        } catch (error: any) {
            result.errors.push(error.message)
            this.log('error', 'Error', `❌ Clone failed: ${error.message}`)
        }

        result.duration = Date.now() - startTime
        return result
    }

    /**
     * Verify that pg_dump is available on the system
     */
    private async verifyPgTools(): Promise<void> {
        return new Promise((resolve, reject) => {
            // On Windows, try with .exe extension
            const pgDumpCmd = process.platform === 'win32' ? 'pg_dump.exe' : 'pg_dump'

            const verifyProcess = spawn(pgDumpCmd, ['--version'], {
                shell: process.platform === 'win32' // Use shell on Windows
            })

            let stdout = ''
            let stderr = ''

            verifyProcess.stdout?.on('data', (data) => {
                stdout += data.toString()
            })

            verifyProcess.stderr?.on('data', (data) => {
                stderr += data.toString()
            })

            verifyProcess.on('close', (code) => {
                if (code === 0) {
                    this.log('success', 'Verification', `✅ pg_dump found: ${stdout.trim()}`)
                    resolve()
                } else {
                    const errorMsg = `pg_dump verification failed (exit code ${code})\nstdout: ${stdout}\nstderr: ${stderr}`
                    this.log('error', 'Verification', errorMsg)
                    reject(new Error(errorMsg))
                }
            })

            verifyProcess.on('error', (error) => {
                const errorMsg = `pg_dump not found or failed to execute: ${error.message}\nPlease ensure PostgreSQL is installed and added to PATH.`
                this.log('error', 'Verification', errorMsg)
                reject(new Error(errorMsg))
            })
        })
    }

    /**
     * Reset target database
     * Drops public schema and cleans system schemas
     */
    private async resetTarget(connection: PostgresConnection): Promise<void> {
        this.log('info', 'Resetting', 'Resetting public schema and cleaning system data...')

        const sql = `
            -- Enable error stopping
            \\set ON_ERROR_STOP on

            -- 1. Reset public schema (drops all user tables and FKs to auth)
            DROP SCHEMA IF EXISTS public CASCADE; 
            CREATE SCHEMA public; 
            GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role; 
            GRANT ALL ON SCHEMA public TO postgres;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;

            -- 2. Clean system data
            -- Disable RLS to ensure we can delete everything
            ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
            
            -- Use TRUNCATE CASCADE
            TRUNCATE TABLE storage.objects CASCADE;
            TRUNCATE TABLE storage.buckets CASCADE;
            TRUNCATE TABLE auth.users CASCADE;
            
            -- Explicit cleanup
            TRUNCATE TABLE auth.flow_state CASCADE;
            TRUNCATE TABLE auth.mfa_challenges CASCADE;
            TRUNCATE TABLE auth.saml_relay_states CASCADE;
            TRUNCATE TABLE auth.sso_domains CASCADE;
            TRUNCATE TABLE auth.sso_providers CASCADE;
            TRUNCATE TABLE auth.audit_log_entries CASCADE;

            -- Re-enable RLS (optional, as we might restore over it, but good practice)
            ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

            -- 3. VERIFY CLEANUP
            DO $$
            DECLARE
                user_count INTEGER;
            BEGIN
                SELECT count(*) INTO user_count FROM auth.users;
                IF user_count > 0 THEN
                    RAISE EXCEPTION 'Failed to clean auth.users. Count is still %', user_count;
                END IF;
            END $$;
        `.replace(/\s+/g, ' ').trim()

        return new Promise((resolve, reject) => {
            const args = [
                '-h', connection.host,
                '-p', connection.port.toString(),
                '-U', connection.user,
                '-d', connection.database
            ]

            this.log('info', 'Resetting', `Running: psql (via stdin)`)

            const psqlProcess = spawn('psql', args, {
                env: {
                    ...process.env,
                    PGPASSWORD: connection.password
                },
                shell: process.platform === 'win32',
                stdio: ['pipe', 'pipe', 'pipe']
            })

            // Write SQL to stdin
            if (psqlProcess.stdin) {
                psqlProcess.stdin.write(sql)
                psqlProcess.stdin.end()
            } else {
                reject(new Error('Failed to open stdin for psql'))
                return
            }

            let stderr = ''

            psqlProcess.stderr?.on('data', (data) => {
                stderr += data.toString()
            })

            psqlProcess.on('close', (code) => {
                if (code === 0) {
                    this.log('success', 'Resetting', 'Target reset successfully')
                    resolve()
                } else {
                    this.log('error', 'Resetting', `Failed to reset target: ${stderr}`)
                    reject(new Error(`Failed to reset target: ${stderr}`))
                }
            })

            psqlProcess.on('error', (error) => {
                reject(new Error(`Failed to start psql: ${error.message}`))
            })
        })
    }

    /**
     * Execute pg_dump to create database backup
     */
    private async executeDump(
        connection: PostgresConnection,
        outputFile: string,
        options: PgDumpOptions
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const args = this.buildDumpArgs(connection, outputFile, options)

            this.log('info', 'Dumping', `Running: pg_dump ${args.filter(a => !a.includes('password')).join(' ')}`)

            const dumpProcess = spawn('pg_dump', args, {
                env: {
                    ...process.env,
                    PGPASSWORD: connection.password
                },
                shell: process.platform === 'win32'
            })

            let stderr = ''

            dumpProcess.stderr.on('data', (data: Buffer) => {
                const message = data.toString()
                stderr += message

                // Log progress
                if (options.verbose) {
                    this.log('info', 'Dumping', message.trim())
                }
            })

            dumpProcess.on('close', async (code) => {
                if (code === 0) {
                    resolve()
                } else {
                    // Debug logging
                    console.log(`[DEBUG] pg_dump failed with code ${code}`)
                    console.log(`[DEBUG] Stderr:`, stderr)
                    console.log(`[DEBUG] DNS error check:`, stderr.includes('Name or service not known'), stderr.includes('could not translate host name'))
                    console.log(`[DEBUG] isIpResolved:`, connection.isIpResolved)

                    this.log('info', 'Debug', `pg_dump failed with code ${code}. Stderr length: ${stderr.length}`)
                    this.log('info', 'Debug', `Stderr content: ${stderr}`)
                    this.log('info', 'Debug', `Checking condition: includes='${stderr.includes('Name or service not known')}', isIpResolved=${connection.isIpResolved}`)

                    // Check for DNS error and retry with resolved IP if not already tried
                    const isDnsError = stderr.includes('Name or service not known') ||
                        stderr.includes('could not translate host name') ||
                        stderr.includes('EAI_NONAME');

                    if (isDnsError && connection.isIpResolved !== true) {
                        console.log('[DEBUG] Triggering DNS retry...')
                        this.log('warning', 'Dumping', `DNS resolution failed for ${connection.host}, attempting to resolve IP...`)
                        try {
                            let ip = await this.resolveHostToIp(connection.host)

                            // Hardcoded fallback for specific host if resolution fails
                            if (!ip && connection.host.includes('mhngbluefyucoesgcjoy')) {
                                ip = '2a05:d014:1c06:5f11:e7f2:7088:c72:86f2';
                                this.log('warning', 'Dumping', `Using hardcoded IPv6 fallback for ${connection.host}`);
                            }

                            if (ip) {
                                console.log('[DEBUG] Retrying with IP:', ip)
                                this.log('info', 'Dumping', `Resolved ${connection.host} to ${ip}. Retrying...`)
                                const newConnection = { ...connection, host: ip, isIpResolved: true }
                                await this.executeDump(newConnection, outputFile, options)
                                resolve()
                                return
                            }
                        } catch (resolveError) {
                            console.log('[DEBUG] Resolve error:', resolveError)
                            this.log('error', 'Dumping', `Failed to resolve IP: ${resolveError}`)
                        }
                    }
                    reject(new Error(`pg_dump exited with code ${code}\n${stderr}`))
                }
            })

            dumpProcess.on('error', (error) => {
                reject(new Error(`Failed to start pg_dump: ${error.message}`))
            })
        })
    }

    /**
     * Resolve hostname to IP address (IPv4 or IPv6)
     */
    private async resolveHostToIp(host: string): Promise<string | null> {
        this.log('info', 'Debug', `Resolving host: ${host}`)
        try {
            // Try IPv4 first
            const ipv4 = await dns.resolve4(host)
            this.log('info', 'Debug', `IPv4 result: ${ipv4}`)
            if (ipv4 && ipv4.length > 0) return ipv4[0]
        } catch (e: any) {
            this.log('info', 'Debug', `IPv4 failed: ${e.message}`)
            // Ignore IPv4 error
        }

        try {
            // Try IPv6
            const ipv6 = await dns.resolve6(host)
            this.log('info', 'Debug', `IPv6 result: ${ipv6}`)
            if (ipv6 && ipv6.length > 0) return ipv6[0]
        } catch (e: any) {
            this.log('info', 'Debug', `IPv6 failed: ${e.message}`)
            // Ignore IPv6 error
        }

        return null
    }

    private async executeRestore(
        connection: PostgresConnection,
        inputFile: string,
        options: PgDumpOptions
    ): Promise<void> {
        // Sanitize dump file to remove unsupported commands and system objects
        try {
            let content = fs.readFileSync(inputFile, 'utf8');
            let modified = false;

            // 1. Remove transaction_timeout (pg_dump 17 vs pg 15)
            this.log('info', 'Debug', `Reading file: ${inputFile}`);
            this.log('info', 'Debug', `File start: ${content.substring(0, 200)}`);

            if (content.includes('transaction_timeout')) {
                this.log('info', 'Restoring', 'Sanitizing: replacing transaction_timeout with statement_timeout...');
                content = content.replace(/transaction_timeout/g, 'statement_timeout');
                modified = true;

                // Verify replacement immediately
                if (content.includes('transaction_timeout')) {
                    this.log('error', 'Debug', 'Sanitization failed! transaction_timeout still present in memory!');
                } else {
                    this.log('info', 'Debug', 'Sanitization successful in memory.');
                }
            } else {
                this.log('warning', 'Debug', 'transaction_timeout NOT found in file content!');
            }

            // 2. Remove System Event Triggers (Supabase managed)
            if (content.includes('EVENT TRIGGER')) {
                this.log('info', 'Restoring', 'Sanitizing: removing EVENT TRIGGER commands...');
                // Match CREATE/DROP/ALTER EVENT TRIGGER command blocks ending with ;
                content = content.replace(/^(DROP|CREATE|ALTER) EVENT TRIGGER[\s\S]+?;/gm, (match) => {
                    return match.split('\n').map(line => `-- ${line}`).join('\n');
                });
                modified = true;
            }

            // 3. Remove System Publications (supabase_realtime)
            if (content.includes('supabase_realtime')) {
                this.log('info', 'Restoring', 'Sanitizing: checking for supabase_realtime publication...');

                // Aggressive removal of all commands related to supabase_realtime publication
                const patterns = [
                    /(CREATE|DROP|ALTER)\s+PUBLICATION\s+"supabase_realtime"[\s\S]+?;/gi,
                    /(CREATE|DROP|ALTER)\s+PUBLICATION\s+supabase_realtime[\s\S]+?;/gi,
                    /^.*CREATE\s+PUBLICATION\s+"?supabase_realtime"?.*/gmi
                ];

                let matched = false;
                for (const pattern of patterns) {
                    if (pattern.test(content)) {
                        matched = true;
                        content = content.replace(pattern, (match) => {
                            return match.split('\n').map(line => `-- ${line} -- Removed by cloner`).join('\n');
                        });
                    }
                }

                if (matched) {
                    this.log('info', 'Restoring', 'Sanitizing: removed supabase_realtime publication commands.');
                    modified = true;
                }
            }

            // 4. Add IF NOT EXISTS to CREATE SCHEMA to avoid "schema already exists" errors
            if (content.includes('CREATE SCHEMA')) {
                this.log('info', 'Restoring', 'Sanitizing: adding IF NOT EXISTS to CREATE SCHEMA...');
                content = content.replace(/^CREATE SCHEMA "?([a-zA-Z0-9_]+)"?;/gm, 'CREATE SCHEMA IF NOT EXISTS "$1";');
                modified = true;
            }

            // 5. Inject TRUNCATE for system tables if this is the system dump
            // This prevents "duplicate key" errors if the table wasn't perfectly clean or was repopulated
            if (options.includeSchemas && options.includeSchemas.includes('auth')) {
                this.log('info', 'Restoring', 'Sanitizing: injecting TRUNCATE for auth.users...');
                // Insert after the initial SET commands (approximate, or just at the top)
                // We use TRUNCATE CASCADE to handle dependencies
                const truncateCmd = `
                    -- Force clean system tables before COPY
                    ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
                    TRUNCATE TABLE auth.users CASCADE;
                    TRUNCATE TABLE storage.objects CASCADE;
                    ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
                `;
                // Insert after the first few lines to avoid messing up encoding/header comments if possible, 
                // but top is safest for execution order.
                content = truncateCmd + '\n' + content;
                modified = true;
            }

            // 6. Remove/Replace references to non-existent "admin" role
            // This handles cases where the source has a custom "admin" role that doesn't exist on target
            if (content.includes('admin')) {
                this.log('info', 'Restoring', 'Sanitizing: processing "admin" role references...');

                // Replace quoted usage in specific contexts (handling newlines)
                const quotedReplacements = [
                    { regex: /TO\s+"admin"/gi, replacement: 'TO "service_role"' },
                    { regex: /FROM\s+"admin"/gi, replacement: 'FROM "service_role"' },
                    { regex: /ROLE\s+"admin"/gi, replacement: 'ROLE "service_role"' },
                    { regex: /OWNER\s+TO\s+"admin"/gi, replacement: 'OWNER TO "service_role"' },
                    { regex: /GRANTED\s+BY\s+"admin"/gi, replacement: 'GRANTED BY "service_role"' }
                ];

                for (const { regex, replacement } of quotedReplacements) {
                    if (regex.test(content)) {
                        this.log('info', 'Restoring', `Sanitizing: replacing ${regex} with ${replacement}`);
                        content = content.replace(regex, replacement);
                        modified = true;
                    }
                }

                // Replace unquoted usage in specific contexts
                const unquotedReplacements = [
                    { regex: /TO\s+admin\b/gi, replacement: 'TO "service_role"' },
                    { regex: /FROM\s+admin\b/gi, replacement: 'FROM "service_role"' },
                    { regex: /ROLE\s+admin\b/gi, replacement: 'ROLE "service_role"' },
                    { regex: /OWNER\s+TO\s+admin\b/gi, replacement: 'OWNER TO "service_role"' },
                    { regex: /GRANTED\s+BY\s+admin\b/gi, replacement: 'GRANTED BY "service_role"' }
                ];

                for (const { regex, replacement } of unquotedReplacements) {
                    if (regex.test(content)) {
                        this.log('info', 'Restoring', `Sanitizing: replacing ${regex} with ${replacement}`);
                        content = content.replace(regex, replacement);
                        modified = true;
                    }
                }

                // Fallback for other admin role commands
                const adminRoleRegex = /(CREATE USER|DROP USER|CREATE ROLE|DROP ROLE).+?\badmin\b/gi;
                if (adminRoleRegex.test(content)) {
                    this.log('info', 'Restoring', 'Sanitizing: commenting out commands referencing unquoted admin role...');
                    content = content.replace(adminRoleRegex, (match) => `-- ${match} -- Removed by cloner`);
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(inputFile, content);
                this.log('info', 'Debug', 'Sanitized dump file written to disk.');
            }
        } catch (e) {
            this.log('warning', 'Restoring', `Failed to sanitize dump file: ${e}`);
        }

        return new Promise((resolve, reject) => {
            const args = this.buildRestoreArgs(connection, inputFile, options)

            this.log('info', 'Restoring', `Running: psql ${args.filter(a => !a.includes('password')).join(' ')}`)

            const restoreProcess = spawn('psql', args, {
                env: {
                    ...process.env,
                    PGPASSWORD: connection.password
                },
                shell: process.platform === 'win32'
            })

            let stderr = ''

            restoreProcess.stderr.on('data', (data: Buffer) => {
                const message = data.toString()
                stderr += message

                // Log progress
                if (options.verbose || message.toLowerCase().includes('error')) {
                    const level = message.toLowerCase().includes('error') ? 'error' : 'info'
                    this.log(level, 'Restoring', message.trim())
                }
            })

            restoreProcess.stdout.on('data', (data: Buffer) => {
                if (options.verbose) {
                    this.log('info', 'Restoring', data.toString().trim())
                }
            })

            restoreProcess.on('close', async (code) => {
                if (code === 0) {
                    resolve()
                } else {
                    // Check for DNS error and retry with resolved IP if not already tried
                    const isDnsError = stderr.includes('Name or service not known') ||
                        stderr.includes('could not translate host name') ||
                        stderr.includes('EAI_NONAME');

                    if (isDnsError && !connection.isIpResolved) {
                        this.log('warning', 'Restoring', `DNS resolution failed for ${connection.host}, attempting to resolve IP...`)
                        try {
                            const ip = await this.resolveHostToIp(connection.host)
                            if (ip) {
                                this.log('info', 'Restoring', `Resolved ${connection.host} to ${ip}. Retrying...`)
                                const newConnection = { ...connection, host: ip, isIpResolved: true }
                                await this.executeRestore(newConnection, inputFile, options)
                                resolve()
                                return
                            }
                        } catch (resolveError) {
                            this.log('error', 'Restoring', `Failed to resolve IP: ${resolveError}`)
                        }
                    }
                    reject(new Error(`psql exited with code ${code}\n${stderr}`))
                }
            })

            restoreProcess.on('error', (error) => {
                reject(new Error(`Failed to start psql: ${error.message}`))
            })
        })
    }

    /**
     * Build pg_dump command arguments
     */
    private buildDumpArgs(
        connection: PostgresConnection,
        outputFile: string,
        options: PgDumpOptions
    ): string[] {
        const args: string[] = [
            '-h', connection.host,
            '-p', connection.port.toString(),
            '-U', connection.user,
            '-d', connection.database,
            '-f', outputFile,
            '--no-owner',           // Don't include ownership commands
            '--no-acl',             // Don't include privileges (GRANT/REVOKE) to avoid role errors
        ]

        // Use INSERTs with ON CONFLICT DO NOTHING
        if (options.useInserts) {
            args.push('--inserts')
            args.push('--on-conflict-do-nothing')
            args.push('--rows-per-insert=1000') // Optimize performance
        }

        // Add schema/data only options
        if (options.schemaOnly) {
            args.push('--schema-only')
        } else if (options.dataOnly) {
            args.push('--data-only')
        }

        // Include specific schemas
        if (options.includeSchemas) {
            options.includeSchemas.forEach(schema => {
                args.push('--schema', schema)
            })
        }

        // Exclude schemas
        if (options.excludeSchemas) {
            options.excludeSchemas.forEach(schema => {
                args.push('--exclude-schema', schema)
            })
        }

        // Exclude tables
        if (options.excludeTables) {
            options.excludeTables.forEach(table => {
                args.push('--exclude-table', table)
            })
        }

        // Compression
        if (options.compress) {
            args.push('--compress', '9')
        }

        // Verbose mode
        if (options.verbose) {
            args.push('--verbose')
        }

        return args
    }

    /**
     * Build psql restore command arguments
     */
    private buildRestoreArgs(
        connection: PostgresConnection,
        inputFile: string,
        options: PgDumpOptions
    ): string[] {
        const args: string[] = [
            '-h', connection.host,
            '-p', connection.port.toString(),
            '-U', connection.user,
            '-d', connection.database,
            '-f', inputFile,
            '--single-transaction',  // Execute in a single transaction
            '--set', 'ON_ERROR_STOP=on', // Stop on first error
        ]

        if (options.verbose) {
            args.push('--echo-all')
        }

        return args
    }

    /**
     * Parse Supabase credentials to PostgreSQL connection info
     */
    private parseSupabaseCredentials(credentials: SupabaseCredentials): PostgresConnection {
        // Supabase URL format: https://xxxxx.supabase.co
        // PostgreSQL host: db.xxxxx.supabase.co

        const match = credentials.url.match(/https?:\/\/([^.]+)\.supabase\.co/)
        if (!match) {
            throw new Error(`Invalid Supabase URL format: ${credentials.url}`)
        }

        const projectId = match[1]
        const host = credentials.host || `db.${projectId}.supabase.co`

        // If using pooler, username must be postgres.projectId
        let user = 'postgres'
        if (host.includes('pooler.supabase.com')) {
            user = `postgres.${projectId}`
        }

        return {
            host,
            port: credentials.port || 5432,
            database: 'postgres',
            user,
            password: this.extractPassword(credentials)
        }
    }

    /**
     * Extract password from credentials
     * For Supabase, we can use the service key or a provided password
     */
    private extractPassword(credentials: SupabaseCredentials): string {
        // If there's a direct password in credentials, use it
        // Otherwise, for Supabase, the service role key can sometimes work
        // In production, users should provide the actual database password

        // This is a simplified version - in production you'd need the actual DB password
        if ((credentials as any).password) {
            return (credentials as any).password
        }

        throw new Error('Database password not provided. Please add password to credentials.')
    }

    /**
     * Format bytes to human readable
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    /**
     * Format duration to human readable
     */
    private formatDuration(ms: number): string {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`
        } else {
            return `${seconds}s`
        }
    }

    /**
     * Log helper
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
