/**
 * RLS Policy Analyzer
 * 
 * Specialized utilities for analyzing Row Level Security policies
 * and schema-specific detection for Supabase environments
 */

import { createClient } from '@supabase/supabase-js'
import { Environment } from '../types'
import { PolicyDefinition, SchemaAnalysisError } from './types'

export interface RLSAnalysisResult {
  policies: PolicyDefinition[]
  tablesWithRLS: string[]
  tablesWithoutRLS: string[]
  policyStatistics: RLSStatistics
  securityGaps: SecurityGap[]
}

export interface RLSStatistics {
  totalPolicies: number
  policiesByCommand: Record<string, number>
  policiesByTable: Record<string, number>
  averagePoliciesPerTable: number
  tablesWithRLSEnabled: number
  tablesWithoutRLSEnabled: number
}

export interface SecurityGap {
  type: 'missing_rls' | 'overly_permissive' | 'no_policies' | 'conflicting_policies'
  tableName: string
  schemaName: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
}

export interface SupabaseSchemaInfo {
  hasAuthSchema: boolean
  hasStorageSchema: boolean
  hasRealtimeSchema: boolean
  hasAuditSchema: boolean
  customSchemas: string[]
  supabaseVersion?: string
  enabledExtensions: string[]
}

export class RLSPolicyAnalyzer {
  private supabase: any

