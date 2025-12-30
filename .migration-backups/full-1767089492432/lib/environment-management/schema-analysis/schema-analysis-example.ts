/**
 * Schema Analysis System Example
 * 
 * Demonstrates how to use the schema analysis, comparison, and migration generation system
 */

import { Environment } from '../types'
import { PostgreSQLSchemaAnalyzer } from './postgresql-schema-analyzer'
import { RLSPolicyAnalyzer } from './rls-policy-analyzer'
import { SchemaComparator } from './schema-comparator'
import { MigrationGenerator } from './migration-generator'

/**
 * Example: Complete schema analysis and migration workflow
 */
export async function demonstrateSchemaAnalysisWorkflow() {
  // Example environments (these would come from your environment configuration)
  const productionEnv: Environment = {
    id: 'prod',
    name: 'Production',
    type: 'production',
    supabaseUrl: 'https://your-project.supabase.co',
    supabaseAnonKey: 'your-anon-key',
    supabaseServiceKey: 'your-service-key',
    status: 'active',
    isProduction: true,
    allowWrites: false, // Production is always read-only for cloning
    createdAt: new Date(),
    lastUpdated: new Date()
  }

  const testEnv: Environment = {
    id: 'test',
    name: 'Test Environment',
    type: 'test',
    supabaseUrl: 'https://your-test-project.supabase.co',
    supabaseAnonKey: 'your-test-anon-key',
    supabaseServiceKey: 'your-test-service-key',
    status: 'active',
    isProduction: false,
    allowWrites: true,
    createdAt: new Date(),
    lastUpdated: new Date()
  }

  try {
    console.log('=== Schema Analysis Workflow Demo ===\n')

    // Step 1: Analyze production schema
    console.log('1. Analyzing production schema...')
    const productionAnalyzer = new PostgreSQLSchemaAnalyzer(productionEnv)
    const productionAnalysis = await productionAnalyzer.analyzeSchema({
      includeSystemTables: true,
      includeViews: false,
      includeFunctions: true,
      includeTriggers: true,
      includePolicies: true,
      includeIndexes: true,
      includeExtensions: true,
      schemasToAnalyze: ['public', 'audit'],
      tablesToExclude: ['temp_tables']
    })

    console.log(`✓ Production schema analyzed:`)
    console.log(`  - ${productionAnalysis.statistics.totalTables} tables`)
    console.log(`  - ${productionAnalysis.statistics.totalFunctions} functions`)
    console.log(`  - ${productionAnalysis.statistics.totalTriggers} triggers`)
    console.log(`  - ${productionAnalysis.statistics.totalPolicies} RLS policies`)
    console.log(`  - Complexity score: ${productionAnalysis.statistics.complexityScore}\n`)

    // Step 2: Analyze RLS policies specifically
    console.log('2. Analyzing RLS policies...')
    const rlsAnalyzer = new RLSPolicyAnalyzer(productionEnv)
    const rlsAnalysis = await rlsAnalyzer.analyzeRLSPolicies(['public', 'audit'])
    
    console.log(`✓ RLS analysis completed:`)
    console.log(`  - ${rlsAnalysis.policyStatistics.totalPolicies} total policies`)
    console.log(`  - ${rlsAnalysis.policyStatistics.tablesWithRLSEnabled} tables with RLS enabled`)
    console.log(`  - ${rlsAnalysis.securityGaps.length} security gaps identified`)
    
    if (rlsAnalysis.securityGaps.length > 0) {
      console.log(`  - Security gaps:`)
      rlsAnalysis.securityGaps.forEach(gap => {
        console.log(`    * ${gap.severity.toUpperCase()}: ${gap.description} (${gap.tableName})`)
      })
    }
    console.log()

    // Step 3: Detect Supabase-specific schemas
    console.log('3. Detecting Supabase schemas...')
    const supabaseInfo = await rlsAnalyzer.detectSupabaseSchemas()
    
    console.log(`✓ Supabase schema detection:`)
    console.log(`  - Auth schema: ${supabaseInfo.hasAuthSchema ? '✓' : '✗'}`)
    console.log(`  - Storage schema: ${supabaseInfo.hasStorageSchema ? '✓' : '✗'}`)
    console.log(`  - Realtime schema: ${supabaseInfo.hasRealtimeSchema ? '✓' : '✗'}`)
    console.log(`  - Audit schema: ${supabaseInfo.hasAuditSchema ? '✓' : '✗'}`)
    console.log(`  - Custom schemas: ${supabaseInfo.customSchemas.join(', ') || 'none'}`)
    console.log(`  - Extensions: ${supabaseInfo.enabledExtensions.join(', ')}\n`)

    // Step 4: Analyze test environment schema
    console.log('4. Analyzing test environment schema...')
    const testAnalyzer = new PostgreSQLSchemaAnalyzer(testEnv)
    const testAnalysis = await testAnalyzer.analyzeSchema({
      includeSystemTables: true,
      includeViews: false,
      includeFunctions: true,
      includeTriggers: true,
      includePolicies: true,
      includeIndexes: true,
      includeExtensions: true,
      schemasToAnalyze: ['public', 'audit'],
      tablesToExclude: ['temp_tables']
    })

    console.log(`✓ Test schema analyzed:`)
    console.log(`  - ${testAnalysis.statistics.totalTables} tables`)
    console.log(`  - ${testAnalysis.statistics.totalFunctions} functions`)
    console.log(`  - ${testAnalysis.statistics.totalTriggers} triggers`)
    console.log(`  - ${testAnalysis.statistics.totalPolicies} RLS policies\n`)

    // Step 5: Compare schemas
    console.log('5. Comparing schemas...')
    const comparator = new SchemaComparator()
    const schemaDiff = await comparator.compareSchemas(
      productionAnalysis.schema,
      testAnalysis.schema,
      {
        ignoreComments: true,
        ignoreIndexes: false,
        ignorePolicies: false,
        ignoreExtensions: false,
        customIgnorePatterns: [],
        dependencyAnalysis: true
      }
    )

    console.log(`✓ Schema comparison completed:`)
    console.log(`  - ${schemaDiff.summary.totalDifferences} total differences`)
    console.log(`  - ${schemaDiff.summary.tableChanges} table changes`)
    console.log(`  - ${schemaDiff.summary.functionChanges} function changes`)
    console.log(`  - ${schemaDiff.summary.triggerChanges} trigger changes`)
    console.log(`  - ${schemaDiff.summary.policyChanges} policy changes`)
    
    if (schemaDiff.differences.length > 0) {
      console.log(`\n  Top differences:`)
      schemaDiff.differences.slice(0, 5).forEach(diff => {
        console.log(`    * ${diff.action.toUpperCase()} ${diff.type}: ${diff.schemaName}.${diff.objectName}`)
      })
    }
    console.log()

    // Step 6: Generate migration script
    if (schemaDiff.differences.length > 0) {
      console.log('6. Generating migration script...')
      const migrationGenerator = new MigrationGenerator()
      const migrationScript = await migrationGenerator.generateMigrationScript(schemaDiff, {
        includeRollback: true,
        validateSyntax: false,
        addComments: true,
        batchSize: 100,
        timeoutPerOperation: 30000,
        safeMode: true
      })

      console.log(`✓ Migration script generated:`)
      console.log(`  - Migration ID: ${migrationScript.id}`)
      console.log(`  - ${migrationScript.operations.length} operations`)
      console.log(`  - ${migrationScript.rollbackOperations.length} rollback operations`)
      console.log(`  - Estimated duration: ${migrationScript.estimatedDuration}ms`)
      console.log(`  - Risk level: ${migrationScript.riskLevel}`)
      
      console.log(`\n  Sample operations:`)
      migrationScript.operations.slice(0, 3).forEach(op => {
        console.log(`    * ${op.description} (${op.riskLevel} risk, ~${op.estimatedDuration}ms)`)
      })

      // Show sample SQL
      if (migrationScript.operations.length > 0) {
        console.log(`\n  Sample SQL:`)
        console.log(`    ${migrationScript.operations[0].sql.split('\n')[0]}...`)
      }
    } else {
      console.log('6. No differences found - schemas are in sync! ✓')
    }

    console.log('\n=== Workflow completed successfully! ===')

    return {
      productionAnalysis,
      testAnalysis,
      rlsAnalysis,
      supabaseInfo,
      schemaDiff,
      migrationScript: schemaDiff.differences.length > 0 ? 
        await new MigrationGenerator().generateMigrationScript(schemaDiff) : null
    }

  } catch (error) {
    console.error('❌ Schema analysis workflow failed:', error)
    throw error
  }
}

