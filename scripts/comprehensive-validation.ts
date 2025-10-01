#!/usr/bin/env tsx
/**
 * COMPREHENSIVE CLONE VALIDATION
 * ==============================
 * 
 * Complete validation of clone success with detailed reporting
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

interface TableValidation {
  table: string
  prodCount: number
  devCount: number
  successRate: number
  status: 'excellent' | 'good' | 'partial' | 'failed' | 'empty' | 'error'
  message: string
}

class ComprehensiveValidator {
  private prodClient: any
  private devClient: any
  private results: TableValidation[] = []

  constructor() {
    this.initializeClients()
  }

  private initializeClients() {
    console.log('🔧 Initializing validation clients...')
    
    // Production
    config({ path: resolve(process.cwd(), '.env.prod'), override: true })
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const prodKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    this.prodClient = createClient(prodUrl, prodKey)
    
    // Development
    config({ path: resolve(process.cwd(), '.env.development'), override: true })
    const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const devKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    this.devClient = createClient(devUrl, devKey)
    
    console.log('✅ Clients initialized')
  }

  private async validateTable(tableName: string): Promise<TableValidation> {
    try {
      // Get counts from both environments
      const [prodResult, devResult] = await Promise.all([
        this.prodClient.from(tableName).select('*'),
        this.devClient.from(tableName).select('*')
      ])

      const prodCount = prodResult.data?.length || 0
      const devCount = devResult.data?.length || 0

      // Handle errors
      if (prodResult.error && devResult.error) {
        return {
          table: tableName,
          prodCount: 0,
          devCount: 0,
          successRate: 0,
          status: 'error',
          message: 'Table not accessible in both environments'
        }
      }

      if (devResult.error) {
        return {
          table: tableName,
          prodCount,
          devCount: 0,
          successRate: 0,
          status: 'error',
          message: 'Table not accessible in DEV'
        }
      }

      if (prodResult.error) {
        return {
          table: tableName,
          prodCount: 0,
          devCount,
          successRate: 0,
          status: 'error',
          message: 'Table not accessible in PROD'
        }
      }

      // Calculate success rate
      const successRate = prodCount > 0 ? (devCount / prodCount) * 100 : 100

      // Determine status
      let status: TableValidation['status']
      let message: string

      if (prodCount === 0 && devCount === 0) {
        status = 'empty'
        message = 'Both environments empty'
      } else if (successRate === 100) {
        status = 'excellent'
        message = 'Perfect clone - all records copied'
      } else if (successRate >= 90) {
        status = 'good'
        message = `${successRate.toFixed(1)}% cloned - very good`
      } else if (successRate >= 50) {
        status = 'partial'
        message = `${successRate.toFixed(1)}% cloned - partial success`
      } else if (devCount > 0) {
        status = 'partial'
        message = `${successRate.toFixed(1)}% cloned - needs attention`
      } else {
        status = 'failed'
        message = 'No records cloned'
      }

      return {
        table: tableName,
        prodCount,
        devCount,
        successRate,
        status,
        message
      }

    } catch (error) {
      return {
        table: tableName,
        prodCount: 0,
        devCount: 0,
        successRate: 0,
        status: 'error',
        message: `Validation error: ${error}`
      }
    }
  }

  private async checkAnonymization(): Promise<{ success: boolean, details: string[] }> {
    const details: string[] = []
    let success = true

    try {
      // Check profiles anonymization
      const { data: profiles } = await this.devClient
        .from('profiles')
        .select('email, full_name')
        .limit(5)

      if (profiles && profiles.length > 0) {
        const productionEmails = profiles.filter(p => 
          p.email && !p.email.includes('dev.local') && !p.email.includes('@dev')
        )

        if (productionEmails.length > 0) {
          success = false
          details.push(`${productionEmails.length} production emails detected`)
        } else {
          details.push('Email anonymization: SUCCESS')
        }

        const devNames = profiles.filter(p => 
          p.full_name && p.full_name.includes('(DEV)')
        )
        
        if (devNames.length > 0) {
          details.push(`${devNames.length} names properly anonymized`)
        }
      } else {
        details.push('No profiles to check (table empty or inaccessible)')
      }

      // Check notifications anonymization
      const { data: notifications } = await this.devClient
        .from('notifications')
        .select('message')
        .limit(3)

      if (notifications && notifications.length > 0) {
        const anonymizedMessages = notifications.filter(n => 
          n.message && n.message.includes('anonymisé')
        )
        
        if (anonymizedMessages.length > 0) {
          details.push(`${anonymizedMessages.length} notifications anonymized`)
        }
      }

    } catch (error) {
      success = false
      details.push(`Anonymization check failed: ${error}`)
    }

    return { success, details }
  }

  private async testFunctionality(): Promise<{ success: boolean, details: string[] }> {
    const details: string[] = []
    let success = true

    const tests = [
      { table: 'currencies', name: 'Currency system' },
      { table: 'categories', name: 'Category system' },
      { table: 'lofts', name: 'Loft management' },
      { table: 'zone_areas', name: 'Zone areas' },
      { table: 'payment_methods', name: 'Payment methods' }
    ]

    for (const test of tests) {
      try {
        const { data, error } = await this.devClient
          .from(test.table)
          .select('*')
          .limit(1)

        if (error) {
          success = false
          details.push(`${test.name}: FAILED - ${error.message}`)
        } else if (data && data.length > 0) {
          details.push(`${test.name}: WORKING`)
        } else {
          details.push(`${test.name}: NO DATA`)
        }
      } catch (error) {
        success = false
        details.push(`${test.name}: ERROR - ${error}`)
      }
    }

    return { success, details }
  }

  public async runValidation(): Promise<void> {
    console.log('🔍 COMPREHENSIVE CLONE VALIDATION')
    console.log('='.repeat(50))

    const startTime = Date.now()

    // Tables to validate
    const tables = [
      'currencies', 'categories', 'zone_areas', 'internet_connection_types',
      'payment_methods', 'loft_owners', 'teams', 'profiles', 'lofts',
      'team_members', 'tasks', 'transactions', 'transaction_category_references',
      'settings', 'notifications', 'customers', 'loft_photos'
    ]

    // Validate each table
    console.log('\n📊 TABLE-BY-TABLE VALIDATION:')
    console.log('-'.repeat(50))

    for (const table of tables) {
      console.log(`📋 Validating ${table}...`)
      const result = await this.validateTable(table)
      this.results.push(result)

      const icon = result.status === 'excellent' ? '🎉' :
                   result.status === 'good' ? '✅' :
                   result.status === 'partial' ? '⚠️' :
                   result.status === 'empty' ? 'ℹ️' : '❌'

      console.log(`${icon} ${table}: ${result.message}`)
      if (result.prodCount > 0 || result.devCount > 0) {
        console.log(`   PROD: ${result.prodCount} | DEV: ${result.devCount}`)
      }
    }

    // Check anonymization
    console.log('\n🔒 ANONYMIZATION CHECK:')
    console.log('-'.repeat(30))
    const anonymization = await this.checkAnonymization()
    anonymization.details.forEach(detail => {
      const icon = detail.includes('SUCCESS') || detail.includes('anonymized') ? '✅' : 
                   detail.includes('FAILED') || detail.includes('detected') ? '❌' : 'ℹ️'
      console.log(`${icon} ${detail}`)
    })

    // Test functionality
    console.log('\n🧪 FUNCTIONALITY TEST:')
    console.log('-'.repeat(30))
    const functionality = await this.testFunctionality()
    functionality.details.forEach(detail => {
      const icon = detail.includes('WORKING') ? '✅' :
                   detail.includes('FAILED') || detail.includes('ERROR') ? '❌' : 'ℹ️'
      console.log(`${icon} ${detail}`)
    })

    // Generate summary
    const duration = Date.now() - startTime
    this.printSummary(anonymization.success, functionality.success, duration)
  }

  private printSummary(anonymizationSuccess: boolean, functionalitySuccess: boolean, duration: number): void {
    console.log('\n📊 VALIDATION SUMMARY')
    console.log('='.repeat(50))

    const excellent = this.results.filter(r => r.status === 'excellent').length
    const good = this.results.filter(r => r.status === 'good').length
    const partial = this.results.filter(r => r.status === 'partial').length
    const failed = this.results.filter(r => r.status === 'failed').length
    const errors = this.results.filter(r => r.status === 'error').length
    const empty = this.results.filter(r => r.status === 'empty').length

    console.log(`⏱️ Validation time: ${Math.round(duration / 1000)}s`)
    console.log(`📋 Tables validated: ${this.results.length}`)
    console.log(`🎉 Excellent: ${excellent}`)
    console.log(`✅ Good: ${good}`)
    console.log(`⚠️ Partial: ${partial}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`💥 Errors: ${errors}`)
    console.log(`ℹ️ Empty: ${empty}`)

    // Calculate total records cloned
    const totalProd = this.results.reduce((sum, r) => sum + r.prodCount, 0)
    const totalDev = this.results.reduce((sum, r) => sum + r.devCount, 0)
    const overallRate = totalProd > 0 ? (totalDev / totalProd) * 100 : 100

    console.log(`📈 Overall success rate: ${overallRate.toFixed(1)}%`)
    console.log(`📊 Records: PROD=${totalProd}, DEV=${totalDev}`)

    // Overall assessment
    console.log('\n🎯 OVERALL ASSESSMENT:')
    console.log('-'.repeat(30))

    const criticalTables = ['currencies', 'categories', 'lofts']
    const criticalSuccess = this.results
      .filter(r => criticalTables.includes(r.table))
      .every(r => r.status === 'excellent' || r.status === 'good')

    if (criticalSuccess && anonymizationSuccess && functionalitySuccess && overallRate >= 80) {
      console.log('🎉 CLONE STATUS: EXCELLENT')
      console.log('✅ All critical systems working')
      console.log('✅ Data properly anonymized')
      console.log('✅ High success rate')
    } else if (criticalSuccess && overallRate >= 60) {
      console.log('✅ CLONE STATUS: GOOD')
      console.log('✅ Critical systems working')
      console.log('⚠️ Some minor issues detected')
    } else if (overallRate >= 40) {
      console.log('⚠️ CLONE STATUS: ACCEPTABLE')
      console.log('⚠️ Partial success - some issues need attention')
    } else {
      console.log('❌ CLONE STATUS: NEEDS IMPROVEMENT')
      console.log('❌ Significant issues detected')
    }

    console.log('\n💡 NEXT STEPS:')
    if (overallRate >= 70) {
      console.log('• ✅ You can proceed with development')
      console.log('• 🚀 Test your application: npm run dev')
      console.log('• 🔑 Use dev123 as universal password')
    } else {
      console.log('• 🔄 Consider re-running the clone')
      console.log('• 🔍 Check specific table issues above')
      console.log('• 🛠️ Manual fixes may be needed')
    }

    if (!anonymizationSuccess) {
      console.log('• ⚠️ Review anonymization issues')
    }

    if (!functionalitySuccess) {
      console.log('• ⚠️ Check functionality issues')
    }
  }
}

// Execute validation
async function main() {
  try {
    const validator = new ComprehensiveValidator()
    await validator.runValidation()
  } catch (error) {
    console.error('💥 VALIDATION FAILED:', error)
    process.exit(1)
  }
}

main().catch(console.error)