  constructor(private environment: Environment) {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseServiceKey
    )
  }

  /**
   * Analyze all RLS policies in the database
   */
  async analyzeRLSPolicies(schemas: string[] = ['public']): Promise<RLSAnalysisResult> {
    try {
      console.log(`Analyzing RLS policies for schemas: ${schemas.join(', ')}`)

      const [policies, rlsEnabledTables, allTables] = await Promise.all([
        this.getAllPolicies(schemas),
        this.getRLSEnabledTables(schemas),
        this.getAllTables(schemas)
      ])

      const tablesWithRLS = rlsEnabledTables.map(t => `${t.schema_name}.${t.table_name}`)
      const tablesWithoutRLS = allTables
        .filter(t => !rlsEnabledTables.some(rls => 
          rls.schema_name === t.schema_name && rls.table_name === t.table_name))
        .map(t => `${t.schema_name}.${t.table_name}`)

      const policyStatistics = this.calculateRLSStatistics(policies, rlsEnabledTables, allTables)
      const securityGaps = await this.identifySecurityGaps(policies, rlsEnabledTables, allTables)

      return {
        policies,
        tablesWithRLS,
        tablesWithoutRLS,
        policyStatistics,
        securityGaps
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new SchemaAnalysisError(`Failed to analyze RLS policies: ${message}`, error as Error)
    }
  }

  /**
   * Detect Supabase-specific schema information
   */
  async detectSupabaseSchemas(): Promise<SupabaseSchemaInfo> {
    try {
      const [schemas, extensions] = await Promise.all([
        this.getAllSchemas(),
        this.getEnabledExtensions()
      ])

      const schemaSet = new Set(schemas)
      const customSchemas = schemas.filter(s => 
        !['public', 'auth', 'storage', 'realtime', 'information_schema', 'pg_catalog', 'pg_toast'].includes(s))

      return {
        hasAuthSchema: schemaSet.has('auth'),
        hasStorageSchema: schemaSet.has('storage'),
        hasRealtimeSchema: schemaSet.has('realtime'),
        hasAuditSchema: schemaSet.has('audit'),
        customSchemas,
        enabledExtensions: extensions
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new SchemaAnalysisError(`Failed to detect Supabase schemas: ${message}`, error as Error)
    }
  }

  /**
   * Get all policies across specified schemas
   */
  private async getAllPolicies(schemas: string[]): Promise<PolicyDefinition[]> {
    const query = `
      SELECT 
        n.nspname as schema_name,
        c.relname as table_name,
        pol.polname as policy_name,
        CASE pol.polcmd
          WHEN 'r' THEN 'SELECT'
          WHEN 'a' THEN 'INSERT'
          WHEN 'w' THEN 'UPDATE'
          WHEN 'd' THEN 'DELETE'
          WHEN '*' THEN 'ALL'
          ELSE pol.polcmd::text
        END as command,
        array_agg(DISTINCT r.rolname) FILTER (WHERE r.rolname IS NOT NULL) as roles,
        pol.polqual as using_expression,
        pol.polwithcheck as check_expression,
        pol.polpermissive as is_permissive
      FROM pg_policy pol
      JOIN pg_class c ON c.oid = pol.polrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_roles r ON r.oid = ANY(pol.polroles)
      WHERE n.nspname = ANY($1)
      GROUP BY n.nspname, c.relname, pol.polname, pol.polcmd, 
               pol.polqual, pol.polwithcheck, pol.polpermissive
      ORDER BY n.nspname, c.relname, pol.polname
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: [schemas]
    })

    if (error) throw new SchemaAnalysisError(`Failed to get policies: ${error.message}`)

    return (data || []).map((row: any) => ({
      schemaName: row.schema_name,
      tableName: row.table_name,
      policyName: row.policy_name,
      command: row.command,
      roles: row.roles || [],
      usingExpression: row.using_expression,
      checkExpression: row.check_expression,
      isPermissive: row.is_permissive
    }))
  }

  /**
   * Get tables with RLS enabled
   */
  private async getRLSEnabledTables(schemas: string[]): Promise<Array<{schema_name: string, table_name: string}>> {
    const query = `
      SELECT 
        n.nspname as schema_name,
        c.relname as table_name,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = ANY($1)
        AND c.relkind = 'r'
        AND c.relrowsecurity = true
      ORDER BY n.nspname, c.relname
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: [schemas]
    })

    if (error) throw new SchemaAnalysisError(`Failed to get RLS enabled tables: ${error.message}`)

    return data || []
  }

  /**
   * Get all tables in specified schemas
   */
  private async getAllTables(schemas: string[]): Promise<Array<{schema_name: string, table_name: string}>> {
    const query = `
      SELECT 
        table_schema as schema_name,
        table_name
      FROM information_schema.tables
      WHERE table_schema = ANY($1)
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: [schemas]
    })

    if (error) throw new SchemaAnalysisError(`Failed to get all tables: ${error.message}`)

    return data || []
  }

  /**
   * Get all schemas in the database
   */
  private async getAllSchemas(): Promise<string[]> {
    const query = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: []
    })

    if (error) throw new SchemaAnalysisError(`Failed to get schemas: ${error.message}`)

    return data?.map((row: any) => row.schema_name) || []
  }

  /**
   * Get enabled extensions
   */
  private async getEnabledExtensions(): Promise<string[]> {
    const query = `
      SELECT extname as extension_name
      FROM pg_extension
      ORDER BY extname
    `

    const { data, error } = await this.supabase.rpc('execute_sql', {
      query,
      params: []
    })

    if (error) throw new SchemaAnalysisError(`Failed to get extensions: ${error.message}`)

    return data?.map((row: any) => row.extension_name) || []
  }

  /**
   * Calculate RLS statistics
   */
  private calculateRLSStatistics(
    policies: PolicyDefinition[], 
    rlsEnabledTables: Array<{schema_name: string, table_name: string}>,
    allTables: Array<{schema_name: string, table_name: string}>
  ): RLSStatistics {
    const policiesByCommand: Record<string, number> = {}
    const policiesByTable: Record<string, number> = {}

    policies.forEach(policy => {
      // Count by command
      policiesByCommand[policy.command] = (policiesByCommand[policy.command] || 0) + 1
      
      // Count by table
      const tableKey = `${policy.schemaName}.${policy.tableName}`
      policiesByTable[tableKey] = (policiesByTable[tableKey] || 0) + 1
    })

    const tablesWithPolicies = Object.keys(policiesByTable).length
    const averagePoliciesPerTable = tablesWithPolicies > 0 ? policies.length / tablesWithPolicies : 0

    return {
      totalPolicies: policies.length,
      policiesByCommand,
      policiesByTable,
      averagePoliciesPerTable,
      tablesWithRLSEnabled: rlsEnabledTables.length,
      tablesWithoutRLSEnabled: allTables.length - rlsEnabledTables.length
    }
  }

  /**
   * Identify security gaps in RLS configuration
   */
  private async identifySecurityGaps(
    policies: PolicyDefinition[],
    rlsEnabledTables: Array<{schema_name: string, table_name: string}>,
    allTables: Array<{schema_name: string, table_name: string}>
  ): Promise<SecurityGap[]> {
    const gaps: SecurityGap[] = []

    // Check for tables without RLS enabled
    const rlsTableSet = new Set(rlsEnabledTables.map(t => `${t.schema_name}.${t.table_name}`))
    
    allTables.forEach(table => {
      const tableKey = `${table.schema_name}.${table.table_name}`
      
      if (!rlsTableSet.has(tableKey)) {
        gaps.push({
          type: 'missing_rls',
          tableName: table.table_name,
          schemaName: table.schema_name,
          description: 'Table does not have Row Level Security enabled',
          severity: 'high',
          recommendation: 'Enable RLS and create appropriate policies'
        })
      }
    })

    // Check for tables with RLS enabled but no policies
    const policyTableSet = new Set(policies.map(p => `${p.schemaName}.${p.tableName}`))
    
    rlsEnabledTables.forEach(table => {
      const tableKey = `${table.schema_name}.${table.table_name}`
      
      if (!policyTableSet.has(tableKey)) {
        gaps.push({
          type: 'no_policies',
          tableName: table.table_name,
          schemaName: table.schema_name,
          description: 'Table has RLS enabled but no policies defined',
          severity: 'critical',
          recommendation: 'Create policies to control access or disable RLS'
        })
      }
    })

    // Check for overly permissive policies
    policies.forEach(policy => {
      if (policy.roles.includes('public') || policy.roles.includes('anon')) {
        gaps.push({
          type: 'overly_permissive',
          tableName: policy.tableName,
          schemaName: policy.schemaName,
          description: `Policy "${policy.policyName}" allows public access`,
          severity: 'medium',
          recommendation: 'Review policy to ensure appropriate access control'
        })
      }
    })

    return gaps
  }

  /**
   * Generate RLS policy recommendations
   */
  async generatePolicyRecommendations(tableName: string, schemaName: string = 'public'): Promise<string[]> {
    const recommendations: string[] = []

    // Basic recommendations based on common patterns
    recommendations.push(
      `-- Enable RLS on ${schemaName}.${tableName}`,
      `ALTER TABLE ${schemaName}.${tableName} ENABLE ROW LEVEL SECURITY;`,
      '',
      `-- Policy for authenticated users to see their own records`,
      `CREATE POLICY "${tableName}_select_own" ON ${schemaName}.${tableName}`,
      `  FOR SELECT USING (auth.uid() = user_id);`,
      '',
      `-- Policy for authenticated users to insert their own records`,
      `CREATE POLICY "${tableName}_insert_own" ON ${schemaName}.${tableName}`,
      `  FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      '',
      `-- Policy for authenticated users to update their own records`,
      `CREATE POLICY "${tableName}_update_own" ON ${schemaName}.${tableName}`,
      `  FOR UPDATE USING (auth.uid() = user_id);`
    )

    return recommendations
  }
}