/**
 * Example: Generate RLS policy recommendations
 */
export async function demonstrateRLSPolicyGeneration() {
  const environment: Environment = {
    id: 'example',
    name: 'Example Environment',
    type: 'development',
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'example-key',
    supabaseServiceKey: 'example-service-key',
    status: 'active',
    isProduction: false,
    allowWrites: true,
    createdAt: new Date(),
    lastUpdated: new Date()
  }

  console.log('=== RLS Policy Generation Demo ===\n')

  const rlsAnalyzer = new RLSPolicyAnalyzer(environment)
  
  // Generate recommendations for a new table
  const recommendations = await rlsAnalyzer.generatePolicyRecommendations('user_profiles', 'public')
  
  console.log('Generated RLS policy recommendations for user_profiles table:')
  console.log(recommendations.join('\n'))
}

/**
 * Example: Analyze specific schema components
 */
export async function demonstrateComponentAnalysis() {
  const environment: Environment = {
    id: 'example',
    name: 'Example Environment',
    type: 'development',
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'example-key',
    supabaseServiceKey: 'example-service-key',
    status: 'active',
    isProduction: false,
    allowWrites: true,
    createdAt: new Date(),
    lastUpdated: new Date()
  }

  console.log('=== Component Analysis Demo ===\n')

  const analyzer = new PostgreSQLSchemaAnalyzer(environment)
  
  // Analyze only specific components
  console.log('1. Analyzing tables only...')
  const tablesOnlyAnalysis = await analyzer.analyzeSchema({
    includeSystemTables: true,
    includeViews: false,
    includeFunctions: false,
    includeTriggers: false,
    includePolicies: false,
    includeIndexes: false,
    includeExtensions: false,
    schemasToAnalyze: ['public']
  })

  console.log(`Found ${tablesOnlyAnalysis.statistics.totalTables} tables`)

  console.log('\n2. Analyzing functions and triggers only...')
  const functionsAndTriggersAnalysis = await analyzer.analyzeSchema({
    includeSystemTables: false,
    includeViews: false,
    includeFunctions: true,
    includeTriggers: true,
    includePolicies: false,
    includeIndexes: false,
    includeExtensions: false,
    schemasToAnalyze: ['public', 'audit']
  })

  console.log(`Found ${functionsAndTriggersAnalysis.statistics.totalFunctions} functions`)
  console.log(`Found ${functionsAndTriggersAnalysis.statistics.totalTriggers} triggers`)
}

// Export the demo functions for use in other files
export const schemaAnalysisExamples = {
  demonstrateSchemaAnalysisWorkflow,
  demonstrateRLSPolicyGeneration,
  demonstrateComponentAnalysis
}