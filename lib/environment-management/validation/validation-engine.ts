/**
 * Environment Validation Engine
 * 
 * Comprehensive validation system for environment health, connectivity,
 * schema validation, data integrity, and audit system validation.
 * 
 * Requirements: 6.1, 6.2, 8.4
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Environment, EnvironmentValidationResult, EnvironmentType } from '../types'
import { ProductionSafetyGuard } from '../production-safety-guard'

export interface DatabaseConnectivityResult {
  connected: boolean
  responseTime: number
  version?: string
  error?: string
}

export interface SchemaValidationResult {
  isValid: boolean
  tablesFound: number
  expectedTables: string[]
  missingTables: string[]
  extraTables: string[]
  functionsFound: number
  triggersFound: number
  policiesFound: number
  errors: string[]
}

export interface DataIntegrityResult {
  isValid: boolean
  totalRecords: number
  orphanedRecords: number
  duplicateRecords: number
  nullConstraintViolations: number
  foreignKeyViolations: number
  errors: string[]
  warnings: string[]
}

export interface AuditSystemValidationResult {
  isValid: boolean
  auditTablesPresent: boolean
  auditTriggersActive: boolean
  auditFunctionsWorking: boolean
  auditLogsRecent: boolean
  errors: string[]
}

export interface ValidationEngineResult {
  isValid: boolean
  connectivity: DatabaseConnectivityResult
  schema: SchemaValidationResult
  dataIntegrity: DataIntegrityResult
  auditSystem: AuditSystemValidationResult
  overallScore: number // 0-100
  timestamp: Date
}

export class ValidationEngine {
  private safetyGuard: ProductionSafetyGuard
  private expectedTables: string[] = [
    // Core tables
    'users', 'profiles', 'teams', 'team_members',
    'lofts', 'loft_photos', 'owners',
    'reservations', 'availability_calendar',
    'transactions', 'transaction_reference_amounts',
    'tasks', 'task_assignments',
    'notifications', 'notification_preferences',
    'conversations', 'conversation_participants', 'messages',
    // Audit tables
    'audit_logs', 'audit_user_context',
    // System tables
    'payment_methods', 'currencies', 'zone_areas'
  ]

  constructor() {
    this.safetyGuard = ProductionSafetyGuard.getInstance()
  }

  /**
   * Comprehensive environment validation
   */
  public async validateEnvironment(env: Environment): Promise<ValidationEngineResult> {
    const startTime = Date.now()

    // Ensure production safety
    await this.safetyGuard.validateEnvironmentAccess(env, 'validation')

    const connectivity = await this.validateDatabaseConnectivity(env)
    const schema = connectivity.connected ? await this.validateSchema(env) : this.getEmptySchemaResult()
    const dataIntegrity = connectivity.connected ? await this.validateDataIntegrity(env) : this.getEmptyDataIntegrityResult()
    const auditSystem = connectivity.connected ? await this.validateAuditSystem(env) : this.getEmptyAuditResult()

    const overallScore = this.calculateOverallScore(connectivity, schema, dataIntegrity, auditSystem)

    return {
      isValid: connectivity.connected && schema.isValid && dataIntegrity.isValid && auditSystem.isValid,
      connectivity,
      schema,
      dataIntegrity,
      auditSystem,
      overallScore,
      timestamp: new Date()
    }
  }

  /**
   * Validate database connectivity and basic health
   */
  public async validateDatabaseConnectivity(env: Environment): Promise<DatabaseConnectivityResult> {
    const startTime = Date.now()

    try {
      // Create read-only client for safety
      const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey)

      // Test basic connectivity with a simple query
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
        throw error
      }

      const responseTime = Date.now() - startTime

      // Try to get database version
      let version: string | undefined
      try {
        const { data: versionData } = await supabase.rpc('version')
        version = versionData
      } catch {
        // Version query failed, but connection works
      }

      return {
        connected: true,
        responseTime,
        version
      }
    } catch (error) {
      return {
        connected: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown connection error'
      }
    }
  }

  /**
   * Validate database schema completeness
   */
  public async validateSchema(env: Environment): Promise<SchemaValidationResult> {
    try {
      const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey)

      // Get all tables
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_table_names')
        .select()

      if (tablesError) {
        // Fallback: try to query information_schema
        const { data: schemaData, error: schemaError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')

        if (schemaError) {
          return {
            isValid: false,
            tablesFound: 0,
            expectedTables: this.expectedTables,
            missingTables: this.expectedTables,
            extraTables: [],
            functionsFound: 0,
            triggersFound: 0,
            policiesFound: 0,
            errors: [`Failed to query schema: ${schemaError.message}`]
          }
        }

        const foundTables = schemaData?.map(t => t.table_name) || []
        return this.analyzeSchemaResults(foundTables, [], [], [])
      }

      const foundTables = tables?.map(t => t.table_name) || []

      // Get functions
      const { data: functions } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_schema', 'public')

      // Get triggers
      const { data: triggers } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name')
        .eq('trigger_schema', 'public')

      // Get RLS policies
      const { data: policies } = await supabase
        .from('pg_policies')
        .select('policyname')

      return this.analyzeSchemaResults(
        foundTables,
        functions?.map(f => f.routine_name) || [],
        triggers?.map(t => t.trigger_name) || [],
        policies?.map(p => p.policyname) || []
      )
    } catch (error) {
      return {
        isValid: false,
        tablesFound: 0,
        expectedTables: this.expectedTables,
        missingTables: this.expectedTables,
        extraTables: [],
        functionsFound: 0,
        triggersFound: 0,
        policiesFound: 0,
        errors: [`Schema validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Validate data integrity and consistency
   */
  public async validateDataIntegrity(env: Environment): Promise<DataIntegrityResult> {
    try {
      const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey)
      const errors: string[] = []
      const warnings: string[] = []

      let totalRecords = 0
      let orphanedRecords = 0
      let duplicateRecords = 0
      let nullConstraintViolations = 0
      let foreignKeyViolations = 0

      // Count total records across main tables
      for (const table of ['users', 'lofts', 'reservations', 'transactions', 'tasks']) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

          if (error) {
            warnings.push(`Could not count records in ${table}: ${error.message}`)
          } else {
            totalRecords += count || 0
          }
        } catch (error) {
          warnings.push(`Error counting ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Check for orphaned records (example: reservations without lofts)
      try {
        const { data: orphanedReservations, error } = await supabase
          .from('reservations')
          .select('id')
          .not('loft_id', 'in', `(SELECT id FROM lofts)`)

        if (error) {
          warnings.push(`Could not check orphaned reservations: ${error.message}`)
        } else {
          orphanedRecords += orphanedReservations?.length || 0
        }
      } catch (error) {
        warnings.push(`Error checking orphaned reservations: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Check for duplicate users (by email)
      try {
        const { data: duplicateUsers, error } = await supabase
          .rpc('find_duplicate_emails')

        if (error) {
          warnings.push(`Could not check duplicate users: ${error.message}`)
        } else {
          duplicateRecords += duplicateUsers?.length || 0
        }
      } catch (error) {
        // This is expected if the function doesn't exist
        warnings.push('Duplicate email check function not available')
      }

      // Check for null constraint violations in critical fields
      const criticalFields = [
        { table: 'users', field: 'email' },
        { table: 'lofts', field: 'name' },
        { table: 'reservations', field: 'loft_id' },
        { table: 'transactions', field: 'amount' }
      ]

      for (const { table, field } of criticalFields) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .is(field, null)

          if (error) {
            warnings.push(`Could not check null values in ${table}.${field}: ${error.message}`)
          } else {
            nullConstraintViolations += count || 0
          }
        } catch (error) {
          warnings.push(`Error checking null values in ${table}.${field}`)
        }
      }

      const isValid = errors.length === 0 && orphanedRecords === 0 && nullConstraintViolations === 0

      return {
        isValid,
        totalRecords,
        orphanedRecords,
        duplicateRecords,
        nullConstraintViolations,
        foreignKeyViolations,
        errors,
        warnings
      }
    } catch (error) {
      return {
        isValid: false,
        totalRecords: 0,
        orphanedRecords: 0,
        duplicateRecords: 0,
        nullConstraintViolations: 0,
        foreignKeyViolations: 0,
        errors: [`Data integrity validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      }
    }
  }

  /**
   * Validate audit system functionality
   */
  public async validateAuditSystem(env: Environment): Promise<AuditSystemValidationResult> {
    try {
      const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey)
      const errors: string[] = []

      // Check if audit tables exist
      const { data: auditTables, error: auditTablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', 'audit%')

      const auditTablesPresent = !auditTablesError && (auditTables?.length || 0) > 0

      if (!auditTablesPresent) {
        errors.push('Audit tables not found')
      }

      // Check if audit triggers are active
      const { data: auditTriggers, error: auditTriggersError } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name')
        .eq('trigger_schema', 'public')
        .like('trigger_name', '%audit%')

      const auditTriggersActive = !auditTriggersError && (auditTriggers?.length || 0) > 0

      if (!auditTriggersActive) {
        errors.push('Audit triggers not found or inactive')
      }

      // Check if audit functions exist
      const { data: auditFunctions, error: auditFunctionsError } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_schema', 'public')
        .like('routine_name', '%audit%')

      const auditFunctionsWorking = !auditFunctionsError && (auditFunctions?.length || 0) > 0

      if (!auditFunctionsWorking) {
        errors.push('Audit functions not found')
      }

      // Check if there are recent audit logs
      let auditLogsRecent = false
      if (auditTablesPresent) {
        try {
          const { data: recentLogs, error: logsError } = await supabase
            .from('audit_logs')
            .select('id')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
            .limit(1)

          auditLogsRecent = !logsError && (recentLogs?.length || 0) > 0
        } catch (error) {
          errors.push('Could not check recent audit logs')
        }
      }

      const isValid = auditTablesPresent && auditTriggersActive && auditFunctionsWorking

      return {
        isValid,
        auditTablesPresent,
        auditTriggersActive,
        auditFunctionsWorking,
        auditLogsRecent,
        errors
      }
    } catch (error) {
      return {
        isValid: false,
        auditTablesPresent: false,
        auditTriggersActive: false,
        auditFunctionsWorking: false,
        auditLogsRecent: false,
        errors: [`Audit system validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Calculate overall validation score
   */
  private calculateOverallScore(
    connectivity: DatabaseConnectivityResult,
    schema: SchemaValidationResult,
    dataIntegrity: DataIntegrityResult,
    auditSystem: AuditSystemValidationResult
  ): number {
    let score = 0

    // Connectivity (25 points)
    if (connectivity.connected) {
      score += 25
      // Bonus for good response time
      if (connectivity.responseTime < 1000) score += 5
      if (connectivity.responseTime < 500) score += 5
    }

    // Schema (30 points)
    if (schema.isValid) {
      score += 30
    } else {
      // Partial credit based on found tables
      const foundRatio = schema.tablesFound / this.expectedTables.length
      score += Math.floor(foundRatio * 30)
    }

    // Data Integrity (25 points)
    if (dataIntegrity.isValid) {
      score += 25
    } else {
      // Deduct points for issues
      if (dataIntegrity.orphanedRecords === 0) score += 8
      if (dataIntegrity.nullConstraintViolations === 0) score += 8
      if (dataIntegrity.foreignKeyViolations === 0) score += 9
    }

    // Audit System (20 points)
    if (auditSystem.isValid) {
      score += 20
    } else {
      // Partial credit
      if (auditSystem.auditTablesPresent) score += 7
      if (auditSystem.auditTriggersActive) score += 7
      if (auditSystem.auditFunctionsWorking) score += 6
    }

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Analyze schema validation results
   */
  private analyzeSchemaResults(
    foundTables: string[],
    foundFunctions: string[],
    foundTriggers: string[],
    foundPolicies: string[]
  ): SchemaValidationResult {
    const missingTables = this.expectedTables.filter(table => !foundTables.includes(table))
    const extraTables = foundTables.filter(table => !this.expectedTables.includes(table))

    const errors: string[] = []
    if (missingTables.length > 0) {
      errors.push(`Missing tables: ${missingTables.join(', ')}`)
    }

    return {
      isValid: missingTables.length === 0,
      tablesFound: foundTables.length,
      expectedTables: this.expectedTables,
      missingTables,
      extraTables,
      functionsFound: foundFunctions.length,
      triggersFound: foundTriggers.length,
      policiesFound: foundPolicies.length,
      errors
    }
  }

  /**
   * Get empty schema result for failed connections
   */
  private getEmptySchemaResult(): SchemaValidationResult {
    return {
      isValid: false,
      tablesFound: 0,
      expectedTables: this.expectedTables,
      missingTables: this.expectedTables,
      extraTables: [],
      functionsFound: 0,
      triggersFound: 0,
      policiesFound: 0,
      errors: ['Database connection failed']
    }
  }

  /**
   * Get empty data integrity result for failed connections
   */
  private getEmptyDataIntegrityResult(): DataIntegrityResult {
    return {
      isValid: false,
      totalRecords: 0,
      orphanedRecords: 0,
      duplicateRecords: 0,
      nullConstraintViolations: 0,
      foreignKeyViolations: 0,
      errors: ['Database connection failed'],
      warnings: []
    }
  }

  /**
   * Get empty audit result for failed connections
   */
  private getEmptyAuditResult(): AuditSystemValidationResult {
    return {
      isValid: false,
      auditTablesPresent: false,
      auditTriggersActive: false,
      auditFunctionsWorking: false,
      auditLogsRecent: false,
      errors: ['Database connection failed']
    }
  }
}