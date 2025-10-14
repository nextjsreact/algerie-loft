/**
 * PostgreSQL Schema Analyzer
 * 
 * Extracts complete schema information from PostgreSQL/Supabase databases
 * including tables, functions, triggers, indexes, and RLS policies
 */

import { createClient } from '@supabase/supabase-js'
import { Environment } from '../types'
import {
  SchemaDefinition,
  TableDefinition,
  ColumnDefinition,
  ConstraintDefinition,
  IndexDefinition,
  FunctionDefinition,
  TriggerDefinition,
  PolicyDefinition,
  ExtensionDefinition,
  SchemaAnalysisOptions,
  SchemaAnalysisResult,
  SchemaStatistics,
  SchemaAnalysisError
} from './types'

export class PostgreSQLSchemaAnalyzer {
  private supabase: any

  constructor(private environment: Environment) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseServiceKey
    )
  }

  /**
   * Analyze complete database schema
   */
  async analyzeSchema(options: SchemaAnalysisOptions = this.getDefaultOptions()): Promise<SchemaAnalysisResult> {
    const startTime = Date.now()
    const warnings: string[] = []
    const errors: string[] = []

    try {
      console.log(`Starting schema analysis for environment: ${this.environment.name}`)

      // Get all schemas
      const schemas = await this.getSchemas(options.schemasToAnalyze)
      
      // Extract all schema components
      const [tables, functions, triggers, indexes, policies, extensions] = await Promise.all([
        options.includeSystemTables ? this.getTables(schemas, options.tablesToExclude) : [],
        options.includeFunctions ? this.getFunctions(schemas) : [],
        options.includeTriggers ? this.getTriggers(schemas) : [],
        options.includeIndexes ? this.getIndexes(schemas) : [],
        options.includePolicies ? this.getPolicies(schemas) : [],
        options.includeExtensions ? this.getExtensions() : []
      ])

      const schema: SchemaDefinition = {
        schemas,
        tables,
        functions,
        triggers,
        indexes,
        policies,
        extensions,
        analyzedAt: new Date()
      }

      const statistics = this.calculateStatistics(schema)
      const analysisTime = Date.now() - startTime

      console.log(`Schema analysis completed in ${analysisTime}ms`)
      console.log(`Found: ${statistics.totalTables} tables, ${statistics.totalFunctions} functions, ${statistics.totalTriggers} triggers`)

      return {
        schema,
        statistics,
        warnings,
        errors,
        analysisTime
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new SchemaAnalysisError(`Failed to analyze schema: ${message}`, error as Error)
    }
  }

  /**
   * Get all schemas in the database
   */
  private async getSchemas(schemasToAnalyze?: string[]): Promise<string[]> {
    const query = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ${schemasToAnalyze ? `AND schema_name = ANY($1)` : ''}
      ORDER BY schema_name
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: schemasToAnalyze ? [schemasToAnalyze] : []
    })

    if (error) throw new SchemaAnalysisError(`Failed to get schemas: ${error.message}`)

    return data?.map((row: any) => row.schema_name) || []
  }

  /**
   * Extract all table definitions
   */
  private async getTables(schemas: string[], tablesToExclude?: string[]): Promise<TableDefinition[]> {
    const tables: TableDefinition[] = []

    for (const schemaName of schemas) {
      const schemaTables = await this.getTablesForSchema(schemaName, tablesToExclude)
      tables.push(...schemaTables)
    }

    return tables
  }

  /**
   * Get tables for a specific schema
   */
  private async getTablesForSchema(schemaName: string, tablesToExclude?: string[]): Promise<TableDefinition[]> {
    // Get basic table information
    const tablesQuery = `
      SELECT 
        t.table_name,
        obj_description(c.oid) as comment
      FROM information_schema.tables t
      LEFT JOIN pg_class c ON c.relname = t.table_name
      LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.table_schema
      WHERE t.table_schema = $1
        AND t.table_type = 'BASE TABLE'
        ${tablesToExclude ? `AND t.table_name != ALL($2)` : ''}
      ORDER BY t.table_name
    `

    const { data: tablesData, error: tablesError } = await this.supabase.rpc('execute_sql', {
      query: tablesQuery,
      params: tablesToExclude ? [schemaName, tablesToExclude] : [schemaName]
    })

    if (tablesError) throw new SchemaAnalysisError(`Failed to get tables for schema ${schemaName}: ${tablesError.message}`)

    const tables: TableDefinition[] = []

    for (const tableRow of tablesData || []) {
      const tableName = tableRow.table_name

      // Get columns, constraints, indexes, triggers, and policies for each table
      const [columns, constraints, indexes, triggers, policies] = await Promise.all([
        this.getTableColumns(schemaName, tableName),
        this.getTableConstraints(schemaName, tableName),
        this.getTableIndexes(schemaName, tableName),
        this.getTableTriggers(schemaName, tableName),
        this.getTablePolicies(schemaName, tableName)
      ])

      tables.push({
        schemaName,
        tableName,
        columns,
        constraints,
        indexes,
        triggers,
        policies,
        comment: tableRow.comment
      })
    }

    return tables
  }

  /**
   * Get column definitions for a table
   */
  private async getTableColumns(schemaName: string, tableName: string): Promise<ColumnDefinition[]> {
    const query = `
      SELECT 
        c.column_name,
        c.data_type,
        c.is_nullable::boolean,
        c.column_default,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.is_identity::boolean,
        c.identity_generation,
        col_description(pgc.oid, c.ordinal_position) as comment
      FROM information_schema.columns c
      LEFT JOIN pg_class pgc ON pgc.relname = c.table_name
      LEFT JOIN pg_namespace pgn ON pgn.oid = pgc.relnamespace AND pgn.nspname = c.table_schema
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: [schemaName, tableName]
    })

    if (error) throw new SchemaAnalysisError(`Failed to get columns for ${schemaName}.${tableName}: ${error.message}`)

    return (data || []).map((row: any) => ({
      columnName: row.column_name,
      dataType: row.data_type,
      isNullable: row.is_nullable === 'YES',
      defaultValue: row.column_default,
      maxLength: row.character_maximum_length,
      numericPrecision: row.numeric_precision,
      numericScale: row.numeric_scale,
      isIdentity: row.is_identity,
      identityGeneration: row.identity_generation,
      comment: row.comment
    }))
  }

  /**
   * Get constraint definitions for a table
   */
  private async getTableConstraints(schemaName: string, tableName: string): Promise<ConstraintDefinition[]> {
    const query = `
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as column_names,
        ccu.table_schema as referenced_schema,
        ccu.table_name as referenced_table,
        array_agg(ccu.column_name ORDER BY kcu.ordinal_position) as referenced_columns,
        cc.check_clause,
        tc.is_deferrable::boolean,
        tc.initially_deferred::boolean
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name 
        AND tc.table_schema = ccu.constraint_schema
      LEFT JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name 
        AND tc.table_schema = cc.constraint_schema
      WHERE tc.table_schema = $1 AND tc.table_name = $2
      GROUP BY tc.constraint_name, tc.constraint_type, ccu.table_schema, ccu.table_name, 
               cc.check_clause, tc.is_deferrable, tc.initially_deferred
      ORDER BY tc.constraint_name
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: [schemaName, tableName]
    })

    if (error) throw new SchemaAnalysisError(`Failed to get constraints for ${schemaName}.${tableName}: ${error.message}`)

    return (data || []).map((row: any) => ({
      constraintName: row.constraint_name,
      constraintType: row.constraint_type,
      columnNames: row.column_names || [],
      referencedSchema: row.referenced_schema,
      referencedTable: row.referenced_table,
      referencedColumns: row.referenced_columns || [],
      checkClause: row.check_clause,
      isDeferrable: row.is_deferrable,
      initiallyDeferred: row.initially_deferred
    }))
  }

  /**
   * Get index definitions for a table
   */
  private async getTableIndexes(schemaName: string, tableName: string): Promise<IndexDefinition[]> {
    const query = `
      SELECT 
        i.schemaname as schema_name,
        i.tablename as table_name,
        i.indexname as index_name,
        am.amname as index_type,
        i.indexdef,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary,
        obj_description(c.oid) as comment
      FROM pg_indexes i
      JOIN pg_class c ON c.relname = i.indexname
      JOIN pg_index ix ON ix.indexrelid = c.oid
      JOIN pg_am am ON am.oid = c.relam
      WHERE i.schemaname = $1 AND i.tablename = $2
      ORDER BY i.indexname
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: [schemaName, tableName]
    })

    if (error) throw new SchemaAnalysisError(`Failed to get indexes for ${schemaName}.${tableName}: ${error.message}`)

    return (data || []).map((row: any) => ({
      schemaName: row.schema_name,
      tableName: row.table_name,
      indexName: row.index_name,
      indexType: row.index_type,
      columns: this.parseIndexColumns(row.indexdef),
      isUnique: row.is_unique,
      isPrimary: row.is_primary,
      comment: row.comment
    }))
  }

  /**
   * Get trigger definitions for a table
   */
  private async getTableTriggers(schemaName: string, tableName: string): Promise<TriggerDefinition[]> {
    const query = `
      SELECT 
        t.trigger_name,
        t.action_timing,
        array_agg(t.event_manipulation) as events,
        t.action_orientation,
        t.action_condition,
        p.pronamespace::regnamespace::text as function_schema,
        p.proname as function_name,
        obj_description(tr.oid) as comment
      FROM information_schema.triggers t
      JOIN pg_trigger tr ON tr.tgname = t.trigger_name
      JOIN pg_proc p ON p.oid = tr.tgfoid
      WHERE t.trigger_schema = $1 AND t.event_object_table = $2
      GROUP BY t.trigger_name, t.action_timing, t.action_orientation, 
               t.action_condition, p.pronamespace, p.proname, tr.oid
      ORDER BY t.trigger_name
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: [schemaName, tableName]
    })

    if (error) throw new SchemaAnalysisError(`Failed to get triggers for ${schemaName}.${tableName}: ${error.message}`)

    return (data || []).map((row: any) => ({
      schemaName,
      tableName,
      triggerName: row.trigger_name,
      timing: row.action_timing,
      events: row.events || [],
      orientation: row.action_orientation,
      condition: row.action_condition,
      functionSchema: row.function_schema,
      functionName: row.function_name,
      comment: row.comment
    }))
  }

  /**
   * Get RLS policy definitions for a table
   */
  private async getTablePolicies(schemaName: string, tableName: string): Promise<PolicyDefinition[]> {
    const query = `
      SELECT 
        pol.polname as policy_name,
        pol.polcmd as command,
        array_agg(r.rolname) as roles,
        pol.polqual as using_expression,
        pol.polwithcheck as check_expression,
        pol.polpermissive as is_permissive
      FROM pg_policy pol
      JOIN pg_class c ON c.oid = pol.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_roles r ON r.oid = ANY(pol.polroles)
      WHERE n.nspname = $1 AND c.relname = $2
      GROUP BY pol.polname, pol.polcmd, pol.polqual, pol.polwithcheck, pol.polpermissive
      ORDER BY pol.polname
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: [schemaName, tableName]
    })

    if (error) throw new SchemaAnalysisError(`Failed to get policies for ${schemaName}.${tableName}: ${error.message}`)

    return (data || []).map((row: any) => ({
      schemaName,
      tableName,
      policyName: row.policy_name,
      command: this.mapPolicyCommand(row.command),
      roles: row.roles || [],
      usingExpression: row.using_expression,
      checkExpression: row.check_expression,
      isPermissive: row.is_permissive
    }))
  }

  /**
   * Get all functions in specified schemas
   */
  private async getFunctions(schemas: string[]): Promise<FunctionDefinition[]> {
    const functions: FunctionDefinition[] = []

    for (const schemaName of schemas) {
      const schemaFunctions = await this.getFunctionsForSchema(schemaName)
      functions.push(...schemaFunctions)
    }

    return functions
  }

  /**
   * Get functions for a specific schema
   */
  private async getFunctionsForSchema(schemaName: string): Promise<FunctionDefinition[]> {
    const query = `
      SELECT 
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_function_result(p.oid) as return_type,
        pg_get_function_arguments(p.oid) as parameters,
        l.lanname as language,
        p.prosrc as body,
        p.prosecdef as is_security_definer,
        p.provolatile as volatility,
        obj_description(p.oid) as comment
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      JOIN pg_language l ON l.oid = p.prolang
      WHERE n.nspname = $1
        AND p.prokind = 'f'
      ORDER BY p.proname
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: [schemaName]
    })

    if (error) throw new SchemaAnalysisError(`Failed to get functions for schema ${schemaName}: ${error.message}`)

    return (data || []).map((row: any) => ({
      schemaName: row.schema_name,
      functionName: row.function_name,
      returnType: row.return_type,
      parameters: this.parseFunctionParameters(row.parameters),
      language: row.language,
      body: row.body,
      isSecurityDefiner: row.is_security_definer,
      volatility: this.mapVolatility(row.volatility),
      comment: row.comment
    }))
  }

  /**
   * Get all triggers in specified schemas
   */
  private async getTriggers(schemas: string[]): Promise<TriggerDefinition[]> {
    // Triggers are already collected per table, so we aggregate them
    const allTriggers: TriggerDefinition[] = []
    
    for (const schemaName of schemas) {
      const tables = await this.getTablesForSchema(schemaName)
      for (const table of tables) {
        allTriggers.push(...table.triggers)
      }
    }

    return allTriggers
  }

  /**
   * Get all indexes in specified schemas
   */
  private async getIndexes(schemas: string[]): Promise<IndexDefinition[]> {
    // Indexes are already collected per table, so we aggregate them
    const allIndexes: IndexDefinition[] = []
    
    for (const schemaName of schemas) {
      const tables = await this.getTablesForSchema(schemaName)
      for (const table of tables) {
        allIndexes.push(...table.indexes)
      }
    }

    return allIndexes
  }

  /**
   * Get all policies in specified schemas
   */
  private async getPolicies(schemas: string[]): Promise<PolicyDefinition[]> {
    // Policies are already collected per table, so we aggregate them
    const allPolicies: PolicyDefinition[] = []
    
    for (const schemaName of schemas) {
      const tables = await this.getTablesForSchema(schemaName)
      for (const table of tables) {
        allPolicies.push(...table.policies)
      }
    }

    return allPolicies
  }

  /**
   * Get all extensions
   */
  private async getExtensions(): Promise<ExtensionDefinition[]> {
    const query = `
      SELECT 
        e.extname as extension_name,
        n.nspname as schema_name,
        e.extversion as version,
        obj_description(e.oid) as comment
      FROM pg_extension e
      JOIN pg_namespace n ON n.oid = e.extnamespace
      ORDER BY e.extname
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: []
    })

    if (error) throw new SchemaAnalysisError(`Failed to get extensions: ${error.message}`)

    return (data || []).map((row: any) => ({
      extensionName: row.extension_name,
      schemaName: row.schema_name,
      version: row.version,
      comment: row.comment
    }))
  }

  /**
   * Calculate schema statistics
   */
  private calculateStatistics(schema: SchemaDefinition): SchemaStatistics {
    const totalColumns = schema.tables.reduce((sum, table) => sum + table.columns.length, 0)
    
    return {
      totalTables: schema.tables.length,
      totalColumns,
      totalFunctions: schema.functions.length,
      totalTriggers: schema.triggers.length,
      totalIndexes: schema.indexes.length,
      totalPolicies: schema.policies.length,
      totalExtensions: schema.extensions.length,
      schemaSize: 0, // Would need additional query to calculate
      complexityScore: this.calculateComplexityScore(schema)
    }
  }

  /**
   * Calculate complexity score based on schema elements
   */
  private calculateComplexityScore(schema: SchemaDefinition): number {
    let score = 0
    
    // Base score for tables and columns
    score += schema.tables.length * 2
    score += schema.tables.reduce((sum, table) => sum + table.columns.length, 0)
    
    // Additional complexity for relationships and constraints
    score += schema.tables.reduce((sum, table) => 
      sum + table.constraints.filter(c => c.constraintType === 'FOREIGN KEY').length * 3, 0)
    
    // Functions and triggers add complexity
    score += schema.functions.length * 5
    score += schema.triggers.length * 4
    
    // Policies add security complexity
    score += schema.policies.length * 2
    
    return score
  }

  /**
   * Helper methods for parsing and mapping
   */
  private parseIndexColumns(indexDef: string): any[] {
    // Simple parsing - in a real implementation, this would be more sophisticated
    return []
  }

  private parseFunctionParameters(paramString: string): any[] {
    // Simple parsing - in a real implementation, this would parse the parameter string
    return []
  }

  private mapPolicyCommand(cmd: string): string {
    const mapping: Record<string, string> = {
      'r': 'SELECT',
      'a': 'INSERT', 
      'w': 'UPDATE',
      'd': 'DELETE',
      '*': 'ALL'
    }
    return mapping[cmd] || cmd
  }

  private mapVolatility(vol: string): 'IMMUTABLE' | 'STABLE' | 'VOLATILE' {
    const mapping: Record<string, 'IMMUTABLE' | 'STABLE' | 'VOLATILE'> = {
      'i': 'IMMUTABLE',
      's': 'STABLE',
      'v': 'VOLATILE'
    }
    return mapping[vol] || 'VOLATILE'
  }

  /**
   * Get default analysis options
   */
  private getDefaultOptions(): SchemaAnalysisOptions {
    return {
      includeSystemTables: true,
      includeViews: false,
      includeFunctions: true,
      includeTriggers: true,
      includePolicies: true,
      includeIndexes: true,
      includeExtensions: true,
      schemasToAnalyze: ['public', 'audit'],
      tablesToExclude: []
    }
  }
}