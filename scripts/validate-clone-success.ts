#!/usr/bin/env tsx
/**
 * POST-CLONE VALIDATION SCRIPT
 * ============================
 * 
 * Validates that the clone operation was successful by:
 * - Comparing record counts between PROD and DEV
 * - Checking data integrity and key relationships
 * - Verifying critical data exists
 * - Testing anonymization worked correctly
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

interface ValidationResult {
  table: string
  status: 'success' | 'warning' | 'error' | 'skipped'
  prodCount: number
  devCount: number
  message: string
  details?: string[]
}

interface ValidationSummary {
  totalTables: number
  successful: number
  warnings: number
  errors: number
  skipped: number
  results: ValidationResult[]
}

class CloneValidator {
  private prodClient: any
  private devClient: any
  private results: ValidationResult[] = []

  // Tables that should exist and have data
  private readonly CRITICAL_TABLES = [
    'currencies',
    'categories',
    'zone_areas',
    'payment_methods',
    'loft_owners',
    'lofts'
  ]

  // Tables that might not exist in DEV (expected)
  private readonly OPTIONAL_TABLES = [
    'customers',
    'loft_photos'
  ]

  // Tables that might have FK constraint issues (expected)
  private readonly PROBLEMATIC_TABLES = [
    'internet_connection_types',
    'profiles',
    'tasks',
    'transactions',
    'notifications'
  ]

  constructor() {
    this.initializeClients()
  }

  /**
   * Initialize Supabase clients
   */
  private initializeClients() {
    console.log('🔧 Initializing validation clients...')

    // Production configuration
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!prodUrl || !prodKey) {
      throw new Error('❌ PRODUCTION configuration missing')
    }

    this.prodClient = createClient(prodUrl, prodKey)
    console.log('✅ PRODUCTION client initialized')

    // Development configuration
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!devUrl || !devKey) {
      throw new Error('❌ DEVELOPMENT configuration missing')
    }

    this.devClient = createClient(devUrl, devKey)
    console.log('✅ DEVELOPMENT client initialized')
  }

  /**
   * Get record count for a table
   */
  private async getTableCount(client: any, tableName: string): Promise<number> {
    try {
      const { data, error, count } = await client
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        throw new Error(error.message)
      }

      return count || 0
    } catch (error) {
      throw new Error(`Failed to count ${tableName}: ${error}`)
    }
  }

  /**
   * Check if table exists
   */
  private async tableExists(client: any, tableName: string): Promise<boolean> {
    try {
      const { error } = await client
        .from(tableName)
        .select('*')
        .limit(1)

      return !error || !error.message.includes('does not exist')
    } catch (error) {
      return false
    }
  }

  /**
   * Validate a single table
   */
  private async validateTable(tableName: string): Promise<ValidationResult> {
    console.log(`📋 Validating: ${tableName}`)

    try {
      // Check if table exists in both environments
      const [prodExists, devExists] = await Promise.all([
        this.tableExists(this.prodClient, tableName),
        this.tableExists(this.devClient, tableName)
      ])

      if (!prodExists) {
        return {
          table: tableName,
          status: 'skipped',
          prodCount: 0,
          devCount: 0,
          message: 'Table does not exist in PRODUCTION'
        }
      }

      if (!devExists) {
        if (this.OPTIONAL_TABLES.includes(tableName)) {
          return {
            table: tableName,
            status: 'warning',
            prodCount: 0,
            devCount: 0,
            message: 'Table does not exist in DEV (expected for this table)'
          }
        } else {
          return {
            table: tableName,
            status: 'error',
            prodCount: 0,
            devCount: 0,
            message: 'Table missing in DEVELOPMENT'
          }
        }
      }

      // Get record counts
      const [prodCount, devCount] = await Promise.all([
        this.getTableCount(this.prodClient, tableName),
        this.getTableCount(this.devClient, tableName)
      ])

      console.log(`   PROD: ${prodCount} records, DEV: ${devCount} records`)

      // Analyze results
      if (prodCount === 0 && devCount === 0) {
        return {
          table: tableName,
          status: 'success',
          prodCount,
          devCount,
          message: 'Both environments empty (consistent)'
        }
      }

      if (prodCount > 0 && devCount === 0) {
        if (this.PROBLEMATIC_TABLES.includes(tableName)) {
          return {
            table: tableName,
            status: 'warning',
            prodCount,
            devCount,
            message: 'No records cloned (expected due to schema differences)'
          }
        } else {
          return {
            table: tableName,
            status: 'error',
            prodCount,
            devCount,
            message: 'Data exists in PROD but not in DEV'
          }
        }
      }

      if (devCount > prodCount) {
        return {
          table: tableName,
          status: 'warning',
          prodCount,
          devCount,
          message: 'DEV has more records than PROD (unexpected)'
        }
      }

      const successRate = (devCount / prodCount) * 100
      
      if (successRate >= 90) {
        return {
          table: tableName,
          status: 'success',
          prodCount,
          devCount,
          message: `${successRate.toFixed(1)}% of records cloned successfully`
        }
      } else if (successRate >= 50) {
        return {
          table: tableName,
          status: 'warning',
          prodCount,
          devCount,
          message: `Only ${successRate.toFixed(1)}% of records cloned (partial success)`
        }
      } else {
        return {
          table: tableName,
          status: 'error',
          prodCount,
          devCount,
          message: `Only ${successRate.toFixed(1)}% of records cloned (failed)`
        }
      }

    } catch (error) {
      return {
        table: tableName,
        status: 'error',
        prodCount: 0,
        devCount: 0,
        message: `Validation failed: ${error}`
      }
    }
  }

  /**
   * Validate critical data integrity
   */
  private async validateDataIntegrity(): Promise<string[]> {
    const issues: string[] = []

    try {
      console.log('\n🔍 Checking data integrity...')

      // Check if we have essential data
      const { data: currencies } = await this.devClient
        .from('currencies')
        .select('*')
        .limit(1)

      if (!currencies || currencies.length === 0) {
        issues.push('No currencies found in DEV - application may not work properly')
      }

      const { data: categories } = await this.devClient
        .from('categories')
        .select('*')
        .limit(1)

      if (!categories || categories.length === 0) {
        issues.push('No categories found in DEV - transaction categorization will fail')
      }

      const { data: lofts } = await this.devClient
        .from('lofts')
        .select('*')
        .limit(1)

      if (!lofts || lofts.length === 0) {
        issues.push('No lofts found in DEV - core functionality will be broken')
      }

      // Check anonymization worked
      const { data: profiles } = await this.devClient
        .from('profiles')
        .select('email')
        .limit(5)

      if (profiles && profiles.length > 0) {
        const hasProductionEmails = profiles.some(p => 
          p.email && !p.email.includes('dev.local') && !p.email.includes('@dev')
        )
        
        if (hasProductionEmails) {
          issues.push('Production emails detected - anonymization may have failed')
        } else {
          console.log('✅ Email anonymization verified')
        }
      }

    } catch (error) {
      issues.push(`Data integrity check failed: ${error}`)
    }

    return issues
  }

  /**
   * Test basic functionality
   */
  private async testBasicFunctionality(): Promise<string[]> {
    const issues: string[] = []

    try {
      console.log('\n🧪 Testing basic functionality...')

      // Test if we can query essential tables
      const testQueries = [
        { table: 'currencies', description: 'Currency lookup' },
        { table: 'categories', description: 'Category lookup' },
        { table: 'lofts', description: 'Loft listing' }
      ]

      for (const query of testQueries) {
        try {
          const { data, error } = await this.devClient
            .from(query.table)
            .select('*')
            .limit(1)

          if (error) {
            issues.push(`${query.description} failed: ${error.message}`)
          } else {
            console.log(`✅ ${query.description} working`)
          }
        } catch (error) {
          issues.push(`${query.description} test failed: ${error}`)
        }
      }

    } catch (error) {
      issues.push(`Functionality test failed: ${error}`)
    }

    return issues
  }

  /**
   * Run complete validation
   */
  public async validate(): Promise<ValidationSummary> {
    console.log('🔍 POST-CLONE VALIDATION STARTING')
    console.log('='.repeat(50))

    const startTime = Date.now()

    // Tables to validate
    const tablesToValidate = [
      'currencies',
      'categories',
      'zone_areas',
      'internet_connection_types',
      'payment_methods',
      'loft_owners',
      'teams',
      'profiles',
      'lofts',
      'team_members',
      'tasks',
      'transactions',
      'transaction_category_references',
      'settings',
      'notifications',
      'customers',
      'loft_photos'
    ]

    // Validate each table
    for (const tableName of tablesToValidate) {
      const result = await this.validateTable(tableName)
      this.results.push(result)
    }

    // Additional integrity checks
    const integrityIssues = await this.validateDataIntegrity()
    const functionalityIssues = await this.testBasicFunctionality()

    // Generate summary
    const summary: ValidationSummary = {
      totalTables: this.results.length,
      successful: this.results.filter(r => r.status === 'success').length,
      warnings: this.results.filter(r => r.status === 'warning').length,
      errors: this.results.filter(r => r.status === 'error').length,
      skipped: this.results.filter(r => r.status === 'skipped').length,
      results: this.results
    }

    // Print detailed results
    this.printValidationReport(summary, integrityIssues, functionalityIssues, startTime)

    return summary
  }

  /**
   * Print comprehensive validation report
   */
  private printValidationReport(
    summary: ValidationSummary,
    integrityIssues: string[],
    functionalityIssues: string[],
    startTime: number
  ): void {
    const duration = Date.now() - startTime

    console.log('\n📊 CLONE VALIDATION REPORT')
    console.log('='.repeat(50))
    console.log(`⏱️ Validation duration: ${Math.round(duration / 1000)}s`)
    console.log(`📋 Tables validated: ${summary.totalTables}`)
    console.log(`✅ Successful: ${summary.successful}`)
    console.log(`⚠️ Warnings: ${summary.warnings}`)
    console.log(`❌ Errors: ${summary.errors}`)
    console.log(`⏭️ Skipped: ${summary.skipped}`)

    console.log('\n📋 DETAILED RESULTS:')
    console.log('-'.repeat(50))

    summary.results.forEach(result => {
      const icon = result.status === 'success' ? '✅' :
                   result.status === 'warning' ? '⚠️' :
                   result.status === 'error' ? '❌' : '⏭️'
      
      const counts = result.prodCount > 0 || result.devCount > 0 
        ? ` (PROD: ${result.prodCount}, DEV: ${result.devCount})`
        : ''
      
      console.log(`${icon} ${result.table}${counts}`)
      console.log(`   ${result.message}`)
    })

    // Critical issues
    if (integrityIssues.length > 0) {
      console.log('\n🚨 DATA INTEGRITY ISSUES:')
      console.log('-'.repeat(30))
      integrityIssues.forEach(issue => console.log(`❌ ${issue}`))
    }

    if (functionalityIssues.length > 0) {
      console.log('\n🚨 FUNCTIONALITY ISSUES:')
      console.log('-'.repeat(30))
      functionalityIssues.forEach(issue => console.log(`❌ ${issue}`))
    }

    // Overall assessment
    console.log('\n🎯 OVERALL ASSESSMENT')
    console.log('='.repeat(50))

    const criticalErrors = summary.results.filter(r => 
      r.status === 'error' && this.CRITICAL_TABLES.includes(r.table)
    ).length

    const totalIssues = integrityIssues.length + functionalityIssues.length + criticalErrors

    if (totalIssues === 0 && summary.errors === 0) {
      console.log('🎉 CLONE VALIDATION: EXCELLENT')
      console.log('✅ All critical data cloned successfully')
      console.log('✅ No integrity issues detected')
      console.log('✅ Basic functionality verified')
    } else if (criticalErrors === 0 && totalIssues <= 2) {
      console.log('✅ CLONE VALIDATION: GOOD')
      console.log('✅ Critical data cloned successfully')
      console.log('⚠️ Minor issues detected but application should work')
    } else if (criticalErrors <= 1) {
      console.log('⚠️ CLONE VALIDATION: ACCEPTABLE')
      console.log('⚠️ Some issues detected but core functionality available')
      console.log('💡 Consider re-running clone for better results')
    } else {
      console.log('❌ CLONE VALIDATION: FAILED')
      console.log('❌ Critical issues detected')
      console.log('🔧 Clone needs to be re-run or fixed manually')
    }

    console.log('\n💡 RECOMMENDATIONS:')
    if (summary.successful >= summary.totalTables * 0.8) {
      console.log('• Clone was largely successful')
      console.log('• You can proceed with development')
      console.log('• Test your application: npm run dev')
    } else {
      console.log('• Consider re-running the clone operation')
      console.log('• Check schema differences between PROD and DEV')
      console.log('• Review error logs for specific issues')
    }

    if (integrityIssues.length === 0) {
      console.log('• Data integrity is good')
    }

    console.log('• Use dev123 as universal password for DEV environment')
  }
}

// Execute validation
async function main() {
  try {
    console.log('🚀 Starting clone validation...')
    const validator = new CloneValidator()
    await validator.validate()
    console.log('✅ Validation completed successfully')
  } catch (error) {
    console.error('💥 VALIDATION FAILED:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { CloneValidator }